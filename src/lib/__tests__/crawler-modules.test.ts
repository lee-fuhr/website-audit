/**
 * Tests for crawler sub-modules:
 *  - src/lib/crawler/url-utils.ts  (isPrivateUrl, shouldSkipUrl, extractLinks, findLinkedIn)
 *  - src/lib/crawler/html-extractors.ts (extractText, extractTitle, extractH1, extractMeta,
 *      extractOgSiteName, extractFooterText, isErrorPage, extractCompanyName)
 *  - src/lib/crawler/fetch.ts (fetchPage — mocked fetch)
 *
 * crawlWebsite itself is an integration-level orchestrator; the interesting logic lives in
 * these pure / mockable helpers. Testing those gives better signal with less noise.
 */

import {
  isPrivateUrl,
  shouldSkipUrl,
  extractLinks,
  findLinkedIn,
  SKIP_PATTERNS,
} from '../crawler/url-utils'

import {
  extractText,
  extractTitle,
  extractH1,
  extractMeta,
  extractOgSiteName,
  extractFooterText,
  isErrorPage,
  extractCompanyName,
} from '../crawler/html-extractors'

import { fetchPage } from '../crawler/fetch'

// ---------------------------------------------------------------------------
// Mocking global fetch for fetchPage tests
// ---------------------------------------------------------------------------

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

beforeEach(() => {
  mockFetch.mockReset()
})

// ===========================================================================
// isPrivateUrl
// ===========================================================================

describe('isPrivateUrl', () => {
  // UNHAPPY PATHS / blocked addresses

  it('blocks localhost', () => {
    expect(isPrivateUrl('http://localhost/')).toBe(true)
  })

  it('blocks localhost.localdomain', () => {
    expect(isPrivateUrl('http://localhost.localdomain/')).toBe(true)
  })

  it('blocks IPv6 loopback [::1]', () => {
    expect(isPrivateUrl('http://[::1]/')).toBe(true)
  })

  it('blocks loopback 127.0.0.1', () => {
    expect(isPrivateUrl('http://127.0.0.1/')).toBe(true)
  })

  it('blocks loopback 127.99.0.1', () => {
    expect(isPrivateUrl('http://127.99.0.1/')).toBe(true)
  })

  it('blocks private class A 10.0.0.1', () => {
    expect(isPrivateUrl('http://10.0.0.1/')).toBe(true)
  })

  it('blocks private class A 10.255.255.255', () => {
    expect(isPrivateUrl('http://10.255.255.255/')).toBe(true)
  })

  it('blocks private class B 172.16.0.1', () => {
    expect(isPrivateUrl('http://172.16.0.1/')).toBe(true)
  })

  it('blocks private class B 172.31.255.255', () => {
    expect(isPrivateUrl('http://172.31.255.255/')).toBe(true)
  })

  it('does NOT block 172.15.x.x (just outside class B range)', () => {
    expect(isPrivateUrl('http://172.15.0.1/')).toBe(false)
  })

  it('does NOT block 172.32.x.x (just outside class B range)', () => {
    expect(isPrivateUrl('http://172.32.0.1/')).toBe(false)
  })

  it('blocks private class C 192.168.0.1', () => {
    expect(isPrivateUrl('http://192.168.0.1/')).toBe(true)
  })

  it('blocks link-local 169.254.0.1', () => {
    expect(isPrivateUrl('http://169.254.0.1/')).toBe(true)
  })

  it('blocks AWS metadata endpoint 169.254.169.254', () => {
    expect(isPrivateUrl('http://169.254.169.254/latest/meta-data/')).toBe(true)
  })

  it('blocks GCP metadata endpoint metadata.google.internal', () => {
    expect(isPrivateUrl('http://metadata.google.internal/')).toBe(true)
  })

  it('blocks .internal hostnames', () => {
    expect(isPrivateUrl('http://service.cluster.internal/')).toBe(true)
  })

  it('blocks .local hostnames', () => {
    expect(isPrivateUrl('http://printer.local/')).toBe(true)
  })

  it('blocks 0.0.0.0', () => {
    expect(isPrivateUrl('http://0.0.0.0/')).toBe(true)
  })

  it('blocks completely invalid URL string', () => {
    expect(isPrivateUrl('not-a-url')).toBe(true)
  })

  it('blocks empty string', () => {
    expect(isPrivateUrl('')).toBe(true)
  })

  // HAPPY PATHS — public addresses

  it('allows public IP 8.8.8.8', () => {
    expect(isPrivateUrl('http://8.8.8.8/')).toBe(false)
  })

  it('allows public hostname example.com', () => {
    expect(isPrivateUrl('https://example.com/')).toBe(false)
  })

  it('allows public hostname with path', () => {
    expect(isPrivateUrl('https://acmecorp.com/about')).toBe(false)
  })
})

