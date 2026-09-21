import { describe, expect, it } from 'vitest';
import type { EdgeAnimation } from '../lib/types/index.js';
import { getEdgeAnimation, normalizeEdgeNumber } from '../lib/utils/edge-animation.js';

describe('edge animation', () => {
	it('defaults explicit options to dots at 48 canvas units per second', () => {
		expect(getEdgeAnimation({}, 240)).toEqual({
			pattern: 'dots', speed: 48, size: 4, spacing: 20, count: 10,
			dasharray: '0 24', dash_offset: -24, dash_duration: 0.5,
			path_duration: 5, direction: 'normal', play_state: 'running',
		});
	});

	it.each(['dots', 'dashes', 'bands', 'squares', 'diamonds'] as const)('normalizes %s with seamless dash loops', (pattern) => {
		const result = getEdgeAnimation({ pattern, speed: 60, size: 6, spacing: 12 }, 300);
		expect(result.pattern).toBe(pattern);
		const period = result.dasharray.split(' ').map(Number).reduce((a, b) => a + b, 0);
		expect(result.dash_offset).toBe(-period);
		expect(result.dash_duration * result.speed).toBeCloseTo(period);
		expect(result.path_duration * result.speed).toBe(300);
	});

	it('accounts for round dot caps and uses long flat bands', () => {
		expect(getEdgeAnimation({ pattern: 'dots', size: 6, spacing: 12 }).dasharray).toBe('0 18');
		expect(getEdgeAnimation({ pattern: 'bands', size: 6, spacing: 12 }).dasharray).toBe('18 12');
	});

	it('freezes with paused or zero speed and reverses without changing duration', () => {
		const normal = getEdgeAnimation({}, 240);
		expect(getEdgeAnimation({ paused: true }, 240)).toEqual({ ...normal, play_state: 'paused' });
		expect(getEdgeAnimation({ reverse: true }, 240)).toEqual({ ...normal, direction: 'reverse' });
		expect(getEdgeAnimation({ speed: 0 }, 240)).toEqual({ ...normal, speed: 0, play_state: 'paused' });
	});

	it.each([NaN, Infinity, -Infinity])('falls back for nonfinite values (%s)', (value) => {
		expect(getEdgeAnimation({ size: value, speed: value, spacing: value }, value)).toEqual(getEdgeAnimation({}));
	});

	it('bounds negative and extreme numeric inputs', () => {
		const negative = getEdgeAnimation({ size: -10, speed: -20, spacing: -30 }, -40);
		expect(negative).toMatchObject({ size: 0.1, speed: 0, spacing: 0, count: 0, play_state: 'paused' });
		const extreme = getEdgeAnimation({ size: 1e300, speed: 1e300, spacing: 1e300 }, 1e300);
		expect(extreme).toMatchObject({ size: 256, speed: 10000, spacing: 10000, count: 256 });
		for (const value of Object.values(extreme)) {
			if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
		}
	});

	it('bounds particle count and keeps durations based on actual path distance', () => {
		expect(getEdgeAnimation({}, 0).count).toBe(0);
		expect(getEdgeAnimation({}, 1).count).toBe(1);
		const result = getEdgeAnimation({ size: 0, spacing: 0 }, 48000);
		expect(result.count).toBe(256);
		expect(result.path_duration).toBe(1000);
	});

	it('keeps durations finite for subnormal positive speeds', () => {
		const result = getEdgeAnimation({ speed: Number.MIN_VALUE }, 480);
		expect(result.speed).toBe(0.01);
		expect(result.path_duration).toBe(48000);
		expect(Number.isFinite(result.dash_duration)).toBe(true);
		expect(result.play_state).toBe('running');
	});

	it('falls back for unknown patterns from untyped input', () => {
		expect(getEdgeAnimation({ pattern: 'unknown' } as unknown as EdgeAnimation).pattern).toBe('dots');
	});

	it('normalizes label padding and radius without losing explicit zero', () => {
		expect(normalizeEdgeNumber(undefined, 4, 0, 256)).toBe(4);
		expect(normalizeEdgeNumber(0, 4, 0, 256)).toBe(0);
		expect(normalizeEdgeNumber(-1, 4, 0, 256)).toBe(0);
		expect(normalizeEdgeNumber(Infinity, 4, 0, 256)).toBe(4);
	});
});
