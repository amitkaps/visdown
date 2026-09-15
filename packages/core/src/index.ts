import { analyzeCell, analyzeExpression } from './analyzer/analyze.js';
import type { CellAnalysis } from './analyzer/analyze.js';
import { generateSvelte } from './codegen/svelte-codegen.js';
import { buildDag } from './dag/build-dag.js';
import { VisdownCompileError } from './errors.js';
import { RemarkMarkdownParser } from './parser/remark-adapter.js';
import { finalizeOutput } from './sourcemap.js';
import type { TemplateNode } from './types.js';

export * from './types.js';
export { VisdownCompileError } from './errors.js';
export { RemarkMarkdownParser } from './parser/remark-adapter.js';
export type { RawSourceMap } from 'source-map-js';

export interface CompileResult {
	code: string;
	/** v3 sourcemap from the generated `.svelte` back to `.md` (spec §5). */
	map: import('source-map-js').RawSourceMap;
}

export function compile(source: string, file = 'source.md'): CompileResult {
	const parser = new RemarkMarkdownParser(file);
	const doc = parser.parse(source);

	const analyses = new Map<string, CellAnalysis>();
	for (const cell of doc.cells) {
		analyses.set(cell.id, analyzeCell(cell, file));
	}

	const dag = buildDag(doc.cells, analyses, file);

	// Validate every `${}` expression's free references resolve too (spec §3:
	// "its free identifiers join the dependency graph like any other cell
	// reference"). Cheap re-walk of the template; errors reuse the same
	// undefined-reference message as cell-to-cell references.
	validateExpressions(doc.template, analyses, file);

	const raw = generateSvelte(doc, doc.cells, analyses, dag, file);
	return finalizeOutput(raw, file, source);
}

function validateExpressions(
	template: TemplateNode[],
	analyses: Map<string, CellAnalysis>,
	file: string
): void {
	const declaredNames = new Set<string>();
	for (const analysis of analyses.values()) {
		for (const { name } of analysis.declared) declaredNames.add(name);
	}

	const visit = (node: TemplateNode): void => {
		if (node.type === 'expression') {
			const { freeRefs } = analyzeExpression(node.code, node.loc, file);
			for (const ref of freeRefs) {
				if (!declaredNames.has(ref.name)) {
					throw new VisdownCompileError(`'${ref.name}' is not defined in any cell`, file, ref.loc);
				}
			}
		} else if (node.type === 'element') {
			node.children.forEach(visit);
		}
	};
	template.forEach(visit);
}
