// Small `view()`-compatible form-element factories for the example docs
// (`src/examples/*.md`) — a real DOM element with a `.value` and an `input`
// event is all `view()` needs (spec §4); these are plain `<input>`/`<select>`
// elements, not a UI-kit dependency.

export function rangeInput(opts: {
	min: number;
	max: number;
	value: number;
	step?: number;
}): HTMLInputElement {
	const el = document.createElement('input');
	el.type = 'range';
	el.min = String(opts.min);
	el.max = String(opts.max);
	el.step = String(opts.step ?? 1);
	el.value = String(opts.value);
	return el;
}

export function selectInput(opts: { options: string[]; value?: string }): HTMLSelectElement {
	const el = document.createElement('select');
	for (const option of opts.options) {
		const optionEl = document.createElement('option');
		optionEl.value = option;
		optionEl.textContent = option;
		el.appendChild(optionEl);
	}
	if (opts.value) el.value = opts.value;
	return el;
}
