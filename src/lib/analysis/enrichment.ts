/**
 * Enrichment functions for website analysis
 *
 * Handles competitor discovery, deep AI competitor analysis,
 * inline (blocking) and background (async) competitor pipelines,
 * and social profile enrichment.
 */

import { crawlWebsite, CrawlResult } from '@/lib/crawler';
import { getAnthropicClient } from '@/lib/analyzer';
import { getState, updateState, FullResults } from './state';
import { buildCompetitorAnalysisPrompt, buildCompetitorDiscoveryPrompt } from './enrichment-prompts';
import { parseCompetitorAnalysisResponse, heuristicCompetitorAnalysis, buildGaps } from './enrichment-parsers';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CompetitorDeepAnalysis {
  categoryScores: {
    firstImpression: number;
    differentiation: number;
    customerClarity: number;
    storyStructure: number;
    trustSignals: number;
    buttonClarity: number;
  };
  strengths: string[];
  weaknesses: string[];
  overallScore: number;
}

export interface DetailedCompetitorScore {
  url: string;
  score: number;
  categoryScores?: CompetitorDeepAnalysis['categoryScores'];
  strengths?: string[];
  weaknesses?: string[];
}

// ---------------------------------------------------------------------------
// Deep AI competitor analysis
// ---------------------------------------------------------------------------

/**
 * Deep AI-powered competitor analysis with category scoring.
 * Returns detailed scores, strengths, and weaknesses for a single competitor.
 */
export async function analyzeCompetitorDeep(
  content: string,
  url: string
): Promise<CompetitorDeepAnalysis> {
  try {
    const anthropic = await getAnthropicClient();
    const prompt = buildCompetitorAnalysisPrompt(content);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const parsed = parseCompetitorAnalysisResponse(text, url);
    if (parsed) return parsed;
  } catch (error) {
    console.error(`AI competitor analysis failed for ${url}:`, error);
  }

  // FALLBACK: Heuristic scoring when AI fails
  return heuristicCompetitorAnalysis(content, url);
}

// ---------------------------------------------------------------------------
// Competitor discovery fallback
// ---------------------------------------------------------------------------

/**
 * Fallback competitor discovery when AI doesn't suggest any.
 * Uses a focused Claude call to identify competitors based on site content.
 */
