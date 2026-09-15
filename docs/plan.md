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
- **Live examples on `packages/site`**: `src/examples/*.md` compiled to real
  Svelte components at dev/build time (`scripts/generate-examples.ts`, run via
  `tsx` ahead of `dev`/`build`/`check`/`test` — not a Vite plugin, since
  vite-plus's config loader can't resolve `@visdown/core`'s TS sources itself)
  and served from `/examples` and `/examples/[slug]` (client-rendered only:
  `ssr = false`, since `view()`'s DOM calls need a browser). Four examples —
  static, `view()`/`$derived`, `display()`, and all three combined — each with
  a "view source" toggle. Verified in a real headless-Chromium run: all four
  render with no console errors, and both interactive paths (slider →
  `$derived`, `<select>` → `display()` redraw) update correctly on input.
- **Sourcemaps** (spec §5): `compile()` returns `{ code, map }` — a v3
  sourcemap from the generated `.svelte` back to the `.md`. Codegen embeds
  invisible position markers (`mark`/`markVerbatim` in `src/sourcemap.ts`)
  wherever it emits source-derived text, then `finalizeOutput` strips them
  into a real `SourceMapGenerator` (per-marked-chunk granularity, not
  character-perfect — enough for a stack trace or Svelte diagnostic to land
  on the right `.md` line). `packages/site`'s `generate-examples.ts` now
  writes a sibling `.svelte.map` next to each generated example.
- **`packages/cli`** (spec §7): `visdown build <file>.md` → `<file>.html`,
  one flat file. Calls `svelte.compile()` directly (`generate: 'client'`,
  runes mode), then bundles the compiled component + Svelte's client runtime
  + any `@visdown/core/runtime` imports with `esbuild` (resolved from
  `packages/cli`'s own `node_modules`, not the invoking cwd) into a single
  inlined `<script type="module">`. `--ssr` additionally compiles with
  `generate: 'server'`, runs `svelte/server`'s `render()` in a throwaway
  child module to get real initial markup, and switches the client bundle
  from `mount()` to `hydrate()`. Verified against the spec §6 fixture in a
  real headless-Chromium run, both with and without `--ssr`, zero console
  errors. `esbuild` and `oxc-parser` (native binaries) and `yaml` (an
  esbuild/CJS-interop edge case) stay real dependencies rather than being
  bundled into the CLI's own `dist/cli.js`.

## Next

Spec §8's task checklist (1–7) is now complete: parser, analyzer, DAG,
codegen with sourcemaps, runtime shims, both benchmark fixtures, and the CLI.
Nothing is queued next — see "Later / unscoped" below for what's deliberately
not being built yet, and spec §9 for open design questions that would need a
real decision (not just an afternoon of code) before picking up.

## Later / unscoped

- `packages/vite` — deferred per spec §7 until there's a real multi-doc site
  that needs dev-server integration; not needed for the CLI deliverable.
- Top-level `await`, implicit display, `ts` fences, cross-file imports — spec
  §9's open questions, intentionally not decided yet.
