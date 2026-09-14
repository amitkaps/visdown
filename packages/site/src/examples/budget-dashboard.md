---
title: Budget Dashboard
summary: view(), $derived and display() together in one document.
order: 4
---

```js
import { rangeInput } from '#lib/inputs';
const budget = view(rangeInput({ min: 100, max: 1000, value: 400, step: 50 }));
```

```js
const tax = Number(budget) * 0.08;
const withTax = Number(budget) + tax;
```

```js
display(`Budget: $${Number(budget).toFixed(0)}`);
display(`With 8% tax: $${withTax.toFixed(2)}`);
```

# Budget Dashboard

Budget is **${budget}**; with tax it's **${withTax.toFixed(2)}**.

Three cells, three shapes: `budget` is a `$state` root from the slider,
`tax`/`withTax` are `$derived.by` (two names, one reactive cell), and the
last cell is side-effects-only — it declares nothing, so it compiles to an
`$effect` that clears and redraws its own slot via `display()`.
