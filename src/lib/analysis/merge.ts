import { AnalysisResult, Finding } from '../analyzer'

/** Count total findings across all issues */
export function countTotalFindings(result: AnalysisResult): number {
  return result.topIssues.reduce((sum, issue) => sum + (issue.findings?.length || 0), 0)
}

/** Find categories with fewer than MIN_FINDINGS_PER_CATEGORY findings */
export function findSparseCategories(result: AnalysisResult, minPerCategory: number): string[] {
  return result.topIssues
    .filter(issue => (issue.findings?.length || 0) < minPerCategory)
    .map(issue => issue.title)
}

/** Merge findings from first and second pass, deduplicating */
export function mergeAnalysisResults(first: AnalysisResult, second: AnalysisResult): AnalysisResult {
  // Create a map of issues by title for merging
  const mergedIssues = new Map<string, typeof first.topIssues[0]>()

  // Add all first pass issues
  for (const issue of first.topIssues) {
    mergedIssues.set(issue.title, { ...issue, findings: [...(issue.findings || [])] })
  }

  // Merge second pass findings into matching categories
  for (const secondIssue of second.topIssues) {
    const existing = mergedIssues.get(secondIssue.title)
    if (existing) {
      // Get existing phrases for deduplication
      const existingPhrases = new Set(
        (existing.findings || []).map(f => f.phrase.toLowerCase().trim())
      )

      // Add non-duplicate findings from second pass
      for (const finding of secondIssue.findings || []) {
        const normalizedPhrase = finding.phrase.toLowerCase().trim()
        // Check for exact match or high similarity
        const isDuplicate = existingPhrases.has(normalizedPhrase) ||
          Array.from(existingPhrases).some(ep =>
            normalizedPhrase.includes(ep) || ep.includes(normalizedPhrase)
          )

        if (!isDuplicate && finding.phrase.length > 5) {
          existing.findings = existing.findings || []
          existing.findings.push(finding)
          existingPhrases.add(normalizedPhrase)
        }
      }
    } else {
      // New category from second pass (shouldn't happen but handle it)
      mergedIssues.set(secondIssue.title, secondIssue)
    }
  }

  // Rebuild pageAnalysis from merged findings
  const allFindings = Array.from(mergedIssues.values()).flatMap(i => i.findings || [])
  const pageMap = new Map<string, Finding[]>()
  for (const finding of allFindings) {
    const pageUrl = finding.pageUrl || ''
    if (!pageMap.has(pageUrl)) pageMap.set(pageUrl, [])
    pageMap.get(pageUrl)!.push(finding)
  }

  return {
    ...first,
    topIssues: Array.from(mergedIssues.values()),
    pageAnalysis: Array.from(pageMap.entries()).map(([url, issues]) => ({
      url,
      title: url,
      score: Math.max(10, 70 - issues.length * 10),
      issues: issues.slice(0, 5),
    })),
  }
}
