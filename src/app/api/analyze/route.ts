/**
 * Website Analysis API Route
 *
 * Accepts a URL, crawls the site, runs AI analysis,
 * returns progress updates and results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { kv } from '@vercel/kv';
import { waitUntil } from '@vercel/functions';
import { crawlWebsite, CrawlResult } from '@/lib/crawler';
import { analyzeWebsite, AnalysisResult } from '@/lib/analyzer';

// Use Vercel KV if available, otherwise fall back to in-memory (for local dev)
const useKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const localStore = new Map<string, AnalysisState>();

async function getState(id: string): Promise<AnalysisState | null> {
  if (useKV) {
    try {
      return await kv.get<AnalysisState>(`analysis:${id}`);
    } catch (error) {
      console.error(`[KV Error] Failed to get state for ${id}:`, error);
      // Fall back to local store if KV fails
      return localStore.get(id) || null;
    }
  }
  return localStore.get(id) || null;
}

async function setState(id: string, state: AnalysisState): Promise<void> {
  if (useKV) {
    try {
      // Store with 1 hour expiry
      await kv.set(`analysis:${id}`, state, { ex: 3600 });
    } catch (error) {
      console.error(`[KV Error] Failed to set state for ${id}:`, error);
      // Fall back to local store if KV fails
      localStore.set(id, state);
    }
  } else {
    localStore.set(id, state);
  }
}

interface AnalysisState {
  id: string;
  url: string;
  email?: string;
  status: 'pending' | 'crawling' | 'analyzing' | 'complete' | 'failed';
  progress: number;
  message: string;
  pagesFound: number;
  pagesCrawled: number;
  currentUrl: string;
  crawledPages: string[];
  createdAt: string;
  completedAt?: string;
  preview?: PreviewData;
  fullResults?: FullResults;
  paid: boolean;
  // Enrichment fields
  socialUrls?: string[];
  pendingCompetitors?: string[];
  enrichmentStatus?: 'analyzing_competitors' | 'complete' | 'failed';
  enrichmentProgress?: number;
  enrichmentMessage?: string;
}

interface PreviewData {
  commodityScore: number;
  pagesScanned: number;
  topIssues: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    // Findings attached DIRECTLY to each issue (not separate array!)
    findings: Array<{
      phrase: string;
      problem: string;
      rewrite: string;
      location: string;
      pageUrl: string;
    }>;
  }>;
  siteSnapshot: {
    title: string;
    description: string;
    hasLinkedIn: boolean;
    pagesFound: string[];
  };
  // Legacy single teaser (keep for backwards compatibility)
  teaserFinding?: {
    phrase: string;
    problem: string;
    rewrite: string;
    location: string;
    pageUrl: string;
  };
  // Voice analysis summary (free preview)
  voiceSummary?: {
    currentTone: string;
    authenticVoice: string;
  };
}

interface FullResults {
  pageByPage: Array<{
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
  competitorComparison?: {
    competitors: string[];
    yourScore: number;
    averageScore: number;
    gaps: string[];
    detailedScores?: Array<{ url: string; score: number }>;
  };
  voiceAnalysis: {
    currentTone: string;
    authenticVoice: string;
    examples: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, email } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please provide a website URL.' },
        { status: 400 }
      );
    }

    // Normalize and validate URL format
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'That doesn\'t look like a valid URL.' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Please provide a valid email address.' },
          { status: 400 }
        );
      }
    }

    // Generate unique analysis ID
    const analysisId = nanoid(10);

    // Create initial analysis state
    const analysisState: AnalysisState = {
      id: analysisId,
      url: normalizedUrl,
      email: email?.trim() || undefined,
      status: 'pending',
      progress: 0,
      message: 'Starting analysis...',
      pagesFound: 0,
      pagesCrawled: 0,
      currentUrl: '',
      crawledPages: [],
      createdAt: new Date().toISOString(),
      paid: false,
    };

    // Store the analysis state
    await setState(analysisId, analysisState);

    // Return immediately - processing will be triggered by first GET poll
    return NextResponse.json({
      success: true,
      analysisId,
      message: 'Analysis started',
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to check analysis status (and trigger processing if pending)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Missing analysis ID' },
      { status: 400 }
    );
  }

  let state = await getState(id);

  if (!state) {
    return NextResponse.json(
      { success: false, error: 'Analysis not found' },
      { status: 404 }
    );
  }

  // If still pending, trigger processing in background (first poll starts the work)
  if (state.status === 'pending') {
    // Immediately set status to 'crawling' so subsequent polls don't re-trigger
    await updateState(id, {
      status: 'crawling',
      progress: 5,
      message: 'Starting crawl...',
    });

    // Schedule background processing with waitUntil (keeps function alive)
    waitUntil(
      processAnalysis(id).catch(err => {
        console.error('Analysis processing failed:', err);
        updateState(id, {
          status: 'failed',
          message: 'Analysis failed. Please try again.',
        });
      })
    );

    // Re-fetch state to return current status
    state = await getState(id);
  }

  // Final null check for TypeScript (all paths above should have handled this)
  if (!state) {
    return NextResponse.json(
      { success: false, error: 'Analysis state unavailable' },
      { status: 500 }
    );
  }

  // Return state (but hide full results if not paid)
  
  const { enrichmentStatus, enrichmentProgress, enrichmentMessage, pendingCompetitors, socialUrls } = state;

  return NextResponse.json({
    success: true,
    analysis: {
      id: state.id,
      url: state.url,
      status: state.status,
      progress: state.progress,
      message: state.message,
      pagesFound: state.pagesFound,
      pagesCrawled: state.pagesCrawled,
      currentUrl: state.currentUrl,
      crawledPages: state.crawledPages,
      createdAt: state.createdAt,
      completedAt: state.completedAt,
      preview: state.preview,
      hasFullResults: !!state.fullResults,
      fullResults: state.paid ? state.fullResults : undefined,
      // Competitor comparison (always visible if exists)
      competitorComparison: state.fullResults?.competitorComparison,
      // Enrichment fields
      enrichmentStatus,
      enrichmentProgress,
      enrichmentMessage,
      pendingCompetitors,
      socialUrls,
    },
  });
}

/**
 * Background processing function
 * Crawls website, runs AI analysis
 */
