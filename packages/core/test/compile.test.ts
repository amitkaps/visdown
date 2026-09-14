import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';

import { compile, VisdownCompileError } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));

const POSITION_KEYS = new Set(['start', 'end', 'loc', 'character', 'name_loc']);

/** Strip source positions and collapse incidental whitespace so codegen is
 *  free to vary formatting/declaration order without failing the comparison
 *  (spec §6: "tests compare normalised ASTs, not strings"). */
function normalize(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value
			.map(normalize)
			.filter((v) => !(v && typeof v === 'object' && (v as { type?: string }).type === 'Text' && (v as { data?: string }).data === ''));
	}
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {};
		for (const [key, v] of Object.entries(value)) {
			if (POSITION_KEYS.has(key)) continue;
			if ((key === 'data' || key === 'raw') && typeof v === 'string') {
				out[key] = v.replace(/\s+/g, ' ').trim();
				continue;
			}
			out[key] = normalize(v);
		}
		return out;
	}
	return value;
}

function normalizedAst(source: string) {
	return normalize(parse(source, { modern: true }));
}

describe('compile — fixture 1 (static, spec §6)', () => {
	it('matches the spec-expected Svelte output as a normalized AST', () => {
		const source = readFileSync(join(here, 'fixtures/sales.md'), 'utf8');
		const { code } = compile(source, 'sales.md');

		const expected = `
<script>
  import { sum } from "some-package";

  const values = [1, 2, 3];
  const total = sum(values);
</script>

<svelte:head>
  <title>Sales Report</title>
</svelte:head>

<h1>Sales</h1>
<p>The total is {total}.</p>
`.trim();

		expect(normalizedAst(code)).toEqual(normalizedAst(expected));
	});

	it('emits no $derived/$state — nothing here depends on view()', () => {
		const source = readFileSync(join(here, 'fixtures/sales.md'), 'utf8');
		const { code } = compile(source, 'sales.md');
		expect(code).not.toContain('$derived');
		expect(code).not.toContain('$state');
	});
});

describe('compile — spec §5 error cases', () => {
	it('rejects a duplicate top-level declaration across cells', () => {
		const source = [
			'```js',
			'const total = 1;',
			'```',
			'',
			'```js',
			'const total = 2;',
			'```'
		].join('\n');
		expect(() => compile(source, 'dup.md')).toThrow(VisdownCompileError);
		expect(() => compile(source, 'dup.md')).toThrow(/Duplicate declaration 'total'/);
	});

	it('rejects a circular reference between cells', () => {
		const source = [
			'```js',
			'const sales = total + 1;',
			'```',
			'',
			'```js',
			'const total = sales + 1;',
			'```'
		].join('\n');
		expect(() => compile(source, 'cycle.md')).toThrow(VisdownCompileError);
		expect(() => compile(source, 'cycle.md')).toThrow(/Circular dependency/);
	});

	it('rejects a reference to a name not declared in any cell', () => {
		const source = ['```js', 'const total = missing + 1;', '```'].join('\n');
		expect(() => compile(source, 'undef.md')).toThrow(VisdownCompileError);
		expect(() => compile(source, 'undef.md')).toThrow(/'missing' is not defined in any cell/);
	});

	it('rejects an undefined reference inside a `${}` expression', () => {
		const source = ['```js', 'const total = 1;', '```', '', 'Value: ${missing}.'].join('\n');
		expect(() => compile(source, 'undef-expr.md')).toThrow(VisdownCompileError);
		expect(() => compile(source, 'undef-expr.md')).toThrow(/'missing' is not defined in any cell/);
	});

	it('rejects a reserved-but-unimplemented fence language', () => {
		const source = ['```sql', 'select 1;', '```'].join('\n');
		expect(() => compile(source, 'sql.md')).toThrow(VisdownCompileError);
		expect(() => compile(source, 'sql.md')).toThrow(/Language 'sql' is not supported in v1/);
	});
});
