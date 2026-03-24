/**
 * Analysis orchestration logic
 *
 * Handles the full background processing pipeline: crawl → analyze → competitor enrichment → state update.
 * Called by the API route via waitUntil.
 */

import { kv } from '@vercel/kv';
import { crawlWebsite, CrawlResult } from '@/lib/crawler';
import { analyzeWebsite, AnalysisResult } from '@/lib/analyzer';
import {
  getState,
  updateState,
  useKV,
  PreviewData,
  FullResults,
} from '@/lib/analysis/state';
import {
  discoverCompetitors,
  analyzeCompetitorsInline,
} from '@/lib/analysis/enrichment';
import { logger } from '@shared/lib/logger';

// ---------------------------------------------------------------------------
// Main processing pipeline
// ---------------------------------------------------------------------------

/**
 * Background processing function.
 * Crawls website, runs AI analysis, performs inline competitor scoring.
 */
export async function processAnalysis(analysisId: string): Promise<void> {
  const state = await getState(analysisId);
  if (!state) return;

  let crawlResult: CrawlResult | null = null;

  try {
    // Phase 1: Crawling
    await updateState(analysisId, {
      status: 'crawling',
      progress: 5,
      message: 'Discovering pages on your website...',
    });

    const crawledPagesList: string[] = [];
    const maxPages = 50;

    crawlResult = await crawlWebsite(
      state.url,
      maxPages,
      (crawled, _found, currentUrl) => {
        const crawlProgress = 5 + Math.round((crawled / maxPages) * 55);
        const currentPath = new URL(currentUrl).pathname || '/';

        if (!crawledPagesList.includes(currentPath)) {
          crawledPagesList.push(currentPath);
        }

        updateState(analysisId, {
          pagesCrawled: crawled,
          pagesFound: crawled,
          currentUrl: currentUrl,
          crawledPages: [...crawledPagesList],
          progress: Math.min(crawlProgress, 60),
          message: `Scanning: ${currentPath}`,
        });
      }
    );

    if (crawlResult.pages.length === 0) {
      throw new Error('Could not access website. Please check the URL.');
    }

    await updateState(analysisId, {
      pagesFound: crawlResult.pages.length,
      pagesCrawled: crawlResult.pages.length,
      crawledPages: crawlResult.pages.map(p => new URL(p.url).pathname || '/'),
      progress: 65,
      message: crawlResult.linkedInUrl
        ? 'LinkedIn found. Analyzing messaging patterns...'
        : 'Analyzing messaging patterns...',
    });

    // Phase 2: Analysis
    await updateState(analysisId, {
      status: 'analyzing',
      progress: 70,
      message: 'Analyzing messaging patterns...',
    });

    const analysisResult = await analyzeWebsite(crawlResult, state.url);

    await updateState(analysisId, {
      progress: 90,
      message: 'Generating recommendations...',
    });

    const preview = buildPreview(crawlResult, analysisResult);
    let fullResults = buildFullResults(analysisResult);

    const hostname = new URL(crawlResult.pages[0]?.url || 'https://example.com').hostname;

    let suggestedCompetitors = analysisResult.suggestedCompetitors || [];

    // FALLBACK: If AI didn't suggest competitors, discover them
    if (suggestedCompetitors.length === 0) {
      logger.warn('No competitors from AI, attempting fallback discovery', { tool: 'website-audit', fn: 'processAnalysis', analysisId });
      await updateState(analysisId, {
        progress: 91,
        message: 'Discovering competitors...',
      });

      try {
        const discovered = await discoverCompetitors(
          crawlResult.pages[0]?.content || '',
          hostname,
          crawlResult.pages[0]?.meta.description || ''
        );
        if (discovered.length > 0) {
          suggestedCompetitors = discovered.map(d => ({
            domain: d,
            confidence: 'medium' as const,
            reason: 'Discovered via fallback analysis'
          }));
          logger.warn('Fallback discovered competitors', { tool: 'website-audit', fn: 'processAnalysis', analysisId, competitors: discovered });
        }
      } catch (err) {
        logger.error('Fallback competitor discovery failed', { tool: 'website-audit', fn: 'processAnalysis', analysisId, error: err instanceof Error ? err.message : String(err) });
      }
    }

    // Always set a default competitorComparison so UI doesn't show "not available"
    fullResults = {
      ...fullResults,
      competitorComparison: {
        competitors: [],
        yourScore: preview.commodityScore,
        averageScore: 0,
        gaps: [],
        detailedScores: []
      },
    };

    if (suggestedCompetitors.length > 0) {
      await updateState(analysisId, {
        progress: 92,
        message: 'Analyzing competitors...',
      });

      const sortedCompetitors = [...suggestedCompetitors]
        .sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.confidence] - order[b.confidence];
        })
        .slice(0, 5)
        .map(c => c.domain);

      // Await competitor analysis with 60s timeout
      const COMPETITOR_TIMEOUT = 60000;
      try {
        const competitorData = await Promise.race([
          analyzeCompetitorsInline(sortedCompetitors, preview.commodityScore),
          new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), COMPETITOR_TIMEOUT)
          )
        ]);

        if (competitorData) {
          fullResults = {
            ...fullResults,
            competitorComparison: competitorData,
          };
        } else {
          logger.warn('Competitor analysis timed out, setting fallback', { tool: 'website-audit', fn: 'processAnalysis', analysisId });
          fullResults = {
            ...fullResults,
            competitorComparison: {
              competitors: sortedCompetitors,
              yourScore: preview.commodityScore,
              averageScore: 0,
              gaps: ['Competitor analysis timed out - try refreshing in 30 seconds'],
              detailedScores: []
            },
          };
        }
      } catch (err) {
        logger.error('Competitor analysis failed', { tool: 'website-audit', fn: 'processAnalysis', analysisId, error: err instanceof Error ? err.message : String(err) });
        fullResults = {
          ...fullResults,
          competitorComparison: {
            competitors: sortedCompetitors,
            yourScore: preview.commodityScore,
            averageScore: 0,
            gaps: ['Competitor analysis failed - competitors may be blocking access'],
            detailedScores: []
          },
        };
      }
    }

    await updateState(analysisId, {
      status: 'complete',
      progress: 100,
      message: 'Analysis complete',
      completedAt: new Date().toISOString(),
      preview,
      fullResults,
    });

  } catch (error) {
    logger.error('Processing error', { tool: 'website-audit', fn: 'processAnalysis', analysisId, error: error instanceof Error ? error.message : String(error) });
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
    try {
      await updateState(analysisId, {
        status: 'failed',
        message: errorMessage,
      });
    } catch (updateErr) {
      logger.error('Failed to write error state via updateState, falling back to direct KV write', { tool: 'website-audit', fn: 'processAnalysis', analysisId, error: updateErr instanceof Error ? updateErr.message : String(updateErr) });
      if (useKV) {
        try {
          const fallbackState = await getState(analysisId);
          await kv.set(`analysis:${analysisId}`, {
            ...(fallbackState ?? {}),
            status: 'failed',
            message: errorMessage,
          }, { ex: 172800 });
        } catch (kvErr) {
          logger.error('Direct KV error state write also failed', { tool: 'website-audit', fn: 'processAnalysis', analysisId, error: kvErr instanceof Error ? kvErr.message : String(kvErr) });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Preview + full results builders
// ---------------------------------------------------------------------------

/**
 * Build preview data from analysis results.
 * Findings come directly on topIssues from the AI.
 */
export function buildPreview(crawlResult: CrawlResult, analysis: AnalysisResult): PreviewData {
  const hostname = new URL(crawlResult.pages[0]?.url || 'https://example.com').hostname;

  const topIssuesWithFindings = analysis.topIssues.slice(0, 10).map((issue) => {
    const findings = (issue.findings || []).map(f => ({
      phrase: f.phrase || '',
      problem: f.problem || '',
      rewrite: f.rewrite || '',
      location: f.location || '',
      pageUrl: f.pageUrl || crawlResult.pages[0]?.url || '',
    }));

    return {
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      findings,
    };
  });

  const totalFindings = topIssuesWithFindings.reduce((sum, i) => sum + i.findings.length, 0);
  logger.info('buildPreview findings count', { tool: 'website-audit', fn: 'buildPreview', issueCount: topIssuesWithFindings.length, totalFindings });

  const allFindings = topIssuesWithFindings.flatMap(i => i.findings);
  const teaserFinding = allFindings[0] || undefined;

  return {
    commodityScore: analysis.commodityScore,
    categoryScores: analysis.categoryScores,
    pagesScanned: crawlResult.pages.length,
    topIssues: topIssuesWithFindings,
    siteSnapshot: {
      title: hostname.replace('www.', '').split('.')[0],
      description: crawlResult.pages[0]?.meta.description || '',
      h1: crawlResult.pages[0]?.h1,
      hasLinkedIn: !!crawlResult.linkedInUrl,
      pagesFound: crawlResult.pages.map(p => new URL(p.url).pathname || '/'),
      spaWarning: crawlResult.spaWarning,
    },
    teaserFinding,
    voiceSummary: {
      currentTone: analysis.voiceAnalysis.currentTone,
      authenticVoice: analysis.voiceAnalysis.authenticVoice,
    },
  };
}

/**
 * Build full results from analysis
 */
export function buildFullResults(analysis: AnalysisResult): FullResults {
  return {
    pageByPage: analysis.pageAnalysis,
    proofPoints: analysis.proofPoints,
    voiceAnalysis: analysis.voiceAnalysis,
  };
}
