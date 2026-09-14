import { parseSync } from 'oxc-parser';

import { VisdownCompileError } from '../errors.js';
import { offsetToLoc } from '../loc.js';
import type { Cell, SourceLocation } from '../types.js';

/** Provided by the JS environment or the Visdown runtime (`view`/`display`,
 *  spec §4) — never a cross-cell reference, never "not defined". */
const KNOWN_GLOBALS = new Set([
	'console',
	'Math',
	'JSON',
	'Array',
	'Object',
	'String',
	'Number',
	'Boolean',
	'Date',
	'RegExp',
	'Map',
	'Set',
	'WeakMap',
	'WeakSet',
	'Promise',
	'Error',
	'TypeError',
	'RangeError',
	'Symbol',
	'Infinity',
	'NaN',
	'undefined',
	'globalThis',
	'parseInt',
	'parseFloat',
	'isNaN',
	'isFinite',
	'structuredClone',
	'fetch',
	'setTimeout',
	'clearTimeout',
	'setInterval',
	'clearInterval',
	'window',
	'document',
	'view',
	'display'
]);

export interface NameRef {
	name: string;
	loc: SourceLocation;
}

export interface CellAnalysis {
	cellId: string;
	/** Top-level names this cell exports for other cells to reference. */
	declared: NameRef[];
	/** Every name bound anywhere in the cell (top-level decls, imports,
	 *  function/catch params, nested declarations) — not scope-aware, just
	 *  enough to keep locally-bound names out of `freeRefs`. */
	boundNames: Set<string>;
	/** Identifiers used but not locally bound and not a known global. */
	freeRefs: NameRef[];
	/** Whether the cell calls `view(...)` anywhere (spec §4 reactive root). */
	hasViewCall: boolean;
	/** Program statement count, for the single/multi-statement codegen split. */
	statementCount: number;
}

// A generic-enough slice of the ESTree shape oxc-parser returns.
interface Node {
	type: string;
	start: number;
	end: number;
	[key: string]: unknown;
}

function isNode(value: unknown): value is Node {
	return typeof value === 'object' && value !== null && typeof (value as Node).type === 'string';
}

function bindPattern(pattern: unknown, bind: (id: Node) => void): void {
	if (!isNode(pattern)) return;
	switch (pattern.type) {
		case 'Identifier':
			bind(pattern);
			break;
		case 'ObjectPattern':
			for (const prop of (pattern.properties as unknown[]) ?? []) {
				if (!isNode(prop)) continue;
				bindPattern(prop.type === 'RestElement' ? prop.argument : prop.value, bind);
			}
			break;
		case 'ArrayPattern':
			for (const el of (pattern.elements as unknown[]) ?? []) bindPattern(el, bind);
			break;
		case 'AssignmentPattern':
			bindPattern(pattern.left, bind);
			break;
		case 'RestElement':
			bindPattern(pattern.argument, bind);
			break;
		default:
			break;
	}
}

function walk(node: unknown, onUse: (id: Node) => void, onView: () => void): void {
	if (Array.isArray(node)) {
		for (const child of node) walk(child, onUse, onView);
		return;
	}
	if (!isNode(node)) return;

	switch (node.type) {
		case 'Identifier':
			onUse(node);
			return;

		case 'VariableDeclarator':
			// `id` is a binding target, not a use — collected separately (see collectBindings).
			walk(node.init, onUse, onView);
			return;

		case 'FunctionDeclaration':
		case 'FunctionExpression':
		case 'ArrowFunctionExpression':
			walk(node.body, onUse, onView);
			return;

		case 'ClassDeclaration':
		case 'ClassExpression':
			if (node.superClass) walk(node.superClass, onUse, onView);
			walk(node.body, onUse, onView);
			return;

		case 'MethodDefinition':
		case 'PropertyDefinition':
			if (node.computed) walk(node.key, onUse, onView);
			walk(node.value, onUse, onView);
			return;

		case 'MemberExpression':
		case 'StaticMemberExpression':
			walk(node.object, onUse, onView);
			if (node.computed) walk(node.property, onUse, onView);
			return;

		case 'Property':
		case 'ObjectProperty':
			if (node.computed) walk(node.key, onUse, onView);
			walk(node.value, onUse, onView);
			return;

		case 'ImportDeclaration':
			return; // specifiers are bindings, not uses — handled in the bind pass

		case 'CallExpression': {
			const callee = node.callee;
			if (isNode(callee) && callee.type === 'Identifier' && (callee as Node).name === 'view') {
				onView();
			}
			walk(node.callee, onUse, onView);
			walk(node.arguments, onUse, onView);
			return;
		}

		default:
			for (const key of Object.keys(node)) {
				if (key === 'type' || key === 'start' || key === 'end') continue;
				walk((node as Record<string, unknown>)[key], onUse, onView);
			}
	}
}

