# Website Messaging Audit - Product Requirements Document

**Last updated:** 2025-12-31
**Version:** 1.0.0
**Status:** Production (Primary reference implementation)

---

## Overview

The $400 website messaging audit that crawls every page of a company's website, finds generic phrases, and provides copy-paste replacements built from proof points buried in the site. The closest thing to a $30k messaging consultant. Target customers are manufacturers, contractors, and service businesses at $2M-10M revenue.

---

## Core value proposition

> "Your website has gold buried in it — project counts, tolerances, on-time stats. The problem? It's hidden in paragraph 3 of your About page while your homepage says 'quality service.'"

The audit finds specific proof points already on the customer's site and shows exactly how to use them. Not generic marketing advice — copy-paste rewrites built from THEIR numbers.

---

## User flow

```
Homepage → Enter URL → Processing (1-2 min) → Results ready reveal → Free preview → Unlock ($400) → Full audit
```

### States

1. **Homepage** (`/`) - Enter website URL, see value prop, pricing calculator
2. **Processing** (`/processing?id=X`) - Show scan progress, optional fields (LinkedIn, email), "Results ready!" reveal
3. **Preview** (`/preview/[id]`) - Free preview with:
   - Real commodity score
   - Top 5 issues (from AI analysis)
   - One real teaser rewrite from their site
   - Voice analysis summary
   - Locked sections for full content
4. **Paid results** (`/results/[id]`) - Full unlocked audit (after Stripe payment)
5. **Sample** (`/sample`) - Demo of what a full paid report looks like

---

## Design rules (MUST FOLLOW)

These rules apply to ALL Lee Fuhr Inc tools. Enforce everywhere.

### Content gating

| View | Free preview | Paid |
|------|--------------|------|
| **Overview** | FULLY FREE - no gating whatsoever | Same as preview |
| Your message | Locked content | Full content |
| Your audience | Locked content | Full content |
| Building trust | Locked content | Full content |
| Copy to use | Locked content | Full content |
| Competitors | Full content (if available) | Same |

**CRITICAL:** The Overview page looks IDENTICAL on preview and paid. We give away good actionable stuff.

### Free preview content (MANDATORY)

The free preview MUST show REAL VALUE, not generic advice. This is non-negotiable.

**Overview page must include:**
- Real commodity score with breakdown
- ALL top priority issues with ACTUAL COPY SUGGESTIONS (before/after rewrites)
- Voice analysis summary
- Copy buttons on all suggested rewrites

**First impression clarity section must include:**
- Full methodology explanation
- ACTUAL COPY SUGGESTIONS with before/after (not "Replace with specific proof")
- Real findings from their site

**What "copy suggestion" means:**
- ❌ WRONG: "Replace with specific proof or unique approach"
- ❌ WRONG: "Use more specific language"
- ✓ RIGHT: "We're driven by precision - delivering ±0.001" tolerance on every part"
- ✓ RIGHT: "47 machinists. Average tenure: 12 years. When you need parts right the first time, that experience matters."

The AI analyzer MUST generate actual copy, not generic instructions. If it can't find specific proof points, it should craft copy based on what's typical for the industry.

### Honesty in marketing claims

**NEVER claim features that don't exist:**
- Don't say "Self-implementation guide" if there's no guide
- Don't say "15-20 rewrites" if we only generate 5
- Every feature claimed in CTAs must actually be delivered

### Results page completeness

The results page (`/preview/[id]` and `/results/[id]`) should NEVER show "in progress" states. All analysis must be complete before showing results. If competitor analysis isn't ready, don't show a spinner - show nothing or "No competitor data" static message.

### Typography

- **No em dashes (—)** - Use " - " (space-hyphen-space) or rewrite the sentence
- **Quotes are for actual quotes** - Don't use quotation marks for directions, instructions, or emphasis. Only for actual quoted speech/text.

### Icons and bullets

- **Use Streamline icons** - Not text bullets, not emoji bullets
- **Consistency** - Same icon style (1px stroke, rounded caps) everywhere
- **Arrow icon** - Use simple arrow (`→`) or chevron for list items instead of bullets

