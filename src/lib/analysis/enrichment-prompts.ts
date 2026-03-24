/**
 * Prompt builders for enrichment AI calls
 */

/**
 * Builds the prompt for deep competitor analysis.
 */
export function buildCompetitorAnalysisPrompt(content: string): string {
  return `Analyze this competitor homepage for messaging effectiveness.

CRITICAL: Include EXACT quoted text from the site in your analysis.

Provide:

1. Category scores (0-10 scale, be honest - most sites score 4-7):
   - firstImpression: Can visitors understand what they do in 5 seconds?
   - differentiation: Do they stand out from competitors with specific claims?
   - customerClarity: Is their ideal customer obvious?
   - storyStructure: Do they have a compelling narrative flow?
   - trustSignals: Can visitors verify claims with specific proof?
   - buttonClarity: Is the next step obvious?

2. Strengths: 2-3 things they do well. MUST include actual quoted text in "quotes" from the site.
   Example: 'Uses specific proof: "Trusted by 50,000+ teams" and "Since 2007"'
   Example: 'Clear CTA: "Start your free trial" appears above fold'

3. Weaknesses: 2-3 gaps. Include quoted examples of weak/generic language if found.
   CRITICAL: All quoted text MUST be complete phrases - never truncate mid-word or mid-sentence.
   BAD: '...nd what you want to do next' (truncated)
   GOOD: 'we help you find what you want to do next' (complete phrase)
   CRITICAL: Strengths and weaknesses MUST NOT contradict each other.
   BAD: Strength "Uses specific proof" + Weakness "Limited use of specific claims"
   GOOD: Be consistent - if they have proof, don't say they lack proof
   Example: 'Generic positioning: "world-class solutions" and "industry-leading"'
   Example: 'No specific customer: describes audience as "businesses of all sizes"'

Website content:
${content.substring(0, 6000)}

Return ONLY valid JSON (no markdown, no explanation):
{
  "categoryScores": {
    "firstImpression": <0-10>,
    "differentiation": <0-10>,
    "customerClarity": <0-10>,
    "storyStructure": <0-10>,
    "trustSignals": <0-10>,
    "buttonClarity": <0-10>
  },
  "strengths": ["<strength with quoted text>", "<another with quotes>"],
  "weaknesses": ["<weakness with quoted text>", "<another with quotes>"],
  "overallScore": <average of categories * 10>
}`;
}

/**
 * Builds the prompt for competitor discovery.
 */
export function buildCompetitorDiscoveryPrompt(
  hostname: string,
  description: string,
  contentSnippet: string,
): string {
  return `Based on this website content, identify 5 likely competitors.

Website: ${hostname}
Description: ${description}

Content snippet:
${contentSnippet}

Return ONLY a JSON array of 5 competitor domain names (no explanations):
["competitor1.com", "competitor2.com", ...]

Focus on direct competitors in the same industry/market segment. Use well-known competitors if applicable.`;
}