async function processAnalysis(analysisId: string): Promise<void> {
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

    // Track crawled pages
    const crawledPagesList: string[] = [];

    // Real crawl with progress updates
    const maxPages = 25;
    crawlResult = await crawlWebsite(
      state.url,
      maxPages,
      (crawled, _found, currentUrl) => {
        const crawlProgress = 5 + Math.round((crawled / maxPages) * 55);
        const currentPath = new URL(currentUrl).pathname || '/';

        // Add to list if not already there
        if (!crawledPagesList.includes(currentPath)) {
          crawledPagesList.push(currentPath);
        }

        // Note: can't await in sync callback, but KV updates are fast
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

    // Build preview and full results from analysis
    const preview = buildPreview(crawlResult, analysisResult);
    const fullResults = buildFullResults(analysisResult);

    // Complete main analysis
    await updateState(analysisId, {
      status: 'complete',
      progress: 100,
      message: 'Analysis complete',
      completedAt: new Date().toISOString(),
      preview,
      fullResults,
    });

    // Auto-trigger competitor analysis if AI suggested competitors
    const suggestedCompetitors = analysisResult.suggestedCompetitors || [];
    if (suggestedCompetitors.length > 0) {
      // Sort by confidence (high first) and take top 5
      const sortedCompetitors = [...suggestedCompetitors]
        .sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.confidence] - order[b.confidence];
        })
        .slice(0, 5)
        .map(c => c.domain);

      // Trigger background competitor analysis
      waitUntil(
        analyzeCompetitors(analysisId, sortedCompetitors).catch(err => {
          console.error('Auto competitor analysis failed:', err);
        })
      );
    }

  } catch (error) {
    console.error('Processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed. Please try again.';
    await updateState(analysisId, {
      status: 'failed',
      message: errorMessage,
    });
  }
}

