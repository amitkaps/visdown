import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { compile as compileVisdown } from '@visdown/core';
import esbuild from 'esbuild';
import { compile as compileSvelte } from 'svelte/compiler';

export interface BuildOptions {
	/** Also render initial markup server-side and hydrate on the client,
	 *  instead of mounting cold (spec §7). */
	ssr?: boolean;
}

// packages/cli's own node_modules — where `svelte`, `@visdown/core`, and
// their transitive deps actually live — resolved relative to this module's
// own location so it works the same from `src/` (via tsx) and from the
// bundled `dist/cli.js` (both one level below the package root).
const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

const COMPONENT_FILENAME = 'Document.svelte';
const COMPONENT_NAME = 'Document';

interface SsrResult {
	head: string;
	body: string;
}

/** `visdown build <file>.md` → a single flat `.html` string: the Svelte
 *  component this `.md` compiles to, its runtime, and (with `--ssr`) its
 *  pre-rendered initial markup, all inlined — nothing left to install or
 *  fetch at open time (spec §7). */
export async function buildHtml(source: string, sourceFile: string, options: BuildOptions = {}): Promise<string> {
	const { code } = compileVisdown(source, sourceFile);

	const ssr = options.ssr ? await renderServer(code) : undefined;
	const clientBundle = await bundleClient(code, Boolean(options.ssr));

	const title = extractTitle(code) ?? basename(sourceFile).replace(/\.md$/, '');
	const bodyHtml = ssr ? `<div id="app">${ssr.body}</div>` : '<div id="app"></div>';
	const headExtra = ssr ? ssr.head : `<title>${escapeHtml(title)}</title>`;

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${headExtra}
</head>
<body>
${bodyHtml}
<script type="module">
${clientBundle}
</script>
</body>
</html>
`;
}

async function bundleClient(svelteCode: string, ssr: boolean): Promise<string> {
	const client = compileSvelte(svelteCode, { filename: COMPONENT_FILENAME, runes: true, generate: 'client' });
	const mountFn = ssr ? 'hydrate' : 'mount';
	const entry = `${client.js.code}
import { ${mountFn} } from 'svelte';
${mountFn}(${COMPONENT_NAME}, { target: document.getElementById('app') });
`;
	return bundle(entry, 'browser');
}

async function renderServer(svelteCode: string): Promise<SsrResult> {
	const server = compileSvelte(svelteCode, { filename: COMPONENT_FILENAME, runes: true, generate: 'server' });
	const entry = `${server.js.code}
import { render } from 'svelte/server';
export const __visdownSsr = render(${COMPONENT_NAME});
`;
	const bundled = await bundle(entry, 'node');
	const mod = (await importInlineModule(bundled)) as { __visdownSsr: SsrResult };
	return mod.__visdownSsr;
}

async function bundle(contents: string, platform: 'browser' | 'node'): Promise<string> {
	const result = await esbuild.build({
		stdin: { contents, resolveDir: PACKAGE_ROOT, loader: 'js' },
		bundle: true,
		write: false,
		format: 'esm',
		platform
	});
	return result.outputFiles[0]!.text;
}

/** Runs a bundled ESM string by writing it to a throwaway file and importing
 *  it — Node has no `import()` for an in-memory module string. */
async function importInlineModule(code: string): Promise<unknown> {
	const dir = mkdtempSync(join(tmpdir(), 'visdown-cli-'));
	const file = join(dir, 'ssr.mjs');
	writeFileSync(file, code);
	return import(pathToFileURL(file).href);
}

function extractTitle(svelteCode: string): string | undefined {
	return /<title>([^<]*)<\/title>/.exec(svelteCode)?.[1];
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
