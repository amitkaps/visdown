import { advanceLoc } from '../loc.js';
import type { SourceLocation, TemplateNode } from '../types.js';

type TextOrExpression = Extract<TemplateNode, { type: 'text' | 'expression' }>;

/**
 * Scan a plain-text string for `${expr}` interpolation (spec §3). `\${` escapes
 * to a literal `${`. Brace-depth tracking (not string-literal aware) lets a
 * simple nested-object expression like `${a ? {x} : {y}}` survive; a `}`
 * inside a string literal within the expression is a known v1 limitation.
 */
export function scanInterpolation(value: string, start: SourceLocation): TextOrExpression[] {
	const nodes: TextOrExpression[] = [];
	let loc = start;
	let buf = '';
	let bufStart = loc;
	let i = 0;

	const flush = () => {
		if (buf) {
			nodes.push({ type: 'text', value: buf, loc: bufStart });
			buf = '';
		}
	};

	while (i < value.length) {
		if (value.startsWith('\\${', i)) {
			if (buf === '') bufStart = loc;
			buf += '${';
			loc = advanceLoc(loc, '\\${');
			i += 3;
			continue;
		}

		if (value.startsWith('${', i)) {
			flush();
			const exprLoc = advanceLoc(loc, '${');
			let depth = 1;
			let j = i + 2;
			let expr = '';
			while (j < value.length && depth > 0) {
				const ch = value[j];
				if (ch === '{') depth++;
				else if (ch === '}') {
					depth--;
					if (depth === 0) break;
				}
				expr += ch;
				j++;
			}
			const closed = j < value.length;
			nodes.push({ type: 'expression', code: expr, loc: exprLoc });
			const consumed = value.slice(i, closed ? j + 1 : j);
			loc = advanceLoc(loc, consumed);
			i = closed ? j + 1 : j;
			bufStart = loc;
			continue;
		}

		if (buf === '') bufStart = loc;
		buf += value[i];
		loc = advanceLoc(loc, value[i]);
		i++;
	}

	flush();
	return nodes;
}

export interface InterpolatedAttr {
	/** A JS template-literal source (no surrounding backticks) when dynamic. */
	expression: boolean;
	value: string;
}

/** Same scan, folded into a single attribute value: static text stays a plain
 *  string, any `${}` promotes the whole attribute to a Svelte expression
 *  (`name={\`...\`}`) built from a JS template literal. */
export function scanAttrValue(value: string, start: SourceLocation): InterpolatedAttr {
	const parts = scanInterpolation(value, start);
	if (parts.every((p) => p.type === 'text')) return { expression: false, value };

	const literal = parts
		.map((p) =>
			p.type === 'text' ? p.value.replace(/[`\\]/g, '\\$&').replace(/\$\{/g, '\\${') : `\${${p.code}}`
		)
		.join('');
	return { expression: true, value: `\`${literal}\`` };
}
