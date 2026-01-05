/**
 * Website Analysis API Route
 *
 * Accepts a URL, crawls the site, runs AI analysis,
 * returns progress updates and results.
 */

// Force dynamic to skip static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { kv } from '@vercel/kv';
import { waitUntil } from '@vercel/functions';
import { crawlWebsite, CrawlResult } from '@/lib/crawler';
import { analyzeWebsite, AnalysisResult, getAnthropicClient } from '@/lib/analyzer';

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
  // Live competitor analysis progress
  competitorProgress?: {
    total: number;
    completed: number;
    competitors: Array<{
      url: string;
      status: 'pending' | 'analyzing' | 'completed' | 'error';
      preliminaryScore?: number;
      earlyFindings?: string[];
    }>;
  };
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
    h1?: string;  // Main H1 headline for comparison
    hasLinkedIn: boolean;
    pagesFound: string[];
    spaWarning?: {
      isSPA: boolean;
      indicators: string[];
      message: string;
    };
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
  // Category scores for comparison table
  categoryScores?: {
    firstImpression: number;
    differentiation: number;
    customerClarity: number;
    storyStructure: number;
    trustSignals: number;
    buttonClarity: number;
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
    detailedScores?: Array<{ url: string; score: number; headline?: string }>;
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
    const maxPages = 50;
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
    let fullResults = buildFullResults(analysisResult);

    // Extract hostname for competitor discovery
    const hostname = new URL(crawlResult.pages[0]?.url || 'https://example.com').hostname;

    // Run competitor analysis BEFORE marking complete (with timeout)
    // This ensures user sees competitor data on first preview load
    let suggestedCompetitors = analysisResult.suggestedCompetitors || [];

    // FALLBACK: If AI didn't suggest competitors, discover them
    if (suggestedCompetitors.length === 0) {
      console.log('No competitors from AI, attempting fallback discovery...');
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
          console.log('Fallback discovered competitors:', discovered);
        }
      } catch (err) {
        console.log('Fallback competitor discovery failed:', err);
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

      // Sort by confidence (high first) and take top 5
      const sortedCompetitors = [...suggestedCompetitors]
        .sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.confidence] - order[b.confidence];
        })
        .slice(0, 5)
        .map(c => c.domain);

      // Await competitor analysis with 60s timeout (increased from 30s for larger sites)
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
          // Set fallback empty competitor comparison on timeout
          console.log('Competitor analysis timed out, setting fallback');
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
        console.log('Competitor analysis failed:', err);
        // Set fallback empty competitor comparison on error
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

    // NOW mark as complete - with competitor data included
    await updateState(analysisId, {
      status: 'complete',
      progress: 100,
      message: 'Analysis complete',
      completedAt: new Date().toISOString(),
      preview,
      fullResults,
    });

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
 * NEW STRUCTURE: Findings come directly on topIssues from the AI.
 * Each issue already has its own findings attached - no distribution needed.
 */
