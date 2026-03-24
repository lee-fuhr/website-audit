/**
 * Response parsers and heuristic fallbacks for enrichment AI calls
 */

import { CompetitorDeepAnalysis } from './enrichment';

// ---------------------------------------------------------------------------
// AI response parser
// ---------------------------------------------------------------------------

interface RawAnalysisJson {
  categoryScores?: {
    firstImpression?: unknown;
    differentiation?: unknown;
    customerClarity?: unknown;
    storyStructure?: unknown;
    trustSignals?: unknown;
    buttonClarity?: unknown;
  };
  strengths?: unknown;
  weaknesses?: unknown;
}

/**
 * Parses and validates the raw JSON response from the competitor analysis AI call.
 * Applies post-processing: filters truncated/malformed quotes, removes contradictions,
 * ensures low-scoring sites have at least one weakness.
 */
export function parseCompetitorAnalysisResponse(
  text: string,
  url: string,
): CompetitorDeepAnalysis | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]) as RawAnalysisJson;

  const toScore = (val: unknown) => Math.min(10, Math.max(0, typeof val === 'number' ? val : 5));

  const categoryScores = {
    firstImpression: toScore(parsed.categoryScores?.firstImpression),
    differentiation: toScore(parsed.categoryScores?.differentiation),
    customerClarity: toScore(parsed.categoryScores?.customerClarity),
    storyStructure: toScore(parsed.categoryScores?.storyStructure),
    trustSignals: toScore(parsed.categoryScores?.trustSignals),
    buttonClarity: toScore(parsed.categoryScores?.buttonClarity),
  };

  const avgCategory =
    (categoryScores.firstImpression +
      categoryScores.differentiation +
      categoryScores.customerClarity +
      categoryScores.storyStructure +
      categoryScores.trustSignals +
      categoryScores.buttonClarity) /
    6;

  const strengths = Array.isArray(parsed.strengths) ? (parsed.strengths as string[]).slice(0, 3) : [];
  let weaknesses = Array.isArray(parsed.weaknesses) ? (parsed.weaknesses as string[]).slice(0, 3) : [];
  const overallScore = Math.round(avgCategory * 10);

  // POST-PROCESS: Filter truncated/malformed quotes
  weaknesses = weaknesses.filter((w: string) => {
    if (/^["']?\.{2,}[a-z]/.test(w)) {
      console.warn('[analyze] Filtered truncated weakness (starts mid-word)', { weakness: w, url, timestamp: new Date().toISOString() });
      return false;
    }
    if (/\.{3}[a-z]{1,3}\s/.test(w)) {
      console.warn('[analyze] Filtered truncated weakness (mid-word ellipsis)', { weakness: w, url, timestamp: new Date().toISOString() });
      return false;
    }
    if (w.length < 20 && !/\s/.test(w.trim())) {
      console.warn('[analyze] Filtered truncated weakness (too short/no spaces)', { weakness: w, url, timestamp: new Date().toISOString() });
      return false;
    }
    return true;
  });

  // POST-PROCESS: Remove contradictory weaknesses
  const contradictionPatterns = [
    { strengthKeywords: ['proof', 'specific', 'evidence', 'data', 'numbers', 'claims'], weaknessKeywords: ['limited', 'missing', 'lack', 'no proof', 'not specific', 'generic claims'] },
    { strengthKeywords: ['clear', 'obvious', 'direct'], weaknessKeywords: ['unclear', 'confusing', 'vague'] },
    { strengthKeywords: ['customer', 'audience', 'target'], weaknessKeywords: ['no customer', 'no audience', 'unclear audience'] },
    { strengthKeywords: ['trust', 'credibility', 'testimonial'], weaknessKeywords: ['no trust', 'lacks credibility', 'missing testimonial'] },
  ];

  const strengthsLower = strengths.map((s: string) => s.toLowerCase()).join(' ');
  weaknesses = weaknesses.filter((w: string) => {
    const wLower = w.toLowerCase();
    for (const pattern of contradictionPatterns) {
      const hasStrengthKeyword = pattern.strengthKeywords.some(k => strengthsLower.includes(k));
      const hasWeaknessKeyword = pattern.weaknessKeywords.some(k => wLower.includes(k));
      if (hasStrengthKeyword && hasWeaknessKeyword) {
        console.warn('[analyze] Filtered contradictory weakness', { weakness: w, conflictsWith: pattern.strengthKeywords[0], url, timestamp: new Date().toISOString() });
        return false;
      }
    }
    return true;
  });

  // ENSURE low-scoring sites have at least one weakness
  if (weaknesses.length === 0 && overallScore < 70) {
    if (overallScore < 40) {
      weaknesses = ['Weak differentiation from competitors', 'Missing specific proof points'];
    } else if (overallScore < 60) {
      weaknesses = ['Limited use of specific claims and evidence'];
    } else {
      weaknesses = ['Could strengthen messaging with more specific proof'];
    }
  }

  return { categoryScores, strengths, weaknesses, overallScore };
}