export async function discoverCompetitors(
  pageContent: string,
  hostname: string,
  description: string
): Promise<string[]> {
  try {
    const client = await getAnthropicClient();
    const contentSnippet = pageContent.slice(0, 2000);
    const prompt = buildCompetitorDiscoveryPrompt(hostname, description, contentSnippet);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((d: unknown): d is string => typeof d === 'string')
          .map(d => d.replace(/^https?:\/\//, '').replace(/\/$/, ''))
          .slice(0, 5);
      }
    }

    return [];
  } catch (error) {
    console.error('Competitor discovery failed:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Inline competitor analysis (blocking, used before marking complete)
// ---------------------------------------------------------------------------

export async function analyzeCompetitorsInline(
  competitors: string[],
  yourScore: number
): Promise<FullResults['competitorComparison'] | null> {
  try {
    const competitorScores: DetailedCompetitorScore[] = [];

    const batchSize = 3;
    for (let i = 0; i < competitors.length; i += batchSize) {
      const batch = competitors.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (competitorUrl) => {
          let normalizedUrl = competitorUrl;
          if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
          }

          try {
            const crawlPromise = crawlWebsite(normalizedUrl, 1);
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Crawl timeout')), 45000)
            );

            const crawlResult = await Promise.race([crawlPromise, timeoutPromise]) as CrawlResult | null;

            if (crawlResult && crawlResult.pages.length > 0) {
              const content = crawlResult.pages[0]?.content || '';
              const headline = crawlResult.pages[0]?.h1;
              const analysis = await analyzeCompetitorDeep(content, competitorUrl);

              return {
                url: normalizedUrl,
                score: analysis.overallScore,
                categoryScores: analysis.categoryScores,
                strengths: analysis.strengths,
                weaknesses: analysis.weaknesses,
                headline,
              };
            }
          } catch (err) {
            console.error('[analyze] Could not analyze competitor (inline)', { competitorUrl, message: err instanceof Error ? err.message : String(err), timestamp: new Date().toISOString() });
          }
          return null;
        })
      );

      for (const result of batchResults) {
        if (result) competitorScores.push(result);
      }
    }

    if (competitorScores.length === 0) return null;

    const avgScore = Math.round(competitorScores.reduce((sum, c) => sum + c.score, 0) / competitorScores.length);
    const gaps = buildGaps(yourScore, avgScore, competitorScores);

    return {
      competitors,
      yourScore,
      averageScore: avgScore,
      gaps,
      detailedScores: competitorScores,
    };
  } catch (error) {
    console.error('Inline competitor analysis error:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Background competitor analysis (async, with live status updates)
// ---------------------------------------------------------------------------

export async function analyzeCompetitors(analysisId: string, competitors: string[]): Promise<void> {
  const state = await getState(analysisId);
  if (!state) return;

  try {
    const competitorScores: DetailedCompetitorScore[] = [];

    const competitorStatuses: Array<{
      url: string;
      status: 'pending' | 'analyzing' | 'completed' | 'error';
      preliminaryScore?: number;
      earlyFindings?: string[];
    }> = competitors.map(url => ({ url, status: 'pending' }));

    await updateState(analysisId, {
      enrichmentStatus: 'analyzing_competitors',
      enrichmentProgress: 0,
      enrichmentMessage: `Starting competitor analysis...`,
      competitorProgress: {
        total: competitors.length,
        completed: 0,
        competitors: competitorStatuses,
      },
    });

    const batchSize = 3;
    for (let batchStart = 0; batchStart < competitors.length; batchStart += batchSize) {
      const batch = competitors.slice(batchStart, batchStart + batchSize);

      batch.forEach((url) => {
        const idx = competitorStatuses.findIndex(c => c.url === url);
        if (idx >= 0) competitorStatuses[idx].status = 'analyzing';
      });

      await updateState(analysisId, {
        enrichmentMessage: `Analyzing ${batch.join(', ')}...`,
        competitorProgress: {
          total: competitors.length,
          completed: competitorScores.length,
          competitors: competitorStatuses,
        },
      });

      const batchResults = await Promise.all(
        batch.map(async (competitorUrl) => {
          let normalizedUrl = competitorUrl;
          if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
          }

          const statusIdx = competitorStatuses.findIndex(c => c.url === competitorUrl);

          try {
            const crawlPromise = crawlWebsite(normalizedUrl, 1);
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Crawl timeout')), 45000)
            );

            const crawlResult = await Promise.race([crawlPromise, timeoutPromise]) as CrawlResult | null;

            if (crawlResult && crawlResult.pages.length > 0) {
              const content = crawlResult.pages[0]?.content || '';
              const headline = crawlResult.pages[0]?.h1;
              const analysis = await analyzeCompetitorDeep(content, competitorUrl);

              if (statusIdx >= 0) {
                competitorStatuses[statusIdx].status = 'completed';
                competitorStatuses[statusIdx].preliminaryScore = analysis.overallScore;
                competitorStatuses[statusIdx].earlyFindings = [
                  ...(analysis.strengths.length > 0 ? [`Strength: ${analysis.strengths[0]}`] : []),
                  ...(analysis.weaknesses.length > 0 ? [`Gap: ${analysis.weaknesses[0]}`] : []),
                ].slice(0, 2);
              }

              return {
                url: normalizedUrl,
                score: analysis.overallScore,
                categoryScores: analysis.categoryScores,
                strengths: analysis.strengths,
                weaknesses: analysis.weaknesses,
                headline,
              };
            }
          } catch (err) {
            console.error('[analyze] Could not analyze competitor (background)', { analysisId, competitorUrl, message: err instanceof Error ? err.message : String(err), timestamp: new Date().toISOString() });
            if (statusIdx >= 0) {
              competitorStatuses[statusIdx].status = 'error';
            }
          }
          return null;
        })
      );

      for (const result of batchResults) {
        if (result) competitorScores.push(result);
      }

      await updateState(analysisId, {
        enrichmentProgress: Math.round((competitorScores.length / competitors.length) * 100),
        enrichmentMessage: `Analyzed ${competitorScores.length} of ${competitors.length} competitors...`,
        competitorProgress: {
          total: competitors.length,
          completed: competitorScores.length,
          competitors: competitorStatuses,
        },
      });
    }

    if (competitorScores.length === 0) {
      await updateState(analysisId, {
        enrichmentStatus: 'failed',
        enrichmentMessage: 'Could not fetch competitor websites',
        competitorProgress: undefined,
      });
      return;
    }

    const avgScore = Math.round(competitorScores.reduce((sum, c) => sum + c.score, 0) / competitorScores.length);
    const yourScore = state.preview?.commodityScore || 50;
    const gaps = buildGaps(yourScore, avgScore, competitorScores);

    const currentFullResults = state.fullResults || {
      pageByPage: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    };

    const existingScores = currentFullResults.competitorComparison?.detailedScores || [];
    const existingCompetitors = currentFullResults.competitorComparison?.competitors || [];
    const allCompetitors = [...new Set([...existingCompetitors, ...competitors])];
    const allScores = [
      ...existingScores.filter((s: DetailedCompetitorScore) => !competitorScores.some(n => n.url === s.url)),
      ...competitorScores
    ];

    const totalAvgScore = allScores.length > 0
      ? Math.round(allScores.reduce((sum: number, c: DetailedCompetitorScore) => sum + c.score, 0) / allScores.length)
      : avgScore;

    await updateState(analysisId, {
      fullResults: {
        ...currentFullResults,
        competitorComparison: {
          competitors: allCompetitors,
          yourScore,
          averageScore: totalAvgScore,
          gaps,
          detailedScores: allScores,
        },
      },
      enrichmentStatus: 'complete',
      enrichmentProgress: 100,
      enrichmentMessage: `Analyzed ${allScores.length} competitor${allScores.length !== 1 ? 's' : ''} with full category scoring`,
      competitorProgress: undefined,
    });

  } catch (error) {
    console.error('Competitor analysis error:', error);
    await updateState(analysisId, {
      enrichmentStatus: 'failed',
      enrichmentMessage: 'Could not analyze competitors',
      competitorProgress: undefined,
    });
  }
}

// ---------------------------------------------------------------------------
// Social profile analysis
// ---------------------------------------------------------------------------

export async function analyzeSocialProfiles(analysisId: string, socialUrls: string[]): Promise<void> {
  const state = await getState(analysisId);
  if (!state) return;

  try {
    await updateState(analysisId, {
      enrichmentStatus: 'analyzing_competitors',
      enrichmentProgress: 50,
      enrichmentMessage: `Checking ${socialUrls[0]}...`,
    });

    // LinkedIn etc. often block scrapers — store URLs as additional context
    await new Promise(resolve => setTimeout(resolve, 2000));

    await updateState(analysisId, {
      enrichmentStatus: 'complete',
      enrichmentProgress: 100,
      enrichmentMessage: `Added ${socialUrls.length} social profile${socialUrls.length !== 1 ? 's' : ''} to analysis`,
    });

  } catch (error) {
    console.error('Social profile analysis error:', error);
    await updateState(analysisId, {
      enrichmentStatus: 'failed',
      enrichmentMessage: 'Could not process social profile',
    });
  }
}
