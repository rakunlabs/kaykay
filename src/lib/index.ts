// Components
export { default as Canvas } from './components/Canvas.svelte';
export { default as Handle } from './components/Handle.svelte';
export { default as HandleGroup } from './components/HandleGroup.svelte';
export { default as Edge } from './components/Edge.svelte';
export { default as DraftEdge } from './components/DraftEdge.svelte';
export { default as Minimap } from './components/Minimap.svelte';
export { default as GroupNode } from './components/GroupNode.svelte';
export { default as Controls } from './components/Controls.svelte';
export { default as StickyNoteNode } from './components/StickyNoteNode.svelte';

// State management
export { FlowState, createFlow, getFlow } from './stores/flow.svelte.js';

// Types
export type {
	Position,
	HandlePosition,
	HandleType,
	HandleDefinition,
	HandleState,
	FlowNode,
	NodeState,
	NodeStatus,
	EdgeType,
	EdgeStyle,
	FlowEdge,
	Flow,
	Viewport,
	NodeProps,
	DraftConnection,
	NodeTypes,
	FlowConfig,
	FlowCallbacks,
	FlowChangeReason,
	ConnectionValidationContext,
	ConnectionValidationResult,
	ConnectionValidationResultObject,
} from './types/index.js';

// Utilities
export {
	getBezierPath,
	getStraightPath,
	getStepPath,
	getEdgePath,
	getEdgePathWithWaypoints,
	getEdgeCenter,
	getPointOnLine,
	getClosestPointOnSegment,
} from './utils/edge-path.js';