// ===========================================================================
// shouldSkipUrl
// ===========================================================================

describe('shouldSkipUrl', () => {
  // UNHAPPY PATHS — should be skipped

  it('skips /wp-json/ API endpoint', () => {
    expect(shouldSkipUrl('https://example.com/wp-json/wp/v2/posts')).toBe(true)
  })

  it('skips /wp-admin/', () => {
    expect(shouldSkipUrl('https://example.com/wp-admin/options.php')).toBe(true)
  })

  it('skips /feed/', () => {
    expect(shouldSkipUrl('https://example.com/feed/')).toBe(true)
  })

  it('skips /cart/', () => {
    expect(shouldSkipUrl('https://example.com/cart/')).toBe(true)
  })

  it('skips /checkout/', () => {
    expect(shouldSkipUrl('https://example.com/checkout/')).toBe(true)
  })

  it('skips pagination /page/3/', () => {
    expect(shouldSkipUrl('https://example.com/blog/page/3/')).toBe(true)
  })

  it('skips PDF files', () => {
    expect(shouldSkipUrl('https://example.com/docs/brochure.pdf')).toBe(true)
  })

  it('skips image files (.jpg)', () => {
    expect(shouldSkipUrl('https://example.com/img/logo.jpg')).toBe(true)
  })

  it('skips image files (.png)', () => {
    expect(shouldSkipUrl('https://example.com/img/photo.png')).toBe(true)
  })

  it('skips SVG files', () => {
    expect(shouldSkipUrl('https://example.com/icons/icon.svg')).toBe(true)
  })

  it('skips ZIP files', () => {
    expect(shouldSkipUrl('https://example.com/downloads/archive.zip')).toBe(true)
  })

  it('skips ?add-to-cart= query string', () => {
    expect(shouldSkipUrl('https://example.com/product?add-to-cart=42')).toBe(true)
  })

  it('skips xmlrpc.php', () => {
    expect(shouldSkipUrl('https://example.com/xmlrpc.php')).toBe(true)
  })

  // HAPPY PATHS — should NOT be skipped

  it('does not skip normal homepage', () => {
    expect(shouldSkipUrl('https://example.com')).toBe(false)
  })

  it('does not skip /about', () => {
    expect(shouldSkipUrl('https://example.com/about')).toBe(false)
  })

  it('does not skip /services', () => {
    expect(shouldSkipUrl('https://example.com/services')).toBe(false)
  })

  it('does not skip /blog/post-title', () => {
    expect(shouldSkipUrl('https://example.com/blog/my-post-title')).toBe(false)
  })

  it('does not skip /contact', () => {
    expect(shouldSkipUrl('https://example.com/contact')).toBe(false)
  })

  it('does not skip URL containing "cart" in the middle of a word', () => {
    // /shopping-cart-guide should not match /cart/?$ pattern
    expect(shouldSkipUrl('https://example.com/shopping-cart-guide')).toBe(false)
  })
})

// ===========================================================================
// extractLinks
// ===========================================================================