function collectBindings(node: unknown, bind: (id: Node) => void): void {
	if (Array.isArray(node)) {
		for (const child of node) collectBindings(child, bind);
		return;
	}
	if (!isNode(node)) return;

	switch (node.type) {
		case 'VariableDeclarator':
			bindPattern(node.id, bind);
			collectBindings(node.init, bind);
			return;

		case 'FunctionDeclaration':
		case 'FunctionExpression':
			if (isNode(node.id)) bind(node.id as Node);
			for (const p of (node.params as unknown[]) ?? []) bindPattern(p, bind);
			collectBindings(node.body, bind);
			return;

		case 'ArrowFunctionExpression':
			for (const p of (node.params as unknown[]) ?? []) bindPattern(p, bind);
			collectBindings(node.body, bind);
			return;

		case 'ClassDeclaration':
		case 'ClassExpression':
			if (isNode(node.id)) bind(node.id as Node);
			collectBindings(node.body, bind);
			return;

		case 'CatchClause':
			if (node.param) bindPattern(node.param, bind);
			collectBindings(node.body, bind);
			return;

		case 'ImportDeclaration':
			for (const spec of (node.specifiers as unknown[]) ?? []) {
				if (isNode(spec) && isNode(spec.local)) bind(spec.local as Node);
			}
			return;

		default:
			for (const key of Object.keys(node)) {
				if (key === 'type' || key === 'start' || key === 'end') continue;
				collectBindings((node as Record<string, unknown>)[key], bind);
			}
	}
}

export function analyzeCell(cell: Cell, file: string): CellAnalysis {
	const { program, errors } = parseSync(`${cell.id}.js`, cell.code);
	if (errors.length > 0) {
		throw new VisdownCompileError(errors[0]!.message, file, cell.loc);
	}

	const toLoc = (offset: number): SourceLocation => offsetToLoc(cell.code, offset, cell.loc);

	const declared: NameRef[] = [];
	for (const stmt of program.body as unknown as Node[]) {
		if (stmt.type === 'VariableDeclaration') {
			for (const decl of (stmt.declarations as unknown[]) ?? []) {
				bindPattern((decl as Node).id, (id) => declared.push({ name: id.name as string, loc: toLoc(id.start) }));
			}
		} else if (stmt.type === 'FunctionDeclaration' || stmt.type === 'ClassDeclaration') {
			if (isNode(stmt.id)) {
				const id = stmt.id as Node;
				declared.push({ name: id.name as string, loc: toLoc(id.start) });
			}
		}
	}

	const boundNames = new Set<string>();
	collectBindings(program.body, (id) => boundNames.add(id.name as string));

	const freeRefs: NameRef[] = [];
	let hasViewCall = false;
	walk(
		program.body,
		(id) => {
			const name = id.name as string;
			if (boundNames.has(name) || KNOWN_GLOBALS.has(name)) return;
			freeRefs.push({ name, loc: toLoc(id.start) });
		},
		() => {
			hasViewCall = true;
		}
	);

	return {
		cellId: cell.id,
		declared,
		boundNames,
		freeRefs,
		hasViewCall,
		statementCount: (program.body as unknown[]).length
	};
}

/** Parse a `${}` expression body and collect its free references the same way. */
export function analyzeExpression(
	code: string,
	loc: SourceLocation,
	file: string
): { freeRefs: NameRef[] } {
	const { program, errors } = parseSync('expr.js', `(${code})`);
	if (errors.length > 0) {
		throw new VisdownCompileError(`Invalid expression: ${errors[0]!.message}`, file, loc);
	}

	// Offsets are within the wrapping `(...)`; shift back by 1 and clamp at 0.
	const toLoc = (offset: number): SourceLocation => offsetToLoc(code, Math.max(0, offset - 1), loc);

	const boundNames = new Set<string>();
	collectBindings(program.body, (id) => boundNames.add(id.name as string));

	const freeRefs: NameRef[] = [];
	walk(
		program.body,
		(id) => {
			const name = id.name as string;
			if (boundNames.has(name) || KNOWN_GLOBALS.has(name)) return;
			freeRefs.push({ name, loc: toLoc(id.start) });
		},
		() => {}
	);

	return { freeRefs };
}
