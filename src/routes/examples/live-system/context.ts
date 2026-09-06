import type { Settings, Snapshot } from './simulation.js';
import type { EdgeAnimation } from '$lib/index.js';

export const LIVE_SYSTEM = Symbol('live-system');

export interface LiveSystem {
	snapshot: Snapshot;
	settings: Settings;
	running: boolean;
	animation: EdgeAnimation;
	label_background: boolean;
	label_opacity: number;
	traffic_speed: boolean;
	line_color: string;
}
