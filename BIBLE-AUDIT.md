# Build Bible audit: website-audit

**Date:** 2026-03-24
**Auditor:** Claude (Build Bible v3.1.0)
**Codebase:** `/Users/lee/Sites/lfi-tools/website-audit/`
**Version:** 2.0.1 (per `src/lib/version.ts`)
**Stack:** Next.js 16, React 18, Vercel KV, Stripe, Anthropic SDK, Resend

---

## Overall score

**Principles:** 10/14 applicable (3 PASS, 5 PARTIAL, 2 FAIL, 1 N/A)
**Anti-patterns:** 5 violations found out of 17 applicable checks

---

## Principles (15)

### 1. §1.1 Orchestrate, don't execute — N/A

Not applicable to standalone product code.

---

### 2. §1.2 QA-first — PARTIAL

**Evidence for:** A QA report exists (`QA-REPORT-v1.0.7.md`). The CHANGELOG shows iterative testing notes ("What to test" sections in v2.0.0, v2.0.1).

**Evidence against:** No design docs, wireframes, or PRD-to-implementation traceability beyond `PRD.md`. No evidence that QA was done before code — the QA report came at v1.0.7, well after initial build.

---

### 3. §1.3 TDD — FAIL

**6 test files** exist covering backend logic:
- `analyzer.test.ts` (549 lines) — mocks Anthropic SDK, tests error paths and second-pass logic
- `crawler-modules.test.ts` (856 lines) — thorough URL, HTML extraction, fetch module tests
- `enrichment-parsers.test.ts` (363 lines) — competitor parsing, weakness filtering
- `preview-utils.test.ts` — text fragment URL generation
- `spa-detection.test.ts` — SPA indicator detection
- `utils.test.ts` (253 lines) — utility function tests

**Gaps:**
- **Zero tests for any API route** (analyze, checkout, webhook, verify-payment, capture-lead, health). These are critical payment and analysis flows.
- **Zero tests for any React component**. No rendering tests, no interaction tests.
- **No evidence of red-green-refactor** workflow. Git history shows tests were likely written retroactively (anti-pattern §6.4).
- Unhappy paths ARE tested in the backend tests that exist (analyzer error handling, fallback logic), but the untested API routes handle real money.

---

### 4. §1.4 Simplicity — PARTIAL

**Files over 500 lines (god file territory):**

| File | Lines | Verdict |
|------|-------|---------|
| `src/lib/__tests__/crawler-modules.test.ts` | 856 | Test file — acceptable |
| `src/lib/__tests__/analyzer.test.ts` | 549 | Test file — acceptable |
| `src/app/preview/[id]/components/PDFGenerators.ts` | 507 | **VIOLATION** — god file, generates 3 PDF types in one file |
| `src/app/results/[id]/page.tsx` | 501 | **VIOLATION** — entire results page in one component |
| `src/app/sample/sampleData.ts` | 495 | Data file — acceptable |
| `src/app/processing/page.tsx` | 492 | **BORDERLINE** — approaching limit |
| `src/app/page.tsx` | 492 | **BORDERLINE** — landing page in one component |
| `src/app/preview/[id]/components/OverviewView.tsx` | 465 | Borderline |
| `src/app/audits/[slug]/auditData.ts` | 457 | Data file — acceptable |
| `src/app/sample/components/OverviewView.tsx` | 454 | Borderline |
| `src/app/audits/[slug]/components/AuditOverviewView.tsx` | 444 | Borderline |

Two files exceed 500 lines (excluding tests/data). Several more are in the 440-495 danger zone.

---

### 5. §1.5 Single source of truth — PASS

**Version:** `src/lib/version.ts` is the single source, referenced from `page.tsx`. CLAUDE.md documents this workflow.

**Pricing:** `_shared/config/pricing.ts` is the canonical pricing store. Checkout route imports from it. Comments explicitly cite "Bible Rule V."

**Issue:** The `$400` price appears **hardcoded as display text** in 8+ locations across UI components (`LockedFindings.tsx`, `OverviewView.tsx`, `CompetitorsView.tsx`, `ResourcesView.tsx`, `page.tsx`, `capture-lead/route.ts`, `sample/page.tsx`). The pricing config is used for Stripe checkout but not for display strings. If the price changes, you'd need to update the config AND grep for "$400" across the UI. This is a drift risk, though not a full violation since the canonical checkout price is in one place.

---

