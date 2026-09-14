export interface SourceLocation {
	line: number; // 1-based, in the .md source
	column: number; // 0-based
}

export interface Cell {
	id: string; // stable: `cell-${index}`
	code: string;
	lang: 'js';
	loc: SourceLocation; // start of the code body, not the fence
}

export interface Attr {
	name: string;
	value: string;
	/** When true, `value` is a JS expression source (e.g. a template literal
	 *  from an interpolated `${}` in a link/image URL) and codegen emits
	 *  `name={value}`; otherwise `value` is the literal attribute text. */
	expression?: boolean;
}

/** Template is a node list, never a string. Codegen owns serialisation. */
export type TemplateNode =
	| { type: 'element'; tag: string; attrs: Attr[]; children: TemplateNode[]; loc: SourceLocation }
	| { type: 'text'; value: string; loc: SourceLocation }
	| { type: 'expression'; code: string; loc: SourceLocation } // from ${...}
	| { type: 'cellSlot'; cellId: string; loc: SourceLocation } // display() target
	| { type: 'raw'; html: string; loc: SourceLocation }; // author-authored HTML only

export interface ParsedDocument {
	frontmatter: Record<string, unknown>;
	cells: Cell[];
	template: TemplateNode[];
}

export interface MarkdownParser {
	parse(source: string): ParsedDocument;
}
