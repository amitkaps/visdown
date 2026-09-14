import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import { parse as parseYaml } from 'yaml';

import { VisdownCompileError } from '../errors.js';
import { fromMdastPoint } from '../loc.js';
import { scanAttrValue, scanInterpolation } from './interpolation.js';
import type { Attr, Cell, MarkdownParser, ParsedDocument, SourceLocation, TemplateNode } from '../types.js';

/** Reserved but not implemented in v1 (spec §0). Any other non-`js` lang
 *  renders as an ordinary code block. */
const RESERVED_UNIMPLEMENTED = new Set(['ts', 'sql', 'dot', 'tex']);

const VOID_TAGS = new Set(['hr', 'br', 'img']);

// mdast (+ gfm) node shapes, typed minimally for what this adapter reads.
interface MNode {
	type: string;
	value?: string;
	depth?: number;
	ordered?: boolean;
	url?: string;
	alt?: string;
	title?: string;
	lang?: string | null;
	children?: MNode[];
	position?: {
		start: { line: number; column: number; offset: number };
		end: { line: number; column: number; offset: number };
	};
}

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm);

export class RemarkMarkdownParser implements MarkdownParser {
	constructor(private readonly file: string) {}

	parse(source: string): ParsedDocument {
		const root = processor.parse(source) as unknown as MNode;

		let frontmatter: Record<string, unknown> = {};
		const cells: Cell[] = [];
		const template: TemplateNode[] = [];

		for (const node of root.children ?? []) {
			if (node.type === 'yaml') {
				frontmatter = (parseYaml(node.value ?? '') ?? {}) as Record<string, unknown>;
				continue;
			}

			if (node.type === 'code' && node.lang === 'js') {
				const cell = this.toCell(node, cells.length);
				cells.push(cell);
				// A placeholder at the cell's position — codegen decides whether it
				// renders anything (a view() cell's mount point; nothing otherwise).
				template.push({ type: 'cellSlot', cellId: cell.id, loc: this.locOf(node) });
				continue;
			}

			if (node.type === 'code' && node.lang && RESERVED_UNIMPLEMENTED.has(node.lang)) {
				throw new VisdownCompileError(
					`Language '${node.lang}' is not supported in v1`,
					this.file,
					this.locOf(node)
				);
			}

			template.push(...this.convert(node));
		}

		return { frontmatter, cells, template };
	}

	private locOf(node: MNode): SourceLocation {
		if (!node.position) return { line: 1, column: 0 };
		return fromMdastPoint(node.position.start);
	}

	/** The code body starts on the line after the opening fence, column 0. */
	private toCell(node: MNode, index: number): Cell {
		const fenceLoc = this.locOf(node);
		return {
			id: `cell-${index}`,
			code: node.value ?? '',
			lang: 'js',
			loc: { line: fenceLoc.line + 1, column: 0 }
		};
	}

	private convert(node: MNode): TemplateNode[] {
		const loc = this.locOf(node);

		switch (node.type) {
			case 'text':
				return scanInterpolation(node.value ?? '', loc);

			case 'html':
				return [{ type: 'raw', html: node.value ?? '', loc }];

			case 'break':
				return [this.element('br', [], [], loc)];

			case 'thematicBreak':
				return [this.element('hr', [], [], loc)];

			case 'inlineCode':
				return [this.element('code', [], [{ type: 'text', value: node.value ?? '', loc }], loc)];

			case 'emphasis':
				return [this.element('em', [], this.convertChildren(node), loc)];

			case 'strong':
				return [this.element('strong', [], this.convertChildren(node), loc)];

			case 'delete':
				return [this.element('s', [], this.convertChildren(node), loc)];

			case 'blockquote':
				return [this.element('blockquote', [], this.convertChildren(node), loc)];

			case 'paragraph':
				return [this.element('p', [], this.convertChildren(node), loc)];

			case 'heading':
				return [this.element(`h${node.depth ?? 1}`, [], this.convertChildren(node), loc)];

			case 'list': {
				const tag = node.ordered ? 'ol' : 'ul';
				const items = (node.children ?? []).map((li) =>
					this.element('li', [], this.convertChildren(li), this.locOf(li))
				);
				return [this.element(tag, [], items, loc)];
			}

			case 'link': {
				const href = scanAttrValue(node.url ?? '', loc);
				const attrs: Attr[] = [{ name: 'href', value: href.value, expression: href.expression }];
				return [this.element('a', attrs, this.convertChildren(node), loc)];
			}

			case 'image': {
				const src = scanAttrValue(node.url ?? '', loc);
				const attrs: Attr[] = [
					{ name: 'src', value: src.value, expression: src.expression },
					{ name: 'alt', value: node.alt ?? '' }
				];
				return [this.element('img', attrs, [], loc)];
			}

			case 'table': {
				const rows = node.children ?? [];
				const [headerRow, ...bodyRows] = rows;
				const sections: TemplateNode[] = [];
				if (headerRow) {
					sections.push(this.element('thead', [], [this.tableRow(headerRow, 'th')], this.locOf(headerRow)));
				}
				if (bodyRows.length) {
					sections.push(
						this.element(
							'tbody',
							[],
							bodyRows.map((row) => this.tableRow(row, 'td')),
							loc
						)
					);
				}
				return [this.element('table', [], sections, loc)];
			}

			case 'code': {
				// Non-`js`, non-reserved lang: an ordinary rendered code block.
				const code = this.element(
					'code',
					[],
					[{ type: 'text', value: node.value ?? '', loc }],
					loc
				);
				return [this.element('pre', [], [code], loc)];
			}

			case 'yaml':
				return [];

			default:
				// Any other container node (root-level fallback): recurse into children.
				return this.convertChildren(node);
		}
	}

	private tableRow(row: MNode, cellTag: 'th' | 'td'): TemplateNode {
		const cells = (row.children ?? []).map((cell) =>
			this.element(cellTag, [], this.convertChildren(cell), this.locOf(cell))
		);
		return this.element('tr', [], cells, this.locOf(row));
	}

	private convertChildren(node: MNode): TemplateNode[] {
		return (node.children ?? []).flatMap((child) => this.convert(child));
	}

	private element(tag: string, attrs: Attr[], children: TemplateNode[], loc: SourceLocation): TemplateNode {
		if (VOID_TAGS.has(tag) && children.length === 0) {
			return { type: 'element', tag, attrs, children: [], loc };
		}
		return { type: 'element', tag, attrs, children, loc };
	}
}