// ---------------------------------------------------------------------------
// Heuristic fallback
// ---------------------------------------------------------------------------

/**
 * Heuristic-based competitor analysis used when the AI call fails.
 */
export function heuristicCompetitorAnalysis(content: string, url: string): CompetitorDeepAnalysis {
  console.warn('[analyze] Using heuristic fallback for competitor', { url, timestamp: new Date().toISOString() });

  const commodityPhrases = [
    'leading', 'innovative', 'solutions', 'best-in-class', 'world-class',
    'cutting-edge', 'next-generation', 'state-of-the-art', 'industry-leading',
    'trusted', 'proven', 'reliable', 'premier', 'excellence', 'committed'
  ];

  const differentiators = [
    { pattern: /\b(\d+)\s*\+?\s*(years?|customers?|clients?|projects?|companies|users?|teams?|employees?|locations?|offices?)\b/gi, type: 'proof' },
    { pattern: /since\s*(19|20)\d{2}/gi, type: 'proof' },
    { pattern: /founded\s*(in\s*)?(19|20)\d{2}/gi, type: 'proof' },
    { pattern: /established\s*(in\s*)?(19|20)\d{2}/gi, type: 'proof' },
    { pattern: /\b(iso|soc|hipaa|gdpr|pci|nist|cmmc|fedramp)\s*\d*\s*(certified|compliant|compliance|approved)?/gi, type: 'proof' },
    { pattern: /\b(award[- ]?winning|patent(ed)?|guaranteed?|warranty|money.?back|satisfaction)\b/gi, type: 'proof' },
    { pattern: /(\d+)%\s*(faster|better|more|increase|reduction|savings?|improvement|growth|success)/gi, type: 'proof' },
    { pattern: /\$\d+[km]?\s*(in\s*)?(savings?|revenue|value|roi)/gi, type: 'proof' },
    { pattern: /case\s*stud(y|ies)/gi, type: 'proof' },
    { pattern: /\b(testimonial|review|rating|rated|stars?)\b/gi, type: 'proof' },
    { pattern: /\b(\d+)\s*(star|review|rating)/gi, type: 'proof' },
    { pattern: /(top|best)\s*\d+/gi, type: 'proof' },
    { pattern: /\bInc\.?\s*5000\b/gi, type: 'proof' },
    { pattern: /\bFortune\s*\d+/gi, type: 'proof' },
    { pattern: /\bBBB\s*A\+?/gi, type: 'proof' },
    { pattern: /\b(certified|licensed|insured|bonded)\b/gi, type: 'proof' },
    { pattern: /\b(member|partner)\s*(of|with)\b/gi, type: 'proof' },
    { pattern: /(locally|family)\s*owned/gi, type: 'proof' },
    { pattern: /free\s*(consultation|estimate|quote|assessment)/gi, type: 'proof' },
    { pattern: /same[- ]?day|next[- ]?day|24[\/\-]?7/gi, type: 'proof' },
  ];

  const lowerContent = content.toLowerCase();
  let genericCount = 0;
  const foundGenericPhrases: string[] = [];
  const foundProofPoints: string[] = [];

  for (const phrase of commodityPhrases) {
    if (lowerContent.includes(phrase)) {
      genericCount++;
      const idx = lowerContent.indexOf(phrase);
      const start = Math.max(0, idx - 30);
      const end = Math.min(content.length, idx + phrase.length + 30);
      const context = content.substring(start, end).trim().replace(/\s+/g, ' ');
      if (foundGenericPhrases.length < 3) {
        foundGenericPhrases.push(`"...${context}..."`);
      }
    }
  }

  for (const { pattern } of differentiators) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches.slice(0, 2)) {
        if (foundProofPoints.length < 3 && !foundProofPoints.some(p => p.includes(match))) {
          foundProofPoints.push(`"${match}"`);
        }
      }
    }
  }

  const genericPenalty = Math.min(10, genericCount * 2);
  const proofBonus = Math.min(25, foundProofPoints.length * 5);
  const heuristicScore = Math.max(20, Math.min(85, 55 - genericPenalty + proofBonus));
  const baseCategory = Math.round(heuristicScore / 10);

  const strengths: string[] = [];
  if (foundProofPoints.length > 0) {
    strengths.push(`Uses specific proof: ${foundProofPoints.join(', ')}`);
  }

  const weaknesses: string[] = [];
  if (foundGenericPhrases.length > 0) {
    weaknesses.push(`Relies on generic language: ${foundGenericPhrases.slice(0, 2).join(', ')}`);
  }

  if (weaknesses.length === 0 && heuristicScore < 70) {
    if (heuristicScore < 40) {
      weaknesses.push('Weak differentiation from competitors');
      weaknesses.push('Missing specific proof points and social proof');
    } else if (heuristicScore < 60) {
      weaknesses.push('Limited use of specific claims and evidence');
    } else {
      weaknesses.push('Could strengthen messaging with more specific proof');
    }
  }

  return {
    categoryScores: {
      firstImpression: Math.min(10, baseCategory + (Math.random() > 0.5 ? 1 : 0)),
      differentiation: Math.min(10, baseCategory + (Math.random() > 0.5 ? -1 : 0)),
      customerClarity: Math.min(10, baseCategory),
      storyStructure: Math.min(10, baseCategory + (Math.random() > 0.5 ? 1 : -1)),
      trustSignals: Math.min(10, baseCategory + (foundProofPoints.length > 2 ? 1 : 0)),
      buttonClarity: Math.min(10, baseCategory),
    },
    strengths,
    weaknesses,
    overallScore: heuristicScore,
  };
}

