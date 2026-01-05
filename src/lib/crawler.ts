/**
 * Website Crawler
 *
 * Crawls a website to extract text content from multiple pages.
 * Designed to work in serverless environment (no puppeteer needed).
 */

/**
 * SSRF Protection: Check if a URL points to a private/internal network
 * Blocks: localhost, private IPs, link-local, loopback
 */
function isPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block localhost variations
    if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
      return true;
    }

    // Block IPv6 localhost
    if (hostname === '::1' || hostname === '[::1]') {
      return true;
    }

    // Check if hostname is an IP address
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c] = ipv4Match.map(Number);

      // Block loopback (127.x.x.x)
      if (a === 127) return true;

      // Block private Class A (10.x.x.x)
      if (a === 10) return true;

      // Block private Class B (172.16.x.x - 172.31.x.x)
      if (a === 172 && b >= 16 && b <= 31) return true;

      // Block private Class C (192.168.x.x)
      if (a === 192 && b === 168) return true;

      // Block link-local (169.254.x.x)
      if (a === 169 && b === 254) return true;

      // Block 0.0.0.0
      if (a === 0 && b === 0 && c === 0) return true;
    }

    // Block cloud metadata endpoints (AWS, GCP, Azure)
    if (hostname === '169.254.169.254' || // AWS/GCP metadata
        hostname === 'metadata.google.internal' ||
        hostname === 'metadata.azure.com' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')) {
      return true;
    }

    return false;
  } catch {
    return true; // Invalid URL = block it
  }
}

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
 * Render service configuration
 */
const RENDER_SERVICE_URL = process.env.RENDER_SERVICE_URL;
const RENDER_SERVICE_API_KEY = process.env.RENDER_SERVICE_API_KEY;

/**
 * Fetch a page using the headless render service (for JavaScript-heavy sites)
 */
