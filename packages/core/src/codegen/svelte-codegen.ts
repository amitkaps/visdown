import { VisdownCompileError } from '../errors.js';
import type { CellAnalysis } from '../analyzer/analyze.js';
import type { DagResult } from '../dag/build-dag.js';
import type { Cell, ParsedDocument, TemplateNode } from '../types.js';

const VOID_TAGS = new Set(['hr', 'br', 'img']);

/** Spec §4's codegen table: static rows verbatim/hoisted, `view()` → `$state`
 *  + a mounted slot, `display()` → its own cleared-per-evaluation slot, and
 *  everything else reactive → `$derived`/`$derived.by`. */
export function generateSvelte(
	doc: ParsedDocument,
	cells: Cell[],
	analyses: Map<string, CellAnalysis>,
	dag: DagResult,
	file: string
): string {
	const scriptLines: string[] = [];
	const slotMarkup = new Map<string, string>();
	const runtimeImports = new Set<string>();

	for (const cellId of dag.order) {
		const cell = cells.find((c) => c.id === cellId)!;
		const analysis = analyses.get(cellId)!;

		if (analysis.hasDisplayCall) {
			if (analysis.declared.length > 0) {
				throw new VisdownCompileError(
					'Unsupported display() usage — combining display() with a declared name is not implemented in this build',
					file,
					cell.loc
				);
			}
			const slotVar = `${safeCellVar(cellId)}__slot`;
			if (dag.reactive.has(cellId)) {
				runtimeImports.add('bindDisplay');
				const decl = `let ${slotVar};\n$effect(() => {\n${indent(`const display = bindDisplay(${slotVar});`)}\n${indent(analysis.bodyCode.trim())}\n});`;
				scriptLines.push(withImports(analysis, decl));
				slotMarkup.set(cellId, `<div bind:this={${slotVar}}></div>`);
			} else {
				runtimeImports.add('mountDisplay');
				if (analysis.importCode) scriptLines.push(analysis.importCode);
				const callback = `(display) => {\n${indent(analysis.bodyCode.trim())}\n}`;
				slotMarkup.set(cellId, `<div use:mountDisplay={${callback}}></div>`);
			}
			continue;
		}

		if (analysis.viewBinding) {
			const { name, argCode } = analysis.viewBinding;
			const decl = `const ${name}__el = ${argCode};\nlet ${name} = $state(${name}__el.value);`;
			scriptLines.push(withImports(analysis, decl));
			slotMarkup.set(
				cellId,
				`<div use:mountView={{ el: ${name}__el, set: (v) => (${name} = v) }}></div>`
			);
			runtimeImports.add('mountView');
			continue;
		}

		if (analysis.hasViewCall) {
			throw new VisdownCompileError(
				"Unsupported view() usage — only 'const NAME = view(EXPR);' is implemented in this build",
				file,
				cell.loc
			);
		}

		slotMarkup.set(cellId, '');
		scriptLines.push(
			dag.reactive.has(cellId) ? emitReactiveCell(analysis) : emitStaticCell(cell, analysis)
		);
	}

	if (runtimeImports.size > 0) {
		const names = [...runtimeImports].sort().join(', ');
		scriptLines.unshift(`import { ${names} } from '@visdown/core/runtime';`);
	}

	const script = scriptLines.length > 0 ? `<script>\n${indent(scriptLines.join('\n\n'))}\n</script>\n\n` : '';
	const head = emitHead(doc.frontmatter);
	const markup = doc.template.map((node) => serialize(node, file, slotMarkup)).join('');

	return `${script}${head}${markup}`;
}

/** `cell-0` → `cell_0`: cell ids aren't valid JS identifiers verbatim. */
function safeCellVar(cellId: string): string {
	return cellId.replace(/[^a-zA-Z0-9_$]/g, '_');
}

/** `import`s can't live inside a wrapping function — prefix them ahead of a
 *  wrapped/rebuilt statement instead of leaving them in `analysis.bodyCode`. */
function withImports(analysis: CellAnalysis, statement: string): string {
	return analysis.importCode ? `${analysis.importCode}\n\n${statement}` : statement;
}

function emitStaticCell(cell: Cell, analysis: CellAnalysis): string {
	// "Multiple statements, one exported name" (spec §4): wrap and return it.
	// Every other static shape — single statement, or multiple declared names —
	// hoists verbatim; the source (imports included) is already the target shape.
	if (analysis.declared.length === 1 && analysis.statementCount > 1) {
		const name = analysis.declared[0]!.name;
		const wrapped = `const ${name} = (() => {\n${indent(analysis.bodyCode.trim())}\n${indent(`return ${name};`)}\n})();`;
		return withImports(analysis, wrapped);
	}
	return cell.code.trim();
}

function emitReactiveCell(analysis: CellAnalysis): string {
	const names = analysis.declared.map((d) => d.name);

	// Side effects only, no declared name, no display() call (that shape is
	// handled separately above) — still worth running as an effect.
	if (names.length === 0) {
		return withImports(analysis, `$effect(() => {\n${indent(analysis.bodyCode.trim())}\n});`);
	}

	if (names.length === 1 && analysis.statementCount === 1 && analysis.singleExprInit) {
		return withImports(analysis, `const ${names[0]} = $derived(${analysis.singleExprInit.exprCode});`);
	}

	if (names.length === 1) {
		const name = names[0]!;
		const wrapped = `const ${name} = $derived.by(() => {\n${indent(analysis.bodyCode.trim())}\n${indent(`return ${name};`)}\n});`;
		return withImports(analysis, wrapped);
	}

	const tuple = names.join(', ');
	const wrapped = `const { ${tuple} } = $derived.by(() => {\n${indent(analysis.bodyCode.trim())}\n${indent(`return { ${tuple} };`)}\n});`;
	return withImports(analysis, wrapped);
}

function emitHead(frontmatter: Record<string, unknown>): string {
	if (typeof frontmatter.title !== 'string') return '';
	return `<svelte:head>\n  <title>${escapeText(frontmatter.title)}</title>\n</svelte:head>\n\n`;
}

function serialize(node: TemplateNode, file: string, slotMarkup: Map<string, string>): string {
	switch (node.type) {
		case 'text':
			return escapeText(node.value);

		case 'expression':
			return `{${node.code}}`;

		case 'raw':
			return node.html;

		case 'cellSlot': {
			const markup = slotMarkup.get(node.cellId);
			if (markup === undefined) {
				throw new VisdownCompileError(`internal: no slot markup computed for ${node.cellId}`, file, node.loc);
			}
			return markup;
		}

		case 'element': {
			const attrs = node.attrs
				.map((a) => (a.expression ? ` ${a.name}={${a.value}}` : ` ${a.name}="${escapeAttr(a.value)}"`))
				.join('');
			if (VOID_TAGS.has(node.tag)) return `<${node.tag}${attrs} />`;
			const children = node.children.map((child) => serialize(child, file, slotMarkup)).join('');
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
