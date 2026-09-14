import { describe, expect, it } from 'vite-plus/test';
import { examples, getExample } from './examples';

describe('examples', () => {
	it('loads every example markdown file and resolves it by slug', () => {
		expect(examples.length).toBeGreaterThanOrEqual(3);
		for (const example of examples) {
			expect(getExample(example.slug)).toBe(example);
		}
	});

	it('takes title and summary from frontmatter', () => {
		for (const example of examples) {
			expect(example.title).toBeTruthy();
			expect(example.summary).toBeTruthy();
		}
	});

	it('orders examples by their frontmatter order', () => {
		const orders = examples.map((example) => example.order);
		expect(orders).toEqual([...orders].sort((a, b) => a - b));
	});

	it('keeps the raw markdown source, frontmatter included', () => {
		for (const example of examples) {
			expect(example.source).toMatch(/^---/);
		}
	});

	it('resolves a matching compiled component for every example', () => {
		for (const example of examples) {
			expect(example.loadComponent).toBeTypeOf('function');
		}
	});

	it('returns undefined for an unknown slug', () => {
		expect(getExample('nope')).toBeUndefined();
	});
});
