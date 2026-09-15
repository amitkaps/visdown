import { describe, expect, it } from 'vitest';

import { buildHtml } from '../src/build.js';

const STATIC_SOURCE = `---
title: Sales Report
---

\`\`\`js
const values = [1, 2, 3];
const total = values.reduce((a, b) => a + b, 0);
\`\`\`

The total is \${total}.
`;

describe('buildHtml (spec §7)', () => {
	it('produces a single flat HTML file with the runtime and component inlined', async () => {
		const html = await buildHtml(STATIC_SOURCE, 'sales.md');

		expect(html).toContain('<!doctype html>');
		expect(html).toContain('<div id="app"></div>');
		expect(html).toContain('<title>Sales Report</title>');
		expect(html).toContain('<script type="module">');
		// The Svelte runtime and the compiled component are inlined, not
		// imported — nothing left to fetch.
		expect(html).not.toContain("from 'svelte");
		expect(html).not.toContain('from "svelte');
	}, 30000);

	it('renders the static value into the client bundle', async () => {
		const html = await buildHtml(STATIC_SOURCE, 'sales.md');
		expect(html).toContain('The total is');
	}, 30000);

	it('with --ssr, pre-renders initial markup into the body and hydrates on the client', async () => {
		const html = await buildHtml(STATIC_SOURCE, 'sales.md', { ssr: true });

		expect(html).toContain('<div id="app"><!--[--><p>The total is 6.</p><!--]--></div>');
		expect(html).toContain('hydrate(');
		expect(html).not.toContain('mount(Document');
	}, 30000);
});
