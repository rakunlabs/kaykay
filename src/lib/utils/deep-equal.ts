// Structural equality with early exit, used to decide whether a history
// snapshot is worth keeping.
//
// The alternative -- `JSON.stringify(a) === JSON.stringify(b)` -- serialises
// both graphs in full before it can answer, so the overwhelmingly common
// "something changed" case paid two complete traversals of every node's data
// to discover a difference that is usually in the first field examined. This
// returns at that first difference instead. It is also insensitive to key
// order, which a stringify comparison is not: reordering a node's data keys
// without changing any value used to record a spurious undo step.
//
// Scope is deliberately snapshot shaped -- plain objects, arrays and
// primitives, which is everything `Flow` may contain, since a snapshot has
// already been through structuredClone or JSON. Dates, Maps, Sets and class
// instances are compared by reference.
export function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;

	// NaN is the one primitive that is not equal to itself.
	if (typeof a === 'number' && typeof b === 'number') return a !== a && b !== b;

	if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;

	const a_is_array = Array.isArray(a);
	if (a_is_array !== Array.isArray(b)) return false;

	if (a_is_array) {
		const left = a as unknown[];
		const right = b as unknown[];
		if (left.length !== right.length) return false;
		for (let i = 0; i < left.length; i++) {
			if (!deepEqual(left[i], right[i])) return false;
		}
		return true;
	}

	const left = a as Record<string, unknown>;
	const right = b as Record<string, unknown>;
	const left_keys = Object.keys(left);
	if (left_keys.length !== Object.keys(right).length) return false;

	for (const key of left_keys) {
		// `{a: undefined}` and `{}` have different key counts but are the same
		// snapshot, so an own-property check is needed rather than a lookup
		// that cannot tell "absent" from "present and undefined".
		if (!Object.hasOwn(right, key)) return false;
		if (!deepEqual(left[key], right[key])) return false;
	}

	return true;
}
