# Changelog

All notable changes to the Website Messaging Audit tool.

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
