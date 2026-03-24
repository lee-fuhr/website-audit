import { createTextFragmentUrl } from '@/app/preview/[id]/components/preview-utils'

describe('createTextFragmentUrl', () => {
  // UNHAPPY PATHS FIRST

  it('returns empty string when baseUrl is empty', () => {
    expect(createTextFragmentUrl('', 'some phrase')).toBe('')
  })

  it('returns baseUrl unchanged when phrase is empty', () => {
    expect(createTextFragmentUrl('https://example.com', '')).toBe('https://example.com')
  })

  it('returns empty string when both baseUrl and phrase are empty', () => {
    expect(createTextFragmentUrl('', '')).toBe('')
  })

  it('does not throw when baseUrl is null (cast)', () => {
    expect(() =>
      createTextFragmentUrl(null as unknown as string, 'phrase')
    ).not.toThrow()
  })

  it('does not throw when phrase is null (cast)', () => {
    expect(() =>
      createTextFragmentUrl('https://example.com', null as unknown as string)
    ).not.toThrow()
  })

  it('does not throw when baseUrl is undefined (cast)', () => {
    expect(() =>
      createTextFragmentUrl(undefined as unknown as string, 'phrase')
    ).not.toThrow()
  })

  it('does not throw when phrase is undefined (cast)', () => {
    expect(() =>
      createTextFragmentUrl('https://example.com', undefined as unknown as string)
    ).not.toThrow()
  })

  // HAPPY PATHS

  it('appends #:~:text= with encoded phrase for a normal URL', () => {
    const result = createTextFragmentUrl('https://example.com', 'hello world')
    expect(result).toBe('https://example.com#:~:text=hello%20world')
  })

  it('encodes special characters in the phrase', () => {
    const result = createTextFragmentUrl('https://example.com', 'price is $100 & up')
    expect(result).toBe('https://example.com#:~:text=price%20is%20%24100%20%26%20up')
  })

  it('truncates phrase longer than 50 characters before encoding', () => {
    const longPhrase = 'A'.repeat(60)
    const result = createTextFragmentUrl('https://example.com', longPhrase)
    // Should only encode the first 50 characters
    const expected50 = encodeURIComponent('A'.repeat(50))
    expect(result).toBe(`https://example.com#:~:text=${expected50}`)
  })

  it('does not truncate phrase that is exactly 50 characters', () => {
    const exact50 = 'B'.repeat(50)
    const result = createTextFragmentUrl('https://example.com', exact50)
    const encoded = encodeURIComponent(exact50)
    expect(result).toBe(`https://example.com#:~:text=${encoded}`)
  })

  it('does not add extra # when URL already contains a hash', () => {
    const result = createTextFragmentUrl('https://example.com#section', 'find me')
    // separator is '' when URL already has #, so no extra # before :~:
    expect(result).toBe('https://example.com#section:~:text=find%20me')
  })

  it('appends hash correctly when URL has query params but no hash', () => {
    const result = createTextFragmentUrl('https://example.com?page=1&sort=asc', 'target text')
    expect(result).toBe('https://example.com?page=1&sort=asc#:~:text=target%20text')
  })
})
