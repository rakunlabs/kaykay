import type { Position, HandlePosition, EdgeType } from '../types/index.js';

/**
 * Calculate bezier curve control points based on handle positions
 */
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

/**
 * Calculate straight line path
 */
export function getStraightPath(sourcePos: Position, targetPos: Position): string {
	return `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;
}

/**
 * Calculate step (orthogonal) path
 */
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

/**
 * Get edge path based on type
 */
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

/**
 * Calculate control point for bezier curve
 */
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

/**
 * Calculate the center point of an edge for label positioning
 */
export function getEdgeCenter(
	sourcePos: Position,
	targetPos: Position
): Position {
	return {
		x: (sourcePos.x + targetPos.x) / 2,
		y: (sourcePos.y + targetPos.y) / 2,
	};
}
