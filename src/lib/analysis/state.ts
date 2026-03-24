/**
 * Analysis state management
 *
 * Provides getState / setState / updateState backed by Vercel KV in production
 * and an in-memory Map during local development.
 */

import { kv } from '@vercel/kv';
import { logger } from '@shared/lib/logger';

// Use Vercel KV if available, otherwise fall back to in-memory (for local dev)
export const useKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
export const localStore = new Map<string, AnalysisState>();

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface AnalysisState {
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

export interface PreviewData {
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
    h1?: string;
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

export interface FullResults {
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

// ---------------------------------------------------------------------------
// State access
// ---------------------------------------------------------------------------

export async function getState(id: string): Promise<AnalysisState | null> {
  if (useKV) {
    try {
      return await kv.get<AnalysisState>(`analysis:${id}`);
    } catch (error) {
      logger.error(`Failed to get state for ${id}`, { tool: 'website-audit', fn: 'getState', err: String(error) });
      return localStore.get(id) || null;
    }
  }
  return localStore.get(id) || null;
}

export async function setState(id: string, state: AnalysisState): Promise<void> {
  if (useKV) {
    try {
      // Store with 48 hour expiry — long enough for a customer to complete payment and return
      await kv.set(`analysis:${id}`, state, { ex: 172800 });
    } catch (error) {
      logger.error(`Failed to set state for ${id}`, { tool: 'website-audit', fn: 'setState', err: String(error) });
      localStore.set(id, state);
    }
  } else {
    localStore.set(id, state);
  }
}

export async function updateState(id: string, updates: Partial<AnalysisState>): Promise<void> {
  const state = await getState(id);
  if (state) {
    await setState(id, { ...state, ...updates });
  }
}
