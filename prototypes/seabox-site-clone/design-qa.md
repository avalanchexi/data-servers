# Design QA

## Comparison target

- Source visual truth: `reference/source-asset-overview-1440x900.png`
- Additional source: `D:/cursor/Data servers/docs/research/seabox-ai-frontend-design-system.md`
- Implementation screenshot: `qa/implementation-asset-overview-1440x900.png`
- Combined comparison: `qa/comparison-source-vs-implementation.png`
- Viewport: 1440×900 CSS px
- Source pixels: 1440×900 at deviceScaleFactor 1
- Implementation pixels: 1440×900 at deviceScaleFactor 1
- State: light theme, 资产中心展开，资产总览 / 全景大屏为当前页面

## Full-view comparison evidence

The combined comparison confirms the same 56px fixed header, 240px desktop sidebar, 20px stage inset, white rounded main surface, page-heading hierarchy, horizontal tab strip, four-column metric grid, indigo primary color and compact enterprise density. The implementation intentionally contains synthetic charts and table rows because the user requested simulation data; the source capture showed an empty-data state.

The Playwright crawl-state screenshot has several navigation groups expanded because capture discovery opened parent groups. The prototype follows the user's selected visual reference by expanding only the current group by default; all other groups remain interactively expandable.

## Focused comparison evidence

The comparison board contains 1:1 focused crops for:

- header, logo lockup and sidebar boundary;
- page icon, title, description and tab anatomy;
- metric card border, radius, spacing and text hierarchy.

These regions were used because the full-page scale makes 11–16px typography and 1px borders difficult to judge.

## Required fidelity surfaces

- Fonts and typography: matches the captured `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif` stack. Page title, tab, body, table and metadata weights follow the captured 400/500/600 hierarchy.
- Spacing and layout rhythm: 56px topbar, 240px sidebar, 20px desktop stage padding, 18px main-surface radius, 14–24px component gaps and compact table rows match the source design language.
- Colors and tokens: maps the captured `#5b6cf0` primary, `#f0f2f8` background, `#fafafe` sidebar, `#ffffff` cards, `#dfe1ec` borders and captured success/warning/error colors.
- Image quality and assets: no hotlinked assets. The brand mark is a local raster rebuilt from the supplied source screenshot; the profile avatar is an explicitly synthetic local raster. UI icons use the local Tabler icon package.
- Copy and content: navigation groups, leaf-page names, page routes and tab labels come from the Playwright crawl. Business rows and metrics are explicitly synthetic.
- Behavior: sidebar groups, page links, tabs, command search, notifications, dark theme, filters, pagination, settings switches and the simulated chat composer are interactive.
- Responsiveness and accessibility: 1440, 1200 and derived 390 widths have no page-level horizontal overflow; tables retain their own horizontal scrolling. Focusable semantic controls, labels and reduced-motion handling are present.

## Comparison history

### Iteration 1 — blocked

- P2: the prototype added an unsupported “概览” tab ahead of the captured tabs.
- P2: a page-header “仿真数据” badge and refresh button changed the source heading balance.
- P2: 资产总览 used a gauge icon instead of the captured grid icon.

Fixes made:

- Removed the synthetic “概览” tab and selected the first captured tab on base pages.
- Removed the extra page-header badge and refresh action; simulation disclosure remains outside the primary UI.
- Switched the 资产总览 page-header icon to the matching grid icon.

Post-fix evidence: `qa/comparison-source-vs-implementation.png`.

### Iteration 2 — passed

No actionable P0, P1 or P2 visual mismatch remains for the desktop source state. Synthetic chart/table content is an approved content substitution rather than design drift.

## Verification

- `qa/playwright-verification.json`: representative page, interaction, console and responsive checks passed.
- `qa/all-pages-verification.json`: 142/142 generated HTML pages opened successfully; zero console errors and zero external requests.
- Mobile source capture was blocked by the internal site closing the connection. The 390×844 implementation is therefore a derived resilience state, not a source-verified clone.

## Follow-up polish

- P3: replace the locally reconstructed brand raster with the original source `logo.png` if an approved asset package becomes available.
- P3: run a source-side mobile comparison when the internal site becomes reachable in a 390×844 session.

final result: passed
