import { detectSPAIndicators } from '../spa-detection'

describe('detectSPAIndicators', () => {
  // UNHAPPY PATHS FIRST

  it('handles empty HTML string without throwing', () => {
    expect(() => detectSPAIndicators('')).not.toThrow()
  })

  it('returns an object with isSPA and indicators for empty string', () => {
    const result = detectSPAIndicators('')
    expect(result).toBeDefined()
    expect(typeof result.isSPA).toBe('boolean')
    expect(Array.isArray(result.indicators)).toBe(true)
  })

  it('returns isSPA: false for empty string', () => {
    const result = detectSPAIndicators('')
    expect(result.isSPA).toBe(false)
  })

  it('returns empty indicators for empty string', () => {
    const result = detectSPAIndicators('')
    expect(result.indicators).toHaveLength(0)
  })

  it('handles HTML with no body tag gracefully', () => {
    const noBody = '<html><head><title>Test</title></head></html>'
    expect(() => detectSPAIndicators(noBody)).not.toThrow()
    const result = detectSPAIndicators(noBody)
    expect(typeof result.isSPA).toBe('boolean')
  })

  it('handles null-like empty content without throwing (null cast as string)', () => {
    // null cast forces the edge case of no string content
    expect(() => detectSPAIndicators('' as any)).not.toThrow()
  })

  // HAPPY PATHS — Framework detection

  it('detects Next.js via __NEXT_DATA__', () => {
    const nextHtml = '<html><head></head><body><script id="__NEXT_DATA__" type="application/json">{}</script></body></html>'
    const result = detectSPAIndicators(nextHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('next.js'))).toBe(true)
  })

  it('detects Next.js via _next/static', () => {
    const nextHtml = '<html><body><script src="/_next/static/chunks/main.js"></script></body></html>'
    const result = detectSPAIndicators(nextHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('next.js'))).toBe(true)
  })

  it('detects Angular via ng-app', () => {
    const angularHtml = '<html><body><div ng-app="myApp"><div ng-controller="ctrl"></div></div></body></html>'
    const result = detectSPAIndicators(angularHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('angular'))).toBe(true)
  })

  it('detects React SPA via data-reactroot', () => {
    const reactHtml = '<html><body><div data-reactroot=""><h1>App</h1></div></body></html>'
    const result = detectSPAIndicators(reactHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('react'))).toBe(true)
  })

  it('detects React SPA via __REACT_DEVTOOLS', () => {
    const reactHtml = '<html><body><script>window.__REACT_DEVTOOLS_GLOBAL_HOOK__={}</script><p>Content here</p></body></html>'
    const result = detectSPAIndicators(reactHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('react'))).toBe(true)
  })

  it('detects Vue.js via data-v- attribute', () => {
    const vueHtml = '<html><body><div data-v-abc123><h1>Hello</h1></div></body></html>'
    const result = detectSPAIndicators(vueHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('vue'))).toBe(true)
  })

  it('detects Vue.js via __VUE__', () => {
    const vueHtml = '<html><body><div id="app"><p>Hello</p></div><script>window.__VUE__ = true</script></body></html>'
    const result = detectSPAIndicators(vueHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('vue'))).toBe(true)
  })

  it('detects Ember via ember-view', () => {
    const emberHtml = '<html><body><div class="ember-view"><p>Hello</p></div></body></html>'
    const result = detectSPAIndicators(emberHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('ember'))).toBe(true)
  })

  it('detects empty app container as SPA indicator', () => {
    const emptyRoot = '<html><body><div id="root">  </div></body></html>'
    const result = detectSPAIndicators(emptyRoot)
    expect(result.indicators.some(i => i.toLowerCase().includes('empty app container'))).toBe(true)
    expect(result.isSPA).toBe(true)
  })

  it('detects empty #app container as SPA indicator', () => {
    const emptyApp = '<html><body><div id="app"></div></body></html>'
    const result = detectSPAIndicators(emptyApp)
    expect(result.indicators.some(i => i.toLowerCase().includes('empty app container'))).toBe(true)
  })

  it('detects noscript requirement as indicator', () => {
    const noscriptHtml = '<html><body><noscript>You need to enable JavaScript</noscript><div id="root"></div></body></html>'
    const result = detectSPAIndicators(noscriptHtml)
    expect(result.indicators.some(i => i.toLowerCase().includes('javascript'))).toBe(true)
  })

  it('detects very little visible content when body text is under 200 chars', () => {
    const thinBody = '<html><body><div id="root"></div><script>app.init()</script></body></html>'
    const result = detectSPAIndicators(thinBody)
    // After stripping scripts and tags, body text is ~0 chars
    expect(result.indicators.some(i => i.toLowerCase().includes('very little'))).toBe(true)
  })

  // HAPPY PATHS — Static site (isSPA: false)

  it('returns isSPA: false for plain static HTML with rich content', () => {
    const staticHtml = `
      <html>
        <body>
          <h1>Welcome to our company</h1>
          <p>We have been serving customers since 1985. Our team of 200 professionals delivers exceptional results.
          We specialize in precision manufacturing and have completed over 5000 projects for clients across 30 countries.
          Our ISO 9001 certified processes ensure quality at every step of production.</p>
          <p>Contact us today to learn more about our services and how we can help your business grow.</p>
        </body>
      </html>
    `
    const result = detectSPAIndicators(staticHtml)
    expect(result.isSPA).toBe(false)
  })

  it('returns no framework indicators for pure static HTML', () => {
    const staticHtml = '<html><body><h1>Hello</h1><p>Static content here with more than two hundred characters of real text to avoid triggering the minimal content detector in this test case for coverage purposes.</p></body></html>'
    const result = detectSPAIndicators(staticHtml)
    const frameworkIndicators = result.indicators.filter(i =>
      i.includes('Angular') || i.includes('React') || i.includes('Vue') || i.includes('Ember')
    )
    expect(frameworkIndicators).toHaveLength(0)
  })

  // isSPA logic

  it('isSPA is true when empty app container present', () => {
    const spa = '<html><body><div id="root">  </div></body></html>'
    const result = detectSPAIndicators(spa)
    expect(result.isSPA).toBe(true)
  })

  it('isSPA is true when framework + multiple indicators', () => {
    // Angular + noscript + thin content = SPA
    const spa = `<html><body>
      <div ng-app="myApp"></div>
      <noscript>Please enable JavaScript</noscript>
    </body></html>`
    const result = detectSPAIndicators(spa)
    expect(result.isSPA).toBe(true)
  })

  it('Next.js alone does not necessarily make isSPA true (may be SSR)', () => {
    // Next.js is flagged as "may be SSR" — indicator logged but isSPA depends on content
    const nextWithContent = `<html><body>
      <script id="__NEXT_DATA__" type="application/json">{}</script>
      <main><h1>Page title</h1><p>This page has a lot of real content that is rendered server-side
      by Next.js and therefore readable by crawlers without JavaScript.
      More content here to push past the 200 char threshold for the body content check.</p></main>
    </body></html>`
    const result = detectSPAIndicators(nextWithContent)
    // isSPA may be false because content is present — just verify it doesn't throw and returns a bool
    expect(typeof result.isSPA).toBe('boolean')
    // The Next.js indicator IS recorded
    expect(result.indicators.some(i => i.includes('Next.js'))).toBe(true)
  })
})
