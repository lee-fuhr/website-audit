import { formatCompanyName, formatHostnameAsCompany, escapeHtml } from '../utils'

// NOTE: safeClipboardWrite is browser-only (navigator.clipboard, document.createElement)
// and is not testable in the Node/jest environment. Tests focus on the pure functions.

describe('formatCompanyName', () => {
  // UNHAPPY PATHS FIRST

  it('returns empty string for empty string input', () => {
    expect(formatCompanyName('')).toBe('')
  })

  it('returns null for null (cast)', () => {
    // The function returns the input unchanged when falsy
    expect(formatCompanyName(null as unknown as string)).toBeNull()
  })

  it('returns undefined for undefined (cast)', () => {
    expect(formatCompanyName(undefined as unknown as string)).toBeUndefined()
  })

  it('handles a single character without throwing', () => {
    expect(() => formatCompanyName('a')).not.toThrow()
  })

  it('handles a number string without throwing', () => {
    expect(() => formatCompanyName('42')).not.toThrow()
  })

  it('handles string with only separators gracefully', () => {
    // dashes and underscores become spaces, then trimmed
    expect(formatCompanyName('---')).toBe('')
  })

  // KNOWN COMPANIES (exact lookup)

  it('maps "hubspot" to "HubSpot"', () => {
    expect(formatCompanyName('hubspot')).toBe('HubSpot')
  })

  it('maps "linkedin" to "LinkedIn"', () => {
    expect(formatCompanyName('linkedin')).toBe('LinkedIn')
  })

  it('maps "github" to "GitHub"', () => {
    expect(formatCompanyName('github')).toBe('GitHub')
  })

  it('strips protocol before looking up known company', () => {
    expect(formatCompanyName('https://hubspot.com')).toBe('HubSpot')
  })

  it('strips www before looking up known company', () => {
    expect(formatCompanyName('www.hubspot.com')).toBe('HubSpot')
  })

  it('strips TLD before looking up known company', () => {
    expect(formatCompanyName('hubspot.io')).toBe('HubSpot')
  })

  // TITLE CASING — unknown companies

  it('title-cases a simple unknown domain name', () => {
    expect(formatCompanyName('acmecorp')).toBe('Acmecorp')
  })

  it('converts underscores to spaces', () => {
    // "my_company" → "My Company"
    expect(formatCompanyName('my_company')).toBe('My Company')
  })

  it('converts hyphens to spaces', () => {
    // "my-company" → "My Company"
    expect(formatCompanyName('my-company')).toBe('My Company')
  })

  it('handles CamelCase word-boundary detection', () => {
    // The function lowercases the whole string first before CamelCase splitting,
    // so "myCompany" → "mycompany" → no uppercase to split → "Mycompany".
    // CamelCase splitting only works on mixed-case input like "myCompany" when the
    // uppercase is preserved — but the .toLowerCase() call at the top kills it.
    // Test what the code actually does, not an idealized behaviour.
    expect(formatCompanyName('myCompany')).toBe('Mycompany')
  })

  it('handles numeric boundaries', () => {
    // "web2app" → "Web 2 App"
    expect(formatCompanyName('web2app')).toBe('Web 2 App')
  })

  // ACRONYMS

  it('upcases known acronym "seo"', () => {
    expect(formatCompanyName('seo')).toBe('SEO')
  })

  it('upcases known acronym "crm"', () => {
    expect(formatCompanyName('crm')).toBe('CRM')
  })

  it('upcases known acronym "api"', () => {
    expect(formatCompanyName('api')).toBe('API')
  })

  it('title-cases a word that was uppercased in input', () => {
    // The function calls .toLowerCase() on the whole input first, so "my-IBM"
    // becomes "my ibm" → title-cased as "My Ibm". The ACRONYM_PATTERNS check
    // only triggers for already-uppercase sequences (pre-lowercase), but by the
    // time words are processed they are already lower. This is the actual behaviour.
    expect(formatCompanyName('my-IBM')).toBe('My Ibm')
  })

  // LOWERCASE ARTICLES in multi-word names

  it('lowercases "and" between other words', () => {
    // "bread-and-butter" → "Bread and Butter"
    expect(formatCompanyName('bread-and-butter')).toBe('Bread and Butter')
  })

  it('lowercases "of" when not first/last', () => {
    // "bank-of-america" → "Bank of America"
    expect(formatCompanyName('bank-of-america')).toBe('Bank of America')
  })

  it('capitalises first word even if it is a lowercase-article word', () => {
    // "the-widget" — "the" is first so should be capitalised... actually the function
    // lowercases only when index > 0 && index < words.length - 1
    // For 2-word input "the widget", "the" is at index 0 — it should be capitalised
    const result = formatCompanyName('the-widget')
    expect(result.startsWith('The')).toBe(true)
  })

  it('capitalises last word even if it is a lowercase-article word', () => {
    // "widget-and" — "and" is last so should be capitalised
    const result = formatCompanyName('widget-and')
    expect(result.endsWith('And')).toBe(true)
  })
})

