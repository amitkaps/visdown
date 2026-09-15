// Bundles `src/cli.ts` into a single runnable `dist/cli.js` — the CLI's
// `bin` entry. Bundled (not just `tsc`'d) so a published/`npx`'d install
// doesn't need `@visdown/core`'s own NodeNext `.js`-to-`.ts` resolution or a
// `node_modules` tree at run time beyond `esbuild` itself, which stays a
// runtime dependency (`buildHtml` calls it too, to bundle the *document's*
// output — see src/build.ts).
import esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['src/cli.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	outfile: 'dist/cli.js',
	banner: { js: '#!/usr/bin/env node' },
	// esbuild and oxc-parser (the latter pulled in transitively by
	// @visdown/core's analyzer) ship native/platform binaries — bundling
	// them breaks their own runtime lookup of those binaries, so they stay
	// real `node_modules` dependencies instead. `yaml` (also transitive, via
	// @visdown/core's frontmatter parsing) does an internal conditional
	// `require('process')` that esbuild's ESM/CJS interop shim can't
	// resolve when bundled in — leaving it a real dependency sidesteps that
	// rather than fighting the bundler about it.
	external: ['esbuild', 'oxc-parser', 'yaml']
});
