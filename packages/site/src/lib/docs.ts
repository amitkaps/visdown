import { parse as parseYaml } from 'yaml';
import { Marked, type RendererObject, type Tokens } from 'marked';
import { z } from 'zod';

// Eager glob: every doc is read and rendered at build time. The pages are
// prerendered, so `marked` and `yaml` never ship to the client or the Worker.
// Adding a page is adding a file: the slug is the filename, and everything else
// comes from its frontmatter.
const files = import.meta.glob('/src/content/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

// Extend this schema as pages need more fields (date, image, tags...). A file
// that does not match fails the build with its path and the offending key.
const frontmatterSchema = z.object({
	title: z.string().min(1),
	summary: z.string().min(1),
	/** Position in the nav and on the home page, ascending. */
	order: z.number().int()
});

export type Doc = z.infer<typeof frontmatterSchema> & {
	slug: string;
	html: string;
};

/** Slugify rendered heading text into an id, GitHub-style: lowercase, spaces to
 *  hyphens, punctuation dropped. Letters, combining marks and digits in any
 *  script are kept, so non-English headings get readable ids. marked adds no
 *  ids of its own, so without this `#section` links fail silently. */
function headingId(html: string): string {
	return (
		html
			.replace(/<[^>]+>/g, '')
			.replace(/&[a-z]+;|&#\d+;/gi, '')
			.toLowerCase()
			.replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
			.trim()
			.replace(/\s+/g, '-') || 'section'
	);
}

/** A heading renderer that gives every heading a page-unique id. */
function headingRenderer(): RendererObject {
	const used = new Set<string>();
	return {
		heading(this: { parser: { parseInline: (tokens: Tokens.Generic[]) => string } }, token) {
			const { depth, tokens } = token as Tokens.Heading;
			const inner = this.parser.parseInline(tokens);
			// Slug the rendered text, so a link's URL never leaks into the id.
			const base = headingId(inner);
			let id = base;
			// Probe until free: a heading that naturally slugs to `foo-1` must not
			// collide with the suffix generated for a second `foo`.
			for (let n = 1; used.has(id); n++) id = `${base}-${n}`;
			used.add(id);
			return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
		}
	};
}

// A fresh instance per doc keeps heading-id uniqueness scoped to one page.
// Note `Marked` is a top-level export — `new marked.Marked()` is not a constructor.
function markdown(): Marked {
	const instance = new Marked({ async: false, gfm: true });
	instance.use({ renderer: headingRenderer() });
	return instance;
}

function render(path: string, source: string): Doc {
	const slug = path.slice('/src/content/'.length, -'.md'.length);

	const match = FRONTMATTER.exec(source);
	if (!match) throw new Error(`${path}: missing YAML frontmatter`);

	// A key with nothing after it (`image:`) parses to null, which Zod's
	// .optional() rejects. Treat it as absent.
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

	const body = source.slice(match[0].length);
	return { ...parsed.data, slug, html: renderMarkdown(body) };
}

/** Render a markdown body to HTML with page-scoped heading ids. */
export const renderMarkdown = (body: string): string =>
	markdown().parse(body, { async: false }) as string;

export const docs: Doc[] = Object.entries(files)
	.map(([path, source]) => render(path, source))
	.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

export const getDoc = (slug: string): Doc | undefined => docs.find((doc) => doc.slug === slug);
