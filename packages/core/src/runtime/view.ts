export interface ViewBinding<T = unknown> {
	/** The DOM element returned by the user's `view(...)` argument — e.g. an
	 *  Observable Inputs-style element with a `.value` and an `input` event. */
	el: HTMLElement & { value: T };
	/** Writes a new value back into the cell's `$state` binding. */
	set: (value: T) => void;
}

/**
 * Svelte action for a `view()` cell's slot div (spec §4): mounts the user's
 * element into the slot and wires its `input` event back to the reactive
 * value, so `use:mountView={{ el, set }}` is the whole runtime surface a
 * `view()` cell needs.
 */
export function mountView<T>(node: HTMLElement, binding: ViewBinding<T>) {
	node.appendChild(binding.el);
	const onInput = () => binding.set(binding.el.value);
	binding.el.addEventListener('input', onInput);

	return {
		destroy() {
			binding.el.removeEventListener('input', onInput);
			binding.el.remove();
		}
	};
}
