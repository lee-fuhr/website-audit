import { AnalysisResult, Finding } from '../analyzer'
import { CrawledPage } from '../crawler'
import { detectIndustry, getIndustryRewrites } from './industry'

/**
 * Generate fallback analysis when AI is unavailable.
 * IMPORTANT: Rewrites must be ACTUAL COPY, not generic advice like "Replace with specific proof"
 */
export function generateFallbackAnalysis(pages: CrawledPage[], siteUrl: string): AnalysisResult {
  // Detect industry to provide appropriate examples
  const industry = detectIndustry(pages, siteUrl)
  const commodityPhraseRewrites = getIndustryRewrites(industry)
  const commodityPhrases = Object.keys(commodityPhraseRewrites)

  // Collect all findings from pages
  const allFindings: Finding[] = []
  const pageAnalysis: AnalysisResult['pageAnalysis'] = []

  for (const page of pages.slice(0, 10)) {
    const lowerContent = page.content.toLowerCase()
    const pageFindings: Finding[] = []

    for (const phrase of commodityPhrases) {
      if (lowerContent.includes(phrase.toLowerCase())) {
        const rewriteData = commodityPhraseRewrites[phrase]
        const finding: Finding = {
          phrase: `"${phrase}"`,
          problem: rewriteData.problem,
          rewrite: rewriteData.rewrite,
          location: 'Found in page content',
          pageUrl: page.url,
        }
        pageFindings.push(finding)
        allFindings.push(finding)
      }
    }

    pageAnalysis.push({
      url: page.url,
      title: page.title,
      score: Math.max(10, 70 - pageFindings.length * 15),
      issues: pageFindings.slice(0, 5),
    })
  }

  // Define the 10 issue categories with their findings
  const issueCategories = [
    {
      title: 'Generic positioning (hero/headline)',
      description: 'Your homepage opens with vague claims instead of specific proof.',
      severity: 'critical' as const,
      keywords: ['quality', 'leading', 'premier', 'innovative', 'solutions'],
    },
    {
      title: 'Vague value propositions',
      description: 'Subheads promise "better, faster, easier" without specifics.',
      severity: 'critical' as const,
      keywords: ['customer-focused', 'dedicated', 'committed', 'excellence'],
    },
    {
      title: 'Missing/buried proof points',
      description: 'Stats and testimonials are hidden instead of prominent.',
      severity: 'critical' as const,
      keywords: ['proven', 'track record', 'trusted'],
    },
    {
      title: 'Weak social proof',
      description: 'Generic "trusted by thousands" instead of specific logos/names.',
      severity: 'warning' as const,
      keywords: ['world-class', 'best-in-class', 'industry-leading'],
    },
    {
      title: 'Generic CTAs',
      description: '"Contact Us" and "Learn More" don\'t give visitors a reason to click.',
      severity: 'warning' as const,
      keywords: ['partner', 'passionate'],
    },
    {
      title: 'Unclear target audience',
      description: 'Visitors can\'t tell if they\'re the right fit for your services.',
      severity: 'warning' as const,
      keywords: ['businesses', 'companies', 'organizations'],
    },
    {
      title: 'Missing differentiators',
      description: 'Nothing explains why someone should choose you over alternatives.',
      severity: 'warning' as const,
      keywords: ['unique', 'different', 'unlike'],
    },
    {
      title: 'Trust signal gaps',
      description: 'No visible certifications, awards, or third-party validation.',
      severity: 'info' as const,
      keywords: ['certified', 'award', 'recognized'],
    },
    {
      title: 'Feature-first copy',
      description: 'You lead with what you do instead of the outcomes you deliver.',
      severity: 'info' as const,
      keywords: ['cutting-edge', 'state-of-the-art', 'technology'],
    },
    {
      title: 'Generic about/team messaging',
      description: 'Your about page is forgettable corporate speak.',
      severity: 'info' as const,
      keywords: ['team', 'years', 'experience'],
    },
  ]

  // Distribute findings to issues based on keyword matching
  const issuesWithFindings = issueCategories.map(category => {
    const matchedFindings = allFindings.filter(f => {
      const phraseText = f.phrase.toLowerCase()
      return category.keywords.some(kw => phraseText.includes(kw))
    }).slice(0, 5)

    return {
      title: category.title,
      description: category.description,
      severity: category.severity,
      findings: matchedFindings,
    }
  })

  const hostname = siteUrl ? new URL(siteUrl).hostname : 'this site'

  return {
    commodityScore: Math.max(10, 65 - allFindings.length * 3),
    categoryScores: {
      firstImpression: 5,
      differentiation: 4,
      customerClarity: 5,
      storyStructure: 4,
      trustSignals: 5,
      buttonClarity: 5,
    },
    topIssues: issuesWithFindings,
    pageAnalysis,
    proofPoints: [
      {
        quote: 'Look for testimonials buried in your content',
        source: 'Case studies or project pages',
        suggestedUse: 'Move to homepage above the fold',
      },
      {
        quote: 'Find specific numbers (project count, years, savings)',
        source: 'About page or capability pages',
        suggestedUse: 'Use in headlines instead of vague claims',
      },
    ],
    voiceAnalysis: {
      currentTone: `${hostname} uses professional but generic language typical of the industry`,
      authenticVoice: 'Look at social media posts or internal communications for more authentic voice',
      examples: [
        'Website: "We are committed to excellence"',
        'Authentic: Use real stories and specific outcomes',
        'Recommendation: Write like you talk to clients in person',
      ],
    },
  }
}
