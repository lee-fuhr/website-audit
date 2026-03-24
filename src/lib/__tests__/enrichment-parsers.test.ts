import { parseCompetitorAnalysisResponse } from '@/lib/analysis/enrichment-parsers'

describe('parseCompetitorAnalysisResponse', () => {
  // UNHAPPY PATHS FIRST

  it('returns null for non-JSON input', () => {
    expect(parseCompetitorAnalysisResponse('this is not json', 'https://example.com')).toBeNull()
  })

  it('returns null for input with no curly braces at all', () => {
    expect(parseCompetitorAnalysisResponse('just plain text here', 'https://example.com')).toBeNull()
  })

  it('returns result with default scores when JSON is an empty object', () => {
    const result = parseCompetitorAnalysisResponse('{}', 'https://example.com')
    expect(result).not.toBeNull()
    // All category scores default to 5 via toScore fallback
    expect(result!.categoryScores).toEqual({
      firstImpression: 5,
      differentiation: 5,
      customerClarity: 5,
      storyStructure: 5,
      trustSignals: 5,
      buttonClarity: 5,
    })
    expect(result!.strengths).toEqual([])
    // overallScore = round(5 * 10) = 50, which is < 70 and < 60, so fallback weakness
    expect(result!.overallScore).toBe(50)
    expect(result!.weaknesses).toEqual(['Limited use of specific claims and evidence'])
  })

  it('defaults missing categoryScores fields to 5', () => {
    const input = JSON.stringify({
      categoryScores: { firstImpression: 8 },
      strengths: ['Good hero'],
      weaknesses: ['Weak CTA messaging and button placement'],
    })
    const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
    expect(result).not.toBeNull()
    expect(result!.categoryScores.firstImpression).toBe(8)
    // All others default to 5
    expect(result!.categoryScores.differentiation).toBe(5)
    expect(result!.categoryScores.customerClarity).toBe(5)
    expect(result!.categoryScores.storyStructure).toBe(5)
    expect(result!.categoryScores.trustSignals).toBe(5)
    expect(result!.categoryScores.buttonClarity).toBe(5)
  })

  it('clamps scores below 0 to 0', () => {
    const input = JSON.stringify({
      categoryScores: { firstImpression: -5 },
    })
    const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
    expect(result!.categoryScores.firstImpression).toBe(0)
  })

  it('clamps scores above 10 to 10', () => {
    const input = JSON.stringify({
      categoryScores: { firstImpression: 99 },
    })
    const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
    expect(result!.categoryScores.firstImpression).toBe(10)
  })

  it('treats non-number category scores as 5', () => {
    const input = JSON.stringify({
      categoryScores: { firstImpression: 'high', differentiation: null },
    })
    const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
    expect(result!.categoryScores.firstImpression).toBe(5)
    expect(result!.categoryScores.differentiation).toBe(5)
  })

  it('extracts JSON even when surrounded by prose text', () => {
    const text = 'Here is my analysis:\n' + JSON.stringify({
      categoryScores: { firstImpression: 7, differentiation: 7, customerClarity: 7, storyStructure: 7, trustSignals: 7, buttonClarity: 7 },
      strengths: ['Strong hero'],
      weaknesses: ['Weak footer messaging needs improvement'],
    }) + '\nEnd of analysis.'
    const result = parseCompetitorAnalysisResponse(text, 'https://example.com')
    expect(result).not.toBeNull()
    expect(result!.categoryScores.firstImpression).toBe(7)
  })

  // TRUNCATION FILTERING (v2.0.1 fix)

  describe('truncation filtering', () => {
    let warnSpy: jest.SpyInstance

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('filters weakness that starts with ellipsis + lowercase (mid-word truncation)', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Good positioning headline'],
        weaknesses: ['...nd what you want from this site'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toEqual([])
      expect(warnSpy).toHaveBeenCalledWith(
        '[analyze] Filtered truncated weakness (starts mid-word)',
        expect.objectContaining({ weakness: '...nd what you want from this site' })
      )
    })

    it('filters weakness with mid-word ellipsis pattern', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Clear value proposition'],
        weaknesses: ['Some metric...ly over 60% of visitors bounce'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toEqual([])
      expect(warnSpy).toHaveBeenCalledWith(
        '[analyze] Filtered truncated weakness (mid-word ellipsis)',
        expect.objectContaining({ weakness: 'Some metric...ly over 60% of visitors bounce' })
      )
    })

    it('filters weakness that is too short with no spaces', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Solid proof points'],
        weaknesses: ['bad'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toEqual([])
      expect(warnSpy).toHaveBeenCalledWith(
        '[analyze] Filtered truncated weakness (too short/no spaces)',
        expect.objectContaining({ weakness: 'bad' })
      )
    })

    it('keeps valid complete weakness unchanged', () => {
      const validWeakness = 'No specific customer testimonials on the homepage'
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Great hero section'],
        weaknesses: [validWeakness],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toContain(validWeakness)
    })

    it('filters quoted ellipsis + lowercase at the start', () => {
      // The regex handles optional leading quote: /^["']?\.{2,}[a-z]/
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Clear positioning'],
        weaknesses: ['"...nd this is a fragment sentence'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toEqual([])
    })

    it('does NOT filter weakness starting with ellipsis + uppercase', () => {
      // Regex requires lowercase after the dots: /^["']?\.{2,}[a-z]/
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Strong messaging throughout'],
        weaknesses: ['...But could improve the footer messaging and layout'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toContain('...But could improve the footer messaging and layout')
    })
  })

  // CONTRADICTION FILTERING

  describe('contradiction filtering', () => {
    let warnSpy: jest.SpyInstance

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('filters weakness that contradicts a strength (proof / no proof)', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Uses specific proof points and data'],
        weaknesses: ['No proof of claims on the homepage is a concern'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toEqual([])
      expect(warnSpy).toHaveBeenCalledWith(
        '[analyze] Filtered contradictory weakness',
        expect.objectContaining({ conflictsWith: 'proof' })
      )
    })

    it('filters weakness about unclear audience when strength mentions customer clarity', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Clearly defines target customer segment'],
        weaknesses: ['Unclear audience makes it hard to connect'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toEqual([])
    })

    it('keeps non-contradictory strength/weakness pairs', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Strong hero section with clear positioning'],
        weaknesses: ['Footer lacks a compelling call to action for visitors'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toContain('Footer lacks a compelling call to action for visitors')
    })

    it('filters trust contradiction (trust strength vs lacks credibility weakness)', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
        strengths: ['Strong trust signals including certifications'],
        weaknesses: ['Site lacks credibility markers for new visitors'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.weaknesses).toEqual([])
    })
  })

  // LOW SCORE GUARANTEE

  describe('low score fallback weaknesses', () => {
    let warnSpy: jest.SpyInstance

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('adds two fallback weaknesses when score < 40 and no weaknesses remain', () => {
      // All scores at 2 → avg 2, overallScore = 20
      const input = JSON.stringify({
        categoryScores: { firstImpression: 2, differentiation: 2, customerClarity: 2, storyStructure: 2, trustSignals: 2, buttonClarity: 2 },
        strengths: [],
        weaknesses: [],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.overallScore).toBe(20)
      expect(result!.weaknesses).toEqual([
        'Weak differentiation from competitors',
        'Missing specific proof points',
      ])
    })

    it('adds one fallback weakness when score is between 40-59 and no weaknesses remain', () => {
      // All scores at 4 → avg 4, overallScore = 40. Wait, 40 < 60 but not < 40.
      // Need score >= 40 and < 60. Scores of 5 → avg 5, overallScore = 50.
      const input = JSON.stringify({
        categoryScores: { firstImpression: 5, differentiation: 5, customerClarity: 5, storyStructure: 5, trustSignals: 5, buttonClarity: 5 },
        strengths: [],
        weaknesses: [],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.overallScore).toBe(50)
      expect(result!.weaknesses).toEqual(['Limited use of specific claims and evidence'])
    })

    it('adds softer fallback when score is between 60-69 and no weaknesses remain', () => {
      // Scores of 6 → avg 6, overallScore = 60. But 60 < 70 and >= 60.
      const input = JSON.stringify({
        categoryScores: { firstImpression: 6, differentiation: 6, customerClarity: 6, storyStructure: 6, trustSignals: 6, buttonClarity: 6 },
        strengths: [],
        weaknesses: [],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.overallScore).toBe(60)
      expect(result!.weaknesses).toEqual(['Could strengthen messaging with more specific proof'])
    })

    it('does not add fallback weaknesses when score >= 70', () => {
      // Scores of 7 → avg 7, overallScore = 70
      const input = JSON.stringify({
        categoryScores: { firstImpression: 7, differentiation: 7, customerClarity: 7, storyStructure: 7, trustSignals: 7, buttonClarity: 7 },
        strengths: ['Good messaging'],
        weaknesses: [],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.overallScore).toBe(70)
      expect(result!.weaknesses).toEqual([])
    })

    it('does not add fallback when valid weaknesses already exist despite low score', () => {
      const input = JSON.stringify({
        categoryScores: { firstImpression: 3, differentiation: 3, customerClarity: 3, storyStructure: 3, trustSignals: 3, buttonClarity: 3 },
        strengths: [],
        weaknesses: ['The homepage hero section completely lacks any differentiation'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.overallScore).toBe(30)
      expect(result!.weaknesses).toEqual(['The homepage hero section completely lacks any differentiation'])
    })

    it('adds fallback when all original weaknesses were filtered out by truncation', () => {
      // Low score + all weaknesses are truncated garbage → should get fallback
      const input = JSON.stringify({
        categoryScores: { firstImpression: 2, differentiation: 2, customerClarity: 2, storyStructure: 2, trustSignals: 2, buttonClarity: 2 },
        strengths: [],
        weaknesses: ['...nd what you want', 'bad'],
      })
      const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
      expect(result!.overallScore).toBe(20)
      // All originals filtered; fallback kicks in
      expect(result!.weaknesses).toEqual([
        'Weak differentiation from competitors',
        'Missing specific proof points',
      ])
    })
  })

  // HAPPY PATH — full valid input

  it('parses a complete valid response with correct overall score', () => {
    const input = JSON.stringify({
      categoryScores: {
        firstImpression: 8,
        differentiation: 6,
        customerClarity: 7,
        storyStructure: 5,
        trustSignals: 9,
        buttonClarity: 7,
      },
      strengths: ['Clear hero', 'Good proof points', 'Strong CTA'],
      weaknesses: ['Footer needs work and improvement overall', 'Blog content is outdated and rarely updated'],
    })
    const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
    expect(result).not.toBeNull()
    // avg = (8+6+7+5+9+7)/6 = 42/6 = 7, overallScore = round(7*10) = 70
    expect(result!.overallScore).toBe(70)
    expect(result!.strengths).toHaveLength(3)
    expect(result!.weaknesses).toHaveLength(2)
  })

  it('limits strengths and weaknesses to 3 each', () => {
    const input = JSON.stringify({
      categoryScores: { firstImpression: 8, differentiation: 8, customerClarity: 8, storyStructure: 8, trustSignals: 8, buttonClarity: 8 },
      strengths: ['One', 'Two', 'Three', 'Four', 'Five'],
      weaknesses: [
        'First problem is that messaging is unclear to visitors',
        'Second problem is that differentiation is weak overall',
        'Third problem involves the footer call to action placement',
        'Fourth problem about the navigation structure being confusing',
      ],
    })
    const result = parseCompetitorAnalysisResponse(input, 'https://example.com')
    expect(result!.strengths).toHaveLength(3)
    expect(result!.weaknesses).toHaveLength(3)
  })
})
