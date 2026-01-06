# Changelog

All notable changes to the Website Messaging Audit tool.

## [2.0.1] - 2026-01-05

### What to test

1. **Link icons** - Should scroll to and highlight the exact text on the page (text fragment links)
2. **Competitor bar** - New editorial design with muted colors, zone labels inside track, individual competitor markers
3. **"Where they're weak"** - Should no longer show truncated quotes like "...nd what you want"

### Fixes

- **Weakness quote truncation (for real this time)** - Added backend validation to filter quotes starting mid-word ("...nd what"), mid-sentence ellipses ("...y over 60%"), and fragments too short to be meaningful
- **Link icons now use text fragments** - Links jump to exact text on page using `#:~:text=` (Arc-style deep linking, works in Chrome/Edge/Safari)

### Design

- **Competitor comparison bar redesigned** - Editorial style positioning map:
  - Muted zone colors (rose-50, amber-50, emerald-50) instead of garish traffic lights
  - Zone labels inside the track, not orphaned below
  - Your score: large navy marker with "YOU" tag above
  - Each competitor: individual gray circles with domain initials (hover for details)
  - Dashed line shows competitor average
  - Header shows your score prominently with zone label

---

## [2.0.0] - 2026-01-05

Major release with 13 fixes, UX improvements, and design system alignment.

### What to test

1. **Run a new audit** - link icons should appear next to "Found:" text
2. **Expand an issue card** - verify findings show external link icon (opens source page)
3. **Check competitors section** - new gradient bar visualization above the table
4. **Download full PDF** - should include ALL findings, competitors, swipe file, pages list
5. **Check typography** - now uses Albert Sans (headings) + Literata (body) like other LFI tools
6. **Verify page count** - should crawl up to 50 pages (was 25)

### Features

- **Number line comparison graphic** - Visual gradient bar (red/yellow/green zones) showing your score vs competitor average, above the comparison table
- **Full PDF export** - Now includes ALL report sections: Overview, Priority Issues (all findings), Copy You Can Use, Competitors (with strengths/weaknesses), Swipe File, Pages Analyzed
- **Link icons on findings** - External link icon next to every "Found:" text to jump to source page (11 locations)
- **Expandable pages list** - "View all X pages we analyzed" section in overview
- **Clickable page cards** - Each scanned page links to the actual URL
- **Copy section explanation** - Added header explaining "Quick wins beyond critical issues"
- **Denser copywriter brief PDF** - Now includes voice snapshot, 3 sample rewrites, competitive context

### Fixes

- **Truncated weakness quotes** - AI now required to use complete phrases, not cut mid-word
- **Contradictory strength/weakness** - Added validation to filter contradictions (e.g., "uses proof" as strength + "lacks proof" as weakness)
- **Competitor scoring bias** - Expanded proof detection (21 patterns), adjusted scoring formula to be less harsh
- **Error page pollution** - Crawler now detects and skips 404/error pages (fixes Grainger issue)

### Changes

- **Page limit increased** - Now crawls up to 50 pages (was 25)
- **LFI design system** - Typography now matches other tools (Albert Sans + Literata + JetBrains Mono)
- **Paper texture** - Subtle background texture for brand consistency

---

## [1.0.9] - 2026-01-04

### Added
- **Headless browser render service** - New microservice (Express + Puppeteer) for JavaScript-rendered SPA sites
  - Runs on Hetzner VPS (~$5/month) for cost efficiency
  - Extracts metadata including og:site_name, title, h1, footer text
  - Docker-based deployment with Puppeteer 24.0
- **Real company name extraction** - No more static mapping! Company names now extracted dynamically from:
  1. `og:site_name` meta tag (most reliable)
  2. Title tag (cleaned before `|` or `-`)
  3. Footer copyright text (regex for "© 2024 Company Name")
- **Render service integration** - Crawler now calls render service when SPA is detected
  - Configured via `RENDER_SERVICE_URL` and `RENDER_SERVICE_API_KEY` environment variables
  - Falls back to static HTML when render service unavailable

### Changed
- **SPA warning updated** - Shows different message when render service resolves vs when content may be incomplete
- **Company name formatting removed** - Deleted the 100+ static company mapping (feeble approach), replaced with real extraction

