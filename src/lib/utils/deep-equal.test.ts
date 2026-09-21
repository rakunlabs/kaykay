import { describe, expect, it } from 'vitest';
import { deepEqual } from './deep-equal.js';

describe('deepEqual', () => {
	it('compares primitives', () => {
		expect(deepEqual(1, 1)).toBe(true);
		expect(deepEqual('a', 'a')).toBe(true);
		expect(deepEqual(null, null)).toBe(true);
		expect(deepEqual(undefined, undefined)).toBe(true);

		expect(deepEqual(1, '1')).toBe(false);
		expect(deepEqual(0, -0)).toBe(true);
		expect(deepEqual(null, undefined)).toBe(false);
		expect(deepEqual(null, {})).toBe(false);
	});

	it('treats NaN as equal to itself', () => {
		// Snapshots are compared for "is this worth an undo step", and a graph
		// holding NaN must not record one on every operation.
		expect(deepEqual(NaN, NaN)).toBe(true);
		expect(deepEqual(NaN, 1)).toBe(false);
	});

	it('compares arrays by position and length', () => {
		expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
		expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
		expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
		expect(deepEqual([], {})).toBe(false);
		expect(deepEqual({ 0: 1, length: 1 }, [1])).toBe(false);
	});

	it('compares objects regardless of key order', () => {
		// The stringify comparison this replaced reported these as different
		// and recorded a spurious undo step.
		expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
		expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
		expect(deepEqual({ a: 1, b: undefined }, { a: 1, b: undefined })).toBe(true);
		expect(deepEqual({ a: 1, b: undefined }, { a: 1, c: undefined })).toBe(false);
	});

	it('recurses through nested snapshot shapes', () => {
		const flow = {
			nodes: [{ id: 'a', position: { x: 1, y: 2 }, data: { label: 'A', tags: ['x'] } }],
			edges: [{ id: 'a-b', source: 'a', target: 'b' }],
		};

		expect(deepEqual(flow, structuredClone(flow))).toBe(true);

		const moved = structuredClone(flow);
		moved.nodes[0].position.x = 2;
		expect(deepEqual(flow, moved)).toBe(false);

		const retagged = structuredClone(flow);
		retagged.nodes[0].data.tags = ['y'];
		expect(deepEqual(flow, retagged)).toBe(false);
	});
});
