import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { Component } from 'svelte';

// Raw .md source, for the "view source" pane — eager, since it's tiny text.
const files = import.meta.glob('/src/examples/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

// Compiled components (see scripts/generate-examples.ts) — lazy, since these
// pull in Svelte's client runtime and only one is ever rendered at a time.
const components = import.meta.glob('/src/lib/generated/*.svelte') as Record<
	string,
	() => Promise<{ default: Component }>
>;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const frontmatterSchema = z.object({
	title: z.string().min(1),
	summary: z.string().min(1),
	order: z.number().int()
});

export type Example = z.infer<typeof frontmatterSchema> & {
	slug: string;
	source: string;
	loadComponent: () => Promise<{ default: Component }>;
};

function render(path: string, source: string): Example {
	const slug = path.slice('/src/examples/'.length, -'.md'.length);

	const match = FRONTMATTER.exec(source);
	if (!match) throw new Error(`${path}: missing YAML frontmatter`);

	const raw = (parseYaml(match[1]) ?? {}) as Record<string, unknown>;
	for (const [key, value] of Object.entries(raw)) {
		if (value === null || value === '') delete raw[key];
	}

	const parsed = frontmatterSchema.safeParse(raw);
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
			.join('; ');
		throw new Error(`${path}: invalid frontmatter — ${issues}`);
	}

	const componentPath = `/src/lib/generated/${slug}.svelte`;
	const loadComponent = components[componentPath];
	if (!loadComponent) {
		throw new Error(
			`${path}: no generated component at ${componentPath} — did generate-examples.ts run?`
		);
	}

	return { ...parsed.data, slug, source, loadComponent };
}

export const examples: Example[] = Object.entries(files)
	.map(([path, source]) => render(path, source))
	.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

export const getExample = (slug: string): Example | undefined =>
	examples.find((example) => example.slug === slug);
