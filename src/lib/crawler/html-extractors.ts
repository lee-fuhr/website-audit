/**
 * HTML content extractors for the crawler
 *
 * Extracts text, titles, headings, meta tags, and other content from raw HTML.
 */

import type { CrawledPage } from '../crawler';

/**
 * Extract text content from HTML, removing scripts, styles, and tags
 */
export function extractText(html: string): string {
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
export function extractTitle(html: string): string {
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
export function extractH1(html: string): string | undefined {
  // First, try to strip navigation and footer areas
  const mainContent = html
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
export function extractMeta(html: string): CrawledPage['meta'] {
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
export function extractOgSiteName(html: string): string | undefined {
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
export function extractFooterText(html: string): string | undefined {
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
 * Detect if a page is an error page (404, 500, error message, etc.)
 * Returns true if the page content indicates it's an error page
 */
export function isErrorPage(content: string, title: string): boolean {
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
 * Extract company name from various metadata sources
 */
export function extractCompanyName(metadata: {
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
