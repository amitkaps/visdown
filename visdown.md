# Visdown v2 — Implementation Spec

Markdown in, Svelte 5 out. Reactive cells, Observable-style, compiled statically.

## 0. Scope for v1

| In | Out |
|---|---|
| `js` fenced cells | `ts`, `sql`, `dot`, `tex` and all other langs |
| `${}` inline interpolation | Implicit display of trailing expressions |
| `view()`, `display()` | `Mutable`, generators, top-level `await` |
| SSR + client hydration | Type checking |

Non-`js` fenced blocks are **not cells**. They render as ordinary code blocks. A fence tagged with a lang in the reserved-but-unimplemented set (`ts`, `sql`, ...) raises a source-mapped error rather than silently rendering.

---

## 1. Pipeline

```
Raw .md source
   │
   ▼
[MarkdownParser adapter]  →  ParsedDocument (frontmatter, cells, node list)
   │
   ▼
[OXC analyzer]            →  per-cell declared names, references, source locs
   │
   ▼
[DAG engine]              →  reactive-root marking, topological order, cycle detection
   │
   ▼
[Svelte codegen]          →  <script> + interleaved markup + display slots + sourcemap
   │
   ▼
[Svelte compiler / Vite]  →  SSR HTML / hydrated bundle
```

---

## 2. Core contracts

### `packages/core/src/types.ts`

```ts
export interface SourceLocation {
  line: number;    // 1-based, in the .md source
  column: number;  // 0-based
}

export interface Cell {
  id: string;              // stable: `cell-${index}`
  code: string;
  lang: 'js';
  loc: SourceLocation;     // start of the code body, not the fence
}

/** Template is a node list, never a string. Codegen owns serialisation. */
export type TemplateNode =
  | { type: 'element'; tag: string; attrs: Attr[]; children: TemplateNode[]; loc: SourceLocation }
  | { type: 'text'; value: string; loc: SourceLocation }
  | { type: 'expression'; code: string; loc: SourceLocation }   // from ${...}
  | { type: 'cellSlot'; cellId: string; loc: SourceLocation }   // display() target
  | { type: 'raw'; html: string; loc: SourceLocation };         // author-authored HTML only

export interface ParsedDocument {
  frontmatter: Record<string, unknown>;
  cells: Cell[];
  template: TemplateNode[];
}

export interface MarkdownParser {
  parse(source: string): ParsedDocument;
}
```

**Why a node list, not a string.** String markup forces regex splicing to insert expressions and slots, which is the failure mode the `@html` removal was meant to avoid. Codegen serialises once, at the end, and is the only place that knows Svelte's escaping rules.

**Parser choice: remark/mdast.** Comark was evaluated and rejected: 0.x with no stability promise, docs explicitly warn upgrades can change output, and a beta markdown-it fork (`markdown-exit@1.1.0-beta.2`) three layers down — not a foundation to build a compiler on. remark/mdast is mature, pure JS/TS (no Rust/WASM either way), and gives us a stable AST to write the cell-extraction and `${}`-tagging pass against.

The `MarkdownParser` interface keeps this swappable — if Comark stabilises past 1.0, or if `display()` output later wants its component syntax (`::callout{...}`) for rich widgets, it's a contained adapter swap, not a rewrite.

**Source locations.** remark/mdast gives full `{ line, column, offset }` on every node, including text nodes — no gap to work around here, unlike Comark's line-only/element-only metadata. §5's `loc.column` contract holds natively.

---

## 3. Interpolation

Sole trigger: `${expr}`.

- A bare `{` or `}` in prose, JSON, or CSS is **inert**. No escaping needed. This is the entire reason for choosing `${}` over `{}`.
- `\${` emits a literal `${`.
- Inert inside fenced code blocks and inline code spans — the parser must mark those regions before scanning.
- Legal in any inline position: paragraphs, headings, list items, table cells, link text, link URLs.
- `expr` is any JS expression. It is parsed by oxc and its free identifiers join the dependency graph like any other cell reference.
- Codegen escapes `{` and `}` in every `text` node when serialising to Svelte.

---

## 4. Reactivity model

**The cell is the unit of reactivity.** Not the declaration.

`const` and `let` mean exactly what they mean in JS — reassignability — and nothing about rune-ness. That axis is orthogonal and collapsing them was the v1 draft's central bug.

### Reactive roots

A cell is a **root** if it calls `view()`. That is the only source of external mutation in v1.

### Propagation

A cell is **reactive** if it transitively references a name declared by a reactive cell. Otherwise it is **static** and emits plain JS with no rune.

### Codegen per cell

| Cell shape | Static | Reactive |
|---|---|---|
| Single expression, one name | `const x = expr;` | `const x = $derived(expr);` |
| Multiple statements, one exported name | `const x = (() => { ... })();` | `const x = $derived.by(() => { ... });` |
| Multiple declared names | see hoisting below | see hoisting below |
| `view(...)` call | n/a — always reactive | `let x = $state(...)` + element ref |
| Side effects only (`display()`) | inline in slot init | `$effect(() => { ... })` |

### Multiple names per cell

A cell declaring several top-level names compiles to one `$derived.by` returning an object, immediately destructured:

```js
// cell source
const lo = range[0];
const hi = range[1];
```

```svelte
const { lo, hi } = $derived.by(() => {
  const lo = range[0];
  const hi = range[1];
  return { lo, hi };
});
```

Static equivalents hoist directly with no wrapper.

### `view()`

```js
const threshold = view(Inputs.range([0, 100]));
```

compiles to two bindings — the element, mounted into the cell's slot, and the value, which is the `$state` root:

