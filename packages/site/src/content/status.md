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
- Codegen for the **reactive** path: `view()` compiles to an element binding
  + `$state`, with a runtime `mountView` action (in `packages/core/src/runtime`)
  mounting the element into its cell's slot and wiring its `input` event back.
  Cells depending on a reactive one compile to `$derived`/`$derived.by`,
  including the multiple-names object-destructure shape. Only the recognized
  `const NAME = view(EXPR);` call shape is supported — anything else calling
  `view()` is rejected explicitly.
- Codegen for **`display()`**: a side-effect-only cell (no declared name) gets
  its own slot div, cleared at the start of each evaluation. A cell with no
  reactive dependency mounts its `display()` calls once via a `mountDisplay`
  action; a cell depending on a reactive name re-runs inside `$effect`, via
  `bindDisplay`. `display()` combined with a declared name in the same cell,
  or called outside a js cell (e.g. inside a `${}` expression), is rejected
  explicitly.
- Benchmark fixtures 1 and 2 (§6) — static and reactive paths — passing as
  AST-normalized/structural tests, plus a `display()` fixture, and all
  verified to compile with the real Svelte compiler in runes mode, not just
  parse.

## Pending

- `packages/cli` — `visdown build <file>.md` → `<file>.html` (§7, the actual
  v1 deliverable).
- Sourcemap emission from generated `.svelte` back to the `.md` source (§5).
- `packages/vite` — deferred per spec §7 until there's a real multi-doc site
  that needs it.
