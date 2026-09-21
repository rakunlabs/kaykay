#!/usr/bin/env node
// Fail the build if the packaged output contains files that have no business
// being published.
//
// svelte-package copies everything under src/lib with no way to exclude, so a
// test file placed next to the module it tests is shipped to every consumer.
// That is how 0.2.1 published dist/stores/flow.svelte.test.js, which imports
// vitest -- a devDependency nobody installing this package has. Tests live in
// src/tests for that reason; this catches the next one that drifts back.

import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve(process.argv[2] ?? 'dist');

/** @type {(dir: string) => string[]} */
function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});
}

if (!fs.existsSync(dist)) {
	console.error(`check-dist: ${dist} does not exist -- run the package step first`);
	process.exit(1);
}

const rules = [
	{ label: 'test file', match: (/** @type {string} */ f) => /\.(test|spec)\./.test(path.basename(f)) },
	{ label: 'source map', match: (/** @type {string} */ f) => f.endsWith('.map') },
];

const offenders = walk(dist).flatMap((file) => {
	const rule = rules.find((r) => r.match(file));
	return rule ? [`${path.relative(dist, file)}  (${rule.label})`] : [];
});

if (offenders.length > 0) {
	console.error(`check-dist: ${offenders.length} file(s) must not be published:`);
	for (const offender of offenders) console.error(`  ${offender}`);
	console.error('\nMove tests to src/tests/; svelte-package publishes all of src/lib.');
	process.exit(1);
}
