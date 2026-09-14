/** Appends one displayed value into a cell's slot (spec §4's `display()`). A
 *  DOM node is appended as-is; anything else is stringified as a text node. */
export type DisplayAppender = (value: unknown) => void;

/** Clears the slot and returns an appender bound to it — "the slot is
 *  cleared at the start of each cell evaluation" (spec §4). Called once per
 *  evaluation (once at mount for a static cell, once per `$effect` run for a
 *  reactive one), never per `display()` call. */
export function bindDisplay(container: Element): DisplayAppender {
	container.replaceChildren();
	return (value: unknown) => {
		container.append(value instanceof Node ? value : document.createTextNode(String(value)));
	};
}

/**
 * Svelte action for a static `display()`-only cell's slot div: runs once at
 * mount (spec §4's "inline in slot init" row — no `$effect`, since nothing
 * in the cell is reactive) with `display` bound to this slot.
 */
export function mountDisplay(node: Element, run: (display: DisplayAppender) => void) {
	run(bindDisplay(node));
	return {
		destroy() {
			node.replaceChildren();
		}
	};
}