```svelte
const threshold__el = Inputs.range([0, 100]);
let threshold = $state(threshold__el.value);
// element mounted into slot; 'input' listener writes back to threshold
```

Both are needed: the element must render *and* the value must be readable in the same cell.

### `display()`

Explicit only. Nothing renders unless `display(v)` is called. A trailing bare expression renders nothing.

- Each cell owns a slot div, emitted at the cell's position in the source document. Output appears where the cell is written.
- **The slot is cleared at the start of each cell evaluation**, then every `display()` call in that run appends. Two calls in one run both show; a re-run wipes both and redraws. Reset per evaluation, not per call.
- `display()` outside a cell is an error.

---

## 5. Errors

All compile errors carry `.md` coordinates.

```ts
export class VisdownCompileError extends Error {
  constructor(message: string, file: string, loc: SourceLocation) {
    super(`${file}:${loc.line}:${loc.column}\n${message}`);
    this.name = 'VisdownCompileError';
  }
}
```

Required cases:

| Condition | Message |
|---|---|
| Cycle in the DAG | `Circular dependency: sales → total → sales` |
| Same top-level name declared in two cells | `Duplicate declaration 'total' (also declared at 12:3)` |
| Reference to an undeclared name | `'foo' is not defined in any cell` |
| Non-`js` reserved lang on a fence | `Language 'sql' is not supported in v1` |
| `display()` outside a cell | `display() may only be called inside a js cell` |
| Reassignment of a `$derived` binding | `Cannot reassign derived value 'total'` |

**Sourcemaps are not optional.** Error locs cover only errors Visdown throws. Svelte compiler diagnostics and runtime stack traces will otherwise point at generated `.svelte` coordinates. Codegen must emit a v3 sourcemap from the generated component back to the `.md`, or the loc plumbing only half-pays.

---

## 6. Benchmark fixture

Must pass before Phase 1 closes.

### Input — `routes/sales.md`

~~~markdown
---
title: Sales Report
---

# Sales

```js
import { sum } from "some-package";
const values = [1, 2, 3];
const total = sum(values);
```

The total is ${total}.
~~~

### Expected output

```svelte
<script>
  import { sum } from "some-package";

  const values = [1, 2, 3];
  const total = sum(values);
</script>

<svelte:head>
  <title>Sales Report</title>
</svelte:head>

<h1>Sales</h1>
<p>The total is {total}.</p>
```

**No `$derived`.** Nothing here depends on a `view()` root, so every binding is static. This is the case the v1 draft got wrong by deriving from `const`-ness instead of from reactivity.

### Second fixture — reactive path

~~~markdown
```js
const threshold = view(Inputs.range([0, 100]));
```

Threshold is ${threshold}.

```js
const doubled = threshold * 2;
```
~~~

`threshold` is a `$state` root; `doubled` is `$derived`; the `${threshold}` expression is a live reference.

### Comparison

Tests compare **normalised ASTs**, not strings. String equality breaks on whitespace and declaration order.

---

## 7. Delivery target: CLI, not a site

**`visdown build sales.md` → `sales.html`** — one flat file, no dev server, no project scaffold.

Same three pipeline stages (parse → analyze → DAG → codegen) as any other path. The difference is only the last step: instead of handing the generated `.svelte` string to Vite, the CLI calls `svelte.compile()` itself and inlines the result — compiled component JS, Svelte's small client runtime, and (optionally) SSR'd initial markup — into a single `<script>` + body in one HTML file.

This is the actual v1 deliverable. It's what makes "no dev site" literally true: open the file, or drop it anywhere, nothing to install or run.

A **Vite plugin** (`packages/vite`, mdsvex-shaped — claims `.md`, transforms to Svelte source in a `transform()` hook, hands off to `vite-plugin-svelte`) is deferred, optional infrastructure for later, only worth building once there's an actual multi-doc site with routing, shared layout, and hot-reload needs. It reuses the same `packages/core` pipeline; the CLI does not block it and isn't blocked by it.

---

## 8. Task checklist

1. `MarkdownParser` interface + remark/mdast adapter → `ParsedDocument` with `TemplateNode[]`, locs on every node (native from mdast), `${}` scanning with fence/code-span masking.
2. oxc analyzer: per-cell declared names, free references, reassignments, source locs. Same pass over `${}` expressions.
3. DAG: root marking from `view()`, transitive reactive propagation, topological sort, cycle + duplicate-name detection with locs.
4. Codegen: single `<script>`, `<svelte:head>` from frontmatter, template serialisation with brace escaping, per-cell slot divs, sourcemap emission.
5. Runtime shims: `view()`, `display()`, slot clear-on-evaluate.
6. Integration tests: both fixtures, AST-normalised.
7. CLI: `packages/cli` — `visdown build <file>.md` → `<file>.html`, calls `svelte.compile()` directly, inlines runtime + component, optional `--ssr` flag for pre-rendered markup.
8. Vite plugin (`packages/vite`) — deferred until a multi-doc site is actually needed.

---

## 9. Open

- **Top-level `await`.** Deliberately excluded. Notebook-style documents lean on it, so decide before v2: `$derived.by` can't be async, so it needs a promise-state wrapper or a `{#await}` block per cell.
- **Implicit display.** Excluded for v1. Purely additive if authors complain.
- **`ts`.** A strip-types pass inserted between analysis and codegen. No typechecking. Not a redesign.
- **Cross-file imports between `.md` documents.** Unspecified.
- **Comark, revisited.** Rejected for now on maturity grounds (0.x, output-changing upgrades, beta dependency). Worth a second look only if it reaches 1.0 and `display()` output later wants component syntax for rich widgets — pass it our own heading-id/slug logic rather than trusting its slugger, per the regression findings.