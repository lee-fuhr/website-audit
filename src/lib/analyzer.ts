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
 * Detect industry from content to provide appropriate examples
 */
function detectIndustry(pages: CrawledPage[], siteUrl: string): 'saas' | 'manufacturing' | 'services' | 'ecommerce' | 'general' {
  const allContent = pages.map(p => p.content.toLowerCase()).join(' ');
  const hostname = siteUrl ? new URL(siteUrl).hostname.toLowerCase() : '';

  // SaaS indicators
  const saasTerms = ['saas', 'software', 'platform', 'app', 'dashboard', 'api', 'integration', 'subscription', 'pricing plans', 'free trial', 'demo', 'onboarding', 'user', 'login', 'sign up', 'cloud', 'workflow', 'automation', 'analytics'];
  const saasScore = saasTerms.filter(t => allContent.includes(t)).length;

  // Manufacturing indicators
  const mfgTerms = ['cnc', 'machining', 'fabrication', 'manufacturing', 'parts', 'prototype', 'tolerance', 'precision', 'metal', 'welding', 'iso 9001', 'as9100', 'equipment', 'facility'];
  const mfgScore = mfgTerms.filter(t => allContent.includes(t)).length;

  // Services indicators
  const servicesTerms = ['consulting', 'services', 'solutions', 'agency', 'firm', 'contractor', 'project management', 'strategy', 'advisory'];
  const servicesScore = servicesTerms.filter(t => allContent.includes(t)).length;

  // E-commerce indicators
  const ecomTerms = ['shop', 'cart', 'checkout', 'buy now', 'add to cart', 'shipping', 'free shipping', 'product', 'order', 'store'];
  const ecomScore = ecomTerms.filter(t => allContent.includes(t)).length;

  // Pick highest scoring
  const scores = { saas: saasScore, manufacturing: mfgScore, services: servicesScore, ecommerce: ecomScore };
  const maxScore = Math.max(...Object.values(scores));

  if (maxScore < 3) return 'general';
  if (saasScore === maxScore) return 'saas';
  if (mfgScore === maxScore) return 'manufacturing';
  if (servicesScore === maxScore) return 'services';
  if (ecomScore === maxScore) return 'ecommerce';
  return 'general';
}

/**
 * Get industry-appropriate rewrite examples
 */
