---
name: agenticos-design-system
description: Design, migrate, generate, modify, or visually review AgenticOS desktop Web pages and HTML or React prototypes with the repository's evidence-derived design system. Use for AgenticOS frontend layout, components, implementation, visual QA, or migration from legacy prototypes and retired --ds-* styles; do not use for backend or domain-only analysis.
---

# AgenticOS design system

Use [`frontend/design-system/`](../../../frontend/design-system/) as the only normative visual source. Read [`evidence-index.md`](../../../frontend/design-system/evidence-index.md) when a task needs source traceability or conflict handling, read [`frontend/alignment.md`](../../../frontend/alignment.md) when evidence ownership or migration scope matters, and read [`CONTEXT.md`](../../../CONTEXT.md) whenever product terms or business content change.

## Route the task

- For every design or visual review, read [`foundations.md`](../../../frontend/design-system/foundations.md).
- For migration of an existing page or prototype, or whenever the target contains `--ds-*`, retired design assets, or a page-local visual system, read [`migration.md`](../../../frontend/design-system/migration.md) before editing and complete all four Gates. Its evidence and conflict steps require [`evidence-index.md`](../../../frontend/design-system/evidence-index.md) and [`frontend/alignment.md`](../../../frontend/alignment.md).
- When selecting or implementing controls, read [`components.md`](../../../frontend/design-system/components.md) and use [`tokens.css`](../../../frontend/design-system/tokens.css).
- When composing a full page or flow, also read [`patterns.md`](../../../frontend/design-system/patterns.md).
- Before generating or reviewing output, read [`ai-guide.md`](../../../frontend/design-system/ai-guide.md). Inspect [`example.html`](../../../frontend/design-system/example.html) only when a concrete composition reference helps.

## Work from evidence

Preserve business content, information architecture, states, and flows from the current source or prototype. Apply the canonical design system to visual decisions. When a required rule is absent, consult the evidence sources named in `frontend/design-system/README.md`, mark the proposed addition as evidence-derived or provisional, and update the canonical file rather than creating a page-local convention.

For existing prototypes, follow the migration Gates and keep permission, read-only, loading, empty, error, and destructive-action states explicit.

## Completion

Run `node frontend/design-system/validate.mjs`. Review the relevant checklist in `ai-guide.md`, and report any unverified domain-specific visual decisions. A migration is complete only when every Gate in `migration.md` is satisfied. All tasks must use canonical tokens and patterns, contain the required interaction states, and introduce no dependency on the retired `--ds-*` system.
