import { describe, expect, it } from 'vitest';
import type { Flow, FlowEdge, FlowNode } from '../types/index.js';
import {
	flattenVirtualWireFlow,
	hydrateVirtualWireFlow,
	resolveVirtualWireEdges,
	VIRTUAL_WIRE_INPUT_TYPE,
	VIRTUAL_WIRE_OUTPUT_TYPE,
} from './virtual-wire.js';

function node(id: string, type = 'basic'): FlowNode {
	return {
		id,
		type,
		position: { x: 0, y: 0 },
		data: { label: id },
	};
}

describe('virtual wire graph utilities', () => {
	it('collapses virtual wire channel edges into logical direct edges', () => {
		const nodes: FlowNode[] = [
			node('source'),
			{
				...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }] },
			},
			{
				...node('wire-out', VIRTUAL_WIRE_OUTPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }] },
			},
			node('target'),
		];
		const edges: FlowEdge[] = [
			{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
			{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
		];

		const resolved_edges = resolveVirtualWireEdges(nodes, edges);

		expect(resolved_edges).toHaveLength(1);
		expect(resolved_edges[0]).toMatchObject({
			id: 'virtual:source-wire:wire-target',
			source: 'source',
			source_handle: 'out',
			target: 'target',
			target_handle: 'in',
		});
		expect(resolved_edges[0].data?.kaykay_virtual_wire).toMatchObject({
			version: 1,
			pair_id: 'wire-a',
			channel_id: '1',
		});
	});

	it('keeps regular edges while hiding physical virtual wire edges', () => {
		const nodes: FlowNode[] = [
			node('a'),
			node('b'),
			{
				...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }] },
			},
		];
		const edges: FlowEdge[] = [
			{ id: 'regular', source: 'a', source_handle: 'out', target: 'b', target_handle: 'in' },
			{ id: 'virtual-only', source: 'a', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
		];

		const resolved_edges = resolveVirtualWireEdges(nodes, edges);

		expect(resolved_edges).toHaveLength(1);
		expect(resolved_edges[0].id).toBe('regular');
	});

	it('matches virtual wire channels by number', () => {
		const nodes: FlowNode[] = [
			node('source-1'),
			node('source-2'),
			node('target-1'),
			node('target-2'),
			{
				...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }, { id: '2' }] },
			},
			{
				...node('wire-out', VIRTUAL_WIRE_OUTPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }, { id: '2' }] },
			},
		];
		const edges: FlowEdge[] = [
			{ id: 's1-wire', source: 'source-1', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
			{ id: 's2-wire', source: 'source-2', source_handle: 'out', target: 'wire-in', target_handle: 'in-2' },
			{ id: 'wire-t2', source: 'wire-out', source_handle: 'out-2', target: 'target-2', target_handle: 'in' },
			{ id: 'wire-t1', source: 'wire-out', source_handle: 'out-1', target: 'target-1', target_handle: 'in' },
		];

		const resolved_edges = resolveVirtualWireEdges(nodes, edges);
		const by_target = new Map(resolved_edges.map((edge) => [edge.target, edge]));

		expect(by_target.get('target-1')?.source).toBe('source-1');
		expect(by_target.get('target-2')?.source).toBe('source-2');
	});

	it('fans one virtual wire input channel out through multiple output portals', () => {
		const nodes: FlowNode[] = [
			node('source'),
			node('target-a'),
			node('target-b'),
			{
				...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }] },
			},
			{
				...node('wire-out-a', VIRTUAL_WIRE_OUTPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }] },
			},
			{
				...node('wire-out-b', VIRTUAL_WIRE_OUTPUT_TYPE),
				data: { pair_id: 'wire-a', channels: [{ id: '1' }] },
			},
		];
		const edges: FlowEdge[] = [
			{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
			{ id: 'wire-target-a', source: 'wire-out-a', source_handle: 'out-1', target: 'target-a', target_handle: 'in' },
			{ id: 'wire-target-b', source: 'wire-out-b', source_handle: 'out-1', target: 'target-b', target_handle: 'in' },
		];

		const resolved_edges = resolveVirtualWireEdges(nodes, edges);
		const by_target = new Map(resolved_edges.map((edge) => [edge.target, edge]));

		expect(resolved_edges).toHaveLength(2);
		expect(by_target.get('target-a')).toMatchObject({ source: 'source', source_handle: 'out' });
		expect(by_target.get('target-b')).toMatchObject({ source: 'source', source_handle: 'out' });
		expect(by_target.get('target-a')?.data?.kaykay_virtual_wire).toMatchObject({ output_node_id: 'wire-out-a' });
		expect(by_target.get('target-b')?.data?.kaykay_virtual_wire).toMatchObject({ output_node_id: 'wire-out-b' });
	});

	it('serializes virtual wires as direct edges with editor metadata', () => {
		const flow: Flow = {
			nodes: [
				node('source'),
				{
					...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
					position: { x: 100, y: 200 },
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				{
					...node('wire-out', VIRTUAL_WIRE_OUTPUT_TYPE),
					position: { x: 500, y: 200 },
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				node('target'),
			],
			edges: [
				{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
				{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
			],
		};

		const flattened = flattenVirtualWireFlow(flow);

		expect(flattened.nodes.map((flat_node) => flat_node.id)).toEqual(['source', 'target']);
		expect(flattened.edges).toHaveLength(1);
		expect(flattened.edges[0]).toMatchObject({
			id: 'virtual:source-wire:wire-target',
			source: 'source',
			target: 'target',
		});
		expect(flattened.edges[0].data?.kaykay_virtual_wire).toMatchObject({
			pair_id: 'wire-a',
			input_edge_id: 'source-wire',
			output_edge_id: 'wire-target',
		});
		expect(flattened.kaykay?.virtual_wires?.nodes.map((virtual_node) => virtual_node.id)).toEqual([
			'wire-in',
			'wire-out',
		]);
		expect(flattened.kaykay?.virtual_wires?.edges.map((virtual_edge) => virtual_edge.id)).toEqual([
			'source-wire',
			'wire-target',
		]);
	});

	it('serializes and hydrates multiple output portals for one input channel', () => {
		const compatible_flow = flattenVirtualWireFlow({
			nodes: [
				node('source'),
				{
					...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				{
					...node('wire-out-a', VIRTUAL_WIRE_OUTPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				{
					...node('wire-out-b', VIRTUAL_WIRE_OUTPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				node('target-a'),
				node('target-b'),
			],
			edges: [
				{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
				{ id: 'wire-target-a', source: 'wire-out-a', source_handle: 'out-1', target: 'target-a', target_handle: 'in' },
				{ id: 'wire-target-b', source: 'wire-out-b', source_handle: 'out-1', target: 'target-b', target_handle: 'in' },
			],
		});

		expect(compatible_flow.nodes.map((flat_node) => flat_node.id)).toEqual(['source', 'target-a', 'target-b']);
		expect(compatible_flow.edges.map((flat_edge) => flat_edge.target).sort()).toEqual(['target-a', 'target-b']);

		const hydrated = hydrateVirtualWireFlow(compatible_flow);

		expect(hydrated.nodes.map((hydrated_node) => hydrated_node.id)).toEqual([
			'source',
			'target-a',
			'target-b',
			'wire-in',
			'wire-out-a',
			'wire-out-b',
		]);
		expect(hydrated.edges.map((hydrated_edge) => hydrated_edge.id)).toEqual([
			'source-wire',
			'wire-target-a',
			'wire-target-b',
		]);
	});

	it('hydrates compatible virtual wire JSON back into editor nodes', () => {
		const compatible_flow = flattenVirtualWireFlow({
			nodes: [
				node('source'),
				{
					...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				{
					...node('wire-out', VIRTUAL_WIRE_OUTPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				node('target'),
			],
			edges: [
				{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
				{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
			],
		});

		const hydrated = hydrateVirtualWireFlow(compatible_flow);

		expect(hydrated.nodes.map((hydrated_node) => hydrated_node.id)).toEqual([
			'source',
			'target',
			'wire-in',
			'wire-out',
		]);
		expect(hydrated.edges.map((hydrated_edge) => hydrated_edge.id)).toEqual(['source-wire', 'wire-target']);
	});

	it('hydrates virtual wires even when old systems strip direct edge data', () => {
		const compatible_flow = flattenVirtualWireFlow({
			nodes: [
				node('source'),
				{
					...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				{
					...node('wire-out', VIRTUAL_WIRE_OUTPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				node('target'),
			],
			edges: [
				{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
				{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
			],
		});
		compatible_flow.edges = compatible_flow.edges.map((edge) => ({ ...edge, data: undefined }));

		const hydrated = hydrateVirtualWireFlow(compatible_flow);

		expect(hydrated.edges.map((hydrated_edge) => hydrated_edge.id)).toEqual(['source-wire', 'wire-target']);
	});

	it('does not restore stale portal edges when the direct edge was deleted', () => {
		const compatible_flow = flattenVirtualWireFlow({
			nodes: [
				node('source'),
				{
					...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				{
					...node('wire-out', VIRTUAL_WIRE_OUTPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				node('target'),
			],
			edges: [
				{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
				{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
			],
		});
		compatible_flow.edges = [];

		const hydrated = hydrateVirtualWireFlow(compatible_flow);

		expect(hydrated.nodes.map((hydrated_node) => hydrated_node.id)).toEqual([
			'source',
			'target',
			'wire-in',
			'wire-out',
		]);
		expect(hydrated.edges).toEqual([]);
	});

	it('retargets restored portal edges from the current direct edge', () => {
		const compatible_flow = flattenVirtualWireFlow({
			nodes: [
				node('source'),
				{
					...node('wire-in', VIRTUAL_WIRE_INPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				{
					...node('wire-out', VIRTUAL_WIRE_OUTPUT_TYPE),
					data: { pair_id: 'wire-a', pair_label: 'Wire A', channels: [{ id: '1' }] },
				},
				node('target'),
				node('target-2'),
			],
			edges: [
				{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
				{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
			],
		});
		compatible_flow.edges = compatible_flow.edges.map((edge) => ({
			...edge,
			target: 'target-2',
			data: undefined,
		}));

		const hydrated = hydrateVirtualWireFlow(compatible_flow);
		const output_edge = hydrated.edges.find((edge) => edge.id === 'wire-target');

		expect(hydrated.edges.map((hydrated_edge) => hydrated_edge.id)).toEqual(['source-wire', 'wire-target']);
		expect(output_edge).toMatchObject({
			source: 'wire-out',
			source_handle: 'out-1',
			target: 'target-2',
			target_handle: 'in',
		});
	});
});
