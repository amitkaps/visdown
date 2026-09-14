# Changelog

Notable changes to the compiler and the site, newest first. Not every commit —
just what a user of either would notice. See `git log` for the full history.

## Unreleased

- Added reactive codegen: `view()` compiles to an element binding + `$state`,
  cells depending on one compile to `$derived`/`$derived.by`, with a runtime
  `mountView` action wiring the view element into its slot. Spec §6 benchmark
  fixture 2 (the reactive path) passes, and both fixtures are now checked
  against the real Svelte compiler in runes mode, not just AST-parsed.
  `display()` is still explicitly rejected — not implemented yet.
- Added `docs/` (`spec.md`, `plan.md`, `changelog.md`) and a root `AGENTS.md`.
- Deployed `packages/site` to next.visdown.com (Cloudflare Workers custom
  domain), with CI auto-deploying on every push to `next.visdown.com`.
- Scaffolded the v2 rewrite: `packages/core` (the compiler — parser, oxc
  analyzer, DAG engine, static-path Svelte codegen) and `packages/site`
  (base-derived SvelteKit + Cloudflare docs shell). Spec §6 benchmark fixture
  1 (the fully static case) passes as an AST-normalized test.
- Removed the old rollup/marked/vega-lite editor from this branch — it stays
  intact on `master`, still live at visdown.com.