### 6. §1.6 Config-driven — PARTIAL

**Good:** Pricing in shared config. Rate limit (2/hour) in code but clearly defined. Page crawl limit (50) is a constant. Processing timeout (5 min) is a constant.

**Bad:** The `$400` display price is scattered across component strings rather than imported from config. The `$97` price for cross-sell tools is hardcoded in `HomeFooter.tsx`. Tool URLs in `webhook/route.ts` (lines 93-98) are hardcoded in a local object rather than shared config.

---

### 7. §1.7 Checkpoints — PASS

The analysis pipeline has clear state gates: `pending` → `crawling` → `analyzing` → `complete` | `failed`. Each stage updates progress in KV. The processing page has a 5-minute timeout with explicit user choices ("Keep waiting" or "Check results anyway"). Background processing uses `waitUntil` with `.catch()` to set failure state. Enrichment polling has a max of 30 attempts. Well done.

---

### 8. §1.8 Prevention — PASS

**URL validation:** Client-side `validateUrl()` + server-side URL parsing with try/catch before any processing.

**Rate limiting:** IP-based rate limit (2/hour) checked before any expensive work.

**Email validation:** Regex check before accepting.

**Competitor URL normalization:** `normalizeCompetitorUrl()` with domain pattern validation.

**SSRF protection:** Private IP blocking in crawler (`fetch.ts:74`), protocol validation.

**Stripe webhook:** Signature verification before processing + idempotency key to prevent double-processing.

**Payment verification:** Stripe session retrieval + metadata match before marking paid.

This is solid layered pre-validation.

---

### 9. §1.9 Atomic operations — N/A

The app uses Vercel KV (Redis) which is inherently atomic for single-key operations. `updateState` does get-then-set which is technically non-atomic, but acceptable for this use case where race conditions are unlikely (single user per analysis).

---

### 10. §1.10 Live docs — PARTIAL

**CLAUDE.md exists** with deployment info, project structure, and version workflow. Good.

**CHANGELOG.md** is thorough and up to date (v0.3.0 through v2.0.1).

**Missing:** No architectural decision records. No `_notes/` directory. PRD.md exists but no decisions.md tracking trade-offs made during development.

---

### 11. §1.11 Actionable metrics — PARTIAL

**Scores ARE tied to actions:** The commodity score drives specific issue identification and rewrites. Category scores (0-10) map to labels ("Strong", "Needs work", "Critical gap") with color coding. Score thresholds trigger different weakness counts in fallback logic.

**Missing:** No business metrics instrumentation beyond Plausible event tracking (`plausible('Analysis Started')` on the landing page). No conversion tracking from free to paid. No analysis completion rate monitoring. No alerting thresholds.

---

### 12. §1.12 Observability — PARTIAL

**Health endpoint:** `/api/health` exists, checks KV ping + API key presence + Stripe key + Resend key. Returns `ok`/`degraded` with 200/503. Good.

**Structured logger:** `_shared/lib/logger.ts` exists. JSON output in production, pretty-print in dev. Used in API routes (`analyze`, `webhook`). Comments cite "Bible Rule XII."

**Gaps:**
- `capture-lead/route.ts` and `checkout/route.ts` still use bare `console.error` instead of the structured logger.
- `analyzer.ts` has 15+ bare `console.log`/`console.error` calls instead of the logger.
- `enrichment.ts` has 8+ bare `console.error` calls.
- `crawler.ts`, `crawler/fetch.ts`, `parser.ts`, `state.ts` all use bare `console.*`.
- No external alerting (no Sentry, no PagerDuty, no Vercel log drain configuration documented).
- No latency tracking on the analysis pipeline.

The logger exists but adoption is incomplete — only the newest code uses it.

---

### 13. §1.13 Unhappy path first — PARTIAL

**Backend tests do cover error paths:** analyzer tests mock API failures, fallback analysis, malformed responses. Crawler tests cover private URLs, error pages.

**API routes handle failures:** Every route has try/catch with error responses. Webhook has idempotency protection. State management falls back to local store when KV fails.

**Gaps:** No tests for API route error paths. No tests for Stripe webhook failure modes. No tests for payment verification edge cases.

---

### 14. §1.14 Speed hides debt — PARTIAL

