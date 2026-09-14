import { defineConfig } from 'vite-plus';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';

const generated = [
	'.svelte-kit/**',
	'build/**',
	'worker-configuration.d.ts',
	'src/lib/generated/**'
];

// The SvelteKit plugin installs a dev-server hook that is incompatible with the
// Vitest environment. Unit tests cover pure modules plus `import.meta.glob`
// content loading, none of which need SvelteKit.
const inTest = !!process.env.VITEST;

export default defineConfig({
	plugins: inTest
		? []
		: [
				sveltekit({
					// SvelteKit 3 takes these options flat — not under a `kit` key.
					prerender: {
						handleHttpError: ({ referrer, message }) => {
							throw new Error(`${message} (linked from ${referrer})`);
						}
					},
					compilerOptions: {
						// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
						runes: ({ filename }) =>
							filename.split(/[/\\]/).includes('node_modules') ? undefined : true
					},
					adapter: adapter()
				})
			],

	// Oxfmt — `vp fmt` / `vp check`. Formats .ts/.js/.svelte/.css/.json.
	fmt: {
		useTabs: true,
		singleQuote: true,
		semi: true,
		printWidth: 100,
		trailingComma: 'none',
		svelte: { indentScriptAndStyle: true },
		sortPackageJson: true,
		ignorePatterns: [...generated, 'pnpm-lock.yaml', 'CHANGELOG.md']
	},

	// Oxlint — `vp lint` / `vp check`. Lints .ts/.js only; `.svelte` type + a11y
	// diagnostics come from `pnpm check:svelte`.
	lint: {
		plugins: ['typescript', 'unicorn', 'import'],
		categories: { correctness: 'error' },
		options: { typeAware: true, typeCheck: true },
		ignorePatterns: generated
	},

	// Vitest — `vp test`.
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
