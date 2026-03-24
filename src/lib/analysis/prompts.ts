import { AnalysisResult } from '../analyzer'

/** Build the analysis prompt for Claude's first pass */
export function buildAnalysisPrompt(
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
9. REWRITE LENGTH RULE: Rewrites MUST be within +20% of original character count. A 30-character phrase gets a 24-36 character rewrite, NOT a 150-character paragraph. Violations will be rejected.`
}

/** Build prompt for focused second pass on sparse categories */
export function buildSecondPassPrompt(
  siteUrl: string,
  pages: Array<{ url: string; title: string; content: string; meta: Record<string, string | undefined> }>,
  sparseCategories: string[],
  firstPassResult: AnalysisResult
): string {
  // Get existing phrases to avoid duplicates
  const existingPhrases = firstPassResult.topIssues
    .flatMap(i => i.findings || [])
    .map(f => f.phrase.toLowerCase().trim())
    .filter(p => p.length > 0)

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
4. If a category genuinely has no more issues, explain why in the description`
}