**Signs of velocity over verification:**
- 16 changelog versions in ~5 days (Dec 29 - Jan 5), some with multiple versions per day
- Zero API route tests despite handling real payments
- Zero component tests despite complex UI state
- Logger adoption incomplete (newer code uses it, older code doesn't)
- Duplicated OverviewView components across `/sample/`, `/audits/`, `/preview/` — similar but divergent

---

### 15. §1.15 Enforce boundaries — FAIL

**Critical rule that's advisory-only:** The `$400` price is display-hardcoded in ~8 UI files. If someone changes `_shared/config/pricing.ts`, the checkout will charge the new amount but the UI will still say "$400". No type system, build check, or lint rule prevents this drift.

**`?unlock=test` bypass** is gated by `NODE_ENV === 'development'` which is safe in production. Good.

**`NEXT_PUBLIC_PAYMENT_GATE_ENABLED`** env var can bypass payment gate — this is intentional for debugging but has no audit trail when used.

---

## Anti-patterns (19)

### 1. §6.1 49-day research agent — NO

Processing has a 5-minute timeout. Enrichment polling has max 30 attempts. No runaway automation.

### 2. §6.2 Premature learning engine — NO

No ML or scoring complexity. AI is used for analysis (appropriate), not for learning/prediction.

### 3. §6.3 Solo execution — N/A

### 4. §6.4 Retrospective test — YES (VIOLATION)

Tests exist for lib modules but were almost certainly written after the code. Evidence: 16 versions shipped in 5 days before the QA report at v1.0.7. Test files cover specific bugs that were found and fixed (truncation filtering, contradiction detection) — these read as regression tests, not TDD.

### 5. §6.5 Multiple sources of truth — YES (VIOLATION)

The `$400` price lives in two places: `_shared/config/pricing.ts` (for Stripe checkout) and ~8 hardcoded strings in UI components (for display). Similarly `$97` is hardcoded in `HomeFooter.tsx` for cross-sell tools but also exists in the pricing config. These will drift independently.

### 6. §6.6 Validate-then-pray — NO

Error handling is mostly solid. Catch blocks log with context. State is updated to 'failed' on errors. The orchestrator even has a fallback-of-fallback (direct KV write if `updateState` fails).

### 7. §6.7 God file — YES (VIOLATION)

- `PDFGenerators.ts`: 507 lines — three PDF generators jammed in one file
- `results/[id]/page.tsx`: 501 lines — entire results page in one component

### 8. §6.8 Silent service — NO

Health endpoint exists. Structured logger exists. Not silent.

### 9. §6.9 Silent placeholder — NO

Sample data is clearly labeled as "SAMPLE REPORT" with a banner. `sampleData.ts` uses "Acme Precision Manufacturing" — obviously fake. No demo data masquerading as real.

### 10. §6.10 Unenforceable punchlist — NO

No TODOs or FIXMEs found in the codebase. Clean.

### 11. §6.11 Advisory illusion — N/A

### 12. §6.12 Absent keyboard — YES (VIOLATION)

**70+ `onClick` handlers** across the codebase with only **6 `onKeyDown` handlers** (in `results/[id]/page.tsx` tab navigation, `EnrichmentBar.tsx` inputs, `ProcessingSection.tsx` email input).

Specific violations:
- `SideNavigation.tsx`: all nav items are `onClick` only (lines 42, 53, 70, 102, 123, 130, 147, 159)
- `OverviewView.tsx`: issue expansion, scorecard clicks, unlock button (lines 154, 235, 290, 329, 451)
- `ScorecardModal.tsx`: modal close, navigation buttons (lines 115, 119, 138, 173, 182)
- `SwipeFile.tsx`: copy buttons, PDF download (lines 20, 26, 58, 92)
- `CompetitorsView.tsx`: unlock button (line 264)
- `sample/page.tsx`: all nav items (lines 173, 183)
- `page.tsx`: "Scan my website" scroll button (line 478) — uses `<button>` which is keyboard-accessible, but no focus indication

Most interactive elements ARE `<button>` elements (inherently keyboard-accessible via Enter/Space), which mitigates this significantly. The real gaps are: `<div onClick>` patterns in scorecard cards, issue expansion cards, and copy-to-clipboard areas.

### 13. §6.13 Spinner curtain — YES (VIOLATION)

**Three full-page spinner states:**

1. `preview/[id]/page.tsx:220-228` — full-page spinner with "Loading your report..." text
2. `results/[id]/page.tsx:128-133` — full-page spinner, no text
3. `processing/page.tsx:484-488` — Suspense fallback with full-page spinner

None use skeleton screens. The preview page spinner is the most impactful since users will see it after paying.

### 14. §6.14 Dead-end empty state — NO

Empty states have CTAs: "No strong proof points were found" includes guidance. Error states include "Try again" links. Processing timeout offers two options. The app handles empty states well.

### 15. §6.15 Catch-and-forget — NO

All catch blocks either log the error, display it to the user, or both. Several catch blocks set state to 'failed' and update the UI. The `capture-lead/route.ts` inner catch (line 26) logs but doesn't fail the request — this is intentional (lead captured even if Lee's notification email fails).

