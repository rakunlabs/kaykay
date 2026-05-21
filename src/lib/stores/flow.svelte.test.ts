import { describe, expect, it, vi } from 'vitest';
import type { FlowNode, HandleState } from '../types/index.js';
import { FlowState } from './flow.svelte.js';

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
