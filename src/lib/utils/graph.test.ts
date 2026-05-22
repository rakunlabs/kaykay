import { describe, expect, it } from 'vitest';
import type { FlowEdge, FlowNode } from '../types/index.js';
import {
	getConnectedEdges,
	getIncomers,
	getNodesBounds,
	getOutgoers,
	getViewportForBounds,
	isEdge,
	isNode,
} from './graph.js';

const nodes: FlowNode[] = [
	{ id: 'a', type: 'test', position: { x: 10, y: 20 }, width: 100, height: 50, data: {} },
	{ id: 'b', type: 'test', position: { x: 200, y: 40 }, width: 80, height: 70, data: {} },
	{ id: 'c', type: 'test', position: { x: -20, y: 100 }, width: 40, height: 40, data: {} },
];

const edges: FlowEdge[] = [
	{ id: 'a-b', source: 'a', source_handle: 'out', target: 'b', target_handle: 'in' },
	{ id: 'c-a', source: 'c', source_handle: 'out', target: 'a', target_handle: 'in' },
];

describe('graph utilities', () => {
	it('detects node and edge shapes', () => {
		expect(isNode(nodes[0])).toBe(true);
		expect(isNode({ id: 'missing-position' })).toBe(false);
		expect(isEdge(edges[0])).toBe(true);
		expect(isEdge({ id: 'missing-target' })).toBe(false);
	});

	it('finds connected edges and adjacent nodes', () => {
		expect(getConnectedEdges([nodes[0]], edges).map((edge) => edge.id)).toEqual(['a-b', 'c-a']);
		expect(getIncomers(nodes[0], nodes, edges).map((node) => node.id)).toEqual(['c']);
		expect(getOutgoers(nodes[0], nodes, edges).map((node) => node.id)).toEqual(['b']);
	});

	it('calculates bounds and a fit viewport', () => {
		expect(getNodesBounds(nodes)).toEqual({ x: -20, y: 20, width: 300, height: 120 });
		expect(getViewportForBounds({ x: 0, y: 0, width: 100, height: 50 }, 400, 200, 0.1, 4, 0)).toEqual({
			x: 0,
			y: 0,
			zoom: 4,
		});
	});
});
