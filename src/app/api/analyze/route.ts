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
import {
  getState,
  setState,
  updateState,
  useKV,
  AnalysisState,
} from '@/lib/analysis/state';
import {
  analyzeCompetitors,
  analyzeSocialProfiles,
} from '@/lib/analysis/enrichment';
import { processAnalysis } from '@/lib/analysis/orchestrator';
import { logger } from '@shared/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 2 analyses per IP per hour
    if (useKV) {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
      const hourKey = `wa:rate:${clientIP}:${new Date().toISOString().slice(0, 13)}`; // hour bucket
      const hourCount = await kv.incr(hourKey);
      await kv.expire(hourKey, 3600);
      if (hourCount > 2) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again in an hour.' },
          { status: 429 }
        );
      }
    }

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

    await setState(analysisId, analysisState);

    // Return immediately - processing will be triggered by first GET poll
    return NextResponse.json({
      success: true,
      analysisId,
      message: 'Analysis started',
    });
  } catch (error) {
    logger.error('Analysis error', { tool: 'website-audit', fn: 'POST /api/analyze', error: error instanceof Error ? error.message : String(error) });
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
    await updateState(id, {
      status: 'crawling',
      progress: 5,
      message: 'Starting crawl...',
    });

    waitUntil(
      processAnalysis(id).catch(err => {
        logger.error('Analysis processing failed', { tool: 'website-audit', fn: 'GET /api/analyze processAnalysis', error: err instanceof Error ? err.message : String(err) });
        updateState(id, {
          status: 'failed',
          message: 'Analysis failed. Please try again.',
        });
      })
    );

    // Re-fetch state to return current status
    state = await getState(id);
  }

  // Final null check for TypeScript
  if (!state) {
    return NextResponse.json(
      { success: false, error: 'Analysis state unavailable' },
      { status: 500 }
    );
  }

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
      paid: state.paid,
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
        await updateState(id, {
          enrichmentStatus: 'analyzing_competitors',
          enrichmentProgress: 0,
          socialUrls: [...(state.socialUrls || []), ...validSocials],
          enrichmentMessage: `Analyzing ${validSocials[0]}...`,
        });

        waitUntil(
          analyzeSocialProfiles(id, validSocials).catch(err => {
            logger.error('Social profile analysis failed', { tool: 'website-audit', fn: 'PATCH /api/analyze', error: err instanceof Error ? err.message : String(err) });
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

      const validCompetitors = allCompetitors.slice(0, 5);

      if (validCompetitors.length > 0) {
        await updateState(id, {
          enrichmentStatus: 'analyzing_competitors',
          enrichmentProgress: 0,
          pendingCompetitors: validCompetitors,
        });

        waitUntil(
          analyzeCompetitors(id, validCompetitors).catch(err => {
            logger.error('Competitor analysis failed', { tool: 'website-audit', fn: 'PATCH /api/analyze', error: err instanceof Error ? err.message : String(err) });
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
    logger.error('Enrichment error', { tool: 'website-audit', fn: 'PATCH /api/analyze', error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Something went wrong.' },
      { status: 500 }
    );
  }
}

// Export state functions for use by other routes (like marking as paid)
export { getState, setState };
