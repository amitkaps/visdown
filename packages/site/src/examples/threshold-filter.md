---
title: Threshold Filter
summary: A slider drives a $derived calculation — Visdown's reactive core.
order: 2
---

```js
import { rangeInput } from '#lib/inputs';
const threshold = view(rangeInput({ min: 0, max: 100, value: 50 }));
```

```js
const doubled = threshold * 2;
```

# Threshold Filter

Move the slider: threshold is **${threshold}**, doubled is **${doubled}**.

`threshold` is a `$state` root bound to the slider. `doubled` never mentions
`view()` itself — it's `$derived` purely because it references a reactive
name, which is the whole point of the cell-level DAG (spec §4).