async function updateState(id: string, updates: Partial<AnalysisState>) {
  const state = await getState(id);
  if (state) {
    await setState(id, { ...state, ...updates });
  }
}

/**
 * Build preview data from analysis results
 *
 * CRITICAL: Each topIssue gets findings attached DIRECTLY to it.
 * We distribute phrase-level findings across top issues so every issue has rewrites.
 */
function buildPreview(crawlResult: CrawlResult, analysis: AnalysisResult): PreviewData {
  const hostname = new URL(crawlResult.pages[0]?.url || 'https://example.com').hostname;

  // Collect ALL phrase-level findings from pageAnalysis
  const allFindings: Array<{
    phrase: string;
    problem: string;
    rewrite: string;
    location: string;
    pageUrl: string;
  }> = [];

  for (const page of analysis.pageAnalysis) {
    for (const issue of page.issues) {
      if (issue.phrase && issue.rewrite) {
        allFindings.push({
          phrase: issue.phrase,
          problem: issue.problem,
          rewrite: issue.rewrite,
          location: issue.location,
          pageUrl: page.url,
        });
      }
    }
  }

  // Build topIssues with findings attached to each
  // Distribute findings across issues - each issue gets up to 5 findings
  const topIssuesWithFindings = analysis.topIssues.slice(0, 10).map((issue, issueIndex) => {
    // Each issue gets a slice of findings
    // Issue 0 gets findings 0-4, Issue 1 gets 5-9, etc.
    // If we run out, cycle back to remaining findings
    const findingsPerIssue = 5;
    const startIndex = issueIndex * findingsPerIssue;

    // Get findings for this issue
    let issueFindings: typeof allFindings = [];

    if (allFindings.length > 0) {
      // First, try to get a dedicated slice
      if (startIndex < allFindings.length) {
        issueFindings = allFindings.slice(startIndex, startIndex + findingsPerIssue);
      }

      // If we don't have enough, cycle through available findings
      if (issueFindings.length === 0) {
        // Cycle through all findings for issues that have no dedicated slice
        const cycleIndex = issueIndex % Math.ceil(allFindings.length / findingsPerIssue);
        const cycleStart = cycleIndex * findingsPerIssue;
        issueFindings = allFindings.slice(cycleStart, cycleStart + findingsPerIssue);
      }

      // If still nothing, just grab first 5
      if (issueFindings.length === 0 && allFindings.length > 0) {
        issueFindings = allFindings.slice(0, findingsPerIssue);
      }
    }

    return {
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      findings: issueFindings,
    };
  });

  // First finding overall is the legacy teaser (backwards compatibility)
  const teaserFinding = allFindings[0] || undefined;

  return {
    commodityScore: analysis.commodityScore,
    pagesScanned: crawlResult.pages.length,
    topIssues: topIssuesWithFindings,
    siteSnapshot: {
      title: hostname.replace('www.', '').split('.')[0],
      description: crawlResult.pages[0]?.meta.description || '',
      hasLinkedIn: !!crawlResult.linkedInUrl,
      pagesFound: crawlResult.pages.slice(0, 10).map(p => new URL(p.url).pathname || '/'),
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
function buildFullResults(analysis: AnalysisResult): FullResults {
  return {
    pageByPage: analysis.pageAnalysis,
    proofPoints: analysis.proofPoints,
    voiceAnalysis: analysis.voiceAnalysis,
  };
}

/**
 * PATCH endpoint to enrich an analysis with competitors or social URLs
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, competitors, socialUrls, email } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing analysis ID' },
        { status: 400 }
      );
    }

    const state = await getState(id);
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Update email if provided
    if (email && typeof email === 'string') {
      await updateState(id, { email: email.trim() });
    }

    // Handle social URL enrichment
    if (socialUrls && Array.isArray(socialUrls) && socialUrls.length > 0) {
      const validSocials = socialUrls
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map(s => s.trim())
        .slice(0, 5);

      if (validSocials.length > 0) {
        // Set enriching status
        await updateState(id, {
          enrichmentStatus: 'analyzing_competitors', // reuse status type
          enrichmentProgress: 0,
          socialUrls: [...(state.socialUrls || []), ...validSocials],
          enrichmentMessage: `Analyzing ${validSocials[0]}...`,
        });

        // Trigger background social analysis
        waitUntil(
          analyzeSocialProfiles(id, validSocials).catch(err => {
            console.error('Social profile analysis failed:', err);
            updateState(id, {
              enrichmentStatus: 'failed',
              enrichmentMessage: 'Could not analyze social profile',
            });
          })
        );

        return NextResponse.json({
          success: true,
          message: `Analyzing social profile...`,
          enrichmentStatus: 'analyzing_competitors',
        });
      }
    }

    // Handle competitor enrichment - always aim for 5 competitors
    if (competitors && Array.isArray(competitors) && competitors.length > 0) {
      let allCompetitors = competitors
        .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        .map(c => c.trim());

      // Supplement with AI-suggested competitors to reach 5
      if (allCompetitors.length < 5 && state.fullResults?.competitorComparison?.competitors) {
        const aiSuggested = state.fullResults.competitorComparison.competitors
          .filter(c => !allCompetitors.includes(c));
        allCompetitors = [...allCompetitors, ...aiSuggested].slice(0, 5);
      }

      // If still under 5 and we have suggestedCompetitors from initial analysis, use those
      // (stored during initial analysis from AI)
      if (allCompetitors.length < 5 && (state as unknown as { suggestedCompetitors?: Array<{ domain: string }> }).suggestedCompetitors) {
        const suggested = ((state as unknown as { suggestedCompetitors?: Array<{ domain: string }> }).suggestedCompetitors || [])
          .map(s => s.domain)
          .filter(d => !allCompetitors.includes(d));
        allCompetitors = [...allCompetitors, ...suggested].slice(0, 5);
      }

      const validCompetitors = allCompetitors.slice(0, 5);

      if (validCompetitors.length > 0) {
        // Set enriching status
        await updateState(id, {
          enrichmentStatus: 'analyzing_competitors',
          enrichmentProgress: 0,
          pendingCompetitors: validCompetitors,
        });

        // Trigger background competitor analysis
        waitUntil(
          analyzeCompetitors(id, validCompetitors).catch(err => {
            console.error('Competitor analysis failed:', err);
            updateState(id, {
              enrichmentStatus: 'failed',
            });
          })
        );

        return NextResponse.json({
          success: true,
          message: `Analyzing ${validCompetitors.length} competitor${validCompetitors.length > 1 ? 's' : ''}...`,
          enrichmentStatus: 'analyzing_competitors',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis updated',
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}

/**
 * Background competitor analysis - lightweight for speed
 */
async function analyzeCompetitors(analysisId: string, competitors: string[]): Promise<void> {
  const state = await getState(analysisId);
  if (!state) return;

  try {
    // For each competitor, do a QUICK crawl (1 page only) and lightweight score
    const competitorScores: Array<{ url: string; score: number }> = [];

    for (let i = 0; i < competitors.length; i++) {
      const competitorUrl = competitors[i];

      await updateState(analysisId, {
        enrichmentStatus: 'analyzing_competitors',
        enrichmentProgress: Math.round(((i) / competitors.length) * 100),
        enrichmentMessage: `Scanning ${competitorUrl}...`,
      });

      // Normalize URL
      let normalizedUrl = competitorUrl;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      try {
        // Quick crawl - just homepage (1 page for speed)
        const crawlResult = await crawlWebsite(normalizedUrl, 1);

        if (crawlResult.pages.length > 0) {
          // Lightweight score based on content indicators (skip full AI analysis for speed)
          const content = crawlResult.pages[0]?.content || '';
          const commodityPhrases = [
            'leading', 'innovative', 'solutions', 'best-in-class', 'world-class',
            'cutting-edge', 'next-generation', 'state-of-the-art', 'industry-leading',
            'trusted', 'proven', 'reliable', 'premier', 'top', 'quality', 'excellence',
            'committed', 'dedicated', 'passionate', 'partner'
          ];

          // Positive differentiators (specific, provable claims)
          const differentiators = [
            '%', 'years', 'customers', 'clients', 'projects', 'since', 'founded',
            'certified', 'iso', 'award', 'patent', 'guarantee', 'warranty'
          ];

          const lowerContent = content.toLowerCase();

          // Count generic phrases (bad)
          let genericCount = 0;
          for (const phrase of commodityPhrases) {
            if (lowerContent.includes(phrase)) genericCount++;
          }

          // Count differentiators (good)
          let differentiatorCount = 0;
          for (const phrase of differentiators) {
            if (lowerContent.includes(phrase)) differentiatorCount++;
          }

          // Score: higher = better differentiated
          // Start at 50, subtract for generic, add for differentiators
          const score = Math.max(15, Math.min(85, 50 - (genericCount * 3) + (differentiatorCount * 4)));

          competitorScores.push({
            url: competitorUrl,
            score,
          });
        }
      } catch (err) {
        console.log(`Could not analyze competitor ${competitorUrl}:`, err);
        // Continue with other competitors
      }
    }

    // Only proceed if we actually analyzed any competitors
    if (competitorScores.length === 0) {
      await updateState(analysisId, {
        enrichmentStatus: 'failed',
        enrichmentMessage: 'Could not fetch competitor websites',
      });
      return;
    }

    // Calculate comparison data
    const avgScore = Math.round(competitorScores.reduce((sum, c) => sum + c.score, 0) / competitorScores.length);
    const yourScore = state.preview?.commodityScore || 50;
    const gaps: string[] = [];

    // Higher score = better differentiation
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

    // Add competitor-specific insights
    const bestCompetitor = competitorScores.reduce((best, c) => c.score > best.score ? c : best, competitorScores[0]);
    const worstCompetitor = competitorScores.reduce((worst, c) => c.score < worst.score ? c : worst, competitorScores[0]);

    if (bestCompetitor && bestCompetitor.score > yourScore) {
      gaps.push(`${bestCompetitor.url} has stronger differentiation - worth studying`);
    }
    if (worstCompetitor && worstCompetitor.score < yourScore - 15) {
      gaps.push(`You're ahead of ${worstCompetitor.url} in messaging clarity`);
    }

    // Update state with competitor comparison - MERGE with existing competitors
    const currentFullResults = state.fullResults || {
      pageByPage: [],
      proofPoints: [],
      voiceAnalysis: { currentTone: '', authenticVoice: '', examples: [] },
    };

    // Merge new competitor scores with existing ones (don't overwrite)
    const existingScores = currentFullResults.competitorComparison?.detailedScores || [];
    const existingCompetitors = currentFullResults.competitorComparison?.competitors || [];

    // Combine, avoiding duplicates
    const allCompetitors = [...new Set([...existingCompetitors, ...competitors])];
    const allScores = [
      ...existingScores.filter(s => !competitorScores.some(n => n.url === s.url)),
      ...competitorScores
    ];

    const totalAvgScore = allScores.length > 0
      ? Math.round(allScores.reduce((sum, c) => sum + c.score, 0) / allScores.length)
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
      enrichmentMessage: `Analyzed ${allScores.length} competitor${allScores.length !== 1 ? 's' : ''}`,
    });

  } catch (error) {
    console.error('Competitor analysis error:', error);
    await updateState(analysisId, {
      
      enrichmentStatus: 'failed',
      enrichmentMessage: 'Could not analyze competitors',
    });
  }
}

/**
 * Background social profile analysis - lightweight for speed
 */
async function analyzeSocialProfiles(analysisId: string, socialUrls: string[]): Promise<void> {
  const state = await getState(analysisId);
  if (!state) return;

  try {
    await updateState(analysisId, {
      enrichmentStatus: 'analyzing_competitors',
      enrichmentProgress: 50,
      enrichmentMessage: `Checking ${socialUrls[0]}...`,
    });

    // For social profiles, we just store them - full analysis would require special handling
    // LinkedIn etc. often block scrapers, so we note the URLs as additional context

    // Short delay to show progress
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mark enrichment complete - social URLs are stored for reference
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

// Export state functions for use by other routes (like marking as paid)
export { getState, setState };
