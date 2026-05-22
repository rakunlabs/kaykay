import { describe, expect, it, vi } from 'vitest';
import type { FlowEdge, FlowNode, HandleState } from '../types/index.js';
import { FlowState } from './flow.svelte.js';
import { VIRTUAL_WIRE_INPUT_TYPE, VIRTUAL_WIRE_OUTPUT_TYPE } from '../utils/virtual-wire.js';

function node(id: string): FlowNode {
	return {
		id,
		type: 'test',
		position: { x: 0, y: 0 },
		data: { label: id, nested: { count: 1 } },
	};
}

function handle(id: string, type: 'input' | 'output'): HandleState {
	return {
		id,
		type,
		port: 'data',
		position: type === 'input' ? 'left' : 'right',
		absolute_position: { x: 0, y: 0 },
	};
}

function typedHandle(id: string, type: 'input' | 'output', port: string, accept?: string[]): HandleState {
	return {
		id,
		type,
		port,
		accept,
		position: type === 'input' ? 'left' : 'right',
		absolute_position: { x: 0, y: 0 },
	};
}

function registerDefaultHandles(flow: FlowState, node_id: string): void {
	flow.registerHandle(node_id, handle('in', 'input'));
	flow.registerHandle(node_id, handle('out', 'output'));
}

describe('FlowState serialization and loading', () => {
	it('filters dangling edges on initial load and fromJSON', () => {
		const flow = new FlowState([node('a')], [
			{ id: 'dangling', source: 'a', source_handle: 'out', target: 'missing', target_handle: 'in' },
		]);

		expect(flow.edges).toEqual([]);

		flow.fromJSON({
			nodes: [node('a')],
			edges: [
				{ id: 'dangling', source: 'missing', source_handle: 'out', target: 'a', target_handle: 'in' },
			],
		});

		expect(flow.edges).toEqual([]);
	});

	it('clears stale handles when loading a new flow', () => {
		const flow = new FlowState([node('a')]);
		flow.registerHandle('a', handle('out', 'output'));

		expect(flow.getHandle('a', 'out')).toBeDefined();

		flow.fromJSON({ nodes: [], edges: [] });

		expect(flow.getHandle('a', 'out')).toBeUndefined();
		expect(flow.getHandlePosition('a', 'out')).toBeUndefined();
	});

	it('keeps handles registered for nodes that survive a JSON load', () => {
		const flow = new FlowState([node('a')]);
		flow.registerHandle('a', handle('out', 'output'));
		flow.updateHandlePosition('a', 'out', { x: 12, y: 34 });

		flow.fromJSON({ nodes: [{ ...node('a'), position: { x: 100, y: 100 } }], edges: [] });

		expect(flow.getHandle('a', 'out')).toBeDefined();
		expect(flow.getNode('a')?.handles.get('out')).toBeDefined();
		expect(flow.getHandlePosition('a', 'out')).toEqual({ x: 12, y: 34 });
	});

	it('keeps handles registered for nodes that survive undo and redo', () => {
		const flow = new FlowState([node('a')]);
		flow.registerHandle('a', handle('out', 'output'));

		flow.beginTransaction();
		flow.updateNodePosition('a', { x: 10, y: 20 });
		flow.endTransaction(true, 'node:position');
		expect(flow.undo()).toBe(true);
		expect(flow.getHandle('a', 'out')).toBeDefined();

		expect(flow.redo()).toBe(true);
		expect(flow.getHandle('a', 'out')).toBeDefined();
	});

	it('drops invalid parent cycles when loading', () => {
		const flow = new FlowState([
			{ ...node('a'), parent_id: 'b' },
			{ ...node('b'), parent_id: 'a' },
		]);

		expect(flow.getNode('a')?.parent_id).toBeUndefined();
		expect(flow.getNode('b')?.parent_id).toBe('a');
	});

	it('deep clones node data in JSON snapshots', () => {
		const flow = new FlowState([node('a')]);
		const exported = flow.toJSON();

		(exported.nodes[0].data as { nested: { count: number } }).nested.count = 99;

		expect((flow.toJSON().nodes[0].data as { nested: { count: number } }).nested.count).toBe(1);
	});

	it('preserves custom edge data in JSON snapshots', () => {
		const flow = new FlowState([node('a'), node('b')], [
			{
				id: 'a-b',
				source: 'a',
				source_handle: 'out',
				target: 'b',
				target_handle: 'in',
				type: 'custom',
				data: { nested: { tone: 'blue' } },
			},
		]);
		const exported = flow.toJSON();

		(exported.edges[0].data as { nested: { tone: string } }).nested.tone = 'orange';

		expect((flow.toJSON().edges[0].data as { nested: { tone: string } }).nested.tone).toBe('blue');
	});

	it('exports virtual wires as backend-compatible direct edges', () => {
		const nodes: FlowNode[] = [
			node('source'),
			{ ...node('wire-in'), type: VIRTUAL_WIRE_INPUT_TYPE, data: { pair_id: 'wire-a', channels: [{ id: '1' }] } },
			{ ...node('wire-out'), type: VIRTUAL_WIRE_OUTPUT_TYPE, data: { pair_id: 'wire-a', channels: [{ id: '1' }] } },
			node('target'),
		];
		const edges: FlowEdge[] = [
			{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
			{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
		];
		const flow = new FlowState(nodes, edges);

		const exported = flow.toJSON();

		expect(exported.nodes.map((exported_node) => exported_node.id)).toEqual(['source', 'target']);
		expect(exported.edges).toHaveLength(1);
		expect(exported.edges[0]).toMatchObject({
			id: 'virtual:source-wire:wire-target',
			source: 'source',
			target: 'target',
		});
		expect(exported.edges[0].data?.kaykay_virtual_wire).toMatchObject({
			pair_id: 'wire-a',
			input_edge_id: 'source-wire',
			output_edge_id: 'wire-target',
		});
		expect(exported.kaykay?.virtual_wires?.nodes.map((virtual_node) => virtual_node.id)).toEqual([
			'wire-in',
			'wire-out',
		]);
	});

	it('loads compatible virtual wire JSON back into editor state', () => {
		const source_flow = new FlowState([
			node('source'),
			{ ...node('wire-in'), type: VIRTUAL_WIRE_INPUT_TYPE, data: { pair_id: 'wire-a', channels: [{ id: '1' }] } },
			{ ...node('wire-out'), type: VIRTUAL_WIRE_OUTPUT_TYPE, data: { pair_id: 'wire-a', channels: [{ id: '1' }] } },
			node('target'),
		], [
			{ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' },
			{ id: 'wire-target', source: 'wire-out', source_handle: 'out-1', target: 'target', target_handle: 'in' },
		]);
		const compatible_json = source_flow.toJSON();
		const flow = new FlowState();

		flow.fromJSON(compatible_json);

		expect(flow.nodes.map((loaded_node) => loaded_node.id)).toEqual([
			'source',
			'target',
			'wire-in',
			'wire-out',
		]);
		expect(flow.edges.map((loaded_edge) => loaded_edge.id)).toEqual(['source-wire', 'wire-target']);
	});
});

describe('FlowState connection validation', () => {
	it('enforces input limits, output limits, cycle prevention, and custom validators', () => {
		const flow = new FlowState(
			[node('a'), node('b'), node('c')],
			[],
			{
				max_connections_per_input: 1,
				max_connections_per_output: 1,
				prevent_cycles: true,
				is_valid_connection: ({ target_node }) => target_node.id !== 'c' || 'No connections to c',
			}
		);
		registerDefaultHandles(flow, 'a');
		registerDefaultHandles(flow, 'b');
		registerDefaultHandles(flow, 'c');

		expect(flow.addEdge({ id: 'a-b', source: 'a', source_handle: 'out', target: 'b', target_handle: 'in' })).toBe(true);

		expect(flow.addEdge({ id: 'c-b', source: 'c', source_handle: 'out', target: 'b', target_handle: 'in' })).toBe(false);
		expect(flow.addEdge({ id: 'a-c', source: 'a', source_handle: 'out', target: 'c', target_handle: 'in' })).toBe(false);
		expect(flow.addEdge({ id: 'b-a', source: 'b', source_handle: 'out', target: 'a', target_handle: 'in' })).toBe(false);
		expect(flow.getConnectionValidation('b', 'out', 'c', 'in')).toEqual({
			valid: false,
			reason: 'No connections to c',
		});
	});

	it('reconnects an existing edge while ignoring itself during validation', () => {
		const flow = new FlowState([node('a'), node('b'), node('c')], [], {
			max_connections_per_input: 1,
			prevent_cycles: true,
		});
		registerDefaultHandles(flow, 'a');
		registerDefaultHandles(flow, 'b');
		registerDefaultHandles(flow, 'c');

		expect(flow.addEdge({ id: 'a-b', source: 'a', source_handle: 'out', target: 'b', target_handle: 'in' })).toBe(true);
		expect(flow.reconnectEdge('a-b', 'a', 'out', 'c', 'in')).toBe(true);
		expect(flow.getEdge('a-b')).toMatchObject({ source: 'a', source_handle: 'out', target: 'c', target_handle: 'in' });
		expect(flow.reconnectEdge('a-b', 'a', 'out', 'c', 'in')).toBe(true);
	});

	it('validates virtual wire output connections using the upstream source port', () => {
		const flow = new FlowState([
			{ ...node('source'), data: { label: 'Source' } },
			{ ...node('wire-in'), type: VIRTUAL_WIRE_INPUT_TYPE, data: { pair_id: 'wire-a', channels: [{ id: '1' }] } },
			{ ...node('wire-out'), type: VIRTUAL_WIRE_OUTPUT_TYPE, data: { pair_id: 'wire-a', channels: [{ id: '1' }] } },
			{ ...node('text-target'), data: { label: 'Text Target' } },
			{ ...node('number-target'), data: { label: 'Number Target' } },
		]);
		flow.registerHandle('source', typedHandle('out', 'output', 'text'));
		flow.registerHandle('wire-in', typedHandle('in-1', 'input', '*', ['*']));
		flow.registerHandle('wire-out', typedHandle('out-1', 'output', '*'));
		flow.registerHandle('text-target', typedHandle('in', 'input', 'text'));
		flow.registerHandle('number-target', typedHandle('in', 'input', 'number'));

		expect(flow.addEdge({ id: 'source-wire', source: 'source', source_handle: 'out', target: 'wire-in', target_handle: 'in-1' })).toBe(true);

		expect(flow.getConnectionValidation('wire-out', 'out-1', 'text-target', 'in')).toEqual({ valid: true });
		expect(flow.getConnectionValidation('wire-out', 'out-1', 'number-target', 'in')).toEqual({
			valid: false,
			reason: 'Port text is not accepted by number',
		});
	});
});

describe('FlowState history transactions', () => {
	it('coalesces multiple updates into one undo snapshot', () => {
		const on_change = vi.fn();
		const flow = new FlowState([node('a')], [], {}, { on_change });

		flow.beginTransaction();
		flow.updateNodePosition('a', { x: 10, y: 10 });
		flow.updateNodePosition('a', { x: 20, y: 20 });
		flow.endTransaction(true, 'node:position');

		expect(flow.getNode('a')?.position).toEqual({ x: 20, y: 20 });
		expect(flow.canUndo).toBe(true);
		expect(on_change).toHaveBeenLastCalledWith(flow.toJSON(), 'node:position');

		expect(flow.undo()).toBe(true);
		expect(flow.getNode('a')?.position).toEqual({ x: 0, y: 0 });
		expect(flow.canUndo).toBe(false);
	});
});
