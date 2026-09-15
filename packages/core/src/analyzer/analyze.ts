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

export interface ViewBinding {
	/** The declared name bound to the view's value (`const NAME = view(...)`). */
	name: string;
	/** Source text of `view(...)`'s single argument, verbatim. */
	argCode: string;
	/** Where `argCode` starts in the `.md` source (spec §5 sourcemaps). */
	argLoc: SourceLocation;
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
	/** The recognized `const name = view(expr);` shape, when `hasViewCall` is
	 *  true and the cell matches it — the only view() shape codegen supports. */
	viewBinding?: ViewBinding;
	/** "Single expression, one name" (spec §4's table): the cell is exactly
	 *  one `const/let NAME = EXPR;` statement. `exprCode` is EXPR's source,
	 *  for codegen to drop into `$derived(EXPR)` or reuse verbatim. */
	singleExprInit?: { name: string; exprCode: string; exprLoc: SourceLocation };
	/** Whether the cell calls `display(...)` anywhere (spec §4's slot/`$effect`
	 *  path). Only the "side effects only, no declared name" shape is
	 *  implemented — `display()` combined with a declared name is rejected. */
	hasDisplayCall: boolean;
	/** Source of the cell's top-level `import` statements, if any — these
	 *  always hoist verbatim ahead of whatever codegen shape the rest of the
	 *  cell takes, since an `import` can't live inside a wrapping function. */
	importCode: string;
	/** Where `importCode` starts in the `.md` source, when non-empty (spec §5 sourcemaps). */
	importLoc?: SourceLocation;
	/** Source of the cell's non-`import` statements (imports assumed to come
	 *  first, per fixture convention — not re-validated). What `statementCount`
	 *  counts, and what a `$derived.by`/IIFE wrap's body is built from. */
	bodyCode: string;
	/** Where `bodyCode` starts in the `.md` source, when non-empty (spec §5 sourcemaps). */
	bodyLoc?: SourceLocation;
	/** Non-import statement count, for the single/multi-statement codegen split. */
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

interface WalkCallbacks {
	onUse: (id: Node) => void;
	onView: () => void;
	onDisplay: () => void;
}

function walk(node: unknown, cb: WalkCallbacks): void {
	if (Array.isArray(node)) {
		for (const child of node) walk(child, cb);
		return;
	}
	if (!isNode(node)) return;

	switch (node.type) {
		case 'Identifier':
			cb.onUse(node);
			return;

		case 'VariableDeclarator':
			// `id` is a binding target, not a use — collected separately (see collectBindings).
			walk(node.init, cb);
			return;

		case 'FunctionDeclaration':
		case 'FunctionExpression':
		case 'ArrowFunctionExpression':
			walk(node.body, cb);
			return;

		case 'ClassDeclaration':
		case 'ClassExpression':
			if (node.superClass) walk(node.superClass, cb);
			walk(node.body, cb);
			return;

		case 'MethodDefinition':
		case 'PropertyDefinition':
			if (node.computed) walk(node.key, cb);
			walk(node.value, cb);
			return;

		case 'MemberExpression':
		case 'StaticMemberExpression':
			walk(node.object, cb);
			if (node.computed) walk(node.property, cb);
			return;

		case 'Property':
		case 'ObjectProperty':
			if (node.computed) walk(node.key, cb);
			walk(node.value, cb);
			return;

		case 'ImportDeclaration':
			return; // specifiers are bindings, not uses — handled in the bind pass

		case 'CallExpression': {
			const callee = node.callee;
			if (isNode(callee) && callee.type === 'Identifier') {
				const calleeName = (callee as Node).name as string;
				if (calleeName === 'view') cb.onView();
				if (calleeName === 'display') cb.onDisplay();
			}
			walk(node.callee, cb);
			walk(node.arguments, cb);
			return;
		}

		default:
			for (const key of Object.keys(node)) {
				if (key === 'type' || key === 'start' || key === 'end') continue;
				walk((node as Record<string, unknown>)[key], cb);
			}
	}
}

/** Recognize the one `view()` shape codegen supports: a single top-level
 *  statement `const NAME = view(ARG);` (spec §4's own example). Anything
 *  else that calls `view()` is a `hasViewCall` without a `viewBinding` —
 *  codegen rejects it explicitly rather than mis-emitting. */
function detectViewBinding(cell: Cell, body: Node[]): ViewBinding | undefined {
	if (body.length !== 1) return undefined;
	const stmt = body[0]!;
	if (stmt.type !== 'VariableDeclaration') return undefined;
	const declarations = stmt.declarations as unknown[];
	if (declarations.length !== 1) return undefined;
	const decl = declarations[0] as Node;
	if (!isNode(decl.id) || (decl.id as Node).type !== 'Identifier') return undefined;
	const init = decl.init;
	if (!isNode(init) || init.type !== 'CallExpression') return undefined;
	const callee = init.callee;
	if (!isNode(callee) || callee.type !== 'Identifier' || callee.name !== 'view') return undefined;
	const args = init.arguments as unknown[];
	if (args.length !== 1) return undefined;
	const arg = args[0] as Node;

	return {
		name: (decl.id as Node).name as string,
		argCode: cell.code.slice(arg.start, arg.end),
		argLoc: offsetToLoc(cell.code, arg.start, cell.loc)
	};
}

/** Recognize "single expression, one name": one top-level `const/let NAME =
 *  EXPR;` statement, whatever EXPR is (including `view(...)` itself). */
function detectSingleExprInit(
	cell: Cell,
	body: Node[]
): { name: string; exprCode: string; exprLoc: SourceLocation } | undefined {
	if (body.length !== 1) return undefined;
	const stmt = body[0]!;
	if (stmt.type !== 'VariableDeclaration') return undefined;
	const declarations = stmt.declarations as unknown[];
	if (declarations.length !== 1) return undefined;
	const decl = declarations[0] as Node;
	if (!isNode(decl.id) || (decl.id as Node).type !== 'Identifier') return undefined;
	if (!isNode(decl.init)) return undefined;
	const init = decl.init as Node;

	return {
		name: (decl.id as Node).name as string,
		exprCode: cell.code.slice(init.start, init.end),
		exprLoc: offsetToLoc(cell.code, init.start, cell.loc)
	};
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
	let hasDisplayCall = false;
	walk(program.body, {
		onUse: (id) => {
			const name = id.name as string;
			if (boundNames.has(name) || KNOWN_GLOBALS.has(name)) return;
			freeRefs.push({ name, loc: toLoc(id.start) });
		},
		onView: () => {
			hasViewCall = true;
		},
		onDisplay: () => {
			hasDisplayCall = true;
		}
	});

	const body = program.body as unknown as Node[];
	const importNodes = body.filter((s) => s.type === 'ImportDeclaration');
	const nonImportBody = body.filter((s) => s.type !== 'ImportDeclaration');

	const importCode = importNodes.map((n) => cell.code.slice(n.start, n.end)).join('\n');
	const importLoc = importNodes.length ? toLoc(importNodes[0]!.start) : undefined;
	const bodyCode = nonImportBody.length
		? cell.code.slice(nonImportBody[0]!.start, nonImportBody[nonImportBody.length - 1]!.end)
		: '';
	const bodyLoc = nonImportBody.length ? toLoc(nonImportBody[0]!.start) : undefined;

	const viewBinding = hasViewCall ? detectViewBinding(cell, nonImportBody) : undefined;
	const singleExprInit = detectSingleExprInit(cell, nonImportBody);

	return {
		cellId: cell.id,
		declared,
		boundNames,
		freeRefs,
		hasViewCall,
		viewBinding,
		hasDisplayCall,
		importCode,
		importLoc,
		bodyCode,
		bodyLoc,
		singleExprInit,
		statementCount: nonImportBody.length
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
	walk(program.body, {
		onUse: (id) => {
			const name = id.name as string;
			if (boundNames.has(name) || KNOWN_GLOBALS.has(name)) return;
			freeRefs.push({ name, loc: toLoc(id.start) });
		},
		onView: () => {},
		onDisplay: () => {
			throw new VisdownCompileError('display() may only be called inside a js cell', file, loc);
		}
	});

	return { freeRefs };
}
