import { describe, expect, it } from 'vite-plus/test';
import { docs, getDoc } from './docs';

describe('docs', () => {
	it('loads every markdown file and resolves it by slug', () => {
		expect(docs.length).toBeGreaterThan(0);
		for (const doc of docs) {
			expect(getDoc(doc.slug)).toBe(doc);
		}
	});

	it('takes title and summary from frontmatter', () => {
		for (const doc of docs) {
			expect(doc.title).toBeTruthy();
			expect(doc.summary).toBeTruthy();
		}
	});

	it('orders docs by their frontmatter order', () => {
		const orders = docs.map((doc) => doc.order);
		expect(orders).toEqual([...orders].sort((a, b) => a - b));
	});

	it('strips frontmatter before rendering', () => {
		for (const doc of docs) {
			expect(doc.html).not.toMatch(/^---/);
			expect(doc.html).not.toContain('summary:');
		}
	});

	it('gives every heading a unique id', () => {
		for (const doc of docs) {
			const ids = [...doc.html.matchAll(/<h[1-6] id="([^"]+)"/g)].map((match) => match[1]);
			expect(new Set(ids).size).toBe(ids.length);
		}
	});

	it('returns undefined for an unknown slug', () => {
		expect(getDoc('nope')).toBeUndefined();
	});
});
