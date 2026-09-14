# Roadmap

What's next, in order. See [`spec.md`](spec.md) for the accepted design and
[`../packages/site/src/content/status.md`](../packages/site/src/content/status.md)
for what's actually implemented right now. This file is the forward-looking
counterpart to that — update it when priorities change, not on every commit.

## Done

- `packages/core`: parser → analyzer → DAG → codegen pipeline, static path.
  Spec §6 benchmark fixture 1 passing as an AST-normalized test.
- `packages/site`: base-derived SvelteKit + Cloudflare docs shell, deployed
  to next.visdown.com, CI auto-deploys on push.
- **Reactive codegen, minus `display()`**: `view()` → element binding +
  `$state` (recognized shape only: `const NAME = view(EXPR);`), `$derived`/
  `$derived.by` for cells depending on a reactive one (including the
  multiple-names destructure shape). Runtime shim `mountView` (an action) for
  `view()`'s element-mount + input-listener wiring. Benchmark fixture 2 (spec
  §6, the reactive path) passing, and both fixtures verified against the real
  Svelte compiler in runes mode, not just AST-parsed.

## Next

1. **`display()` codegen + runtime shim** — the last piece of spec §4's
   table: the per-cell slot div, cleared at the start of each evaluation, and
   the `$effect` wrapper for cells that call it. Cells calling `display()`
   are rejected explicitly today rather than mis-emitted.
2. **`packages/cli`** (spec §7) — `visdown build <file>.md` → `<file>.html`.
   This is the actual v1 deliverable per the spec; the pipeline above exists
   to make this possible.
3. **Sourcemaps** (spec §5) — v3 sourcemap from generated `.svelte` back to
   the `.md` source, so Svelte compiler diagnostics and runtime stack traces
   point at real coordinates instead of generated ones.

## Later / unscoped

- `packages/vite` — deferred per spec §7 until there's a real multi-doc site
  that needs dev-server integration; not needed for the CLI deliverable.
- Top-level `await`, implicit display, `ts` fences, cross-file imports — spec
  §9's open questions, intentionally not decided yet.
- Wiring `packages/site` to actually render compiled `.md` live, once the CLI
  exists to make that possible.
