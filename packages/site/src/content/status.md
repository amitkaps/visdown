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
- Codegen for the **static** path only: single-expression and
  multiple-declared-name cells hoist directly; multi-statement single-name
  cells wrap in an IIFE. Template serialization with brace escaping and
  `<svelte:head>` from frontmatter.
- Benchmark fixture 1 (§6) — the fully static case — passing as an
  AST-normalized test.

## Pending

- Reactive codegen: `view()` → `$state`, `$derived`/`$derived.by`, `$effect`,
  and `display()`'s per-cell slot divs.
- The runtime shims `view()` and `display()` themselves.
- `packages/cli` — `visdown build <file>.md` → `<file>.html` (§7, the actual
  v1 deliverable).
- Sourcemap emission from generated `.svelte` back to the `.md` source (§5).
- `packages/vite` — deferred per spec §7 until there's a real multi-doc site
  that needs it.