### Interactive elements

- **Clickable cards** - If a card/div is clickable, the ENTIRE card should be clickable, not just the text inside
- **Hover states** - All clickable elements need hover states
- **Focus states** - Keyboard navigation must work

### Version display

- Version number in footer of ALL pages (landing, processing, preview, results, sample)
- Format: `v0.X.Y` in small monospace text

---

## Design decisions

### Layout: Side nav

All audit result pages use a **dark side nav** on the left with:
- Company name and hostname at top
- View navigation: Overview, Your message, Your audience, Building trust, Copy to use
- Locked indicators (🔒) on preview
- Download PDF button (locked on preview)

### Color: Commodity score

| Score | Color | Label |
|-------|-------|-------|
| 0-40 | Green | Well differentiated |
| 41-60 | Yellow | Needs work |
| 61-80 | Orange | Highly generic |
| 81-100 | Red | Commodity territory |

### Rewrites display

Always show before/after in two-column layout:
- Left: Red background, "❌ BEFORE", original phrase, location
- Right: Green background, "✓ AFTER", suggested rewrite

---

## Technical architecture

### Current state (tech debt)

Currently have separate page components:
- `/src/app/sample/page.tsx` - Hardcoded sample data, full layout
- `/src/app/preview/[id]/page.tsx` - Real data, locked layout
- (future) `/src/app/results/[id]/page.tsx` - Real data, unlocked layout

**Problem:** Layout is duplicated, risking drift between pages.

### Target state (TODO)

Refactor to shared component:

```typescript
// src/components/AuditResults.tsx
interface AuditResultsProps {
  data: AuditData
  isLocked: boolean
  isSample: boolean
}

function AuditResults({ data, isLocked, isSample }: AuditResultsProps) {
  // Single source of truth for layout
  // Render locked placeholders when isLocked
  // Show sample banner when isSample
}
```

Then each page just wraps the component:
- `/preview/[id]` → `<AuditResults data={...} isLocked={true} isSample={false} />`
- `/results/[id]` → `<AuditResults data={...} isLocked={false} isSample={false} />`
- `/sample` → `<AuditResults data={sampleData} isLocked={false} isSample={true} />`

### Data flow

```
POST /api/analyze (url) → Returns analysisId
GET /api/analyze?id=X → Returns analysis state with:
  - preview: { commodityScore, topIssues, teaserFinding, voiceSummary, siteSnapshot }
  - fullResults: Only returned if paid=true
```

### Storage

- **Vercel KV (Redis)** - Production state storage
- **In-memory Map** - Local dev fallback
- **1 hour TTL** - Analysis expires after 1 hour

---

## Content decisions

### Lee's positioning

After 27 years in digital (not "15 years in manufacturing") — this is a PIVOT story:

> "After 27 years in the digital world — running an agency, building hundreds of websites — I kept noticing the same problem: great companies with generic websites."

### Industries served

Machine shops, HVAC contractors, construction firms, fabricators, precision manufacturers, service businesses.

### Competitor comparison

**Removed.** We don't actually scan competitors. Changed to "Standing out from the pack" — we detect commodity language patterns common across the industry, not specific competitors.

### Pricing

- **$400** one-time payment
- No subscription
- No money-back guarantee mentioned (digital product with preview)
- Instant access after payment

---

## Pages

### Homepage (`/`)

