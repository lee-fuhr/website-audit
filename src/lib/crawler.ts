/**
 * Website Crawler
 *
 * Crawls a website to extract text content from multiple pages.
 * Designed to work in serverless environment (no puppeteer needed).
 */

import { detectSPAIndicators } from './spa-detection';
import { isPrivateUrl, shouldSkipUrl, extractLinks, findLinkedIn } from './crawler/url-utils';
import {
  extractText,
  extractTitle,
  extractH1,
  extractMeta,
  extractOgSiteName,
  extractFooterText,
  extractCompanyName,
  isErrorPage,
} from './crawler/html-extractors';
import { fetchPage, fetchWithRenderService } from './crawler/fetch';
import { logger } from '@shared/lib/logger';

export interface CrawledPage {
  url: string;
  title: string;
  h1?: string;  // Main H1 headline for comparison
  content: string;
  links: string[];
  meta: {
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
}

export interface CrawlResult {
  pages: CrawledPage[];
  linkedInUrl?: string;
  errors: string[];
  spaWarning?: {
    isSPA: boolean;
    indicators: string[];
    message: string;
  };
  // Company name extracted from site metadata (og:site_name, title, footer)
  companyName?: string;
}

/**
 * Crawl a website starting from the given URL
 */
export async function crawlWebsite(
  startUrl: string,
  maxPages = 25,
  onProgress?: (crawled: number, found: number, currentUrl: string) => void
): Promise<CrawlResult> {
  // SSRF protection: reject private URLs at entry point
  if (isPrivateUrl(startUrl)) {
    logger.error(`Rejected private URL: ${startUrl}`, { tool: 'website-audit', fn: 'crawlWebsite' });
    return {
      pages: [],
      errors: ['Cannot crawl private/internal URLs'],
    };
  }

  const result: CrawlResult = {
    pages: [],
    errors: [],
  };

  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  let linkedInUrl: string | undefined;

  // Normalize start URL
  const baseUrl = new URL(startUrl);
  const normalizedStart = `${baseUrl.origin}${baseUrl.pathname}`.replace(/\/$/, '');
  queue[0] = normalizedStart;

  // Priority pages to try to find
  const priorityPaths = [
    '/about', '/about-us', '/who-we-are',
    '/services', '/capabilities', '/what-we-do',
    '/contact', '/contact-us',
    '/case-studies', '/projects', '/portfolio', '/work',
    '/testimonials', '/clients', '/customers',
    '/team', '/leadership', '/our-team',
    '/why-us', '/why-choose-us',
    '/process', '/how-we-work',
  ];

  // Add priority paths to queue
  for (const path of priorityPaths) {
    const priorityUrl = `${baseUrl.origin}${path}`;
    if (!queue.includes(priorityUrl)) {
      queue.push(priorityUrl);
    }
  }

  while (queue.length > 0 && result.pages.length < maxPages) {
    const url = queue.shift()!;

    // Skip if already visited
    const normalizedUrl = url.replace(/\/$/, '');
    if (visited.has(normalizedUrl)) continue;

    // Skip junk URLs
    if (shouldSkipUrl(normalizedUrl)) {
      continue;
    }

    visited.add(normalizedUrl);

    // Report progress
    if (onProgress) {
      onProgress(result.pages.length, queue.length + visited.size, normalizedUrl);
    }

    // Fetch the page
    let html = await fetchPage(url);
    let renderMetadata: { title: string; ogSiteName: string; ogTitle: string; description: string; h1: string; footerText: string } | undefined;

    if (!html) {
      result.errors.push(`Failed to fetch: ${url}`);
      continue;
    }

    // Check for SPA on the first page (homepage)
    if (result.pages.length === 0) {
      const spaCheck = detectSPAIndicators(html);
      if (spaCheck.isSPA) {
        logger.info(`SPA detected for ${url}`, { tool: 'website-audit', fn: 'crawlWebsite', indicators: spaCheck.indicators });

        // Try render service for JavaScript-heavy sites
        const rendered = await fetchWithRenderService(url);
        if (rendered) {
          logger.info('Using rendered HTML from headless browser', { tool: 'website-audit', fn: 'crawlWebsite' });
          html = rendered.html;
          renderMetadata = rendered.metadata;

          // Extract company name from render metadata
          result.companyName = extractCompanyName(renderMetadata);
          if (result.companyName) {
            logger.info(`Extracted company name: ${result.companyName}`, { tool: 'website-audit', fn: 'crawlWebsite' });
          }

          // Re-check SPA indicators on rendered content
          const recheck = detectSPAIndicators(html);
          if (!recheck.isSPA) {
            logger.info('Render service resolved SPA issues', { tool: 'website-audit', fn: 'crawlWebsite' });
          } else {
            result.spaWarning = {
              isSPA: true,
              indicators: recheck.indicators,
              message: 'This site uses JavaScript rendering. We used a headless browser but some content may still be incomplete.'
            };
          }
        } else {
          // Render service not available - show warning
          result.spaWarning = {
            isSPA: true,
            indicators: spaCheck.indicators,
            message: 'This site appears to use JavaScript rendering. Some content may not be captured in the analysis. Results may be incomplete.'
          };
        }
      } else {
        // Not an SPA - try to extract company name from static HTML metadata
        const staticMeta = {
          ogSiteName: extractOgSiteName(html),
          title: extractTitle(html),
          footerText: extractFooterText(html),
        };
        result.companyName = extractCompanyName(staticMeta);
        if (result.companyName) {
          logger.info(`Extracted company name: ${result.companyName}`, { tool: 'website-audit', fn: 'crawlWebsite' });
        }
      }
    }

    // Extract content
    const title = extractTitle(html);
    const content = extractText(html);

    // Skip error pages - they pollute the analysis with irrelevant content
    if (isErrorPage(content, title)) {
      logger.info(`Skipping error page: ${url}`, { tool: 'website-audit', fn: 'crawlWebsite' });
      continue;
    }

    const page: CrawledPage = {
      url: normalizedUrl,
      title,
      h1: extractH1(html),
      content,
      links: extractLinks(html, url),
      meta: extractMeta(html),
    };

    result.pages.push(page);

    // Find LinkedIn if not found yet
    if (!linkedInUrl) {
      linkedInUrl = findLinkedIn(html);
    }

    // Add new links to queue (but not priority paths we already added)
    for (const link of page.links) {
      const normalizedLink = link.replace(/\/$/, '');
      if (!visited.has(normalizedLink) && !queue.includes(normalizedLink)) {
        queue.push(normalizedLink);
      }
    }

    // Small delay to be polite (but not too slow)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  result.linkedInUrl = linkedInUrl;
  return result;
}

/**
 * Fetch LinkedIn company page content (limited - no login)
 */
export async function fetchLinkedInPreview(url: string): Promise<string | null> {
  // LinkedIn blocks most scraping, but we can try to get basic public info
  // This is limited without authentication
  const html = await fetchPage(url);
  if (!html) return null;

  // Extract what we can from public view
  return extractText(html);
}
