/**
 * Page fetching utilities for the crawler
 *
 * Handles raw HTTP fetching and optional headless render service fallback.
 */

import { isPrivateUrl } from './url-utils';
import { logger } from '@shared/lib/logger';

/**
 * Render service configuration
 */
const RENDER_SERVICE_URL = process.env.RENDER_SERVICE_URL;
const RENDER_SERVICE_API_KEY = process.env.RENDER_SERVICE_API_KEY;

export interface RenderMetadata {
  title: string;
  ogSiteName: string;
  ogTitle: string;
  description: string;
  h1: string;
  footerText: string;
}

export interface RenderResult {
  html: string;
  metadata: RenderMetadata;
}

/**
 * Fetch a page using the headless render service (for JavaScript-heavy sites)
 */
export async function fetchWithRenderService(url: string): Promise<RenderResult | null> {
  if (!RENDER_SERVICE_URL || !RENDER_SERVICE_API_KEY) {
    logger.info('Render service not configured, skipping JS rendering', { tool: 'website-audit', fn: 'fetchWithRenderService' });
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
      logger.error(`Render service error: ${response.status}`, { tool: 'website-audit', fn: 'fetchWithRenderService' });
      return null;
    }

    const result = await response.json();
    if (result.success) {
      logger.info(`Rendered ${url} via headless browser in ${result.elapsed}ms`, { tool: 'website-audit', fn: 'fetchWithRenderService' });
      return {
        html: result.html,
        metadata: result.metadata,
      };
    }
    return null;
  } catch (err) {
    logger.error('Render service fetch failed', { tool: 'website-audit', fn: 'fetchWithRenderService', err: String(err) });
    return null;
  }
}

/**
 * Fetch a single page with timeout and error handling
 */
export async function fetchPage(url: string, timeout = 5000): Promise<string | null> {
  // SSRF protection: block private/internal URLs
  if (isPrivateUrl(url)) {
    logger.warn(`Blocked private URL: ${url}`, { tool: 'website-audit', fn: 'fetchPage' });
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