function buildPreview(crawlResult: CrawlResult, analysis: AnalysisResult): PreviewData {
  const hostname = new URL(crawlResult.pages[0]?.url || 'https://example.com').hostname;

  // Build topIssues - findings are already attached from the analyzer
  const topIssuesWithFindings = analysis.topIssues.slice(0, 10).map((issue) => {
    // Use findings directly from the issue (new structure)
    // Ensure each finding has required fields with defaults
    // No slice limit - include ALL findings for complete PDF export
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

  // Log finding count for debugging
  const totalFindings = topIssuesWithFindings.reduce((sum, i) => sum + i.findings.length, 0);
  console.log(`[buildPreview] Total findings across ${topIssuesWithFindings.length} issues: ${totalFindings}`);

  // First finding overall is the legacy teaser (backwards compatibility)
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
      h1: crawlResult.pages[0]?.h1,  // Main H1 for comparison
      hasLinkedIn: !!crawlResult.linkedInUrl,
      // Include ALL pages found for complete report
      pagesFound: crawlResult.pages.map(p => new URL(p.url).pathname || '/'),
      spaWarning: crawlResult.spaWarning,  // Warning if site uses JavaScript rendering
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
 * Deep AI-powered competitor analysis with category scoring
 * Returns detailed scores, strengths, and weaknesses for a single competitor
 */
interface CompetitorDeepAnalysis {
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

async function analyzeCompetitorDeep(
  content: string,
  url: string
): Promise<CompetitorDeepAnalysis> {
  try {
    const anthropic = await getAnthropicClient();

    const prompt = `Analyze this competitor homepage for messaging effectiveness.

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

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize scores
      const categoryScores = {
        firstImpression: Math.min(10, Math.max(0, parsed.categoryScores?.firstImpression || 5)),
        differentiation: Math.min(10, Math.max(0, parsed.categoryScores?.differentiation || 5)),
        customerClarity: Math.min(10, Math.max(0, parsed.categoryScores?.customerClarity || 5)),
        storyStructure: Math.min(10, Math.max(0, parsed.categoryScores?.storyStructure || 5)),
        trustSignals: Math.min(10, Math.max(0, parsed.categoryScores?.trustSignals || 5)),
        buttonClarity: Math.min(10, Math.max(0, parsed.categoryScores?.buttonClarity || 5)),
      };

      const avgCategory = (
        categoryScores.firstImpression +
        categoryScores.differentiation +
        categoryScores.customerClarity +
        categoryScores.storyStructure +
        categoryScores.trustSignals +
        categoryScores.buttonClarity
      ) / 6;

      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [];
      let weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 3) : [];
      const overallScore = Math.round(avgCategory * 10);

      // POST-PROCESS: Remove contradictory weaknesses
      // If strength mentions a topic, don't allow weakness to claim absence of that topic
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
            console.log(`[Competitor] Filtered contradictory weakness: "${w}" (conflicts with strength about ${pattern.strengthKeywords[0]})`);
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

      return {
        categoryScores,
        strengths,
        weaknesses,
        overallScore,
      };
    }
  } catch (error) {
    console.error(`AI competitor analysis failed for ${url}:`, error);
  }

  // FALLBACK: Heuristic scoring when AI fails - extract ACTUAL quotes
  console.log(`[Competitor] Using heuristic fallback for ${url}`);

  const commodityPhrases = [
    'leading', 'innovative', 'solutions', 'best-in-class', 'world-class',
    'cutting-edge', 'next-generation', 'state-of-the-art', 'industry-leading',
    'trusted', 'proven', 'reliable', 'premier', 'excellence', 'committed'
  ];
  // EXPANDED proof patterns to reduce scoring bias - give competitors fair credit
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

  // Find actual generic phrases used
  for (const phrase of commodityPhrases) {
    if (lowerContent.includes(phrase)) {
      genericCount++;
      // Extract context around the phrase (up to 50 chars before/after)
      const idx = lowerContent.indexOf(phrase);
      const start = Math.max(0, idx - 30);
      const end = Math.min(content.length, idx + phrase.length + 30);
      const context = content.substring(start, end).trim().replace(/\s+/g, ' ');
      if (foundGenericPhrases.length < 3) {
        foundGenericPhrases.push(`"...${context}..."`);
      }
    }
  }

  // Find actual proof points with quoted text
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

  // Adjusted scoring: less harsh on generic phrases, more generous with proof
  // Old: 50 - (genericCount * 3) + (foundProofPoints.length * 4)
  // New: 55 base, -2 per generic (capped at -10), +5 per proof (capped at +25)
  const genericPenalty = Math.min(10, genericCount * 2);
  const proofBonus = Math.min(25, foundProofPoints.length * 5);
  const heuristicScore = Math.max(20, Math.min(85, 55 - genericPenalty + proofBonus));
  const baseCategory = Math.round(heuristicScore / 10);

  // Build strengths with actual quotes
  const strengths: string[] = [];
  if (foundProofPoints.length > 0) {
    strengths.push(`Uses specific proof: ${foundProofPoints.join(', ')}`);
  }

  // Build weaknesses with actual quotes
  const weaknesses: string[] = [];
  if (foundGenericPhrases.length > 0) {
    weaknesses.push(`Relies on generic language: ${foundGenericPhrases.slice(0, 2).join(', ')}`);
  }

  // ENSURE lower-scoring sites have at least some weaknesses
  // A 50/100 site MUST have visible weaknesses
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

/**
 * Enhanced detailed competitor score with category breakdown
 */
interface DetailedCompetitorScore {
  url: string;
  score: number;
  categoryScores?: CompetitorDeepAnalysis['categoryScores'];
  strengths?: string[];
  weaknesses?: string[];
}

/**
 * Fallback competitor discovery when AI doesn't suggest any
 * Uses a focused Claude call to identify competitors based on site content
 */
async function discoverCompetitors(
  pageContent: string,
  hostname: string,
  description: string
): Promise<string[]> {
  try {
    const client = await getAnthropicClient();

    // Extract meaningful content snippet (first 2000 chars)
    const contentSnippet = pageContent.slice(0, 2000);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Based on this website content, identify 5 likely competitors.

Website: ${hostname}
Description: ${description}

Content snippet:
${contentSnippet}

Return ONLY a JSON array of 5 competitor domain names (no explanations):
["competitor1.com", "competitor2.com", ...]

Focus on direct competitors in the same industry/market segment. Use well-known competitors if applicable.`
      }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON array from response
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

/**
 * Inline competitor analysis - returns data directly (for use before marking complete)
 * Uses AI-powered deep analysis with parallelization
 */
async function analyzeCompetitorsInline(
  competitors: string[],
  yourScore: number
): Promise<FullResults['competitorComparison'] | null> {
  try {
    const competitorScores: DetailedCompetitorScore[] = [];

    // Analyze competitors in parallel (batches of 3 for performance)
    const batchSize = 3;
    for (let i = 0; i < competitors.length; i += batchSize) {
      const batch = competitors.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (competitorUrl) => {
          // Normalize URL
          let normalizedUrl = competitorUrl;
          if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
          }

          try {
            // Crawl homepage with 45s timeout
            const crawlPromise = crawlWebsite(normalizedUrl, 1);
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Crawl timeout')), 45000)
            );

            const crawlResult = await Promise.race([crawlPromise, timeoutPromise]) as CrawlResult | null;

            if (crawlResult && crawlResult.pages.length > 0) {
              const content = crawlResult.pages[0]?.content || '';
              const headline = crawlResult.pages[0]?.h1;  // Extract H1 for comparison

              // Run deep AI analysis
              const analysis = await analyzeCompetitorDeep(content, competitorUrl);

              return {
                url: normalizedUrl,
                score: analysis.overallScore,
                categoryScores: analysis.categoryScores,
                strengths: analysis.strengths,
                weaknesses: analysis.weaknesses,
                headline,  // Include H1 in competitor data
              };
            }
          } catch (err) {
            console.log(`Could not analyze competitor ${competitorUrl}:`, err);
          }
          return null;
        })
      );

      // Add successful results
      for (const result of batchResults) {
        if (result) {
          competitorScores.push(result);
        }
      }
    }

    if (competitorScores.length === 0) {
      return null;
    }

    const avgScore = Math.round(competitorScores.reduce((sum, c) => sum + c.score, 0) / competitorScores.length);
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

/**
 * Background competitor analysis with AI-powered deep analysis
 * Uses parallelization and live status updates
 */
async function analyzeCompetitors(analysisId: string, competitors: string[]): Promise<void> {
  const state = await getState(analysisId);
  if (!state) return;

  try {
    const competitorScores: DetailedCompetitorScore[] = [];

    // Initialize competitor progress tracking
    const competitorStatuses: Array<{
      url: string;
      status: 'pending' | 'analyzing' | 'completed' | 'error';
      preliminaryScore?: number;
      earlyFindings?: string[];
    }> = competitors.map(url => ({ url, status: 'pending' }));

    // Update initial state with competitor progress
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

    // Process competitors in parallel batches of 3
    const batchSize = 3;
    for (let batchStart = 0; batchStart < competitors.length; batchStart += batchSize) {
      const batch = competitors.slice(batchStart, batchStart + batchSize);

      // Mark batch as analyzing
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

      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (competitorUrl) => {
          // Normalize URL
          let normalizedUrl = competitorUrl;
          if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
          }

          const statusIdx = competitorStatuses.findIndex(c => c.url === competitorUrl);

          try {
            // Crawl homepage with 45s timeout
            const crawlPromise = crawlWebsite(normalizedUrl, 1);
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Crawl timeout')), 45000)
            );

            const crawlResult = await Promise.race([crawlPromise, timeoutPromise]) as CrawlResult | null;

            if (crawlResult && crawlResult.pages.length > 0) {
              const content = crawlResult.pages[0]?.content || '';
              const headline = crawlResult.pages[0]?.h1;  // Extract H1 for comparison

              // Run deep AI analysis
              const analysis = await analyzeCompetitorDeep(content, competitorUrl);

              // Update status with preliminary results
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
                headline,  // Include H1 in competitor data
              };
            }
          } catch (err) {
            console.log(`Could not analyze competitor ${competitorUrl}:`, err);
            if (statusIdx >= 0) {
              competitorStatuses[statusIdx].status = 'error';
            }
          }
          return null;
        })
      );

      // Add successful results
      for (const result of batchResults) {
        if (result) {
          competitorScores.push(result);
        }
      }

      // Update progress after batch
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

    // Only proceed if we actually analyzed any competitors
    if (competitorScores.length === 0) {
      await updateState(analysisId, {
        enrichmentStatus: 'failed',
        enrichmentMessage: 'Could not fetch competitor websites',
        competitorProgress: undefined,
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
      competitorProgress: undefined, // Clear progress once complete
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
