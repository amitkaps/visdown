---
title: Status
summary: 'What of the v1 task checklist is implemented, and what is still pending.'
order: 2
---

Tracking the spec's own task checklist (§8). Updated by hand as pieces land —
not generated from the code.

## Implemented

- `MarkdownParser` interface + remark/mdast adapter, `${}` scanning with
  fence/code-span masking (§3).
- oxc analyzer: per-cell declared names, free references, source locs (§2).
- DAG engine: reactive-root marking from `view()`, transitive propagation,
  topological sort, cycle + duplicate-declaration detection (§4).
- Codegen for the **static** path: single-expression and multiple-declared-name
  cells hoist directly; multi-statement single-name cells wrap in an IIFE.
  Template serialization with brace escaping and `<svelte:head>` from
  frontmatter.
- Codegen for the **reactive** path, minus `display()`: `view()` compiles to
  an element binding + `$state`, with a runtime `mountView` action (in
  `packages/core/src/runtime`) mounting the element into its cell's slot and
  wiring its `input` event back. Cells depending on a reactive one compile to
  `$derived`/`$derived.by`, including the multiple-names object-destructure
  shape. Only the recognized `const NAME = view(EXPR);` call shape is
  supported — anything else calling `view()` is rejected explicitly.
- Benchmark fixtures 1 and 2 (§6) — static and reactive paths — passing as
  AST-normalized/structural tests, and both verified to compile with the real
  Svelte compiler in runes mode, not just parse.

## Pending

- `display()` codegen — the per-cell slot-clearing `$effect` path (§4). Cells
  calling `display()` are rejected explicitly for now rather than mis-emitted.
- The runtime shim for `display()` itself (`view()`'s `mountView` is done).
- `packages/cli` — `visdown build <file>.md` → `<file>.html` (§7, the actual
  v1 deliverable).
- Sourcemap emission from generated `.svelte` back to the `.md` source (§5).
- `packages/vite` — deferred per spec §7 until there's a real multi-doc site
  that needs it.
