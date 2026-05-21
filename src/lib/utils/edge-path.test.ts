import { describe, expect, it } from 'vitest';
import {
	getClosestPointOnSegment,
	getEdgeCenter,
	getEdgePath,
	getEdgePathWithWaypoints,
	getPointOnLine,
} from './edge-path.js';

describe('edge path utilities', () => {
	it('creates straight paths and centers', () => {
		expect(getEdgePath({ x: 0, y: 0 }, 'right', { x: 10, y: 20 }, 'left', 'straight')).toBe(
			'M 0 0 L 10 20'
		);
		expect(getEdgeCenter({ x: 0, y: 10 }, { x: 20, y: 30 })).toEqual({ x: 10, y: 20 });
	});

	it('splits paths through waypoints', () => {
		const paths = getEdgePathWithWaypoints(
			{ x: 0, y: 0 },
			'right',
			{ x: 30, y: 0 },
			'left',
			'straight',
			[{ x: 10, y: 10 }, { x: 20, y: 10 }]
		);

		expect(paths).toEqual([
			'M 0 0 L 10 10',
			'M 10 10 L 20 10',
			'M 20 10 L 30 0',
		]);
	});

	it('projects points onto a segment', () => {
		expect(getPointOnLine({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
		expect(getClosestPointOnSegment({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({
			position: { x: 5, y: 0 },
			ratio: 0.5,
		});
	});
});
