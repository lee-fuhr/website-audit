/**
 * AI-Powered Website Messaging Analyzer
 *
 * Uses Claude to analyze website content for commodity messaging
 * and generate specific recommendations.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CrawledPage, CrawlResult } from './crawler';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnalysisResult {
  commodityScore: number;
  topIssues: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
  pageAnalysis: Array<{
    url: string;
    title: string;
    score: number;
    issues: Array<{
      phrase: string;
      problem: string;
      rewrite: string;
      location: string;
    }>;
  }>;
  proofPoints: Array<{
    quote: string;
    source: string;
    suggestedUse: string;
  }>;
  voiceAnalysis: {
    currentTone: string;
    authenticVoice: string;
    examples: string[];
  };
  suggestedCompetitors?: Array<{
    domain: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>;
}

/**
 * Analyze crawled website content using Claude
 */
export async function analyzeWebsite(
  crawlResult: CrawlResult,
  siteUrl: string
): Promise<AnalysisResult> {
  // Prepare content for analysis
  const pagesContent = crawlResult.pages.map(page => ({
    url: page.url,
    title: page.title,
    // Truncate content to avoid token limits
    content: page.content.slice(0, 3000),
    meta: page.meta,
  }));

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt(siteUrl, pagesContent);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return parseAnalysisResponse(responseText, crawlResult.pages);
  } catch (error) {
    console.error('AI analysis error:', error);
    // Return fallback analysis if AI fails
    return generateFallbackAnalysis(crawlResult.pages, siteUrl);
  }
}

/**
 * Build the analysis prompt for Claude
 */
function buildAnalysisPrompt(
  siteUrl: string,
  pages: Array<{ url: string; title: string; content: string; meta: Record<string, string | undefined> }>
): string {
  return `You are an expert website messaging strategist. Analyze this website for commodity messaging - phrases that sound generic and could appear on any competitor's site.

WEBSITE: ${siteUrl}

PAGES CRAWLED:
${pages.map(p => `
--- ${p.url} ---
Title: ${p.title}
${p.meta.description ? `Meta: ${p.meta.description}` : ''}
Content:
${p.content}
`).join('\n')}

ANALYZE FOR:
1. Commodity phrases - generic claims like "quality craftsmanship", "customer-focused", "innovative solutions"
2. Missing proof points - claims without specific evidence
3. Buried gold - specific testimonials, stats, or proof buried in content that should be highlighted
4. Voice inconsistency - where the site sounds corporate vs authentic
5. Likely competitors - based on industry, positioning, and offerings

RESPOND IN THIS EXACT JSON FORMAT:
{
  "differentiationScore": <number 0-100, higher = better differentiated, lower = more commodity>,
  "topIssues": [
    {
      "title": "<short issue title - be specific to THIS site>",
      "description": "<1-2 sentence description referencing actual content from this site>",
      "severity": "<critical|warning|info>"
    }
  ],
  "pageAnalysis": [
    {
      "url": "<page url>",
      "title": "<page title>",
      "score": <differentiation score for this page 0-100>,
      "issues": [
        {
          "phrase": "<the exact problematic phrase found on this page>",
          "problem": "<why this specific phrase hurts this company>",
          "rewrite": "<specific replacement copy using their industry/products>",
          "location": "<where on page: hero, about section, etc>"
        }
      ]
    }
  ],
  "proofPoints": [
    {
      "quote": "<specific quote or stat found>",
      "source": "<where found: page name, section>",
      "suggestedUse": "<where this should be prominently displayed>"
    }
  ],
  "voiceAnalysis": {
    "currentTone": "<description of current website voice>",
    "authenticVoice": "<what their authentic voice seems to be based on content>",
    "examples": [
      "<example of corporate speak from site>",
      "<example of more authentic language found>",
      "<recommendation>"
    ]
  },
  "suggestedCompetitors": [
    {
      "domain": "<competitor domain like 'monday.com'>",
      "confidence": "<high|medium|low>",
      "reason": "<why this is likely a competitor>"
    }
  ]
}

CRITICAL INSTRUCTIONS:
- Provide 10 top issues minimum, all specific to THIS site with actual quotes/phrases from the content
- Analyze all pages provided
- Find 3-5 proof points if they exist
- Give meaningful voice analysis
- Suggest 5 likely competitors based on the industry and offerings (domain only, no https://)
- Be specific - reference actual content you found, not generic advice`;
}

/**
 * Parse Claude's response into structured data
 */
