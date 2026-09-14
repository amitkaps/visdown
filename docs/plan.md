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
- **Reactive codegen, full spec §4 table**: `view()` → element binding +
  `$state` (recognized shape only: `const NAME = view(EXPR);`), `$derived`/
  `$derived.by` for cells depending on a reactive one (including the
  multiple-names destructure shape), and `display()` → a per-cell slot div
  cleared at the start of each evaluation — mounted once via an action for a
  static cell, re-run inside `$effect` for a reactive one. Runtime shims
  `mountView`, `mountDisplay`, `bindDisplay` (all actions/helpers, no
  framework beyond Svelte itself). Benchmark fixtures 2 and a new `display()`
  fixture (spec §6) passing, and all fixtures verified against the real
  Svelte compiler in runes mode, not just AST-parsed.

## Next

1. **Wire `packages/site` to render compiled `.md` live** — a demo/playground
   page that runs `packages/core`'s `compile()` on a sample `.md` (or
   user-edited text) and mounts the result, so the pipeline is visible in the
   browser before there's a CLI. Priority over the CLI for now — seeing it
   work end-to-end matters more than the build-tool wrapper.
2. **`packages/cli`** (spec §7) — `visdown build <file>.md` → `<file>.html`.
   The actual v1 deliverable per the spec; deliberately held off until the
   site above proves the pipeline out.
3. **Sourcemaps** (spec §5) — v3 sourcemap from generated `.svelte` back to
   the `.md` source, so Svelte compiler diagnostics and runtime stack traces
   point at real coordinates instead of generated ones.

## Later / unscoped

- `packages/vite` — deferred per spec §7 until there's a real multi-doc site
  that needs dev-server integration; not needed for the CLI deliverable.
- Top-level `await`, implicit display, `ts` fences, cross-file imports — spec
  §9's open questions, intentionally not decided yet.
