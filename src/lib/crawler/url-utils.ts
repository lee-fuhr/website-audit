/**
 * URL utilities for the crawler
 *
 * SSRF protection, skip patterns, link extraction, LinkedIn detection.
 */

/**
 * SSRF Protection: Check if a URL points to a private/internal network
 * Blocks: localhost, private IPs, link-local, loopback
 */
export function isPrivateUrl(urlString: string): boolean {
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

// Paths to skip - not real content pages
export const SKIP_PATTERNS = [
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
export function shouldSkipUrl(url: string): boolean {
  return SKIP_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Extract internal links from HTML
 */
export function extractLinks(html: string, baseUrl: string): string[] {
  const links: Set<string> = new Set();
  const base = new URL(baseUrl);

  // Match href attributes
  const hrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);

  for (const match of hrefMatches) {
    const href = match[1];

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
export function findLinkedIn(html: string): string | undefined {
  const linkedInMatch = html.match(/href=["'](https?:\/\/(?:www\.)?linkedin\.com\/company\/[^"']+)["']/i);
  return linkedInMatch ? linkedInMatch[1] : undefined;
}
