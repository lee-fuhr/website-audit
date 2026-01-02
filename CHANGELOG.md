# Changelog

All notable changes to the Website Messaging Audit tool.

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