function parseAnalysisResponse(
  response: string,
  pages: CrawledPage[]
): AnalysisResult {
  try {
    // Extract JSON from response (Claude might include explanation text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and return - differentiationScore where 100 = best
    return {
      commodityScore: Math.min(100, Math.max(0, parsed.differentiationScore || parsed.commodityScore || 50)),
      topIssues: (parsed.topIssues || []).slice(0, 10).map((issue: Record<string, string>) => ({
        title: issue.title || 'Issue detected',
        description: issue.description || 'Generic messaging detected',
        severity: (['critical', 'warning', 'info'].includes(issue.severity) ? issue.severity : 'warning') as 'critical' | 'warning' | 'info',
      })),
      pageAnalysis: (parsed.pageAnalysis || []).map((page: Record<string, unknown>) => ({
        url: String(page.url || ''),
        title: String(page.title || 'Page'),
        score: Number(page.score) || 70,
        issues: (Array.isArray(page.issues) ? page.issues : []).map((issue: Record<string, string>) => ({
          phrase: issue.phrase || '',
          problem: issue.problem || '',
          rewrite: issue.rewrite || '',
          location: issue.location || '',
        })),
      })),
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
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return generateFallbackAnalysis(pages, '');
  }
}

/**
 * Generate fallback analysis when AI is unavailable
 */
function generateFallbackAnalysis(pages: CrawledPage[], siteUrl: string): AnalysisResult {
  // Detect common commodity phrases in content
  const commodityPhrases = [
    'quality craftsmanship',
    'customer-focused',
    'innovative solutions',
    'dedicated team',
    'proven track record',
    'committed to excellence',
    'industry-leading',
    'best-in-class',
    'world-class',
    'cutting-edge',
    'state-of-the-art',
    'exceeding expectations',
    'passionate about',
    'your trusted partner',
  ];

  let totalMatches = 0;
  const issues: AnalysisResult['topIssues'] = [];
  const pageAnalysis: AnalysisResult['pageAnalysis'] = [];

  for (const page of pages.slice(0, 10)) {
    const lowerContent = page.content.toLowerCase();
    const pageIssues: AnalysisResult['pageAnalysis'][0]['issues'] = [];
    let pageMatches = 0;

    for (const phrase of commodityPhrases) {
      if (lowerContent.includes(phrase.toLowerCase())) {
        pageMatches++;
        totalMatches++;
        pageIssues.push({
          phrase: `"${phrase}"`,
          problem: 'Generic phrase used by competitors',
          rewrite: 'Replace with specific proof or unique approach',
          location: 'Found in page content',
        });
      }
    }

    pageAnalysis.push({
      url: page.url,
      title: page.title,
      score: Math.max(10, 70 - pageMatches * 15), // Higher = better, subtract for commodity phrases
      issues: pageIssues.slice(0, 3),
    });
  }

  // Generate top issues based on findings
  if (totalMatches > 0) {
    issues.push({
      title: 'Commodity language detected',
      description: `Found ${totalMatches} generic phrases across your site that appear on competitor websites.`,
      severity: 'critical',
    });
  }

  issues.push({
    title: 'Missing specific proof points',
    description: 'Your claims need specific numbers, names, and examples to be believable.',
    severity: 'critical',
  });

  issues.push({
    title: 'Generic value proposition',
    description: 'Your homepage doesn\'t clearly state what makes you different from competitors.',
    severity: 'critical',
  });

  issues.push({
    title: 'Weak headline structure',
    description: 'Your headlines describe what you do, not why it matters to the buyer.',
    severity: 'warning',
  });

  issues.push({
    title: 'No clear ideal customer',
    description: 'Visitors can\'t tell if they\'re the right fit for your services.',
    severity: 'warning',
  });

  issues.push({
    title: 'Buried social proof',
    description: 'Testimonials and case studies are hidden instead of front and center.',
    severity: 'warning',
  });

  issues.push({
    title: 'Generic CTAs',
    description: '"Contact Us" and "Learn More" don\'t give visitors a reason to click.',
    severity: 'warning',
  });

  issues.push({
    title: 'Missing trust signals',
    description: 'No visible certifications, awards, or third-party validation on key pages.',
    severity: 'info',
  });

  issues.push({
    title: 'Features before benefits',
    description: 'You lead with what you do instead of the outcomes you deliver.',
    severity: 'info',
  });

  issues.push({
    title: 'No competitive positioning',
    description: 'Nothing explains why someone should choose you over alternatives.',
    severity: 'info',
  });

  const hostname = siteUrl ? new URL(siteUrl).hostname : 'this site';

  return {
    commodityScore: Math.max(10, 65 - totalMatches * 5), // Higher = better, subtract for commodity phrases
    topIssues: issues,
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
  };
}
