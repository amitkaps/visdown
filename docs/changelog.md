# Changelog

Notable changes to the compiler and the site, newest first. Not every commit —
just what a user of either would notice. See `git log` for the full history.

## Unreleased

- Added `packages/cli` (spec §7): `visdown build <file>.md` → `<file>.html`,
  a single flat file with no dev server or project scaffold. Calls
  `svelte.compile()` directly and bundles the result — Svelte's client
  runtime, `@visdown/core/runtime`, and the compiled component — with
  `esbuild` into one inlined `<script type="module">`. `--ssr` pre-renders
  initial markup via `svelte/server` and hydrates on the client instead of
  mounting cold. This is the actual v1 deliverable per the spec.
- Added sourcemaps (spec §5): `compile()` now returns `{ code, map }`, a v3
  sourcemap from the generated `.svelte` back to the `.md` source, so Svelte
  compiler diagnostics and runtime stack traces can point at real
  coordinates. `packages/site`'s live examples now ship a `.svelte.map`
  alongside each generated component.
- Added live examples to `packages/site`: four `.md` documents under
  `src/examples/` (static, `view()`/`$derived`, `display()`, and all three
  combined) are compiled to real Svelte components by `@visdown/core` and
  rendered at `/examples/<slug>`, each with a "view source" toggle. Compiling
  happens via a `tsx` script (`generate-examples.ts`) run ahead of
  `dev`/`build`/`check`/`test`, not inside `vite.config.ts` itself — the
  config loader can't resolve `@visdown/core`'s TS sources. Example pages
  disable SSR (`view()`'s form-element factories in the new `#lib/inputs`
  module need a real `document`).
- Added `display()` codegen: a side-effect-only cell gets its own slot div,
  cleared at the start of each evaluation. A cell with no reactive dependency
  mounts its `display()` calls once via a `mountDisplay` action; a cell
  depending on a reactive name re-runs inside `$effect` via `bindDisplay`.
  `display()` combined with a declared name, or called outside a js cell, is
  rejected explicitly. Spec §4's codegen table is now fully implemented.
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
