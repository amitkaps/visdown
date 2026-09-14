import { VisdownCompileError } from '../errors.js';
import type { CellAnalysis } from '../analyzer/analyze.js';
import type { DagResult } from '../dag/build-dag.js';
import type { Cell, ParsedDocument, TemplateNode } from '../types.js';

const VOID_TAGS = new Set(['hr', 'br', 'img']);

/** Static-only codegen (spec §4's "Static" column). A cell the DAG marked
 *  reactive has no codegen path yet — `view()`/`$derived`/`$state`/`$effect`/
 *  `display()` slots are a follow-up, not silently mis-emitted. */
export function generateSvelte(
	doc: ParsedDocument,
	cells: Cell[],
	analyses: Map<string, CellAnalysis>,
	dag: DagResult,
	file: string
): string {
	const scriptLines: string[] = [];

	for (const cellId of dag.order) {
		const cell = cells.find((c) => c.id === cellId)!;
		const analysis = analyses.get(cellId)!;

		if (dag.reactive.has(cellId)) {
			throw new VisdownCompileError(
				`Cell is reactive (declares from view()) — reactive codegen is not implemented in this build`,
				file,
				cell.loc
			);
		}

		scriptLines.push(emitStaticCell(cell, analysis));
	}

	const script = scriptLines.length > 0 ? `<script>\n${indent(scriptLines.join('\n\n'))}\n</script>\n\n` : '';
	const head = emitHead(doc.frontmatter);
	const markup = doc.template.map((node) => serialize(node, file)).join('');

	return `${script}${head}${markup}`;
}

function emitStaticCell(cell: Cell, analysis: CellAnalysis): string {
	// "Multiple statements, one exported name" (spec §4): wrap and return it.
	// Every other static shape — single statement, or multiple declared names —
	// hoists verbatim; the source is already the target shape.
	if (analysis.declared.length === 1 && analysis.statementCount > 1) {
		const name = analysis.declared[0]!.name;
		return `const ${name} = (() => {\n${indent(cell.code.trim())}\n${indent(`return ${name};`)}\n})();`;
	}
	return cell.code.trim();
}

function emitHead(frontmatter: Record<string, unknown>): string {
	if (typeof frontmatter.title !== 'string') return '';
	return `<svelte:head>\n  <title>${escapeText(frontmatter.title)}</title>\n</svelte:head>\n\n`;
}

function serialize(node: TemplateNode, file: string): string {
	switch (node.type) {
		case 'text':
			return escapeText(node.value);

		case 'expression':
			return `{${node.code}}`;

		case 'raw':
			return node.html;

		case 'cellSlot':
			throw new VisdownCompileError(
				'display() slots are not implemented in this build',
				file,
				node.loc
			);

		case 'element': {
			const attrs = node.attrs
				.map((a) => (a.expression ? ` ${a.name}={${a.value}}` : ` ${a.name}="${escapeAttr(a.value)}"`))
				.join('');
			if (VOID_TAGS.has(node.tag)) return `<${node.tag}${attrs} />`;
			const children = node.children.map((child) => serialize(child, file)).join('');
			return `<${node.tag}${attrs}>${children}</${node.tag}>`;
		}
	}
}

/** Svelte templates have no brace escape sequence; `{'{'}` / `{'}'}` renders
 *  the literal character (spec §3). */
function escapeText(value: string): string {
	return value.replace(/\{/g, "{'{'}").replace(/\}/g, "{'}'}");
}

function escapeAttr(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function indent(code: string): string {
	return code
		.split('\n')
		.map((line) => (line ? `  ${line}` : line))
		.join('\n');
}
