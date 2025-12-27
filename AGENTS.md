# AGENTS.md - Coding Agent Guidelines for kaykay

This document provides guidelines for AI coding agents working on the kaykay codebase - a Svelte 5 flow/node editor library with typed port connections.

## Project Overview

- **Name**: kaykay
- **Type**: Svelte 5 component library (ES Module)
- **Framework**: SvelteKit with static adapter (for demo site)
- **Package Manager**: pnpm (v10)

## Build, Lint, and Test Commands

### Primary Commands

```bash
# Development server (http://localhost:5173)
pnpm dev

# Build library for distribution
pnpm build

# Type checking (TypeScript + Svelte)
pnpm check

# Linting (oxlint)
pnpm lint

# Format code (Prettier)
pnpm format
```

### Testing

**Note**: No test framework is currently configured. If adding tests:
- Use Vitest (Vite-native) for unit tests
- Use Playwright for component/e2e tests
- Add script: `"test": "vitest"` or `"test": "vitest run"`
- Single test: `pnpm vitest run path/to/file.test.ts`

### CI/CD

- **npm publish**: Triggered on tags (excluding `demo*`), uses pnpm 10 + Node.js 24
- **Demo deploy**: Triggered on `demo*` tags, deploys to GitHub Pages

## Code Style Guidelines

### TypeScript

- **Strict mode** enabled with bundler module resolution
- Use explicit type annotations for function parameters and return types
- Use `interface` for object shapes, `type` for unions and aliases
- Generic types for flexible data handling: `FlowNode<T = Record<string, unknown>>`
- Use `.js` extension for local imports (even for `.ts` files):
  ```typescript
  import type { Position } from '../types/index.js';
  import { FlowState } from '../stores/flow.svelte.js';
  ```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables/Functions | `snake_case` | `node_id`, `handle_offset`, `getAbsolutePosition` |
| Types/Interfaces | `PascalCase` | `FlowNode`, `HandleState`, `Position` |
| Component Files | `PascalCase.svelte` | `Canvas.svelte`, `Handle.svelte` |
| CSS Classes | `kebab-case` with prefix | `kaykay-canvas`, `kaykay-handle-left` |
| CSS Variables | `--kaykay-` prefix | `--kaykay-canvas-bg`, `--kaykay-handle-input-bg` |
| Data Attributes | `data-` prefix | `data-node-id`, `data-handle-type` |

### Import Organization

Order imports as follows:
1. External packages (svelte, etc.)
2. Local types
3. Local components
4. Local utilities/stores

```typescript
import { getContext, onMount, onDestroy } from 'svelte';
import type { HandleType, HandlePosition, Position } from '../types/index.js';
import type { FlowState } from '../stores/flow.svelte.js';
```

### SvelteKit Paths

Use the modern `$app/paths` API (SvelteKit 2.26+):

```typescript
import { resolve, asset } from '$app/paths';

// For routes/navigation
<a href={resolve('/playground')}>Link</a>

// For static assets
<img src={asset('/kaykay.svg')} alt="logo" />
```

### Svelte 5 Patterns

Use Svelte 5 runes consistently:

```svelte
<script lang="ts">
  // Props with interface
  interface Props {
    id: string;
    data: T;
    selected?: boolean;
  }
  let { id, data, selected = false }: Props = $props();

  // Reactive state
  let isDragging = $state(false);
  let position = $state<Position>({ x: 0, y: 0 });

  // Derived values
  const isActive = $derived(isDragging || selected);
  const computedStyle = $derived.by(() => {
    // Complex derivation logic
    return `transform: translate(${position.x}px, ${position.y}px)`;
  });

  // Side effects
  $effect(() => {
    // React to state changes
    console.log('Position changed:', position);
  });
</script>
```

### Class-Based State Management

Use `$state` in class fields for complex state:

```typescript
export class FlowState {
  nodes = $state<NodeState[]>([]);
  edges = $state<FlowEdge[]>([]);
  viewport = $state<Viewport>({ x: 0, y: 0, zoom: 1 });
  
  // Methods mutate state directly
  addNode(node: FlowNode): void {
    this.nodes.push(/* ... */);
  }
}
```

### Component Structure

Follow this order in `.svelte` files:

```svelte
<script lang="ts">
  // 1. External imports
  // 2. Local imports (types, components, stores)
  // 3. Props interface
  // 4. Props destructuring with $props()
  // 5. Context retrieval (getContext)
  // 6. State declarations ($state)
  // 7. Lifecycle (onMount, onDestroy)
  // 8. Functions
  // 9. Derived values ($derived)
</script>

<!-- Template markup -->

<style>
  /* Light mode defaults */
  .kaykay-component {
    --kaykay-component-bg: #fff;
  }
  
  /* Dark mode overrides */
  :global(.kaykay-dark) .kaykay-component {
    --kaykay-component-bg: #1a1a1a;
  }
</style>
```

### CSS Architecture

- Component-scoped styles with CSS custom properties for theming
- Light mode is default; dark mode via `:global(.kaykay-dark)` selector
- Use `kaykay-` prefix for all class names and CSS variables
- Avoid inline styles; prefer CSS classes

### Error Handling

- Throw errors for critical failures (e.g., missing context):
  ```typescript
  export function getFlow(): FlowState {
    const flow = getContext<FlowState>(FLOW_CONTEXT_KEY);
    if (!flow) {
      throw new Error('getFlow must be called within a Canvas component');
    }
    return flow;
  }
  ```
- Use early returns with null checks for optional operations
- Validate connections before creating edges

### Library Exports

All public API is exported from `src/lib/index.ts`:
- Components: default exports (`export { default as Canvas }`)
- State: named exports (`export { FlowState, createFlow, getFlow }`)
- Types: type exports (`export type { Position, FlowNode, ... }`)
- Utilities: named exports (`export { getBezierPath, ... }`)

## Project Structure

```
src/
  lib/                    # Library source (published to npm)
    components/           # Svelte components
    stores/               # State management (flow.svelte.ts)
    types/                # TypeScript type definitions
    utils/                # Utility functions
    index.ts              # Library entry point
  routes/                 # Demo site (not published)
    examples/             # Example pages
    playground/           # Interactive playground
```

## Key Concepts

- **FlowState**: Central state class managing nodes, edges, viewport, and selection
- **Handles**: Connection points on nodes with typed ports for validation
- **Edges**: Connections between handles with bezier/straight/step rendering
- **Groups**: Nodes can be nested within group nodes via `parent_id`
- **Viewport**: Pan/zoom state for canvas navigation

## Dependencies

- **Zero runtime dependencies** - the library has no external runtime deps
- **Peer dependency**: `svelte ^5.0.0`
- **Dev tools**: SvelteKit, TypeScript, Vite, oxlint, Prettier
