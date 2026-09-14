---
title: Overview
summary: 'What Visdown v2 is, and where the spec lives.'
order: 1
---

Visdown compiles markdown into reactive Svelte 5 components. A fenced ` ```js `
block is a **cell** — a unit of reactivity, not a plain code sample — and
`${expr}` anywhere in the surrounding prose is a live interpolation into that
same reactive graph. Cells that call `view()` become `$state` roots; anything
that transitively depends on one becomes `$derived`; everything else compiles
down to plain, static JS.

The full spec — pipeline, contracts, the reactivity model, and the error
cases a compiler build has to get right — lives in
[`visdown.md`](https://github.com/amitkaps/visdown/blob/next.visdown.com/visdown.md)
at the root of the repo.

See [Status](/status) for what's implemented so far.
