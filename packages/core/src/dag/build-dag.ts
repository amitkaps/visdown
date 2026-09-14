import { VisdownCompileError } from '../errors.js';
import type { CellAnalysis } from '../analyzer/analyze.js';
import type { Cell } from '../types.js';

export interface DagResult {
	/** cellIds in an order where every cell comes after every cell it depends on. */
	order: string[];
	/** cellIds that are reactive (spec §4): a `view()` root, or transitively
	 *  dependent on one. */
	reactive: Set<string>;
}

interface DeclaredName {
	cellId: string;
	loc: { line: number; column: number };
}

export function buildDag(cells: Cell[], analyses: Map<string, CellAnalysis>, file: string): DagResult {
	const declaredBy = new Map<string, DeclaredName>();

	for (const cell of cells) {
		const analysis = analyses.get(cell.id)!;
		for (const { name, loc } of analysis.declared) {
			const existing = declaredBy.get(name);
			if (existing) {
				throw new VisdownCompileError(
					`Duplicate declaration '${name}' (also declared at ${existing.loc.line}:${existing.loc.column})`,
					file,
					loc
				);
			}
			declaredBy.set(name, { cellId: cell.id, loc });
		}
	}

	// cellId -> set of names it references that resolve to another cell's declaration.
	const cellDeps = new Map<string, Set<string>>();
	for (const cell of cells) {
		const analysis = analyses.get(cell.id)!;
		const deps = new Set<string>();
		for (const ref of analysis.freeRefs) {
			const owner = declaredBy.get(ref.name);
			if (!owner) {
				throw new VisdownCompileError(`'${ref.name}' is not defined in any cell`, file, ref.loc);
			}
			if (owner.cellId !== cell.id) deps.add(ref.name);
		}
		cellDeps.set(cell.id, deps);
	}

	checkCycles(cells, declaredBy, cellDeps, file);

	const order = topoSort(cells, declaredBy, cellDeps);
	const reactive = propagateReactive(cells, analyses, declaredBy, cellDeps);

	return { order, reactive };
}

/** DFS over the name graph (not the cell graph) so a cycle reads back as
 *  `a → b → a` in reference order, per spec §5. */
function checkCycles(
	cells: Cell[],
	declaredBy: Map<string, DeclaredName>,
	cellDeps: Map<string, Set<string>>,
	file: string
): void {
	// name -> the names its owning cell depends on (shared across co-declared names).
	const nameEdges = new Map<string, string[]>();
	for (const [name, owner] of declaredBy) {
		nameEdges.set(name, [...(cellDeps.get(owner.cellId) ?? [])]);
	}

	const state = new Map<string, 'visiting' | 'done'>();
	const stack: string[] = [];

	const visit = (name: string): void => {
		const status = state.get(name);
		if (status === 'done') return;
		if (status === 'visiting') {
			const cycleStart = stack.indexOf(name);
			const cycle = [...stack.slice(cycleStart), name];
			const owner = declaredBy.get(name)!;
			throw new VisdownCompileError(`Circular dependency: ${cycle.join(' → ')}`, file, owner.loc);
		}

		state.set(name, 'visiting');
		stack.push(name);
		for (const dep of nameEdges.get(name) ?? []) visit(dep);
		stack.pop();
		state.set(name, 'done');
	};

	for (const cell of cells) {
		for (const name of declaredBy.keys()) {
			if (declaredBy.get(name)!.cellId === cell.id) visit(name);
		}
	}
}

function topoSort(
	cells: Cell[],
	declaredBy: Map<string, DeclaredName>,
	cellDeps: Map<string, Set<string>>
): string[] {
	const dependsOnCells = new Map<string, Set<string>>();
	for (const cell of cells) {
		const owners = new Set<string>();
		for (const name of cellDeps.get(cell.id) ?? []) {
			const owner = declaredBy.get(name);
			if (owner) owners.add(owner.cellId);
		}
		dependsOnCells.set(cell.id, owners);
	}

	const placed = new Set<string>();
	const order: string[] = [];
	while (order.length < cells.length) {
		let progressed = false;
		for (const cell of cells) {
			if (placed.has(cell.id)) continue;
			const deps = dependsOnCells.get(cell.id) ?? new Set();
			if ([...deps].every((d) => placed.has(d))) {
				order.push(cell.id);
				placed.add(cell.id);
				progressed = true;
			}
		}
		if (!progressed) {
			// Cycle detection above already throws before this can happen.
			throw new Error('internal: topological sort made no progress');
		}
	}
	return order;
}

function propagateReactive(
	cells: Cell[],
	analyses: Map<string, CellAnalysis>,
	declaredBy: Map<string, DeclaredName>,
	cellDeps: Map<string, Set<string>>
): Set<string> {
	const reactive = new Set<string>();
	for (const cell of cells) {
		if (analyses.get(cell.id)!.hasViewCall) reactive.add(cell.id);
	}

	let changed = true;
	while (changed) {
		changed = false;
		for (const cell of cells) {
			if (reactive.has(cell.id)) continue;
			for (const name of cellDeps.get(cell.id) ?? []) {
				const owner = declaredBy.get(name);
				if (owner && reactive.has(owner.cellId)) {
					reactive.add(cell.id);
					changed = true;
					break;
				}
			}
		}
	}

	return reactive;
}