describe('extractLinks', () => {
  // UNHAPPY PATHS

  it('returns empty array for empty HTML', () => {
    expect(extractLinks('', 'https://example.com')).toEqual([])
  })

  it('returns empty array when no href attributes present', () => {
    const html = '<html><body><p>No links here</p></body></html>'
    expect(extractLinks(html, 'https://example.com')).toEqual([])
  })

  it('ignores anchor (#) hrefs', () => {
    const html = '<a href="#section">Jump</a>'
    expect(extractLinks(html, 'https://example.com')).toEqual([])
  })

  it('ignores javascript: hrefs', () => {
    const html = '<a href="javascript:void(0)">Click</a>'
    expect(extractLinks(html, 'https://example.com')).toEqual([])
  })

  it('ignores mailto: hrefs', () => {
    const html = '<a href="mailto:test@example.com">Email</a>'
    expect(extractLinks(html, 'https://example.com')).toEqual([])
  })

  it('ignores tel: hrefs', () => {
    const html = '<a href="tel:+15551234567">Call</a>'
    expect(extractLinks(html, 'https://example.com')).toEqual([])
  })

  it('ignores external links', () => {
    const html = '<a href="https://other.com/page">External</a>'
    expect(extractLinks(html, 'https://example.com')).toEqual([])
  })

  it('ignores skippable URL patterns (e.g. PDF)', () => {
    const html = '<a href="/docs/file.pdf">Download</a>'
    expect(extractLinks(html, 'https://example.com')).toEqual([])
  })

  // HAPPY PATHS

  it('returns internal absolute link', () => {
    const html = '<a href="https://example.com/about">About</a>'
    const links = extractLinks(html, 'https://example.com')
    expect(links).toContain('https://example.com/about')
  })

  it('returns internal relative link resolved against base URL', () => {
    const html = '<a href="/contact">Contact</a>'
    const links = extractLinks(html, 'https://example.com')
    expect(links).toContain('https://example.com/contact')
  })

  it('de-duplicates identical links', () => {
    const html = '<a href="/about">A</a><a href="/about">B</a>'
    const links = extractLinks(html, 'https://example.com')
    expect(links.filter(l => l === 'https://example.com/about')).toHaveLength(1)
  })

  it('strips trailing slashes from normalized links', () => {
    const html = '<a href="https://example.com/services/">Services</a>'
    const links = extractLinks(html, 'https://example.com')
    expect(links).toContain('https://example.com/services')
    expect(links).not.toContain('https://example.com/services/')
  })

  it('collects multiple distinct internal links', () => {
    const html = `
      <a href="/about">About</a>
      <a href="/services">Services</a>
      <a href="/contact">Contact</a>
    `
    const links = extractLinks(html, 'https://example.com')
    expect(links).toHaveLength(3)
  })

  it('handles single-quoted hrefs', () => {
    const html = "<a href='/about'>About</a>"
    const links = extractLinks(html, 'https://example.com')
    expect(links).toContain('https://example.com/about')
  })
})

// ===========================================================================
// findLinkedIn
// ===========================================================================

describe('findLinkedIn', () => {
  it('returns undefined for empty HTML', () => {
    expect(findLinkedIn('')).toBeUndefined()
  })

  it('returns undefined when no LinkedIn link present', () => {
    const html = '<a href="https://twitter.com/acme">Twitter</a>'
    expect(findLinkedIn(html)).toBeUndefined()
  })

  it('finds https LinkedIn company URL', () => {
    const html = '<a href="https://www.linkedin.com/company/acme-corp">LinkedIn</a>'
    expect(findLinkedIn(html)).toBe('https://www.linkedin.com/company/acme-corp')
  })

  it('finds LinkedIn URL without www', () => {
    const html = '<a href="https://linkedin.com/company/acme-corp">LinkedIn</a>'
    expect(findLinkedIn(html)).toBe('https://linkedin.com/company/acme-corp')
  })

  it('handles single-quoted href', () => {
    const html = "<a href='https://www.linkedin.com/company/test-co/'>Link</a>"
    expect(findLinkedIn(html)).toBe('https://www.linkedin.com/company/test-co/')
  })

  it('returns only the first LinkedIn URL when multiple present', () => {
    const html = `
      <a href="https://www.linkedin.com/company/first">A</a>
      <a href="https://www.linkedin.com/company/second">B</a>
    `
    expect(findLinkedIn(html)).toBe('https://www.linkedin.com/company/first')
  })
})

