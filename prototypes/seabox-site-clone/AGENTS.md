# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Prototype scope contract

- This project recreates the complete frontend surface discovered by the sanitized Playwright crawl: 142 page and tab-state HTML entries.
- The live Seabox UI evidence and `docs/research/seabox-ai-frontend-design-system.md` are the visual source of truth. Do not use the repository's older `enterprise-prototype-design`, `DESIGN-SPEC.md`, or previous design tokens.
- Keep all business records synthetic. Do not add live APIs, credentials, personal data, hotlinked assets, or production write operations.
- Preserve the shared 56px header, 240px desktop sidebar, source navigation wording, tab structure, color tokens, typography, spacing and component density.