### 16. §6.16 Thumb trap — NO

Buttons consistently use `py-3`/`py-4` with `px-6` padding, meeting the 44px minimum. Cross-sell CTAs explicitly use `min-h-[44px]`. Form inputs use `py-3` with `text-lg`. No obvious thumb traps.

### 17. §6.17 Rogue fetch — NO (with caveat)

All `fetch()` calls go to `/api/*` routes (the app's own API). There's no centralized API client, but all fetch calls follow the same pattern (POST with JSON body, check `result.success`). For a single-tool app this is acceptable, though a shared `fetchAPI()` wrapper would reduce boilerplate.

### 18. §6.18 Incremental god file — NO (but watch list)

Several files in the 440-495 range:
- `processing/page.tsx` (492), `page.tsx` (492), `OverviewView.tsx` (465), `auditData.ts` (457), `sample/OverviewView.tsx` (454), `AuditOverviewView.tsx` (444)

These aren't violations yet but will be with any feature additions.

### 19. §6.19 Dynamic static — NO

`new Date()` is used for footer copyright years (appropriate) and log timestamps (appropriate). The report date in `PageHeader.tsx` shows today's date, which is correct since reports are generated live.

---

## Top 5 issues by severity

### 1. No API route or payment flow tests (§1.3 FAIL, §1.13 gap)

**Severity: CRITICAL**

The app handles real money via Stripe. The checkout route, webhook handler, and payment verification route have zero test coverage. A regression in webhook processing could silently break payment confirmation, leaving customers who paid unable to see their results. The webhook idempotency logic, metadata matching, and KV state updates are all untested.

**Files:** `src/app/api/checkout/route.ts`, `src/app/api/webhook/route.ts`, `src/app/api/verify-payment/route.ts`

**Fix:** Write integration tests mocking Stripe SDK and KV. Test: successful payment, duplicate webhook, mismatched metadata, KV failure during payment update, expired/invalid session IDs.

---

### 2. Price display hardcoded across UI ($400 in ~8 files) (§1.5 drift risk, §6.5)

**Severity: HIGH**

The pricing config at `_shared/config/pricing.ts` controls what Stripe charges, but the UI independently says "$400" in hardcoded strings. Changing the price requires updating the config AND finding every string. One miss = the UI promises one price while Stripe charges another.

**Files:** `src/components/LockedFindings.tsx:17,37`, `src/app/page.tsx:101,227,270,419,422`, `src/app/preview/[id]/components/OverviewView.tsx:455`, `src/app/preview/[id]/components/CompetitorsView.tsx:270`, `src/app/preview/[id]/components/ResourcesView.tsx:106`, `src/app/preview/[id]/components/LockedFindings.tsx:115`, `src/app/api/capture-lead/route.ts:24`, `src/app/sample/page.tsx:163`

**Fix:** Import the price from `_shared/config/pricing.ts` and format it: `` `$${PRICING['website-audit'].base}` ``. A single constant drives both Stripe and display.

---

### 3. Inconsistent logger adoption (§1.12)

**Severity: MEDIUM**

A structured logger exists and is used in the newest routes (`analyze`, `webhook`), but older files still use bare `console.log`/`console.error`. In production, bare console calls produce unstructured text that's hard to search/aggregate, while the logger produces JSON.

**Files with bare console calls:** `analyzer.ts` (15+ calls), `enrichment.ts` (8+ calls), `crawler.ts`, `crawler/fetch.ts`, `parser.ts`, `state.ts`, `capture-lead/route.ts`, `checkout/route.ts`, `verify-payment/route.ts`, `processing/page.tsx`, `preview/[id]/page.tsx`

**Fix:** Replace all `console.log/error/warn` in `src/lib/` and `src/app/api/` with `logger.info/error/warn`. Client-side code (`page.tsx` files) can keep `console.error` since the logger targets server-side.

---

### 4. God files: PDFGenerators.ts (507) and results page (501) (§6.7)

**Severity: MEDIUM**

`PDFGenerators.ts` packs three independent PDF generators into one file. `results/[id]/page.tsx` is an entire multi-view page in one component.

**Fix:** Split `PDFGenerators.ts` into `FullAuditPDF.ts`, `BriefPDF.ts`, `SwipePDF.ts`. Extract the results page views into separate components (same pattern as the `preview/[id]/components/` directory).

---

### 5. Full-page spinners instead of skeletons (§6.13)

**Severity: LOW-MEDIUM**

Three loading states show a spinner with no content structure. The preview page spinner is the worst offender since users see it after clicking from the processing page — they expect to see their report, not another spinner. A skeleton screen showing the page structure (sidebar, header, content areas) would feel faster.

**Files:** `src/app/preview/[id]/page.tsx:220-228`, `src/app/results/[id]/page.tsx:128-133`, `src/app/processing/page.tsx:484-488`

**Fix:** Replace spinners with skeleton components that match the final page layout. The preview page should show the sidebar and header shape immediately.

---

## Summary table: principles

| # | Principle | Verdict | Key evidence |
|---|-----------|---------|-------------|
| 1 | §1.1 Orchestrate | N/A | Product code |
| 2 | §1.2 QA-first | PARTIAL | QA report exists but came late |
| 3 | §1.3 TDD | FAIL | 6 test files but 0 API/component tests, no red-green evidence |
| 4 | §1.4 Simplicity | PARTIAL | 2 god files, 6 borderline |
| 5 | §1.5 Single source of truth | PASS | Version + pricing centralized (display strings drift risk) |
| 6 | §1.6 Config-driven | PARTIAL | Pricing in config but display price hardcoded |
| 7 | §1.7 Checkpoints | PASS | Clear state machine with timeout handling |
| 8 | §1.8 Prevention | PASS | Layered validation on all inputs |
| 9 | §1.9 Atomic ops | N/A | KV is inherently atomic |
| 10 | §1.10 Live docs | PARTIAL | CLAUDE.md + CHANGELOG good, no ADRs |
| 11 | §1.11 Actionable metrics | PARTIAL | Scores drive actions, no business metrics |
| 12 | §1.12 Observability | PARTIAL | Health endpoint + logger exist but inconsistently used |
| 13 | §1.13 Unhappy path | PARTIAL | Backend tests cover errors, API routes untested |
| 14 | §1.14 Speed hides debt | PARTIAL | 16 versions in 5 days, test gaps |
| 15 | §1.15 Enforce boundaries | FAIL | Price display has no enforcement mechanism |

## Summary table: anti-patterns

| # | Anti-pattern | Found? | Key evidence |
|---|-------------|--------|-------------|
| 1 | §6.1 49-day agent | NO | 5-min timeout + poll limits |
| 2 | §6.2 Premature ML | NO | No ML used |
| 3 | §6.3 Solo execution | N/A | |
| 4 | §6.4 Retrospective test | YES | Tests written after bugs found |
| 5 | §6.5 Multiple truth | YES | $400 in config + 8 UI strings |
| 6 | §6.6 Validate-then-pray | NO | Solid error handling |
| 7 | §6.7 God file | YES | PDFGenerators.ts (507), results page (501) |
| 8 | §6.8 Silent service | NO | Health endpoint + logger |
| 9 | §6.9 Silent placeholder | NO | Sample data clearly labeled |
| 10 | §6.10 Unenforceable punchlist | NO | No TODOs found |
| 11 | §6.11 Advisory illusion | N/A | |
| 12 | §6.12 Absent keyboard | YES | 70+ onClick, ~6 onKeyDown (mitigated by button elements) |
| 13 | §6.13 Spinner curtain | YES | 3 full-page spinners |
| 14 | §6.14 Dead-end empty | NO | Empty states have CTAs |
| 15 | §6.15 Catch-and-forget | NO | All catches log + update state |
| 16 | §6.16 Thumb trap | NO | Buttons meet 44px minimum |
| 17 | §6.17 Rogue fetch | NO | All fetches to own API |
| 18 | §6.18 Incremental god | NO | 6 files on watch list (440-495) |
| 19 | §6.19 Dynamic static | NO | Dates used appropriately |
