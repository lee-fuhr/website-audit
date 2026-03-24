import { AnalysisResult, Finding } from '../analyzer'
import { CrawledPage } from '../crawler'
import { generateFallbackAnalysis } from './fallback'

/**
 * Parse Claude's response into structured data.
 * Handles both new structure (findings in topIssues) and old structure (findings in pageAnalysis).
 */
export function parseAnalysisResponse(
  response: string,
  pages: CrawledPage[]
): AnalysisResult {
  try {
    // Strip markdown code fences if present (Claude often wraps JSON in ```json ... ```)
    let cleanedResponse = response
    if (response.includes('```json')) {
      cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    } else if (response.includes('```')) {
      cleanedResponse = response.replace(/```\s*/g, '')
    }

    // Extract JSON from response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[Parser] No JSON found in AI response')
      console.error('[Parser] Response preview:', response.substring(0, 300))
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    console.log('[Parser] Successfully parsed AI JSON response')

    // FIRST: Collect all findings from pageAnalysis (old structure / backwards compat)
    const allFindingsFromPages: Finding[] = []
    if (Array.isArray(parsed.pageAnalysis)) {
      for (const page of parsed.pageAnalysis) {
        const pageUrl = String(page.url || pages[0]?.url || '')
        if (Array.isArray(page.issues)) {
          for (const issue of page.issues) {
            if (issue.phrase && issue.rewrite) {
              allFindingsFromPages.push({
                phrase: String(issue.phrase || ''),
                problem: String(issue.problem || ''),
                rewrite: String(issue.rewrite || ''),
                location: String(issue.location || ''),
                pageUrl,
              })
            }
          }
        }
      }
    }
    console.log(`[Parser] Found ${allFindingsFromPages.length} findings from pageAnalysis`)

    // SECOND: Parse topIssues and merge findings
    const topIssues = (parsed.topIssues || []).slice(0, 10).map((issue: Record<string, unknown>) => {
      // Parse findings nested within each issue (new structure)
      let findings: Finding[] = []

      if (Array.isArray(issue.findings) && issue.findings.length > 0) {
        // New structure: findings directly on issue
        // ENFORCE LENGTH CONSTRAINT: rewrite should be within +50% of original length
        findings = issue.findings.map((f: Record<string, string>) => {
          let rewrite = f.rewrite || ''
          let phrase = f.phrase || ''

          // CLEAN UP TRUNCATED PHRASES - detect and fix mid-word cuts
          if (phrase.match(/^\.{2,}\s*[a-z]/) || phrase.match(/^[a-z]/)) {
            // Starts with lowercase - likely truncated. Remove leading partial word if present
            const cleanedStart = phrase.replace(/^\.{2,}\s*\w+\s+/, '').replace(/^\w+\s+/, '')
            if (cleanedStart.length > 10) {
              console.log(`[Parser] Cleaned truncated phrase start: "${phrase.substring(0, 30)}..." → "${cleanedStart.substring(0, 30)}..."`)
              phrase = cleanedStart
            }
          }
          // Check for fragments that end mid-word (no punctuation, lowercase ending)
          if (phrase.match(/[a-z]$/) && !phrase.match(/[.!?:,;]$/)) {
            // Ends with lowercase, no punctuation - likely truncated. Add ellipsis for clarity
            phrase = phrase.trim() + '...'
          }

          const maxLength = Math.max(phrase.length * 1.5, 100) // Allow 50% longer or min 100 chars

          // If rewrite is WAY too long, truncate at sentence boundary
          if (rewrite.length > maxLength) {
            const truncated = rewrite.substring(0, Math.floor(maxLength))
            const lastPeriod = truncated.lastIndexOf('.')
            const lastQuestion = truncated.lastIndexOf('?')
            const lastExclaim = truncated.lastIndexOf('!')
            const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim)

            if (lastSentence > 20) {
              rewrite = truncated.substring(0, lastSentence + 1)
            } else {
              rewrite = truncated.trim()
            }
            console.log(`[Parser] Truncated overly-long rewrite: ${f.rewrite?.length} → ${rewrite.length} chars`)
          }

          return {
            phrase,
            problem: f.problem || '',
            rewrite,
            location: f.location || '',
            pageUrl: f.pageUrl || '',
          }
        })
      } else if (allFindingsFromPages.length > 0) {
        // Fallback: match findings to issues by keywords in the issue title
        const issueTitle = String(issue.title || '').toLowerCase()

        // Keywords for each issue category (matches the 10 categories in the prompt)
        const categoryKeywords: Record<string, string[]> = {
          'positioning': ['positioning', 'hero', 'headline', 'generic positioning', 'vague positioning'],
          'value': ['value proposition', 'vague value', 'subhead', 'value prop'],
          'proof': ['proof point', 'proof points', 'missing proof', 'buried proof'],
          'social': ['social proof', 'weak social', 'testimonial'],
          'cta': ['cta', 'call-to-action', 'call to action', 'generic cta', 'button'],
          'audience': ['target audience', 'unclear target', 'audience', 'who is this for'],
          'differentiator': ['differentiator', 'missing differentiator', 'why choose', 'differentiation'],
          'trust': ['trust signal', 'trust gap', 'certification', 'award', 'validation'],
          'feature': ['feature-first', 'feature first', 'features instead', 'leading with feature'],
          'about': ['about', 'team messaging', 'company description', 'generic about'],
        }

        // Find which category this issue belongs to
        let matchedCategory = ''
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => issueTitle.includes(kw))) {
            matchedCategory = category
            break
          }
        }

        if (matchedCategory) {
          findings = allFindingsFromPages.filter(f => {
            const content = `${f.phrase || ''} ${f.problem || ''} ${f.location || ''}`.toLowerCase()
            const keywords = categoryKeywords[matchedCategory] || []
            return keywords.some(kw => content.includes(kw))
          }).slice(0, 5)
        }

        if (findings.length === 0 && allFindingsFromPages.length > 0) {
          console.log(`[Parser] No matching findings for issue "${issue.title}" - leaving empty to prevent mismatches`)
        }
      }

      return {
        title: String(issue.title || 'Issue detected'),
        description: String(issue.description || 'Generic messaging detected'),
        severity: (['critical', 'warning', 'info'].includes(String(issue.severity)) ? issue.severity : 'warning') as 'critical' | 'warning' | 'info',
        findings,
      }
    })

    // Count total findings
    const totalFindings = topIssues.reduce((sum: number, i: { findings: Finding[] }) => sum + i.findings.length, 0)
    console.log(`[Parser] Total findings distributed across ${topIssues.length} issues: ${totalFindings}`)

    // Build pageAnalysis for backwards compatibility
    const pageMap = new Map<string, Finding[]>()
    for (const issue of topIssues) {
      for (const finding of issue.findings || []) {
        const pageUrl = finding.pageUrl || pages[0]?.url || ''
        if (!pageMap.has(pageUrl)) {
          pageMap.set(pageUrl, [])
        }
        pageMap.get(pageUrl)!.push(finding)
      }
    }

    const pageAnalysis = Array.from(pageMap.entries()).map(([url, issues]) => ({
      url,
      title: pages.find(p => p.url === url)?.title || 'Page',
      score: Math.max(10, 70 - issues.length * 10),
      issues: issues.slice(0, 5),
    }))

    // Validate and return
    return {
      commodityScore: Math.min(100, Math.max(0, parsed.differentiationScore || parsed.commodityScore || 50)),
      categoryScores: parsed.categoryScores ? {
        firstImpression: Math.min(10, Math.max(0, parsed.categoryScores.firstImpression || 5)),
        differentiation: Math.min(10, Math.max(0, parsed.categoryScores.differentiation || 5)),
        customerClarity: Math.min(10, Math.max(0, parsed.categoryScores.customerClarity || 5)),
        storyStructure: Math.min(10, Math.max(0, parsed.categoryScores.storyStructure || 5)),
        trustSignals: Math.min(10, Math.max(0, parsed.categoryScores.trustSignals || 5)),
        buttonClarity: Math.min(10, Math.max(0, parsed.categoryScores.buttonClarity || 5)),
      } : undefined,
      topIssues,
      pageAnalysis,
      proofPoints: (parsed.proofPoints || []).map((pp: Record<string, string>) => ({
        quote: pp.quote || '',
        source: pp.source || '',
        suggestedUse: pp.suggestedUse || '',
      })),
      voiceAnalysis: {
        currentTone: parsed.voiceAnalysis?.currentTone || 'Corporate/generic',
        authenticVoice: parsed.voiceAnalysis?.authenticVoice || 'Unable to determine',
        examples: parsed.voiceAnalysis?.examples || [],
      },
      suggestedCompetitors: (parsed.suggestedCompetitors || []).slice(0, 5).map((comp: Record<string, string>) => ({
        domain: comp.domain || '',
        confidence: (['high', 'medium', 'low'].includes(comp.confidence) ? comp.confidence : 'medium') as 'high' | 'medium' | 'low',
        reason: comp.reason || '',
      })).filter((c: { domain: string }) => c.domain),
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    return generateFallbackAnalysis(pages, '')
  }
}