// ---------------------------------------------------------------------------
// Gap analysis helper
// ---------------------------------------------------------------------------

import { DetailedCompetitorScore } from './enrichment';

/**
 * Builds the list of gap observations comparing your score to the competitor average.
 */
export function buildGaps(
  yourScore: number,
  avgScore: number,
  competitorScores: DetailedCompetitorScore[],
): string[] {
  const gaps: string[] = [];

  if (yourScore > avgScore + 10) {
    gaps.push('Your messaging is more differentiated than most competitors');
    gaps.push('You have unique proof points competitors lack');
  } else if (yourScore < avgScore - 10) {
    gaps.push('Competitors have clearer differentiation than you');
    gaps.push('Look for proof points you can surface to stand out');
  } else {
    gaps.push('Your messaging is similar to competitors - room to differentiate');
    gaps.push('Focus on unique proof points only you can claim');
  }

  const bestCompetitor = competitorScores.reduce((best, c) => c.score > best.score ? c : best, competitorScores[0]);
  const worstCompetitor = competitorScores.reduce((worst, c) => c.score < worst.score ? c : worst, competitorScores[0]);

  if (bestCompetitor && bestCompetitor.score > yourScore) {
    gaps.push(`${bestCompetitor.url} has stronger differentiation - worth studying`);
  }
  if (worstCompetitor && worstCompetitor.score < yourScore - 15) {
    gaps.push(`You're ahead of ${worstCompetitor.url} in messaging clarity`);
  }

  return gaps;
}
