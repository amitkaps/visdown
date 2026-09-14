---
title: Order Status
summary: display() renders explicit output into its own slot, redrawn on every change.
order: 3
---

```js
import { selectInput } from '#lib/inputs';
const status = view(
	selectInput({ options: ['pending', 'shipped', 'delivered'], value: 'pending' })
);
```

```js
const NOTE = {
	pending: 'Awaiting fulfillment.',
	shipped: 'On its way — tracking sent.',
	delivered: 'Delivered.'
};
```

```js
display(`Status: ${status}`);
display(NOTE[status]);
```

# Order Status

Pick a status above. The cell below calls `display()` twice; both lines
appear, and both are wiped and redrawn — never appended to — on every change,
since the slot clears once per evaluation, not once per `display()` call.
