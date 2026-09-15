import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parseArgs } from 'node:util';

import { VisdownCompileError } from '@visdown/core';

import { buildHtml } from './build.js';

function usage(): never {
	console.error('Usage: visdown build <file>.md [-o <file>.html] [--ssr]');
	process.exit(1);
}

async function main(): Promise<void> {
	const { positionals, values } = parseArgs({
		args: process.argv.slice(2),
		allowPositionals: true,
		options: {
			out: { type: 'string', short: 'o' },
			ssr: { type: 'boolean', default: false }
		}
	});

	const [command, input] = positionals;
	if (command !== 'build' || !input) usage();

	const outPath = values.out ?? input.replace(/\.md$/, '') + '.html';

	let source: string;
	try {
		source = readFileSync(input, 'utf8');
	} catch {
		console.error(`visdown: can't read ${input}`);
		process.exit(1);
	}

	try {
		const html = await buildHtml(source, basename(input), { ssr: values.ssr });
		writeFileSync(outPath, html);
		console.log(`visdown: wrote ${outPath}`);
	} catch (err) {
		if (err instanceof VisdownCompileError) {
			console.error(err.message);
			process.exit(1);
		}
		throw err;
	}
}

main();
