// Compiles every `src/examples/*.md` into `src/lib/generated/*.svelte` via
// `@visdown/core`. Run via `tsx` (not loaded from `vite.config.ts` itself —
// vite-plus's config loader uses plain Node ESM resolution for a config
// file's imports, which can't follow `@visdown/core`'s NodeNext-style
// `./foo.js` specifiers back to their `.ts` sources; `tsx` can). Every
// script that needs the generated output (`dev`/`build`/`check`/`test`)
// runs this first — see package.json.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compile } from '@visdown/core';

export function generateExamples(root: string): void {
	const examplesDir = join(root, 'src/examples');
	const generatedDir = join(root, 'src/lib/generated');

	if (existsSync(generatedDir)) rmSync(generatedDir, { recursive: true });
	mkdirSync(generatedDir, { recursive: true });

	for (const file of readdirSync(examplesDir)) {
		if (!file.endsWith('.md')) continue;
		const slug = basename(file, '.md');
		const source = readFileSync(join(examplesDir, file), 'utf8');
		const { code } = compile(source, file);
		writeFileSync(join(generatedDir, `${slug}.svelte`), code);
	}
}

// `tsx scripts/generate-examples.ts` from the package root.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	generateExamples(process.cwd());
}