// ===========================================================================
// extractText
// ===========================================================================

describe('extractText', () => {
  it('returns empty string for empty HTML', () => {
    expect(extractText('')).toBe('')
  })

  it('strips script tags and their contents', () => {
    const html = '<p>Hello</p><script>alert("xss")</script>'
    expect(extractText(html)).not.toContain('alert')
    expect(extractText(html)).toContain('Hello')
  })

  it('strips style tags and their contents', () => {
    const html = '<p>Text</p><style>body { color: red; }</style>'
    expect(extractText(html)).not.toContain('color')
    expect(extractText(html)).toContain('Text')
  })

  it('strips nav elements', () => {
    const html = '<nav><a href="/">Home</a></nav><p>Main content</p>'
    // Nav text is removed
    expect(extractText(html)).not.toContain('Home')
    expect(extractText(html)).toContain('Main content')
  })

  it('strips footer elements', () => {
    const html = '<p>Content</p><footer>Copyright 2024</footer>'
    expect(extractText(html)).not.toContain('Copyright')
  })

  it('strips header elements', () => {
    const html = '<header>Navigation header</header><p>Body</p>'
    expect(extractText(html)).not.toContain('Navigation header')
    expect(extractText(html)).toContain('Body')
  })

  it('removes remaining HTML tags', () => {
    const html = '<div><h1>Title</h1><p>Paragraph</p></div>'
    const text = extractText(html)
    expect(text).not.toContain('<')
    expect(text).not.toContain('>')
  })

  it('decodes &nbsp; to space', () => {
    const html = '<p>hello&nbsp;world</p>'
    expect(extractText(html)).toContain('hello world')
  })

  it('decodes &amp;', () => {
    const html = '<p>rock &amp; roll</p>'
    expect(extractText(html)).toContain('rock & roll')
  })

  it('decodes &lt; and &gt;', () => {
    const html = '<p>&lt;br&gt;</p>'
    expect(extractText(html)).toContain('<br>')
  })

  it('collapses whitespace', () => {
    const html = '<p>   too   much   space   </p>'
    const text = extractText(html)
    expect(text).not.toMatch(/\s{2,}/)
  })

  it('returns trimmed text', () => {
    const html = '   <p>trimmed</p>   '
    expect(extractText(html).startsWith(' ')).toBe(false)
    expect(extractText(html).endsWith(' ')).toBe(false)
  })
})

// ===========================================================================
// extractTitle
// ===========================================================================

describe('extractTitle', () => {
  it('returns "Untitled" for empty HTML', () => {
    expect(extractTitle('')).toBe('Untitled')
  })

  it('returns "Untitled" when no title or h1', () => {
    expect(extractTitle('<html><body><p>No title here</p></body></html>')).toBe('Untitled')
  })

  it('extracts text from <title> tag', () => {
    const html = '<html><head><title>My Company | Home</title></head><body></body></html>'
    expect(extractTitle(html)).toBe('My Company | Home')
  })

  it('trims whitespace from title', () => {
    const html = '<title>  Padded Title  </title>'
    expect(extractTitle(html)).toBe('Padded Title')
  })

  it('falls back to H1 when no title tag', () => {
    const html = '<html><body><h1>About Us</h1></body></html>'
    expect(extractTitle(html)).toBe('About Us')
  })

  it('prefers <title> over <h1>', () => {
    const html = '<title>Title Tag</title><h1>H1 Tag</h1>'
    expect(extractTitle(html)).toBe('Title Tag')
  })
})

// ===========================================================================
// extractH1
// ===========================================================================

