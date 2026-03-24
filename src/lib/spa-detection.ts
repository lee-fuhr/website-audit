/**
 * SPA detection utilities
 *
 * Shared function extracted from crawler.ts and utils.ts to eliminate duplication.
 */

/**
 * Check if a site appears to be JavaScript-rendered (SPA)
 * Returns indicators that suggest the site may not crawl well
 */
export function detectSPAIndicators(html: string): {
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