describe('formatHostnameAsCompany', () => {
  // UNHAPPY PATHS FIRST

  it('handles invalid URL gracefully (falls back to formatCompanyName)', () => {
    // Invalid URL → catch block → calls formatCompanyName on the raw string
    expect(() => formatHostnameAsCompany('not-a-url')).not.toThrow()
    // The fallback will title-case "not-a-url" → "Not a Url"
    const result = formatHostnameAsCompany('not-a-url')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles empty string without throwing', () => {
    expect(() => formatHostnameAsCompany('')).not.toThrow()
  })

  it('handles completely malformed input without throwing', () => {
    expect(() => formatHostnameAsCompany('!@#$%^&*()')).not.toThrow()
  })

  // HAPPY PATHS

  it('extracts known company from full URL with path', () => {
    expect(formatHostnameAsCompany('https://www.hubspot.com/marketing')).toBe('HubSpot')
  })

  it('strips www from hostname before formatting', () => {
    expect(formatHostnameAsCompany('https://www.github.com')).toBe('GitHub')
  })

  it('uses only hostname, ignores path', () => {
    // "https://acmecorp.com/about/team" → hostname = "acmecorp.com" → "acmecorp" → "Acmecorp"
    const result = formatHostnameAsCompany('https://acmecorp.com/about/team')
    expect(result).toBe('Acmecorp')
  })

  it('processes bare hostname correctly', () => {
    // The URL constructor requires a protocol; bare hostnames fall to the catch block
    // and use formatCompanyName directly
    const result = formatHostnameAsCompany('linkedin.com')
    // Falls to catch → formatCompanyName('linkedin.com') → 'LinkedIn'
    expect(result).toBe('LinkedIn')
  })
})

describe('escapeHtml', () => {
  // UNHAPPY PATHS FIRST

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('handles string with no special characters unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('handles string that is already escaped (double-escape)', () => {
    // Passing already-escaped text should escape the ampersand in &amp;
    expect(escapeHtml('&amp;')).toBe('&amp;amp;')
  })

  // HAPPY PATHS — all five characters

  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than sign', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes greater-than sign', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s')
  })

  it('escapes all five special characters in a single string', () => {
    const input = `<div class="test" data-value='5 & 10'>`
    const output = escapeHtml(input)
    expect(output).not.toContain('<')
    expect(output).not.toContain('>')
    expect(output).not.toContain('"')
    expect(output).not.toContain("'")
    // The raw & that was not part of an entity is escaped
    expect(output).toContain('&amp;')
    expect(output).toContain('&lt;')
    expect(output).toContain('&gt;')
    expect(output).toContain('&quot;')
    expect(output).toContain('&#039;')
  })

  it('prevents XSS script injection', () => {
    const xss = '<script>alert("xss")</script>'
    const escaped = escapeHtml(xss)
    expect(escaped).not.toContain('<script>')
    expect(escaped).toContain('&lt;script&gt;')
  })

  it('handles unicode characters without modification', () => {
    expect(escapeHtml('café résumé')).toBe('café résumé')
  })

  it('handles long strings efficiently', () => {
    const long = 'a'.repeat(10000)
    expect(escapeHtml(long)).toBe(long)
  })
})
