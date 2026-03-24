/**
 * Single source of truth for all tool pricing.
 * Bible Rule V: one canonical store per data domain.
 *
 * To update a price or promo code, change it here only.
 *
 * Why: checkout routes across tools were hardcoding TOOL_PRICE independently, creating drift risk. Centralized here per Bible Rule V.
 */

export interface ToolPricing {
  /** Base price in dollars */
  base: number
  promo: {
    code: string
    discountPct: number
    /** Discounted price in dollars */
    discounted: number
  }
}

export const PRICING: Record<string, ToolPricing> = {
  'commodity-test': {
    base: 97,
    promo: {
      code: 'COMMODITY30',
      discountPct: 30,
      discounted: Math.round(97 * 0.7),
    },
  },
  'website-audit': {
    base: 400,
    promo: {
      code: 'LAUNCH30',
      discountPct: 30,
      discounted: Math.round(400 * 0.7),
    },
  },
  'risk-translator': {
    base: 97,
    promo: {
      code: 'LAUNCH30',
      discountPct: 30,
      discounted: Math.round(97 * 0.7),
    },
  },
  'proposal-analyzer': {
    base: 97,
    promo: {
      code: 'COMMODITY30',
      discountPct: 30,
      discounted: Math.round(97 * 0.7),
    },
  },
  'case-study-extractor': {
    base: 147,
    promo: {
      code: 'LAUNCH30',
      discountPct: 30,
      discounted: Math.round(147 * 0.7),
    },
  },
}

export type ToolId = keyof typeof PRICING

/** Format a tool's base price for display, e.g. "$400" */
export function displayPrice(tool: string): string {
  return `$${PRICING[tool]?.base || 0}`
}
