export interface Settings {
  load: number;
  cache_hit: number;
  api_failed: boolean;
}

export interface Metric {
  rate: number;
  utilization: number;
  queue: number;
  dropped: number;
}

export interface Snapshot {
  elapsed: number;
  nodes: Record<string, Metric>;
  edges: Record<string, number>;
  completed: number;
  dropped: number;
  offered: number;
}

export function initialSnapshot(): Snapshot {
  return {
    elapsed: 0,
    nodes: Object.fromEntries(
      ['clients', 'balancer', 'api-a', 'api-b', 'cache', 'database'].map((id) => [
        id,
        { rate: 0, utilization: 0, queue: 0, dropped: 0 }
      ])
    ),
    edges: {
      'clients-balancer': 0,
      'balancer-api-a': 0,
      'balancer-api-b': 0,
      'api-a-cache': 0,
      'api-b-cache': 0,
      'cache-database': 0
    },
    completed: 0,
    dropped: 0,
    offered: 0
  };
}

function clamp(value: number, maximum: number): number {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(0, value)) : 0;
}

/**
 * Rates are req/s; queues and drops are fluid request amounts, not latency estimates.
 * Each tick serves old backlog first, then arrivals, and tail-drops excess backlog.
 * Upstream output is available downstream in the same tick (no transit delay).
 * Edge rates include arrivals rejected downstream. Unlimited nodes have utilization 0.
 * Load is capped at 10,000 req/s and dt at 1 second; non-finite inputs become zero.
 * A zero dt is a no-op, including failure changes. Inputs must be simulator snapshots.
 */
export function step(previous: Snapshot, settings: Settings, dt: number): Snapshot {
  dt = clamp(dt, 1);
  if (dt === 0) return previous;

  const load = clamp(settings.load, 10_000);
  const cache_hit = clamp(settings.cache_hit, 1);
  const next = initialSnapshot();
  next.elapsed = previous.elapsed + dt;
  next.offered = previous.offered + load * dt;
  next.nodes.clients.rate = load;
  next.nodes.balancer.rate = load;
  next.edges['clients-balancer'] = load;

  for (const id of ['api-a', 'api-b', 'database']) {
    const metric = next.nodes[id];
    if (id === 'api-a' && settings.api_failed) {
      metric.dropped = previous.nodes[id].queue;
      continue;
    }

    const is_database = id === 'database';
    const arrival_rate = is_database
      ? (next.nodes['api-a'].rate + next.nodes['api-b'].rate) * (1 - cache_hit)
      : load / (settings.api_failed ? 1 : 2);
    const capacity = is_database ? 180 : 300;
    const queue_limit = is_database ? 360 : 600;
    const available = previous.nodes[id].queue + arrival_rate * dt;
    const processed = Math.min(available, capacity * dt);
    const backlog = Math.max(0, available - processed);
    metric.rate = processed / dt;
    metric.utilization = Math.min(1, metric.rate / capacity);
    metric.queue = Math.min(queue_limit, backlog);
    metric.dropped = Math.max(0, backlog - queue_limit);
    next.edges[is_database ? 'cache-database' : `balancer-${id}`] = arrival_rate;
    if (!is_database) next.edges[`${id}-cache`] = metric.rate;
  }

  next.nodes.cache.rate = next.nodes['api-a'].rate + next.nodes['api-b'].rate;
  next.completed = previous.completed +
    (next.nodes.cache.rate * cache_hit + next.nodes.database.rate) * dt;
  next.dropped = previous.dropped +
    next.nodes['api-a'].dropped + next.nodes['api-b'].dropped + next.nodes.database.dropped;
  return next;
}