- Hero: "Your website is invisible"
- Value prop boxes
- Pricing calculator (# projects × $ value = lost opportunity)
- URL input form
- Sample audit CTA
- FAQ section

**Known issue:** Calculator math not updating when dropdown changes. TODO: Fix.

### Processing (`/processing?id=X`)

- 3-column fields at top: LinkedIn URL (optional), Competitors (locked - "after purchase"), Email (optional)
- Spinner and progress bar
- Pages scanned list
- Progress checklist
- "Results ready!" state with reveal button (no auto-redirect)

### Preview (`/preview/[id]`)

Overview shows:
- Real commodity score (big number with color)
- Score context (74 typical, 32 best, your score)
- Voice analysis summary (free preview)
- Top 5 issues with expandable details
- One real teaser rewrite from their site
- Locked detailed breakdown CTA

Other views (Your message, Your audience, Building trust, Copy to use):
- Methodology explanation
- Locked content placeholder
- Unlock CTA

### Sample (`/sample`)

- Fixed banner: "SAMPLE REPORT"
- Full content for "Acme Construction"
- All views populated with realistic sample data
- CTA to analyze own site

---

## API endpoints

### POST /api/analyze

Request: `{ url: string, email?: string }`
Response: `{ success: true, analysisId: string }`

### GET /api/analyze?id=X

Response: `{ success: true, analysis: AnalysisState }`

### POST /api/checkout

Request: `{ analysisId: string }`
Response: `{ success: true, checkoutUrl: string }`

(Stripe integration)

---

## Open questions

1. Should we add artificial delay to make the scan feel more thorough?
2. Should LinkedIn/competitor fields actually be used, or just placeholders?
3. Do we need email collection for abandoned cart recovery?
4. What happens when analysis expires after 1 hour?

---

---

## Shared Component Matrix

| Component | Used | Customization |
|-----------|------|---------------|
| ProcessingPage | Partial | Need to add enrichment fields (LinkedIn, email, competitors) |
| AuditLayout | ✓ | Using as-is |
| SidebarNav | ✓ | Using as-is |
| LockedFindings | ✓ | Using as-is |
| ScoreModal | ✓ | Using as-is |
| AnimatedCounter | ✓ | Using as-is |
| viewIcons | ✓ | Using as-is (overview, message, audience, trust, copy) |
| ProcessingProgress | ✗ | Using custom progress bar |
| ProcessingStatus | ✗ | Using custom status display |
| ProcessingChecklist | ✗ | Using custom checklist |
| getCommodityScore* | ✓ | Core scoring system - using exactly as designed |
| formatHostname | ✓ | Using as-is |
| formatCompanyName | ✓ | Using as-is |

---

## Tool-Specific Components

### Custom Components Needed

1. **ROICalculator** - Interactive deal value/opps selector with real-time ROI calculation (already implemented in landing page)
2. **EnrichmentForm** - 3-column layout (LinkedIn, Competitors note, Email) during processing
3. **FindingCard** - Shows problematic phrase, problem explanation, rewrite suggestion, location, copy button
4. **BeforeAfterComparison** - Side-by-side generic vs. differentiated examples for landing page
5. **ProcessingEnrichmentLayout** - Custom processing page (can't use shared ProcessingPage due to enrichment fields)

---

## Changelog

### 0.7.0 (2026-01-01)
- **CRITICAL FIX:** All 10 top priorities now show copy-paste rewrites (not just first 3)
- **Data architecture change:** Findings now attached DIRECTLY to each topIssue (not separate arrays)
- **Multiple rewrite options:** Each issue shows up to 5 rewrite suggestions
- **Industry detection:** Fallback analyzer detects SaaS/manufacturing/services and uses appropriate examples
- **First Impression Clarity:** Fully unlocked with real findings (removed LockedFindings component)
- **Competitor merge logic:** PATCH endpoint now merges instead of overwrites

### 1.0.0 (2025-12-31)
- PRD updated to document shared component usage
- Reference implementation for shared component library
- Established commodity scoring system (inverse 0-100)
- Defined 5-view audit structure

### 0.3.0 (2024-12-31)
- Fixed preview to show REAL data (commodity score, topIssues, teaserFinding)
- Removed fake 6-category score cards (data didn't exist)
- Fixed Lee's credibility text (27 year pivot, not 15 years in manufacturing)
- Removed false competitor comparison claim
- Updated processing page with 3-column fields and "Results ready!" reveal
- Updated sample page to use side nav layout

### 0.2.0 (2024-12-30)
- Implemented side nav design
- Added real AI analysis (Claude)
- Added Stripe checkout
- Fixed crawler issues

### 0.1.0 (2024-12-29)
- Initial prototype