describe('extractH1', () => {
  it('returns undefined for empty HTML', () => {
    expect(extractH1('')).toBeUndefined()
  })

  it('returns undefined when no H1 present', () => {
    expect(extractH1('<html><body><h2>Sub</h2></body></html>')).toBeUndefined()
  })

  it('extracts simple H1 text', () => {
    const html = '<html><body><h1>We Build Remarkable Software</h1></body></html>'
    expect(extractH1(html)).toBe('We Build Remarkable Software')
  })

  it('strips inline HTML tags within H1', () => {
    const html = '<html><body><h1><strong>Bold</strong> headline</h1></body></html>'
    const result = extractH1(html)
    expect(result).toContain('Bold')
    expect(result).toContain('headline')
    expect(result).not.toContain('<strong>')
  })

  it('ignores H1s inside <header> element (strips header first)', () => {
    const html = '<header><h1>Navigation</h1></header><main><h1>Real Hero Headline That Is Long</h1></main>'
    // After stripping header, only the main h1 remains
    const result = extractH1(html)
    expect(result).toContain('Real Hero Headline')
  })

  it('ignores H1s inside <nav> element', () => {
    const html = '<nav><h1>Menu</h1></nav><h1>This is the primary headline for the page</h1>'
    const result = extractH1(html)
    expect(result).toContain('primary headline')
  })

  it('ignores short nav-like H1s (< 20 chars + nav word)', () => {
    // "Contact" alone is a nav word and short — should be filtered
    const html = `
      <h1>Contact</h1>
      <h1>Providing world-class engineering services to the Fortune 500</h1>
    `
    const result = extractH1(html)
    expect(result).toBeTruthy()
    expect(result).toContain('world-class')
  })

  it('falls back to longest H1 when all are filtered', () => {
    // Both H1s look like nav items; should return the longest one
    const html = '<h1>Home</h1><h1>About</h1>'
    const result = extractH1(html)
    // Should not throw; returns one of them
    expect(result).toBeDefined()
  })
})

// ===========================================================================
// extractMeta
// ===========================================================================

describe('extractMeta', () => {
  it('returns empty object for empty HTML', () => {
    expect(extractMeta('')).toEqual({})
  })

  it('extracts meta description', () => {
    const html = '<meta name="description" content="We build great software">'
    const meta = extractMeta(html)
    expect(meta.description).toBe('We build great software')
  })

  it('extracts og:title', () => {
    const html = '<meta property="og:title" content="My Site - Home">'
    const meta = extractMeta(html)
    expect(meta.ogTitle).toBe('My Site - Home')
  })

  it('extracts og:description', () => {
    const html = '<meta property="og:description" content="We help companies grow">'
    const meta = extractMeta(html)
    expect(meta.ogDescription).toBe('We help companies grow')
  })

  it('returns undefined fields when tags are absent', () => {
    const meta = extractMeta('<html><head></head><body></body></html>')
    expect(meta.description).toBeUndefined()
    expect(meta.ogTitle).toBeUndefined()
    expect(meta.ogDescription).toBeUndefined()
  })

  it('extracts all three fields from a full head block', () => {
    const html = `
      <meta name="description" content="Desc here">
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Desc">
    `
    const meta = extractMeta(html)
    expect(meta.description).toBe('Desc here')
    expect(meta.ogTitle).toBe('OG Title')
    expect(meta.ogDescription).toBe('OG Desc')
  })
})

// ===========================================================================
// extractOgSiteName
// ===========================================================================

describe('extractOgSiteName', () => {
  it('returns undefined for empty HTML', () => {
    expect(extractOgSiteName('')).toBeUndefined()
  })

  it('returns undefined when og:site_name absent', () => {
    expect(extractOgSiteName('<html><head></head></html>')).toBeUndefined()
  })

  it('extracts og:site_name in property-first order', () => {
    const html = '<meta property="og:site_name" content="Acme Corp">'
    expect(extractOgSiteName(html)).toBe('Acme Corp')
  })

  it('extracts og:site_name in content-first order', () => {
    const html = '<meta content="Acme Corp" property="og:site_name">'
    expect(extractOgSiteName(html)).toBe('Acme Corp')
  })

  it('handles single-quoted attribute values', () => {
    const html = "<meta property='og:site_name' content='Acme Corp'>"
    expect(extractOgSiteName(html)).toBe('Acme Corp')
  })
})

