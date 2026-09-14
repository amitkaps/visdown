---
title: Sales Report
summary: A fully static document — no view(), no reactivity, just computed values.
order: 1
---

```js
const values = [120, 340, 275, 90];
const total = values.reduce((a, b) => a + b, 0);
```

# Sales Report

The total across ${values.length} orders is **${total}**.

Nothing here reacts to anything — the cell runs once, and its values hoist
straight into the template as plain `const`s.
