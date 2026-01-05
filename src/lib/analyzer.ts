/**
 * AI-Powered Website Messaging Analyzer
 *
 * Uses Claude to analyze website content for commodity messaging
 * and generate specific recommendations.
 */

import { CrawledPage, CrawlResult } from './crawler';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _anthropic: any = null;

export async function getAnthropicClient() {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    console.log(`[AI] Initializing Anthropic client - key present: ${!!apiKey}, length: ${apiKey?.length || 0}`);
    // Regular dynamic import - force-dynamic prevents build-time evaluation
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

export interface Finding {
  phrase: string;
  problem: string;
  rewrite: string;
  location: string;
  pageUrl?: string;
}

export interface AnalysisResult {
  commodityScore: number;
  categoryScores?: {
    firstImpression: number;  // 0-10
    differentiation: number;  // 0-10
    customerClarity: number;  // 0-10
    storyStructure: number;   // 0-10
    trustSignals: number;     // 0-10
    buttonClarity: number;    // 0-10
  };
  topIssues: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    findings?: Finding[]; // Findings nested directly on each issue
  }>;
  pageAnalysis: Array<{
    url: string;
    title: string;
    score: number;
    issues: Finding[];
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

// Minimum findings thresholds for quality audit
const MIN_TOTAL_FINDINGS = 25;
const MIN_FINDINGS_PER_CATEGORY = 2;

/**
 * Analyze crawled website content using Claude
 * Includes automatic second-pass retry for sparse results
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

  try {
    // Debug: Check API key at runtime
    const apiKeyPresent = !!process.env.ANTHROPIC_API_KEY;
    const apiKeyLength = process.env.ANTHROPIC_API_KEY?.length || 0;
    console.log(`[AI] API Key check - present: ${apiKeyPresent}, length: ${apiKeyLength}`);

    // ===== FIRST PASS =====
    console.log(`[AI] FIRST PASS: Analyzing ${siteUrl} with ${pagesContent.length} pages...`);
    const firstPassResult = await runAnalysisPass(siteUrl, pagesContent, crawlResult.pages);

    // Count findings
    const totalFindings = countTotalFindings(firstPassResult);
    const sparseCategories = findSparseCategories(firstPassResult);

    console.log(`[AI] First pass complete: ${totalFindings} findings, ${sparseCategories.length} sparse categories`);

    // ===== SECOND PASS (if needed) =====
    if (totalFindings < MIN_TOTAL_FINDINGS || sparseCategories.length > 3) {
      console.log(`[AI] SECOND PASS: Need more findings (have ${totalFindings}, need ${MIN_TOTAL_FINDINGS})`);
      console.log(`[AI] Sparse categories: ${sparseCategories.join(', ')}`);

      try {
        const secondPassResult = await runSecondPass(
          siteUrl,
          pagesContent,
          crawlResult.pages,
          sparseCategories,
          firstPassResult
        );

        // Merge results
        const mergedResult = mergeAnalysisResults(firstPassResult, secondPassResult);
        const mergedTotal = countTotalFindings(mergedResult);
        console.log(`[AI] After merge: ${mergedTotal} total findings`);

        return mergedResult;
      } catch (secondPassError) {
        console.error('[AI] Second pass failed, using first pass results:', secondPassError);
        return firstPassResult;
      }
    }

    return firstPassResult;
  } catch (error) {
    console.error('[AI] ===== ANALYSIS ERROR =====');
    console.error('[AI] Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('[AI] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[AI] Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && 'status' in error) {
      console.error('[AI] HTTP status:', (error as { status: number }).status);
    }
    if (error instanceof Error && 'response' in error) {
      console.error('[AI] Response:', JSON.stringify((error as { response: unknown }).response));
    }
    console.error('[AI] API Key configured:', !!process.env.ANTHROPIC_API_KEY);
    // Return fallback analysis if AI fails
    return generateFallbackAnalysis(crawlResult.pages, siteUrl);
  }
}

/**
 * Run a single analysis pass
 */
async function runAnalysisPass(
  siteUrl: string,
  pagesContent: Array<{ url: string; title: string; content: string; meta: Record<string, string | undefined> }>,
  pages: CrawledPage[]
): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(siteUrl, pagesContent);

  const anthropic = await getAnthropicClient();
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  console.log(`[AI] Got response, length: ${responseText.length} chars`);

  return parseAnalysisResponse(responseText, pages);
}

/**
 * Run focused second pass on sparse categories
 */
async function runSecondPass(
  siteUrl: string,
  pagesContent: Array<{ url: string; title: string; content: string; meta: Record<string, string | undefined> }>,
  pages: CrawledPage[],
  sparseCategories: string[],
  firstPassResult: AnalysisResult
): Promise<AnalysisResult> {
  const prompt = buildSecondPassPrompt(siteUrl, pagesContent, sparseCategories, firstPassResult);

  const anthropic = await getAnthropicClient();
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  console.log(`[AI] Second pass response, length: ${responseText.length} chars`);

  return parseAnalysisResponse(responseText, pages);
}

/**
 * Count total findings across all issues
 */
function countTotalFindings(result: AnalysisResult): number {
  return result.topIssues.reduce((sum, issue) => sum + (issue.findings?.length || 0), 0);
}

/**
 * Find categories with fewer than MIN_FINDINGS_PER_CATEGORY findings
 */
function findSparseCategories(result: AnalysisResult): string[] {
  return result.topIssues
    .filter(issue => (issue.findings?.length || 0) < MIN_FINDINGS_PER_CATEGORY)
    .map(issue => issue.title);
}

/**
 * Build prompt for focused second pass on sparse categories
 */
function buildSecondPassPrompt(
  siteUrl: string,
  pages: Array<{ url: string; title: string; content: string; meta: Record<string, string | undefined> }>,
  sparseCategories: string[],
  firstPassResult: AnalysisResult
): string {
  // Get existing phrases to avoid duplicates
  const existingPhrases = firstPassResult.topIssues
    .flatMap(i => i.findings || [])
    .map(f => f.phrase.toLowerCase().trim())
    .filter(p => p.length > 0);

  return `You are an expert website messaging strategist doing a DEEP DIVE analysis.

WEBSITE: ${siteUrl}

PAGES CRAWLED:
${pages.map(p => `
--- ${p.url} ---
Title: ${p.title}
${p.meta.description ? `Meta: ${p.meta.description}` : ''}
Content:
${p.content}
`).join('\n')}

PREVIOUS ANALYSIS found these issues but needs MORE SPECIFIC EXAMPLES.

CATEGORIES NEEDING MORE FINDINGS (find 3-5 in EACH):
${sparseCategories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

PHRASES ALREADY FOUND (DO NOT REPEAT THESE):
${existingPhrases.slice(0, 20).map(p => `- "${p}"`).join('\n')}

YOUR TASK: Find ADDITIONAL problematic phrases we missed. Look harder at:
- Headers and subheaders on ALL pages
- Button text and CTAs
- Feature descriptions
- About/Team page content
- Footer content
- Navigation labels
- Form labels and descriptions
- Any repeated phrases across pages

MANDATORY LENGTH CONSTRAINT (ENFORCED - violations will be rejected):
- Rewrites MUST be approximately the same length as the original phrase
- Maximum allowed: +20% longer than original
- A 7-word headline gets a 5-9 word rewrite, NEVER a 30-word paragraph
- WRONG: Original "What sets us apart" → 40-word rambling rewrite
- RIGHT: Original "What sets us apart" → "Why 2,400 teams chose us"

RESPOND IN THIS EXACT JSON FORMAT:
{
  "differentiationScore": ${firstPassResult.commodityScore},
  "topIssues": [
${sparseCategories.map(cat => `    {
      "title": "${cat}",
      "description": "Additional findings for ${cat}",
      "severity": "warning",
      "findings": [
        {
          "phrase": "<EXACT quote from page content - must be DIFFERENT from already found>",
          "problem": "<why this hurts the business>",
          "rewrite": "<SPECIFIC replacement copy>",
          "location": "<where: page section>",
          "pageUrl": "<page URL>"
        }
      ]
    }`).join(',\n')}
  ],
  "proofPoints": [],
  "voiceAnalysis": {
    "currentTone": "${firstPassResult.voiceAnalysis.currentTone}",
    "authenticVoice": "${firstPassResult.voiceAnalysis.authenticVoice}",
    "examples": []
  },
  "suggestedCompetitors": []
}

CRITICAL:
1. Find 3-5 NEW findings per category listed above
2. Quote ACTUAL TEXT from the pages - no made up examples
3. DO NOT repeat any phrases from the "already found" list
4. If a category genuinely has no more issues, explain why in the description`;
}

/**
 * Merge findings from first and second pass, deduplicating
 */
function mergeAnalysisResults(first: AnalysisResult, second: AnalysisResult): AnalysisResult {
  // Create a map of issues by title for merging
  const mergedIssues = new Map<string, typeof first.topIssues[0]>();

  // Add all first pass issues
  for (const issue of first.topIssues) {
    mergedIssues.set(issue.title, { ...issue, findings: [...(issue.findings || [])] });
  }

  // Merge second pass findings into matching categories
  for (const secondIssue of second.topIssues) {
    const existing = mergedIssues.get(secondIssue.title);
    if (existing) {
      // Get existing phrases for deduplication
      const existingPhrases = new Set(
        (existing.findings || []).map(f => f.phrase.toLowerCase().trim())
      );

      // Add non-duplicate findings from second pass
      for (const finding of secondIssue.findings || []) {
        const normalizedPhrase = finding.phrase.toLowerCase().trim();
        // Check for exact match or high similarity
        const isDuplicate = existingPhrases.has(normalizedPhrase) ||
          Array.from(existingPhrases).some(ep =>
            normalizedPhrase.includes(ep) || ep.includes(normalizedPhrase)
          );

        if (!isDuplicate && finding.phrase.length > 5) {
          existing.findings = existing.findings || [];
          existing.findings.push(finding);
          existingPhrases.add(normalizedPhrase);
        }
      }
    } else {
      // New category from second pass (shouldn't happen but handle it)
      mergedIssues.set(secondIssue.title, secondIssue);
    }
  }

  // Rebuild pageAnalysis from merged findings
  const allFindings = Array.from(mergedIssues.values()).flatMap(i => i.findings || []);
  const pageMap = new Map<string, Finding[]>();
  for (const finding of allFindings) {
    const pageUrl = finding.pageUrl || '';
    if (!pageMap.has(pageUrl)) pageMap.set(pageUrl, []);
    pageMap.get(pageUrl)!.push(finding);
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
  };
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

YOUR TASK: Find SPECIFIC PHRASES from the actual page content that are problematic, and provide SPECIFIC REWRITES.

QUOTE EXTRACTION RULES (CRITICAL):
- Extract COMPLETE sentences or phrases - never cut mid-word
- WRONG: "...nd what you want to do next" or "y over 60% of the Fortune"
- RIGHT: "Find what you want to do next" or "Used by over 60% of the Fortune 500"
- Start quotes at natural word boundaries (beginning of sentence, after punctuation)
- End quotes at natural word boundaries (end of sentence, before punctuation)
- If a phrase is very long, extract a complete clause, not a fragment

MANDATORY LENGTH CONSTRAINT (ENFORCED - violations will be rejected):
- Rewrites MUST be approximately the same length as the original phrase
- Maximum allowed: +20% longer than original (e.g., 50 char original → max 60 char rewrite)
- A 7-word headline gets a 5-9 word rewrite, NEVER a 30-word paragraph
- Count the words in the original. Your rewrite should have similar word count.
- WRONG: Original "What sets us apart" → "Unlike other project management tools that make you rebuild your entire workflow from scratch, we connect seamlessly with all your existing applications"
- RIGHT: Original "What sets us apart" → "Why 2,400 teams chose us"
- If you can't improve it in similar length, the rewrite should be SHORTER, not longer

ISSUE CATEGORIES TO ANALYZE (find 3-5 phrases in EACH category):
1. Generic positioning (hero/headline) - vague claims like "innovative solutions" or "leading provider"
2. Vague value propositions (subheads) - "better, faster, easier" without specifics
3. Missing/buried proof points - stats and testimonials hidden instead of prominent
4. Weak social proof - generic "trusted by thousands" instead of specific logos/names
5. Generic CTAs - "Contact Us" or "Learn More" without compelling reason
6. Unclear target audience - who is this site for? Can visitors tell?
7. Missing differentiators - nothing explains why choose you over alternatives
8. Trust signal gaps - no visible certs, awards, or third-party validation
9. Feature-first copy - leading with features instead of outcomes/benefits
10. Generic about/team messaging - forgettable company description

RESPOND IN THIS EXACT JSON FORMAT:
{
  "differentiationScore": <number 0-100, higher = better differentiated>,
  "categoryScores": {
    "firstImpression": <0-10 score for first impression clarity>,
    "differentiation": <0-10 score for standing out from competitors>,
    "customerClarity": <0-10 score for how clear the target audience is>,
    "storyStructure": <0-10 score for compelling narrative>,
    "trustSignals": <0-10 score for proof and credibility>,
    "buttonClarity": <0-10 score for clear call-to-action>
  },
  "topIssues": [
    {
      "title": "<issue category from list above>",
      "description": "<1-2 sentences about how THIS site fails in this area>",
      "severity": "<critical|warning|info>",
      "findings": [
        {
          "phrase": "<EXACT quote from the page content>",
          "problem": "<why this specific phrase hurts this company>",
          "rewrite": "<SPECIFIC replacement copy using details from THIS site - not generic advice>",
          "location": "<where: hero section, about page, footer, etc>",
          "pageUrl": "<which page URL this was found on>"
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
    "examples": ["<corporate speak example>", "<authentic example if found>", "<recommendation>"]
  },
  "suggestedCompetitors": [
    {
      "domain": "<competitor domain like 'monday.com'>",
      "confidence": "<high|medium|low>",
      "reason": "<why this is likely a competitor>"
    }
  ]
}

CRITICAL REQUIREMENTS:
1. Return EXACTLY 10 topIssues (one for each category)
2. Each topIssue MUST have 3-5 findings with actual quotes from the content
3. MINIMUM 30 total findings across all issues (you should have 30-50)
4. Rewrites must be ACTUAL COPY, not instructions like "add specificity" - write the actual headline/sentence
5. Include pageUrl for every finding so users know where to fix it
6. Find 3-5 proof points if they exist in the content
7. Suggest 5 likely competitors based on industry and offerings
8. Be brutally specific - quote actual text, provide actual replacement copy
9. REWRITE LENGTH RULE: Rewrites MUST be within +20% of original character count. A 30-character phrase gets a 24-36 character rewrite, NOT a 150-character paragraph. Violations will be rejected.`;
}

/**
 * Parse Claude's response into structured data
 * Handles both new structure (findings in topIssues) and old structure (findings in pageAnalysis)
 */
function parseAnalysisResponse(
  response: string,
  pages: CrawledPage[]
): AnalysisResult {
  try {
    // Strip markdown code fences if present (Claude often wraps JSON in ```json ... ```)
    let cleanedResponse = response;
    if (response.includes('```json')) {
      cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (response.includes('```')) {
      cleanedResponse = response.replace(/```\s*/g, '');
    }

    // Extract JSON from response
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Parser] No JSON found in AI response');
      console.error('[Parser] Response preview:', response.substring(0, 300));
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('[Parser] Successfully parsed AI JSON response');

    // FIRST: Collect all findings from pageAnalysis (old structure / backwards compat)
    const allFindingsFromPages: Finding[] = [];
    if (Array.isArray(parsed.pageAnalysis)) {
      for (const page of parsed.pageAnalysis) {
        const pageUrl = String(page.url || pages[0]?.url || '');
        if (Array.isArray(page.issues)) {
          for (const issue of page.issues) {
            if (issue.phrase && issue.rewrite) {
              allFindingsFromPages.push({
                phrase: String(issue.phrase || ''),
                problem: String(issue.problem || ''),
                rewrite: String(issue.rewrite || ''),
                location: String(issue.location || ''),
                pageUrl,
              });
            }
          }
        }
      }
    }
    console.log(`[Parser] Found ${allFindingsFromPages.length} findings from pageAnalysis`);

    // SECOND: Parse topIssues and merge findings
    const topIssues = (parsed.topIssues || []).slice(0, 10).map((issue: Record<string, unknown>, idx: number) => {
      // Parse findings nested within each issue (new structure)
      let findings: Finding[] = [];

      if (Array.isArray(issue.findings) && issue.findings.length > 0) {
        // New structure: findings directly on issue
        // ENFORCE LENGTH CONSTRAINT: rewrite should be within +50% of original length
        findings = issue.findings.map((f: Record<string, string>) => {
          let rewrite = f.rewrite || '';
          let phrase = f.phrase || '';

          // CLEAN UP TRUNCATED PHRASES - detect and fix mid-word cuts
          // Check for fragments that start mid-word (lowercase letter after leading ellipsis or nothing)
          if (phrase.match(/^\.{2,}\s*[a-z]/) || phrase.match(/^[a-z]/)) {
            // Starts with lowercase - likely truncated. Remove leading partial word if present
            const cleanedStart = phrase.replace(/^\.{2,}\s*\w+\s+/, '').replace(/^\w+\s+/, '');
            if (cleanedStart.length > 10) {
              console.log(`[Parser] Cleaned truncated phrase start: "${phrase.substring(0, 30)}..." → "${cleanedStart.substring(0, 30)}..."`);
              phrase = cleanedStart;
            }
          }
          // Check for fragments that end mid-word (no punctuation, lowercase ending)
          if (phrase.match(/[a-z]$/) && !phrase.match(/[.!?:,;]$/)) {
            // Ends with lowercase, no punctuation - likely truncated. Add ellipsis for clarity
            phrase = phrase.trim() + '...';
          }

          const maxLength = Math.max(phrase.length * 1.5, 100); // Allow 50% longer or min 100 chars

          // If rewrite is WAY too long, truncate at sentence boundary
          if (rewrite.length > maxLength) {
            // Find last sentence ending before max length
            const truncated = rewrite.substring(0, Math.floor(maxLength));
            const lastPeriod = truncated.lastIndexOf('.');
            const lastQuestion = truncated.lastIndexOf('?');
            const lastExclaim = truncated.lastIndexOf('!');
            const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim);

            if (lastSentence > 20) {
              rewrite = truncated.substring(0, lastSentence + 1);
            } else {
              // No good sentence break, just truncate
              rewrite = truncated.trim();
            }
            console.log(`[Parser] Truncated overly-long rewrite: ${f.rewrite?.length} → ${rewrite.length} chars`);
          }

          return {
            phrase,
            problem: f.problem || '',
            rewrite,
            location: f.location || '',
            pageUrl: f.pageUrl || '',
          };
        });
      } else if (allFindingsFromPages.length > 0) {
        // Fallback: match findings to issues by keywords in the issue title
        // This replaces the old round-robin which assigned findings randomly
        const issueTitle = String(issue.title || '').toLowerCase();

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
        };

        // Find which category this issue belongs to
        let matchedCategory = '';
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => issueTitle.includes(kw))) {
            matchedCategory = category;
            break;
          }
        }

        if (matchedCategory) {
          // Filter findings whose content matches this category
          findings = allFindingsFromPages.filter(f => {
            const content = `${f.phrase || ''} ${f.problem || ''} ${f.location || ''}`.toLowerCase();
            const keywords = categoryKeywords[matchedCategory] || [];
            return keywords.some(kw => content.includes(kw));
          }).slice(0, 5);
        }

        // If no keyword match found, leave findings empty rather than assigning randomly
        // This prevents wrong findings appearing under wrong sections
        if (findings.length === 0 && allFindingsFromPages.length > 0) {
          console.log(`[Parser] No matching findings for issue "${issue.title}" - leaving empty to prevent mismatches`);
        }
      }

      return {
        title: String(issue.title || 'Issue detected'),
        description: String(issue.description || 'Generic messaging detected'),
        severity: (['critical', 'warning', 'info'].includes(String(issue.severity)) ? issue.severity : 'warning') as 'critical' | 'warning' | 'info',
        findings,
      };
    });

    // Count total findings
    const totalFindings = topIssues.reduce((sum: number, i: { findings: Finding[] }) => sum + i.findings.length, 0);
    console.log(`[Parser] Total findings distributed across ${topIssues.length} issues: ${totalFindings}`);

    // Build pageAnalysis for backwards compatibility
    const pageMap = new Map<string, Finding[]>();
    for (const issue of topIssues) {
      for (const finding of issue.findings || []) {
        const pageUrl = finding.pageUrl || pages[0]?.url || '';
        if (!pageMap.has(pageUrl)) {
          pageMap.set(pageUrl, []);
        }
        pageMap.get(pageUrl)!.push(finding);
      }
    }

    const pageAnalysis = Array.from(pageMap.entries()).map(([url, issues]) => ({
      url,
      title: pages.find(p => p.url === url)?.title || 'Page',
      score: Math.max(10, 70 - issues.length * 10),
      issues: issues.slice(0, 5),
    }));

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

  // Collect all findings from pages
  const allFindings: Finding[] = [];
  const pageAnalysis: AnalysisResult['pageAnalysis'] = [];

  for (const page of pages.slice(0, 10)) {
    const lowerContent = page.content.toLowerCase();
    const pageFindings: Finding[] = [];

    for (const phrase of commodityPhrases) {
      if (lowerContent.includes(phrase.toLowerCase())) {
        const rewriteData = commodityPhraseRewrites[phrase];
        const finding: Finding = {
          phrase: `"${phrase}"`,
          problem: rewriteData.problem,
          rewrite: rewriteData.rewrite,
          location: 'Found in page content',
          pageUrl: page.url,
        };
        pageFindings.push(finding);
        allFindings.push(finding);
      }
    }

    pageAnalysis.push({
      url: page.url,
      title: page.title,
      score: Math.max(10, 70 - pageFindings.length * 15),
      issues: pageFindings.slice(0, 5),
    });
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
  ];

  // Distribute findings to issues based on keyword matching
  const issuesWithFindings = issueCategories.map(category => {
    const matchedFindings = allFindings.filter(f => {
      const phraseText = f.phrase.toLowerCase();
      return category.keywords.some(kw => phraseText.includes(kw));
    }).slice(0, 5);

    return {
      title: category.title,
      description: category.description,
      severity: category.severity,
      findings: matchedFindings,
    };
  });

  const hostname = siteUrl ? new URL(siteUrl).hostname : 'this site';

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
  };
}
