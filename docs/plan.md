# Roadmap

What's next, in order. See [`spec.md`](spec.md) for the accepted design and
[`../packages/site/src/content/status.md`](../packages/site/src/content/status.md)
for what's actually implemented right now. This file is the forward-looking
counterpart to that — update it when priorities change, not on every commit.

## Done

- `packages/core`: parser → analyzer → DAG → codegen pipeline, static path
  only. Spec §6 benchmark fixture 1 passing as an AST-normalized test.
- `packages/site`: base-derived SvelteKit + Cloudflare docs shell, deployed
  to next.visdown.com, CI auto-deploys on push.

## Next

1. **Reactive codegen** (`packages/core/src/codegen`) — the "Reactive" column
   of spec §4's table: `view()` → `$state` + element ref, `$derived`/
   `$derived.by` for cells that depend on one, `$effect` for `display()`-only
   cells. This is the biggest remaining piece of `packages/core` and unlocks
   everything after it.
2. **Runtime shims** — `view()` and `display()` themselves (spec §4): the
   slot-clear-on-evaluate behavior for `display()`, the element-mount +
   input-listener wiring for `view()`.
3. **Benchmark fixture 2** (spec §6, the reactive path) passing the same
   AST-normalized way as fixture 1.
4. **`packages/cli`** (spec §7) — `visdown build <file>.md` → `<file>.html`.
   This is the actual v1 deliverable per the spec; everything above exists to
   make this possible.
5. **Sourcemaps** (spec §5) — v3 sourcemap from generated `.svelte` back to
   the `.md` source, so Svelte compiler diagnostics and runtime stack traces
   point at real coordinates instead of generated ones.

## Later / unscoped

- `packages/vite` — deferred per spec §7 until there's a real multi-doc site
  that needs dev-server integration; not needed for the CLI deliverable.
- Top-level `await`, implicit display, `ts` fences, cross-file imports — spec
  §9's open questions, intentionally not decided yet.
- Wiring `packages/site` to actually render compiled `.md` live, once the CLI
  exists to make that possible.
