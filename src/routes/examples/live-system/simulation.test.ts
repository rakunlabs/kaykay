import { describe, expect, it } from 'vitest';
import { initialSnapshot, step, type Snapshot } from './simulation.js';

function expect_conservation(snapshot: Snapshot): void {
  const queued = Object.values(snapshot.nodes).reduce((sum, metric) => sum + metric.queue, 0);
  expect(snapshot.offered).toBeCloseTo(snapshot.completed + snapshot.dropped + queued, 7);
}

describe('live-system fluid simulation', () => {
  it('starts empty with the exact topology and remains empty at zero load', () => {
    const initial = initialSnapshot();
    expect(Object.keys(initial.nodes)).toEqual([
      'clients', 'balancer', 'api-a', 'api-b', 'cache', 'database'
    ]);
    expect(Object.keys(initial.edges)).toEqual([
      'clients-balancer', 'balancer-api-a', 'balancer-api-b',
      'api-a-cache', 'api-b-cache', 'cache-database'
    ]);
    expect(step(initial, { load: 0, cache_hit: 0.5, api_failed: false }, 0.25))
      .toEqual({ ...initial, elapsed: 0.25 });
    initial.nodes.clients.rate = 10;
    expect(initialSnapshot().nodes.clients.rate).toBe(0);
  });

  it('conserves fluid across many changing loads, time steps, hits, and failures', () => {
    let snapshot = initialSnapshot();
    for (let i = 0; i < 2000; i++) {
      const previous = snapshot;
      snapshot = step(previous, {
        load: (i * 137) % 1800,
        cache_hit: (i % 11) / 10,
        api_failed: i % 53 < 12
      }, 0.01 + (i % 17) / 20);
      expect_conservation(snapshot);
      const tick_drops = Object.values(snapshot.nodes).reduce((sum, metric) => sum + metric.dropped, 0);
      expect(snapshot.dropped - previous.dropped).toBeCloseTo(tick_drops, 7);
      for (const metric of Object.values(snapshot.nodes)) {
        expect(metric.utilization).toBeGreaterThanOrEqual(0);
        expect(metric.utilization).toBeLessThanOrEqual(1);
        expect(metric.queue).toBeGreaterThanOrEqual(0);
      }
      expect(snapshot.nodes['api-a'].queue).toBeLessThanOrEqual(600);
      expect(snapshot.nodes['api-b'].queue).toBeLessThanOrEqual(600);
      expect(snapshot.nodes.database.queue).toBeLessThanOrEqual(360);
    }
  });

  it('saturates at capacity with bounded queues and tail drops', () => {
    let snapshot = initialSnapshot();
    for (let i = 0; i < 20; i++) {
      snapshot = step(snapshot, { load: 2000, cache_hit: 0, api_failed: false }, 1);
    }
    expect(snapshot.nodes['api-a']).toEqual({ rate: 300, utilization: 1, queue: 600, dropped: 700 });
    expect(snapshot.nodes['api-b']).toEqual(snapshot.nodes['api-a']);
    expect(snapshot.nodes.database).toEqual({ rate: 180, utilization: 1, queue: 360, dropped: 420 });
    expect(snapshot.edges['cache-database']).toBe(600);
    expect_conservation(snapshot);
  });

  it('drains retained work after overload without further drops', () => {
    let snapshot = initialSnapshot();
    for (let i = 0; i < 10; i++) {
      snapshot = step(snapshot, { load: 1500, cache_hit: 0.8, api_failed: false }, 1);
    }
    const dropped = snapshot.dropped;
    for (let i = 0; i < 10; i++) {
      snapshot = step(snapshot, { load: 0, cache_hit: 0.8, api_failed: false }, 1);
      expect_conservation(snapshot);
    }
    expect(snapshot.dropped).toBe(dropped);
    expect(Object.values(snapshot.nodes).every((metric) => metric.queue === 0)).toBe(true);
    expect(snapshot.completed + snapshot.dropped).toBeCloseTo(snapshot.offered);
  });

  it('completes hits immediately and queues only misses at the database', () => {
    const hits = step(initialSnapshot(), { load: 600, cache_hit: 1, api_failed: false }, 1);
    expect(hits.completed).toBe(600);
    expect(hits.nodes.database.rate).toBe(0);
    const misses = step(initialSnapshot(), { load: 600, cache_hit: 0.5, api_failed: false }, 1);
    expect(misses.completed).toBe(480);
    expect(misses.nodes.database.queue).toBe(120);
    expect_conservation(misses);
  });

  it('is deterministic and never mutates its inputs', () => {
    const previous = step(initialSnapshot(), { load: 1000, cache_hit: 0.2, api_failed: false }, 1);
    const original = structuredClone(previous);
    const settings = Object.freeze({ load: 400, cache_hit: 0.75, api_failed: true });
    Object.values(previous.nodes).forEach(Object.freeze);
    Object.freeze(previous.nodes);
    Object.freeze(previous.edges);
    Object.freeze(previous);
    expect(step(previous, settings, 0.3)).toEqual(step(previous, settings, 0.3));
    expect(previous).toEqual(original);
  });

  it('sheds failed API backlog once, reroutes all arrivals, and restores balanced routing', () => {
    const previous = step(initialSnapshot(), { load: 1000, cache_hit: 1, api_failed: false }, 1);
    const failed = step(previous, { load: 200, cache_hit: 1, api_failed: true }, 1);
    expect(failed.nodes['api-a']).toEqual({ rate: 0, utilization: 0, queue: 0, dropped: 200 });
    expect(failed.edges['balancer-api-a']).toBe(0);
    expect(failed.edges['api-a-cache']).toBe(0);
    expect(failed.edges['balancer-api-b']).toBe(200);
    expect(failed.nodes['api-b'].queue).toBe(100);
    expect_conservation(failed);
    const still_failed = step(failed, { load: 0, cache_hit: 1, api_failed: true }, 1);
    expect(still_failed.dropped).toBe(failed.dropped);
    const recovered = step(still_failed, { load: 200, cache_hit: 1, api_failed: false }, 1);
    expect(recovered.edges['balancer-api-a']).toBe(100);
    expect(recovered.edges['balancer-api-b']).toBe(100);
    expect_conservation(recovered);
  });

  it('clamps settings and time steps, treating invalid or zero time as a no-op', () => {
    const initial = initialSnapshot();
    const settings = { load: 20_000, cache_hit: 2, api_failed: false };
    expect(step(initial, settings, 100)).toEqual(
      step(initial, { ...settings, load: 10_000, cache_hit: 1 }, 1)
    );
    for (const dt of [0, -1, NaN, Infinity, -Infinity]) {
      expect(step(initial, settings, dt)).toEqual(initial);
    }
    for (const load of [-1, NaN, Infinity, -Infinity]) {
      expect(step(initial, { ...settings, load }, 1).offered).toBe(0);
    }
    for (const cache_hit of [-1, NaN, Infinity, -Infinity]) {
      expect(step(initial, { load: 200, cache_hit, api_failed: false }, 1)).toEqual(
        step(initial, { load: 200, cache_hit: 0, api_failed: false }, 1)
      );
    }
  });
});