// ===========================================================================
// extractFooterText
// ===========================================================================

describe('extractFooterText', () => {
  it('returns undefined for empty HTML', () => {
    expect(extractFooterText('')).toBeUndefined()
  })

  it('returns undefined when no footer or copyright', () => {
    expect(extractFooterText('<html><body><p>Content</p></body></html>')).toBeUndefined()
  })

  it('extracts text from footer element', () => {
    const html = '<footer><p>Copyright 2024 Acme Corp. All rights reserved.</p></footer>'
    const text = extractFooterText(html)
    expect(text).toBeTruthy()
    expect(text).toContain('Copyright')
  })

  it('strips scripts inside footer', () => {
    const html = '<footer><script>analytics()</script><p>Copyright 2024 Acme</p></footer>'
    const text = extractFooterText(html)
    expect(text).not.toContain('analytics')
  })

  it('falls back to copyright notice outside footer element', () => {
    const html = '<div>© 2024 Standalone Corp. All rights reserved.</div>'
    const text = extractFooterText(html)
    expect(text).toBeTruthy()
    expect(text).toContain('2024')
  })

  it('returns undefined when footer text is longer than 2000 chars (too noisy)', () => {
    const longContent = 'x'.repeat(2001)
    const html = `<footer>${longContent}</footer>`
    // Long footer content → returns undefined
    expect(extractFooterText(html)).toBeUndefined()
  })
})

// ===========================================================================
// isErrorPage
// ===========================================================================

describe('isErrorPage', () => {
  // UNHAPPY PATHS (i.e., pages that ARE error pages)

  it('detects 404 in title', () => {
    expect(isErrorPage('Some body', '404 Not Found')).toBe(true)
  })

  it('detects "not found" in title (case insensitive)', () => {
    expect(isErrorPage('Some body', 'Page Not Found')).toBe(true)
  })

  it('detects "error" in title', () => {
    expect(isErrorPage('An error occurred', 'Error')).toBe(true)
  })

  it('detects "sorry" in title', () => {
    expect(isErrorPage('', 'Sorry, that page moved')).toBe(true)
  })

  it('detects "page not found" phrase in short body content', () => {
    expect(isErrorPage('page not found', 'Untitled')).toBe(true)
  })

  it('detects "oops!" in short body content', () => {
    expect(isErrorPage("Oops! We can't find what you're looking for.", 'Untitled')).toBe(true)
  })

  it('detects "does not exist" in short body', () => {
    expect(isErrorPage('This page does not exist anymore', 'Untitled')).toBe(true)
  })

  it('detects "broken link" in short body', () => {
    expect(isErrorPage('This appears to be a broken link', 'Untitled')).toBe(true)
  })

  // HAPPY PATHS (normal pages, not errors)

  it('returns false for a normal homepage', () => {
    const content = 'We are a leading provider of industrial equipment. Our team serves clients across 30 states.'
    expect(isErrorPage(content, 'Acme Equipment - Home')).toBe(false)
  })

  it('does NOT flag long body containing "page not found" in passing text', () => {
    // The function only checks error phrases when content.length < 2000
    const longContent = 'page not found '.repeat(200) // > 2000 chars
    expect(isErrorPage(longContent, 'Normal Title')).toBe(false)
  })

  it('returns false for empty content and empty title', () => {
    expect(isErrorPage('', '')).toBe(false)
  })
})

// ===========================================================================
// extractCompanyName
// ===========================================================================