### Security
- **Protocol validation** - Render service blocks non-HTTP/HTTPS protocols (file://, ftp://, javascript:, data:)
- **SSRF protection** - Render service blocks private/internal IPs (localhost, 127.x, 10.x, 192.168.x, 169.254.x, *.local, *.internal)
- **AWS metadata blocking** - Explicitly blocks cloud metadata endpoints

### Fixed
- **Browser singleton race condition** - Concurrent requests now properly share single browser instance instead of each launching their own

### Technical
- New files: `render-service/server.js`, `Dockerfile`, `docker-compose.yml`, `DEPLOY.md`
- New crawler functions: `fetchWithRenderService()`, `extractCompanyName()`, `extractOgSiteName()`, `extractFooterText()`
- Added `companyName` field to `CrawlResult` interface

## [1.0.8] - 2026-01-03

### Added
- **Company name formatting** - New `formatCompanyName()` utility with 100+ known company mappings (John Deere, HubSpot, etc.) plus smart title case heuristics for unknown names
- **Mobile navigation** - Hamburger menu with full-screen overlay for navigating all 7 views on mobile devices
- **SPA detection warning** - Detects JavaScript-rendered sites (React, Angular, Vue, etc.) and displays yellow warning banner with technical details
- **Processing timeout** - 5-minute timeout with friendly UI offering "Keep waiting" or "Check results anyway" options
- **Safe clipboard utility** - `safeClipboardWrite()` with modern Clipboard API + execCommand fallback for insecure contexts

### Fixed
- **Clipboard errors** - All 15+ copy buttons now use safe clipboard utility instead of raw `navigator.clipboard.writeText()`
- **Email messaging** - Changed from "Email me my results" to "Get notified about your messaging" - avoids broken promises since email delivery isn't implemented
- **escapeHtml scope** - Moved to shared utils.ts so both PDF functions can use it (was causing build error)
- **Duplicate zendesk key** - Removed duplicate entry in KNOWN_COMPANIES object
- **TypeScript types** - Added `spaWarning` to `siteSnapshot` interface in route.ts

### Changed
- **Processing page text** - "Bookmark this page" messaging instead of promising email delivery

## [1.0.7] - 2026-01-03

### Security
- **Removed API key exposure** - Debug endpoint no longer leaks API key prefix (was exposing first 10 chars)
- **Removed API key logging** - Error handler no longer logs API key prefix (was logging 20 chars)
- **XSS fix in copywriter brief PDF** - Applied `escapeHtml()` to all user content in brief PDF generation

### Added
- **Comprehensive QA report** - Created `QA-REPORT-v1.0.6.md` with 47 findings from 13-agent review

## [1.0.6] - 2026-01-03

### Added
- **HTML escaping in PDF** - Added `escapeHtml()` helper to prevent XSS and broken markup from user content
- **Empty findings message** - Issues without specific rewrites now show "No specific rewrites for this issue" instead of empty space

### Fixed
- **Long text overflow in PDF** - Added `word-wrap: break-word` and `table-layout: fixed` to prevent text breaking layout
- **Display name logic** - Now prefers company name over raw hostname for cleaner PDF header

### Changed
- **PDF agent review** - Three-pass review completed, verified:
  - Title renders correctly with spaces
  - Score displays properly with fallback
  - All 10 issues included
  - Page breaks work correctly

## [1.0.5] - 2026-01-03

### Changed
- **PDF completely redesigned** - Abandoned fancy html2pdf styling, now uses simple Word-style formatting:
  - Georgia font, basic tables, minimal styling
  - Tables for Before/After comparisons instead of fancy cards
  - Simple severity labels instead of gradient badges
  - Clean header with centered title and score
  - Reliable rendering that actually works

### Fixed
- **AI rewrite length enforcement** - Added strict character count constraints to prevent 2-3x longer rewrites:
  - Prompt now explicitly shows WRONG vs RIGHT examples
  - Post-processing validation truncates overly-long rewrites at sentence boundaries
  - Maximum +50% longer than original (was unlimited)
- **Quote truncation mid-word** - Added explicit rules for quote extraction:
  - Prompts now forbid mid-word cuts like "...nd what you want"
  - Post-processing cleans up fragments that start with lowercase
- **Empty weaknesses for low-scoring sites** - Sites with 50/100 now show weaknesses:
  - Added fallback weaknesses when AI returns empty array
  - Sites <40 get 2 weaknesses, <60 get 1 weakness, <70 gets suggestion
- **Wrong H1 extraction** - Fixed "About Notion" being shown as homepage H1:
  - Now strips header/nav/footer before finding H1
  - Filters out short navigation-looking H1s ("About", "Contact")
  - Prefers longer, more meaningful H1s from main content

## [1.0.4] - 2026-01-03

### Changed
- **PDF design overhaul** - Major visual improvements based on design review:
  - Score badges now pill-shaped with color-coded backgrounds (red/yellow/green)
  - Executive summary stats now 42px bold numbers with colored backgrounds (red for issues, green for rewrites)
  - Before/After rewrites now have visual transformation feel with arrow indicator and green gradient backgrounds
  - Severity badges now solid colored pills with white text (more visual weight)
  - Score Breakdown section stays together (no more orphaned items on empty pages)
  - Issues section starts on fresh page for cleaner layout

## [1.0.3] - 2026-01-03

### Added
- **H1 headline comparison in competitor table** - Now extracts and displays each site's main H1 headline for side-by-side positioning comparison
- **Description text on Previous buttons** - Bottom nav now shows section descriptions on both prev/next buttons

### Changed
- **Top navigation removed** - Simplified navigation to just bottom prev/next cards (was confusing with multiple nav areas)
- **YOUR OPPORTUNITY heading in allcaps** - Competitor card headings now styled as uppercase for better visual hierarchy
- **Competitor table casing fixed** - Category names now properly capitalized (First Impression, not first Impression)

### Fixed
- **Double bottom nav on Overview** - Removed duplicate CTA section that was showing two sets of navigation buttons
- **PDF title spacing** - "Website Messaging Audit" now properly spaced in PDF header (was rendering as one word)
- **PDF score display** - Score now always shows in cover page (was sometimes missing, showing just "/100")

## [1.0.2] - 2026-01-03

### Added
- **Fallback competitor discovery** - When AI doesn't suggest competitors, a dedicated Claude call now discovers 5 likely competitors based on site content (SHOWSTOPPER fix)
- **Phase transition animation** - Header fades out over 1000ms and new phase fades in over 500ms when switching from "Scanning" to "Analyzing"

### Changed
- **Navigation layout** - Small nav stays at top, BOTH previous AND next buttons now show as big cards at bottom (gray for previous, blue for next)
- **Main PDF complete** - Now includes ALL issues and ALL findings, not just top 5 (was truncating the report)
- **Company name in PDF** - Shows full domain (asana.com) for recognition, proper casing in header

### Fixed
- **Copywriter brief fits one page** - Reduced padding, smaller fonts, two-column layout for priorities and samples, truncated text to 80 chars

## [1.0.1] - 2026-01-03

### Added
- **Custom PDF design** - Full audit PDF is now a professionally designed document with cover page, executive summary, score breakdown, priority issues with rewrites, and competitor table (was just printing the web page)
- **Copywriter brief PDF** - Download button alongside Copy button for a formatted one-page handoff document
- **Dynamic trust checklist** - Now scans actual site content and shows Found/Missing status with specific copy suggestions

### Changed
- **Resources page visible to free users** - Shows teaser for each section with gate, building anticipation before purchase
- **Swipe file UX improved** - Click anywhere to copy, hover state with "Click to copy" label, glow effect on copy confirmation
- **Navigation consistency** - Big blue CTA only at bottom of pages (was showing duplicate nav buttons)

### Fixed
- **Competitor analysis "not available"** - Fixed bug where empty competitor list caused UI to show error state
- **Removed "on your site" redundant text** - Labels now just say "CURRENT" instead of "CURRENT - on your site"

## [1.0.0] - 2026-01-03

### Added
- **Resources tab** - New unlocked-only view with export tools
- **Swipe file** - All rewrites in one scrollable, exportable list with "Copy all" button
- **Copywriter brief** - One-page handoff summary with stats, priorities, and sample rewrites
- **Trust signal checklist** - 8-item actionable checklist with placement tips
- **Competitor comparison table** - Side-by-side strongest/weakest areas by category
- **Actual quoted text from competitors** - Heuristic fallback now extracts real phrases, not generic summaries
- **Enhanced AI prompts** - Competitor analysis now requires quoted text examples

### Changed
- **Opportunity text is now actionable** - Uses category scores to give specific, SMART-style recommendations
- **PDF layout** - Comprehensive print CSS with proper page breaks, margins, and hidden nav elements
- **"Full audit shows" text** - Now conditional based on unlock state (shows comparison table reference when unlocked)

### Fixed
- **Competitor external links** - Now properly links to https://competitor.com instead of internal preview URL
- **N/A scores in comparison table** - User's category scores now display correctly (were missing from preview data)
- **TypeScript build errors** - Fixed categoryScores type definition and optional chaining

## [0.9.9] - 2026-01-03

### Added
- **PDF download button** - Now generates actual PDF file using html2pdf.js (was window.print fallback)
- **Wikipedia links on frameworks** - Each methodology box links to canonical source for external validity
- **External link icon on competitor cards** - Click to open competitor site in new tab
- **Customized opportunity text** - "Your opportunity" section now references specific competitor strengths/weaknesses

### Changed
- **Framework boxes styling** - Subtle gray border instead of blue left border for cleaner look
- **ViewNavBar wrapper pattern** - Bottom nav now correctly appears after section content (was rendering at top)
- **Comparison table cells** - Full background color fill on cells (was text-only coloring)
- **"Your advantage" → "You're behind/ahead"** - Clearer score gap language on competitor cards
- **Empty states improved** - "No standout strengths that apply to you" instead of "No specific strengths identified"
- **Findings display** - Shows up to 5 findings per section (was 3), removed "X options" count labels

### Fixed
- **Bottom nav visibility** - Now correctly shows at bottom of each view (ViewNavBar is now a wrapper component)
- **Top nav on Overview** - Correctly hidden on Overview page, visible on other views (mobile only)
- **"Your opportunity" colon removed** - Headers no longer have trailing colons (GLOBAL RULE)

## [0.9.8] - 2026-01-02

### Fixed
- **Processing page text** - "Feel free to close this tab" → "Then you can close this tab"
- **Top nav hidden on Overview** - Mobile top nav now hidden on Overview page (was showing "Your message" button row)
- **"What we scanned" section title** - Changed from "What we found on your site"
- **Competitor count showing 0** - Now displays `detailedScores.length` instead of `competitors.length`
- **Previous button outline removed** - Gray background instead of bordered outline (was looking like input field)
- **Competitor analysis fallback** - Always sets `competitorComparison` even on timeout/error (prevents "not available" message)
- **PDF button works** - Now uses `window.print()` (renamed to "Print / Save PDF")

### Changed
- ViewNavBar now accepts `hideTopNav` prop to conditionally hide top mobile nav

## [0.9.7] - 2026-01-02

### Added
- **Deep competitor analysis** - Full 6-category scoring per competitor (firstImpression, differentiation, customerClarity, storyStructure, trustSignals, buttonClarity)
- **Competitor comparison table** - Bold side-by-side table with color-coded category scores (green/yellow/red)
- **"What to steal" insight cards** - Per-competitor strengths, weaknesses, and "Your opportunity" recommendations
- **Live competitor progress** - Processing page shows real-time competitor analysis status with preliminary scores and early findings
- **Framework references** - All methodology boxes now cite underlying frameworks (StoryBrand, Jobs-to-be-done, Trust hierarchy, Micro-commitment ladder, Specificity ladder)
- **Score card sub-factors** - Each category now shows "What we measure" with 3 specific factors
- **Intelligence summary** - "What we found on your site" section with total rewrites, competitors analyzed, and pages crawled

### Changed
- **Progress bar switch point** - Now transitions from crawl to AI analysis at 55% (was 70%) for better perceived progress
- **AI status messages expanded** - 18 substantive, action-oriented messages during analysis phase (was 15 generic)
- **Competitor analysis parallelized** - Runs 3 concurrent analyses with 45s timeout per competitor

### Fixed
- **ViewNavBar on Overview** - Bottom navigation now appears on Overview section (was missing)

### Technical
- New `analyzeCompetitorDeep()` function with AI scoring + heuristic fallback
- `competitorProgress` field added to AnalysisState for real-time tracking
- Exported `getAnthropicClient` from analyzer.ts for route.ts access

## [0.9.6] - 2026-01-02

### Fixed
- **PDF button readable** - Added text color and font weight to white button background
- **Competitors page unlocks with ?unlock=test** - Added isTestUnlocked check to "What you can steal" section
- **Custom tooltips on priority pills** - 150ms fade-in on hover, replaced slow native title attribute
- **All "What to do" sections show real findings** - Each section now pulls from relevant topIssues index (was showing generic placeholder)
- **Bottom nav more visible** - Darker background, thicker border, larger padding, shadow
- **Top navbar no longer looks like input** - Light background with subtle border and hover states

### Added
- New Tooltip component (`src/components/Tooltip.tsx`) for custom hover tooltips

## [0.9.5] - 2026-01-02

### Changed
- **Progress bar shimmer always on** - Consistent animated shimmer throughout scanning and analysis
- **"Analyzing..." header with animated dots** - Shows during AI analysis with pulsing dots
- **Duplicate nav bars fixed** - Top nav hidden on desktop where sidebar is visible

## [0.9.4] - 2026-01-02

### Fixed
- **Scorecards no longer all show same value** - Added variance per category for fallback scores when AI scores unavailable

## [0.9.3] - 2026-01-02

### Fixed
- **Processing page feels alive** - Animated shimmer on progress bar, fake progress 70→95%, fade transitions on messages
- **"What to do" sections now show on unlock** - Replaced empty sections with implementation guidance when unlocked
- **PDF download works when unlocked** - Sidebar PDF button unlocks with ?unlock=test parameter
- **Priority pills have tooltips** - Hover to see severity explanations and timelines
- **"Option 1" headers removed** - Cleaner finding cards without useless headers

### Changed
- Status messages expanded to 15 variants (was 6) with variable 3-7s delays
- Messages fade in/out with CSS animation
- Progress bar uses shimmer effect during AI analysis

## [0.9.2] - 2026-01-02

### Fixed
- **Score mismatch bug** - Category scores (7/10, 6/10) now come from AI, not buggy formula
- **Processing stuck at 70%** - Rotating status messages every 5 seconds during AI analysis
- **Share buttons confusing** - Labels now "Share via email", "Share on LinkedIn", "Copy share link"
- **Blue backgrounds bleeding** - Replaced bg-blue-* with neutral bg-slate-* colors
- **Missing navigation buttons** - Added bottom prev/next buttons to ViewNavBar

### Added
- **AI category scores** - AI now returns 0-10 scores for each of 6 categories
- **"Taking a while?" prompt** - Email option after 30s, continues processing if tab closes
- **Test unlock param** - Add `?unlock=test` to bypass payment for testing
- **Length constraint in AI prompt** - Rewrites stay -30% to +15% of original length

## [0.8.7] - 2026-01-02

### Added
- **Second-pass AI retry** - If first pass returns < 25 findings or > 3 sparse categories, automatically runs focused second pass
- Deduplication logic prevents repeating findings between passes (exact match + substring similarity)
- `buildSecondPassPrompt()` lists already-found phrases to avoid
- `mergeAnalysisResults()` combines passes with intelligent deduplication

### Technical
- Constants: `MIN_TOTAL_FINDINGS = 25`, `MIN_FINDINGS_PER_CATEGORY = 2`
- Refactored analyzer into modular functions: `runAnalysisPass()`, `runSecondPass()`, `countTotalFindings()`, `findSparseCategories()`

## [0.8.6] - 2026-01-02

### Fixed
- **AI works in Vercel production** - Fixed build-time SDK initialization failures
- Added `export const dynamic = 'force-dynamic'` to all API routes to skip prerendering
- Changed SDK clients to lazy initialization: `getStripe()`, `getResend()`, `getAnthropicClient()`
- Updated Anthropic SDK from 0.32.1 to 0.71.2

### Added
- `/api/debug` endpoint for production AI connectivity testing
- Extensive logging for API key and AI initialization debugging

## [0.8.5] - 2026-01-02

### Fixed
- **Content-based finding distribution** - Findings now match to issues by semantic relevance, not round-robin
- Added `ISSUE_KEYWORDS` mapping for each of 10 categories
- `matchFindingToIssue()` scores findings by keyword overlap

## [0.8.0] - 2026-01-02

### Changed
- **Enhanced AI prompt** - Now explicitly requests 3-5 findings per category, minimum 30 total
- Prompt structure includes "CRITICAL" instruction for 30+ real findings
- Each category must have findings with exact quotes from site

## [0.7.0] - 2026-01-01

### Added
- Competitor analysis with auto-discovery and manual override
- 30-second timeout for competitor analysis with graceful fallback
- Competitor scores displayed relative to user's score

## [0.6.1] - 2026-01-01

### Fixed
- **Fallback analyzer now generates REAL copy suggestions** - not generic "Replace with specific proof" garbage
- **Competitor analysis now MERGES** instead of overwriting - add 4 competitors, see all 4 analyzed
- **Up to 10 preview findings** (was 5) - covers all top issues with real rewrites
- Removed dishonest "Self-implementation guide" claim from CTA
- Removed "15-20 rewrites" claim - now says "Specific replacement copy for every issue found"

### Added
- PRD updated with mandatory rules for Overview and First Impression content
- PRD: "What copy suggestion means" section - explicit examples of RIGHT vs WRONG rewrites

## [0.6.0] - 2026-01-01

### Added
- **Centralized VERSION constant** - single source of truth in `/src/lib/version.ts`
- **Overview shows REAL recommendations** - expanded issue cards now display actual before/after rewrites from your site
- **Up to 5 copy-paste fixes in free preview** - real value, not generic text
- Copy buttons on suggested rewrites

### Fixed
- Version number now updates automatically everywhere
- Competitors always aim for 5 - supplements user input with AI suggestions

### Changed
- Preview data structure expanded with `previewFindings` array (up to 5 findings)
- Competitor PATCH endpoint supplements user competitors to reach 5

## [0.5.3] - 2025-12-31

### Fixed
- Removed ALL em dashes (—) from preview page, replaced with " - "
- Replaced text bullets (•) with arrow icons (→) throughout
- Made issue cards fully clickable (entire card, not just text)
- Added hover states to clickable cards

### Changed
- Updated impact statement formatting (em dash → hyphen)
- Improved click target area for top priority cards

## [0.5.2] - 2025-12-31

### Changed
- Copy button now on SUGGESTED REWRITE text (the actual copy we're recommending)
- Replaced fake ROI percentages with qualitative impact labels ("High-impact fix", "Medium-impact fix", "Polish item")

## [0.5.1] - 2025-12-31

### Added
- Share buttons in header (Email, LinkedIn, Copy link)
- Copy-to-clipboard button on rewrite suggestions
- Impact labels on expanded issues (qualitative, not fake percentages)

## [0.5.0] - 2025-12-31

### Fixed
- Overview issues now show severity-based impact content (no more "Full findings locked")
- Added "Preview included" badge to top priorities section
- Competitor analysis shows spinner + time estimate during progress
- Fixed inconsistent messaging (only show competitor count if enrichment successful)
- Changed "87 after implementation" to "85+ typical after fixes"

### Added
- Social links display in header ("LinkedIn found ✓", "X socials added ✓")
- Better visual feedback during competitor enrichment (spinner, timing message)

### Changed
- Expanded issue content uses colored severity boxes (red/amber/blue borders)
- Processing page competitor section shows expected wait time

## [0.4.0] - 2025-12-30

### Added
- Competitor comparison feature with auto-discovery
- Score interpretation (higher = better differentiated)
- Page crawl limit increased to 25 pages

### Fixed
- Score logic flipped (100 = best, lower = commodity)
- Scorecard modal colors (solid backgrounds, white text)

## [0.3.0] - 2025-12-29

### Added
- Initial release
- Website crawling and AI analysis
- Preview page with gated full results
- Stripe checkout integration
- Processing page with live progress updates
