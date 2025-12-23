import type { Position, HandlePosition, EdgeType } from '../types/index.js';

// Calculate bezier curve control points based on handle positions
export function getBezierPath(
	sourcePos: Position,
	sourceHandlePosition: HandlePosition,
	targetPos: Position,
	targetHandlePosition: HandlePosition,
	curvature = 0.25
): string {
	const sourceControl = getControlPoint(sourcePos, sourceHandlePosition, targetPos, curvature);
	const targetControl = getControlPoint(targetPos, targetHandlePosition, sourcePos, curvature);

	return `M ${sourcePos.x} ${sourcePos.y} C ${sourceControl.x} ${sourceControl.y}, ${targetControl.x} ${targetControl.y}, ${targetPos.x} ${targetPos.y}`;
}

// Calculate straight line path
export function getStraightPath(sourcePos: Position, targetPos: Position): string {
	return `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;
}

// Calculate step (orthogonal) path
export function getStepPath(
	sourcePos: Position,
	sourceHandlePosition: HandlePosition,
	targetPos: Position,
	targetHandlePosition: HandlePosition
): string {
	const midX = (sourcePos.x + targetPos.x) / 2;
	const midY = (sourcePos.y + targetPos.y) / 2;

	// Determine path based on handle positions
	if (isHorizontal(sourceHandlePosition) && isHorizontal(targetHandlePosition)) {
		// Both horizontal: go through midX
		return `M ${sourcePos.x} ${sourcePos.y} L ${midX} ${sourcePos.y} L ${midX} ${targetPos.y} L ${targetPos.x} ${targetPos.y}`;
	} else if (isVertical(sourceHandlePosition) && isVertical(targetHandlePosition)) {
		// Both vertical: go through midY
		return `M ${sourcePos.x} ${sourcePos.y} L ${sourcePos.x} ${midY} L ${targetPos.x} ${midY} L ${targetPos.x} ${targetPos.y}`;
	} else if (isHorizontal(sourceHandlePosition)) {
		// Source horizontal, target vertical
		return `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;
	} else {
		// Source vertical, target horizontal
		return `M ${sourcePos.x} ${sourcePos.y} L ${sourcePos.x} ${targetPos.y} L ${targetPos.x} ${targetPos.y}`;
	}
}

// Get edge path based on type (without waypoints)
export function getEdgePath(
	sourcePos: Position,
	sourceHandlePosition: HandlePosition,
	targetPos: Position,
	targetHandlePosition: HandlePosition,
	type: EdgeType = 'bezier'
): string {
	switch (type) {
		case 'straight':
			return getStraightPath(sourcePos, targetPos);
		case 'step':
			return getStepPath(sourcePos, sourceHandlePosition, targetPos, targetHandlePosition);
		case 'bezier':
		default:
			return getBezierPath(sourcePos, sourceHandlePosition, targetPos, targetHandlePosition);
	}
}

// Get edge path with waypoints support
export function getEdgePathWithWaypoints(
	sourcePos: Position,
	sourceHandlePosition: HandlePosition,
	targetPos: Position,
	targetHandlePosition: HandlePosition,
	type: EdgeType = 'bezier',
	waypoints: Position[] = []
): string[] {
	if (waypoints.length === 0) {
		return [getEdgePath(sourcePos, sourceHandlePosition, targetPos, targetHandlePosition, type)];
	}

	const paths: string[] = [];
	const allPoints = [sourcePos, ...waypoints, targetPos];

	for (let i = 0; i < allPoints.length - 1; i++) {
		const from = allPoints[i];
		const to = allPoints[i + 1];

		// For first segment: use source handle position, infer "to" direction from where we're going
		// For last segment: infer "from" direction from where we came, use target handle position
		// For middle segments: infer both directions based on flow
		let fromPosition: HandlePosition;
		let toPosition: HandlePosition;

		if (i === 0) {
			// First segment: source handle -> first waypoint
			fromPosition = sourceHandlePosition;
			toPosition = inferIncomingDirection(from, to);
		} else if (i === allPoints.length - 2) {
			// Last segment: last waypoint -> target handle
			fromPosition = inferOutgoingDirection(from, to);
			toPosition = targetHandlePosition;
		} else {
			// Middle segment: waypoint -> waypoint
			fromPosition = inferOutgoingDirection(from, to);
			toPosition = inferIncomingDirection(from, to);
		}

		switch (type) {
			case 'straight':
				paths.push(getStraightPath(from, to));
				break;
			case 'step':
				paths.push(getStepPath(from, fromPosition, to, toPosition));
				break;
			case 'bezier':
			default:
				paths.push(getBezierPath(from, fromPosition, to, toPosition));
				break;
		}
	}

	return paths;
}

// Infer which direction we're leaving FROM a point (going towards "to")
function inferOutgoingDirection(from: Position, to: Position): HandlePosition {
	const dx = to.x - from.x;
	const dy = to.y - from.y;

	if (Math.abs(dx) > Math.abs(dy)) {
		return dx > 0 ? 'right' : 'left';
	} else {
		return dy > 0 ? 'bottom' : 'top';
	}
}

// Infer which direction we're arriving INTO a point (coming from "from")
function inferIncomingDirection(from: Position, to: Position): HandlePosition {
	const dx = to.x - from.x;
	const dy = to.y - from.y;

	// Incoming is opposite of the direction we're traveling
	if (Math.abs(dx) > Math.abs(dy)) {
		return dx > 0 ? 'left' : 'right';
	} else {
		return dy > 0 ? 'top' : 'bottom';
	}
}

// Calculate control point for bezier curve
function getControlPoint(
	point: Position,
	handlePosition: HandlePosition,
	oppositePoint: Position,
	curvature: number
): Position {
	const distance = Math.sqrt(
		Math.pow(oppositePoint.x - point.x, 2) + Math.pow(oppositePoint.y - point.y, 2)
	);
	const offset = distance * curvature;

	switch (handlePosition) {
		case 'left':
			return { x: point.x - offset, y: point.y };
		case 'right':
			return { x: point.x + offset, y: point.y };
		case 'top':
			return { x: point.x, y: point.y - offset };
		case 'bottom':
			return { x: point.x, y: point.y + offset };
	}
}

function isHorizontal(position: HandlePosition): boolean {
	return position === 'left' || position === 'right';
}

function isVertical(position: HandlePosition): boolean {
	return position === 'top' || position === 'bottom';
}

// Calculate the center point of an edge for label positioning
export function getEdgeCenter(
	sourcePos: Position,
	targetPos: Position
): Position {
	return {
		x: (sourcePos.x + targetPos.x) / 2,
		y: (sourcePos.y + targetPos.y) / 2,
	};
}

// Get point on path at a given ratio (0-1) for adding waypoints
export function getPointOnLine(from: Position, to: Position, ratio: number): Position {
	return {
		x: from.x + (to.x - from.x) * ratio,
		y: from.y + (to.y - from.y) * ratio,
	};
}

// Find the closest point on a line segment to a given point
export function getClosestPointOnSegment(
	point: Position,
	segmentStart: Position,
	segmentEnd: Position
): { position: Position; ratio: number } {
	const dx = segmentEnd.x - segmentStart.x;
	const dy = segmentEnd.y - segmentStart.y;
	const lengthSquared = dx * dx + dy * dy;

	if (lengthSquared === 0) {
		return { position: segmentStart, ratio: 0 };
	}

	let ratio = ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / lengthSquared;
	ratio = Math.max(0, Math.min(1, ratio));

	return {
		position: {
			x: segmentStart.x + ratio * dx,
			y: segmentStart.y + ratio * dy,
		},
		ratio,
	};
}