describe('extractCompanyName', () => {
  // UNHAPPY PATHS

  it('returns undefined when all fields are undefined', () => {
    expect(extractCompanyName({})).toBeUndefined()
  })

  it('returns undefined when ogSiteName is empty string', () => {
    expect(extractCompanyName({ ogSiteName: '' })).toBeUndefined()
  })

  it('returns undefined when ogSiteName is single character', () => {
    // Length must be > 1
    expect(extractCompanyName({ ogSiteName: 'x' })).toBeUndefined()
  })

  it('returns undefined when title contains "home"', () => {
    expect(extractCompanyName({ title: 'Home' })).toBeUndefined()
  })

  it('returns undefined when title contains "welcome"', () => {
    expect(extractCompanyName({ title: 'Welcome to our site' })).toBeUndefined()
  })

  it('returns undefined when title segment is longer than 50 chars', () => {
    const longTitle = 'This is a very long company name that goes way over the limit | Other'
    expect(extractCompanyName({ title: longTitle })).toBeUndefined()
  })

  // HAPPY PATHS — priority order

  it('prefers ogSiteName over title', () => {
    const result = extractCompanyName({ ogSiteName: 'Preferred Co', title: 'Preferred Co - Home' })
    expect(result).toBe('Preferred Co')
  })

  it('uses ogSiteName when present and valid', () => {
    expect(extractCompanyName({ ogSiteName: 'Acme Corp' })).toBe('Acme Corp')
  })

  it('extracts company name from title before pipe', () => {
    expect(extractCompanyName({ title: 'Acme Corp | Home' })).toBe('Acme Corp')
  })

  it('extracts company name from title before dash', () => {
    expect(extractCompanyName({ title: 'Acme Corp - Services' })).toBe('Acme Corp')
  })

  it('extracts company name from footer copyright', () => {
    const footerText = '© 2024 Apex Industries Inc. All rights reserved.'
    expect(extractCompanyName({ footerText })).toBe('Apex Industries')
  })

  it('uses footer when title and ogSiteName are absent', () => {
    const footerText = '© 2023 Bright Solutions LLC. Privacy Policy'
    const result = extractCompanyName({ footerText })
    expect(result).toBeTruthy()
    expect(result).toContain('Bright Solutions')
  })
})

// ===========================================================================
// fetchPage (mocked fetch)
// ===========================================================================

describe('fetchPage', () => {
  // UNHAPPY PATHS FIRST

  it('returns null for private/internal URL (SSRF protection)', async () => {
    const result = await fetchPage('http://localhost:3000/')
    expect(result).toBeNull()
    // fetch should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null when fetch throws (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))
    const result = await fetchPage('https://example.com')
    expect(result).toBeNull()
  })

  it('returns null when response is not ok (404)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { get: () => 'text/html' },
    } as unknown as Response)
    const result = await fetchPage('https://example.com')
    expect(result).toBeNull()
  })

  it('returns null when content-type is not text/html (e.g. JSON)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json; charset=utf-8' },
      text: jest.fn().mockResolvedValueOnce('{"data":true}'),
    } as unknown as Response)
    const result = await fetchPage('https://example.com/api')
    expect(result).toBeNull()
  })

  it('returns null when content-type header is null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: jest.fn().mockResolvedValueOnce('<html></html>'),
    } as unknown as Response)
    const result = await fetchPage('https://example.com')
    expect(result).toBeNull()
  })

  it('returns null for private IP even with a valid-looking URL', async () => {
    const result = await fetchPage('http://192.168.1.100/admin')
    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // HAPPY PATH

  it('returns HTML string when fetch succeeds with text/html', async () => {
    const html = '<html><body><h1>Hello</h1></body></html>'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html; charset=utf-8' },
      text: jest.fn().mockResolvedValueOnce(html),
    } as unknown as Response)

    const result = await fetchPage('https://example.com')
    expect(result).toBe(html)
  })

  it('sends a User-Agent header', async () => {
    const html = '<html></html>'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      text: jest.fn().mockResolvedValueOnce(html),
    } as unknown as Response)

    await fetchPage('https://example.com')

    const callArgs = mockFetch.mock.calls[0]
    const options = callArgs[1] as RequestInit
    const headers = options.headers as Record<string, string>
    expect(headers['User-Agent']).toMatch(/WebsiteAuditBot/)
  })
})
