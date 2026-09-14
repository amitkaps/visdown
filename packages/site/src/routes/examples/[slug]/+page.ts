import { getExample } from '#lib';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Compiled examples call `view()`'s DOM-element argument and other
// browser-only APIs at component-init time — no `document` during SSR, and
// nothing here needs to be prerendered anyway.
export const ssr = false;
export const csr = true;
export const prerender = false;

export const load: PageLoad = async ({ params }) => {
	const example = getExample(params.slug);
	if (!example) error(404, 'Not found');

	const { default: Component } = await example.loadComponent();
	return { example, Component };
};