function getIndustryRewrites(industry: 'saas' | 'manufacturing' | 'services' | 'ecommerce' | 'general'): Record<string, { problem: string; rewrite: string }> {
  // SaaS-specific rewrites
  if (industry === 'saas') {
    return {
      'quality craftsmanship': {
        problem: 'Every competitor claims quality - it\'s meaningless without proof',
        rewrite: 'Try: "99.99% uptime SLA" or "Trusted by 2,400+ teams including Spotify and Dropbox"'
      },
      'customer-focused': {
        problem: 'Empty claim that says nothing specific',
        rewrite: 'Try: "Average response time: 4 minutes" or "Dedicated CSM for accounts over $10k ARR"'
      },
      'innovative solutions': {
        problem: 'Buzzword without substance',
        rewrite: 'Try: "We shipped 47 features last quarter based on customer requests" or name a specific capability'
      },
      'dedicated team': {
        problem: 'Every company has a team - what makes yours different?',
        rewrite: 'Try: "22 engineers, 8 from Google/Meta/Apple" or "Average tenure: 4 years"'
      },
      'proven track record': {
        problem: 'Track record claim without the track record',
        rewrite: 'Try: "10M+ workflows automated since 2019" or "Helping 850 companies save 12 hours/week"'
      },
      'committed to excellence': {
        problem: 'Generic statement every company makes',
        rewrite: 'Try: "SOC 2 Type II certified. GDPR compliant. 256-bit encryption at rest and in transit."'
      },
      'industry-leading': {
        problem: 'Unverifiable claim that prospects ignore',
        rewrite: 'Try: "#1 on G2 for ease of use" or "Named a Gartner Cool Vendor 2024"'
      },
      'best-in-class': {
        problem: 'Superlative without evidence',
        rewrite: 'Try: "4.8/5 average rating across 2,000+ reviews" or cite specific benchmark data'
      },
      'world-class': {
        problem: 'Meaningless claim - what does world-class mean?',
        rewrite: 'Try: "Teams in 40 countries trust us" or "12 language localization built in"'
      },
      'cutting-edge': {
        problem: 'Tech buzzword that says nothing',
        rewrite: 'Try: "AI-powered insights that save you 3 hours daily" or name your actual technology'
      },
      'state-of-the-art': {
        problem: 'Overused phrase that prospects tune out',
        rewrite: 'Try: "Built on AWS with auto-scaling to handle 10M requests/day" or be specific about your stack'
      },
      'exceeding expectations': {
        problem: 'Vague promise with no specifics',
        rewrite: 'Try: "91% customer retention rate" or "NPS score of 72 (industry avg: 41)"'
      },
      'passionate about': {
        problem: 'Emotional claim that can\'t be verified',
        rewrite: 'Try: "We use our own product every day - here\'s our public roadmap" or show don\'t tell'
      },
      'your trusted partner': {
        problem: 'Trust must be earned through proof, not claimed',
        rewrite: 'Try: "Average customer has been with us 3.2 years" or "Zero data breaches since founding"'
      },
    };
  }

  // Services-specific rewrites
  if (industry === 'services') {
    return {
      'quality craftsmanship': {
        problem: 'Every competitor claims quality - it\'s meaningless without proof',
        rewrite: 'Try: "94% of clients renew their contracts" or "Average engagement: 2.3 years"'
      },
      'customer-focused': {
        problem: 'Empty claim that says nothing specific',
        rewrite: 'Try: "Weekly status calls. Monthly reports. Quarterly reviews." or "24/7 emergency hotline"'
      },
      'innovative solutions': {
        problem: 'Buzzword without substance',
        rewrite: 'Try: "We developed a proprietary methodology that reduced client costs 23%" or name it'
      },
      'dedicated team': {
        problem: 'Every company has a team - what makes yours different?',
        rewrite: 'Try: "15 consultants with avg 12 years experience" or "Former executives from [industry leaders]"'
      },
      'proven track record': {
        problem: 'Track record claim without the track record',
        rewrite: 'Try: "340 projects completed. $47M saved for clients." or "Serving Fortune 500 since 2008"'
      },
      'committed to excellence': {
        problem: 'Generic statement every company makes',
        rewrite: 'Try: "Every deliverable goes through 3-stage QA. Every deadline is contractual."'
      },
      'industry-leading': {
        problem: 'Unverifiable claim that prospects ignore',
        rewrite: 'Try: "Ranked #3 consulting firm in [region] by [publication]" or cite awards'
      },
      'best-in-class': {
        problem: 'Superlative without evidence',
        rewrite: 'Try: "Our clients see 3.2x ROI within 12 months" or show case study data'
      },
      'world-class': {
        problem: 'Meaningless claim - what does world-class mean?',
        rewrite: 'Try: "Clients in 18 countries" or "Certified in [relevant certifications]"'
      },
      'cutting-edge': {
        problem: 'Tech buzzword that says nothing',
        rewrite: 'Try: "We integrate with your existing tech stack - Salesforce, HubSpot, SAP" or be specific'
      },
      'state-of-the-art': {
        problem: 'Overused phrase that prospects tune out',
        rewrite: 'Try: "Using the same frameworks as McKinsey and BCG" or cite your actual methodology'
      },
      'exceeding expectations': {
        problem: 'Vague promise with no specifics',
        rewrite: 'Try: "87% of projects delivered early. Zero budget overruns in 5 years." or be specific'
      },
      'passionate about': {
        problem: 'Emotional claim that can\'t be verified',
        rewrite: 'Try: "Our team has published 14 books on [topic]" or show your thought leadership'
      },
      'your trusted partner': {
        problem: 'Trust must be earned through proof, not claimed',
        rewrite: 'Try: "78% of business comes from referrals" or "Average client relationship: 6 years"'
      },
    };
  }

  // Manufacturing-specific (original) or default
  return {
    'quality craftsmanship': {
      problem: 'Every competitor claims quality - it\'s meaningless without proof',
      rewrite: 'Try: "47 machinists with an average tenure of 12 years" or "0.02% defect rate across 10,000 parts"'
    },
    'customer-focused': {
      problem: 'Empty claim that says nothing specific',
      rewrite: 'Try: "Your dedicated project manager responds within 2 hours" or "93% of business from referrals"'
    },
    'innovative solutions': {
      problem: 'Buzzword without substance',
      rewrite: 'Try: "We developed custom fixturing that cut your setup time 40%" or name a specific innovation'
    },
    'dedicated team': {
      problem: 'Every company has a team - what makes yours different?',
      rewrite: 'Try: "Average employee tenure: 8 years" or "3 engineers with 60+ years combined experience"'
    },
    'proven track record': {
      problem: 'Track record claim without the track record',
      rewrite: 'Try: "2,400 projects delivered since 2005" or "Zero safety incidents in 15 years"'
    },
    'committed to excellence': {
      problem: 'Generic statement every company makes',
      rewrite: 'Try: "Every part inspected. Every tolerance documented. Every deadline met."'
    },
    'industry-leading': {
      problem: 'Unverifiable claim that prospects ignore',
      rewrite: 'Try: "First in the region to offer 5-axis capability" or cite an industry award'
    },
    'best-in-class': {
      problem: 'Superlative without evidence',
      rewrite: 'Try: "0.02% defect rate vs. industry average of 0.5%" or show a specific comparison'
    },
    'world-class': {
      problem: 'Meaningless claim - what does world-class mean?',
      rewrite: 'Try: "ISO 9001 and AS9100 certified" or "Serving aerospace clients in 12 countries"'
    },
    'cutting-edge': {
      problem: 'Tech buzzword that says nothing',
      rewrite: 'Try: "5-axis CNC with 0.0001 inch positioning accuracy" or name your actual equipment'
    },
    'state-of-the-art': {
      problem: 'Overused phrase that prospects tune out',
      rewrite: 'Try: "$2M invested in new equipment since 2020" or list specific machines'
    },
    'exceeding expectations': {
      problem: 'Vague promise with no specifics',
      rewrite: 'Try: "98% on-time delivery for 5 years running" or "Average project comes in 3 days early"'
    },
    'passionate about': {
      problem: 'Emotional claim that can\'t be verified',
      rewrite: 'Try: "Our machinists average 12 years tenure - they chose this career" or show don\'t tell'
    },
    'your trusted partner': {
      problem: 'Trust must be earned through proof, not claimed',
      rewrite: 'Try: "Average client relationship: 8 years" or "Founded in 1985, same ownership since day one"'
    },
  };
}

/**
 * Generate fallback analysis when AI is unavailable
 * IMPORTANT: Rewrites must be ACTUAL COPY, not generic advice like "Replace with specific proof"
 */
function generateFallbackAnalysis(pages: CrawledPage[], siteUrl: string): AnalysisResult {
  // Detect industry to provide appropriate examples
  const industry = detectIndustry(pages, siteUrl);
  const commodityPhraseRewrites = getIndustryRewrites(industry);

  const commodityPhrases = Object.keys(commodityPhraseRewrites);

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
        const rewriteData = commodityPhraseRewrites[phrase];
        pageIssues.push({
          phrase: `"${phrase}"`,
          problem: rewriteData.problem,
          rewrite: rewriteData.rewrite,
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
