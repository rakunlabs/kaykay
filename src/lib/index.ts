// Components
export { default as Canvas } from './components/Canvas.svelte';
export { default as BaseEdge } from './components/BaseEdge.svelte';
export { default as Background } from './components/Background.svelte';
export { default as Handle } from './components/Handle.svelte';
export { default as HandleGroup } from './components/HandleGroup.svelte';
export { default as Edge } from './components/Edge.svelte';
export { default as DraftEdge } from './components/DraftEdge.svelte';
export { default as Minimap } from './components/Minimap.svelte';
export { default as GroupNode } from './components/GroupNode.svelte';
export { default as NodeResizer } from './components/NodeResizer.svelte';
export { default as Panel } from './components/Panel.svelte';
export { default as Controls } from './components/Controls.svelte';
export { default as StickyNoteNode } from './components/StickyNoteNode.svelte';
export { default as VirtualWireInputNode } from './components/VirtualWireInputNode.svelte';
export { default as VirtualWireOutputNode } from './components/VirtualWireOutputNode.svelte';
export { default as ViewportPortal } from './components/ViewportPortal.svelte';

// State management
export { FlowState, createFlow, getFlow } from './stores/flow.svelte.js';

// Types
export type {
	Position,
	Rect,
	PanelPosition,
	HandlePosition,
	HandleType,
	HandleDefinition,
	HandleState,
	FlowNode,
	NodeState,
	NodeStatus,
	BuiltinEdgeType,
	EdgeType,
	EdgeStyle,
	FlowEdge,
	VirtualWireChannel,
	VirtualWireNodeData,
	VirtualWireResolvedEdgeData,
	VirtualWireFlowMetadata,
	KaykayFlowMetadata,
	EdgeProps,
	Flow,
	Viewport,
	NodeProps,
	DraftConnection,
	NodeTypes,
	EdgeTypes,
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

export {
	isNode,
	isEdge,
	getConnectedEdges,
	getIncomers,
	getOutgoers,
	getNodesBounds,
	getViewportForBounds,
} from './utils/graph.js';

export {
	VIRTUAL_WIRE_INPUT_TYPE,
	VIRTUAL_WIRE_OUTPUT_TYPE,
	createVirtualWireNodeData,
	getNextVirtualWireChannelId,
	getVirtualWireInputHandleId,
	getVirtualWireOutputHandleId,
	getVirtualWireInputChannelId,
	getVirtualWireOutputChannelId,
	getVirtualWirePairId,
	getVirtualWireNodeChannels,
	isVirtualWireInputNode,
	isVirtualWireOutputNode,
	isVirtualWireNode,
	mergeVirtualWireChannels,
	normalizeVirtualWireChannels,
	flattenVirtualWireFlow,
	hydrateVirtualWireFlow,
	resolveVirtualWireEdges,
} from './utils/virtual-wire.js';
