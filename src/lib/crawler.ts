/**
 * Website Crawler
 *
 * Crawls a website to extract text content from multiple pages.
 * Designed to work in serverless environment (no puppeteer needed).
 */

export interface CrawledPage {
  url: string;
  title: string;
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
}

/**
 * Extract text content from HTML, removing scripts, styles, and tags
 */
function extractText(html: string): string {
  // Remove script and style elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // Remove navigation (usually repeated)
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ''); // Remove header

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].trim();
  }

  return 'Untitled';
}

/**
 * Extract meta tags from HTML
 */
function extractMeta(html: string): CrawledPage['meta'] {
  const meta: CrawledPage['meta'] = {};

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) meta.description = descMatch[1];

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) meta.ogTitle = ogTitleMatch[1];

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch) meta.ogDescription = ogDescMatch[1];

  return meta;
}

// Paths to skip - not real content pages
const SKIP_PATTERNS = [
  /\/wp-json\//i,
  /\/wp-admin\//i,
  /\/wp-content\/uploads\//i,
  /\/wp-includes\//i,
  /\/feed\/?$/i,
  /\/comments\/feed\/?$/i,
  /\/trackback\/?$/i,
  /\/xmlrpc\.php/i,
  /\/wp-login\.php/i,
  /\/cart\/?$/i,
  /\/checkout\/?$/i,
  /\/my-account\/?$/i,
  /\/add-to-cart/i,
  /\?add-to-cart=/i,
  /\?replytocom=/i,
  /\/page\/\d+\/?$/i,  // Pagination
  /\.(pdf|jpg|jpeg|png|gif|svg|webp|mp4|mp3|zip|doc|docx|xls|xlsx)$/i,
];

/**
 * Check if URL should be skipped
 */
function shouldSkipUrl(url: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Extract internal links from HTML
 */
function extractLinks(html: string, baseUrl: string): string[] {
  const links: Set<string> = new Set();
  const base = new URL(baseUrl);

  // Match href attributes
  const hrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);

  for (const match of hrefMatches) {
    let href = match[1];

    // Skip anchors, javascript, mailto, tel
    if (href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    // Skip external links
    try {
      const url = new URL(href, baseUrl);
      if (url.hostname !== base.hostname) {
        continue;
      }
      // Normalize the URL
      const normalized = `${url.origin}${url.pathname}`.replace(/\/$/, '');

      // Skip junk URLs
      if (shouldSkipUrl(normalized)) {
        continue;
      }

      links.add(normalized);
    } catch {
      // Invalid URL, skip
    }
  }

  return Array.from(links);
}

/**
 * Find LinkedIn company page URL
 */
function findLinkedIn(html: string): string | undefined {
  const linkedInMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"']+)["']/i);
  return linkedInMatch ? linkedInMatch[1] : undefined;
}

/**
 * Fetch a single page with timeout and error handling
 */
async function fetchPage(url: string, timeout = 5000): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebsiteAuditBot/1.0; +https://leefuhr.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      return null;
    }

    return await response.text();
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Crawl a website starting from the given URL
 */
export async function crawlWebsite(
  startUrl: string,
  maxPages = 25,
  onProgress?: (crawled: number, found: number, currentUrl: string) => void
): Promise<CrawlResult> {
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
    const html = await fetchPage(url);
    if (!html) {
      result.errors.push(`Failed to fetch: ${url}`);
      continue;
    }

    // Extract content
    const page: CrawledPage = {
      url: normalizedUrl,
      title: extractTitle(html),
      content: extractText(html),
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
