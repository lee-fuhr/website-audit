/**
 * Debug endpoint to test AI connectivity in production
 */

// Force dynamic to skip static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    version: '0.8.7',
  };

  // Check env vars (safely)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  results.envCheck = {
    ANTHROPIC_API_KEY_present: !!apiKey,
    ANTHROPIC_API_KEY_length: apiKey?.length || 0,
    ANTHROPIC_API_KEY_prefix: apiKey?.substring(0, 10) || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
  };

  // Try to make a simple AI call
  if (apiKey) {
    try {
      // Regular dynamic import - force-dynamic prevents build-time evaluation
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey });

      const startTime = Date.now();
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say "AI is working" in 5 words or less.' }]
      });
      const duration = Date.now() - startTime;

      results.aiTest = {
        success: true,
        duration_ms: duration,
        response: response.content[0].type === 'text' ? response.content[0].text : 'non-text response',
        model: response.model,
        usage: response.usage,
      };
    } catch (error) {
      results.aiTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error as object), 2),
      };
    }
  } else {
    results.aiTest = {
      success: false,
      error: 'ANTHROPIC_API_KEY not set',
    };
  }

  return NextResponse.json(results);
}
