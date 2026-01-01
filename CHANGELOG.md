# Changelog

All notable changes to the Website Messaging Audit tool.

## [0.5.1] - 2025-12-31

### Added
- Share buttons in header (Email, LinkedIn, Copy link)
- Copy-to-clipboard button on each finding
- ROI impact language on expanded issues (e.g., "Fixing critical issues typically increases qualified leads 20-35%")

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