async function fetchWithRenderService(url: string): Promise<{
  html: string;
  metadata: {
    title: string;
    ogSiteName: string;
    ogTitle: string;
    description: string;
    h1: string;
    footerText: string;
  };
} | null> {
  if (!RENDER_SERVICE_URL || !RENDER_SERVICE_API_KEY) {
    console.log('[Crawler] Render service not configured, skipping JS rendering');
    return null;
  }

  try {
    const response = await fetch(`${RENDER_SERVICE_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': RENDER_SERVICE_API_KEY,
      },
      body: JSON.stringify({ url, waitFor: 3000, timeout: 30000 }),
    });

    if (!response.ok) {
      console.log(`[Crawler] Render service error: ${response.status}`);
      return null;
    }

    const result = await response.json();
    if (result.success) {
      console.log(`[Crawler] Rendered ${url} via headless browser in ${result.elapsed}ms`);
      return {
        html: result.html,
        metadata: result.metadata,
      };
    }
    return null;
  } catch (err) {
    console.error('[Crawler] Render service fetch failed:', err);
    return null;
  }
}

/**
 * Extract company name from various metadata sources
 */
function extractCompanyName(metadata: {
  ogSiteName?: string;
  ogTitle?: string;
  title?: string;
  footerText?: string;
}): string | undefined {
  // Priority 1: og:site_name (most reliable)
  if (metadata.ogSiteName && metadata.ogSiteName.length > 1 && metadata.ogSiteName.length < 100) {
    return metadata.ogSiteName;
  }

  // Priority 2: Clean title (before | or -)
  if (metadata.title) {
    const cleanTitle = metadata.title.split(/[|\-–—]/)[0].trim();
    if (cleanTitle.length > 1 && cleanTitle.length < 50 &&
        !cleanTitle.toLowerCase().includes('home') &&
        !cleanTitle.toLowerCase().includes('welcome')) {
      return cleanTitle;
    }
  }

  // Priority 3: Footer copyright (© 2024 Company Name)
  if (metadata.footerText) {
    const copyrightMatch = metadata.footerText.match(/©\s*\d{4}\s+([A-Z][A-Za-z0-9\s&]+?)(?:\.|,|All|Inc|LLC|Ltd|Corp)/i);
    if (copyrightMatch && copyrightMatch[1]) {
      const name = copyrightMatch[1].trim();
      if (name.length > 1 && name.length < 50) {
        return name;
      }
    }
  }

  return undefined;
}

/**
 * Detect if a page is an error page (404, 500, error message, etc.)
 * Returns true if the page content indicates it's an error page
 */
function isErrorPage(content: string, title: string): boolean {
  const lowerContent = content.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Error indicators in title
  const titleErrorPatterns = [
    /404/,
    /not found/i,
    /error/i,
    /sorry/i,
    /page.*not.*found/i,
    /cannot.*find/i,
    /doesn.*exist/i,
    /unavailable/i,
  ];

  for (const pattern of titleErrorPatterns) {
    if (pattern.test(lowerTitle)) {
      return true;
    }
  }

  // Error phrases in content - must be short content (error pages are typically short)
  if (content.length < 2000) {
    const errorPhrases = [
      "page not found",
      "page you requested",
      "page cannot be found",
      "404 error",
      "we couldn't find",
      "we can't find",
      "doesn't exist",
      "does not exist",
      "sorry, we can't",
      "sorry, something went wrong",
      "this page isn't available",
      "oops!",
      "the page you're looking for",
      "no longer available",
      "has been removed",
      "has been moved",
      "broken link",
    ];

    for (const phrase of errorPhrases) {
      if (lowerContent.includes(phrase)) {
        return true;
      }
    }
  }

  return false;
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
 * Extract H1 headline from HTML (for competitor comparison)
 * Tries to find the MAIN hero H1, not nav/footer H1s
 */
function extractH1(html: string): string | undefined {
  // First, try to strip navigation and footer areas
  let mainContent = html
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Find ALL H1s in the remaining content
  const h1Pattern = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const h1Candidates: string[] = [];

  let match;
  while ((match = h1Pattern.exec(mainContent)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) h1Candidates.push(text);
  }

  // If no H1s found in main content, try original HTML
  if (h1Candidates.length === 0) {
    const fallbackPattern = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    while ((match = fallbackPattern.exec(html)) !== null) {
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) h1Candidates.push(text);
    }
  }

  if (h1Candidates.length === 0) return undefined;

  // Filter out likely navigation H1s (short, generic words)
  const navWords = ['about', 'home', 'contact', 'blog', 'news', 'careers', 'login', 'sign up', 'menu', 'navigation'];
  const isNavH1 = (h1: string) => {
    const lower = h1.toLowerCase();
    return h1.length < 20 && navWords.some(w => lower.includes(w));
  };

  // Prefer longer H1s that don't look like navigation
  const validH1s = h1Candidates.filter(h1 => !isNavH1(h1) && h1.length > 5);

  if (validH1s.length > 0) {
    // Return the first valid (non-nav) H1
    return validH1s[0];
  }

  // If all H1s were filtered out, return the longest one
  return h1Candidates.sort((a, b) => b.length - a.length)[0];
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

/**
 * Extract og:site_name meta tag from HTML
 */
function extractOgSiteName(html: string): string | undefined {
  // Try content="..." property="og:site_name" format
  const match1 = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (match1) return match1[1];

  // Try content="..." property="og:site_name" format (reversed order)
  const match2 = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
  if (match2) return match2[1];

  return undefined;
}

/**
 * Extract footer text from HTML for company name extraction
 */
function extractFooterText(html: string): string | undefined {
  // Try to find footer element
  const footerMatch = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/i);
  if (footerMatch) {
    const footerText = footerMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (footerText.length > 0 && footerText.length < 2000) {
      return footerText;
    }
  }

  // Try to find copyright notice anywhere in the page
  const copyrightMatch = html.match(/©\s*\d{4}[^<]{0,200}/i);
  if (copyrightMatch) {
    return copyrightMatch[0];
  }

  return undefined;
}

/**
 * Check if a site appears to be JavaScript-rendered (SPA)
 * Returns indicators that suggest the site may not crawl well
 */
function detectSPAIndicators(html: string): {
  isSPA: boolean
  indicators: string[]
} {
  const indicators: string[] = []

  // Check for common SPA framework indicators
  if (html.includes('__NEXT_DATA__') || html.includes('_next/static')) {
    indicators.push('Next.js detected (may be SSR - checking content)')
  }
  if (html.includes('ng-app') || html.includes('ng-controller') || html.match(/angular[.\-]/i)) {
    indicators.push('Angular detected')
  }
  if (html.includes('data-reactroot') || html.includes('__REACT_DEVTOOLS')) {
    indicators.push('React SPA detected')
  }
  if (html.includes('data-v-') || html.includes('__VUE__')) {
    indicators.push('Vue.js detected')
  }
  if (html.includes('ember-view') || html.includes('EmberENV')) {
    indicators.push('Ember detected')
  }

  // Check for empty/minimal body content (the real signal)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    const bodyContent = bodyMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (bodyContent.length < 200) {
      indicators.push('Very little visible content without JavaScript')
    }
  }

  // Check for noscript warnings
  if (html.includes('<noscript') && html.toLowerCase().includes('javascript')) {
    indicators.push('Site requires JavaScript to display content')
  }

  // Check for empty app root divs
  if (html.match(/<div id="(app|root|__next)"[^>]*>(\s*)<\/div>/)) {
    indicators.push('Empty app container (content rendered by JavaScript)')
  }

  // Only flag as SPA if we have strong indicators of client-side rendering
  const hasMinimalContent = indicators.some(i => i.includes('Very little') || i.includes('Empty app'))
  const hasFramework = indicators.some(i =>
    i.includes('Angular') || i.includes('React SPA') || i.includes('Vue') || i.includes('Ember')
  )

  return {
    isSPA: hasMinimalContent || (hasFramework && indicators.length >= 2),
    indicators
  }
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
  // SSRF protection: block private/internal URLs
  if (isPrivateUrl(url)) {
    console.warn(`[Crawler] Blocked private URL: ${url}`);
    return null;
  }

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
  // SSRF protection: reject private URLs at entry point
  if (isPrivateUrl(startUrl)) {
    console.error(`[Crawler] Rejected private URL: ${startUrl}`);
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
        console.log(`[Crawler] SPA detected for ${url}:`, spaCheck.indicators);

        // Try render service for JavaScript-heavy sites
        const rendered = await fetchWithRenderService(url);
        if (rendered) {
          console.log(`[Crawler] Using rendered HTML from headless browser`);
          html = rendered.html;
          renderMetadata = rendered.metadata;

          // Extract company name from render metadata
          result.companyName = extractCompanyName(renderMetadata);
          if (result.companyName) {
            console.log(`[Crawler] Extracted company name: ${result.companyName}`);
          }

          // Re-check SPA indicators on rendered content
          const recheck = detectSPAIndicators(html);
          if (!recheck.isSPA) {
            console.log(`[Crawler] Render service resolved SPA issues`);
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
          console.log(`[Crawler] Extracted company name: ${result.companyName}`);
        }
      }
    }

    // Extract content
    const title = extractTitle(html);
    const content = extractText(html);

    // Skip error pages - they pollute the analysis with irrelevant content
    if (isErrorPage(content, title)) {
      console.log(`[Crawler] Skipping error page: ${url}`);
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
