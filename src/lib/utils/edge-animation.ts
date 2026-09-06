import type { EdgeAnimation, EdgeAnimationPattern } from '../types/index.js';

export function normalizeEdgeNumber(value: number | undefined, fallback: number, min: number, max: number): number {
	return typeof value === 'number' && Number.isFinite(value)
		? Math.min(max, Math.max(min, value))
		: fallback;
}

interface NormalizedEdgeAnimation {
	pattern: EdgeAnimationPattern;
	speed: number;
	size: number;
	spacing: number;
	count: number;
	dasharray: string;
	dash_offset: number;
	dash_duration: number;
	path_duration: number;
	direction: 'reverse' | 'normal';
	play_state: 'paused' | 'running';
}

export function getEdgeAnimation(options: EdgeAnimation, path_length = 0): NormalizedEdgeAnimation {
	const patterns: EdgeAnimationPattern[] = ['dashes', 'dots', 'bands', 'squares', 'diamonds'];
	const pattern = options.pattern && patterns.includes(options.pattern) ? options.pattern : 'dots';
	const raw_speed = normalizeEdgeNumber(options.speed, 48, 0, 10000);
	const speed = raw_speed === 0 ? 0 : Math.max(0.01, raw_speed);
	const size = normalizeEdgeNumber(options.size, 4, 0.1, 256);
	const spacing = normalizeEdgeNumber(options.spacing, 20, 0, 10000);
	const length = normalizeEdgeNumber(path_length, 0, 0, 1e9);
	const segment = pattern === 'dots' ? 0 : pattern === 'dashes' || pattern === 'bands' ? size * 3 : size;
	// Round caps add one diameter to dots; spacing always means the visible gap.
	const gap = pattern === 'dots' ? size + spacing : spacing;
	const period = segment + gap;
	const count = length > 0 ? Math.min(256, Math.max(1, Math.floor(length / (size + spacing)))) : 0;
	return {
		pattern, speed, size, spacing, count,
		dasharray: `${segment} ${gap}`,
		dash_offset: -period,
		dash_duration: period / (speed || 48),
		path_duration: length / (speed || 48),
		direction: options.reverse ? 'reverse' : 'normal',
		play_state: options.paused || speed === 0 ? 'paused' : 'running',
	};
}
