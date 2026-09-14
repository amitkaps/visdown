import type { SourceLocation } from './types.js';

/** Advance a SourceLocation by the characters in `str` (newline-aware). */
export function advanceLoc(loc: SourceLocation, str: string): SourceLocation {
	let { line, column } = loc;
	for (const ch of str) {
		if (ch === '\n') {
			line++;
			column = 0;
		} else {
			column++;
		}
	}
	return { line, column };
}

/** Resolve a byte offset into `code` (0-based) to a SourceLocation, given the
 *  SourceLocation of `code`'s own first character. */
export function offsetToLoc(code: string, offset: number, base: SourceLocation): SourceLocation {
	return advanceLoc(base, code.slice(0, offset));
}

/** mdast's `Point.column` is 1-based; §2's `SourceLocation.column` is 0-based. */
export function fromMdastPoint(point: { line: number; column: number }): SourceLocation {
	return { line: point.line, column: point.column - 1 };
}
