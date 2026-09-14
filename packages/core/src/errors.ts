import type { SourceLocation } from './types.js';

export class VisdownCompileError extends Error {
	constructor(message: string, file: string, loc: SourceLocation) {
		super(`${file}:${loc.line}:${loc.column}\n${message}`);
		this.name = 'VisdownCompileError';
	}
}
