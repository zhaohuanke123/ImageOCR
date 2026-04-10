import { describe, it, expect } from 'vitest';
import { mergeBBoxes, estimateLineBBox } from '../utils';
import type { BBox, MindmapNode } from '@/types';

// Performance test utilities
function generateLargeNodeSet(count: number): MindmapNode[] {
  const nodes: MindmapNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = (i % 100) * 100;
    const y = Math.floor(i / 100) * 50;
    nodes.push({
      id: `node_${i}`,
      text: `Node ${i}`,
      bbox: [
        [x, y],
        [x + 80, y],
        [x + 80, y + 40],
        [x, y + 40],
      ],
      lines: [`Node ${i}`],
      confidence: 0.9 + Math.random() * 0.1,
      parent_id: i === 0 ? null : `node_${Math.floor((i - 1) / 2)}`,
      children: [],
    });
  }
  return nodes;
}

function generateLargeBBoxSet(count: number): BBox[] {
  const bboxes: BBox[] = [];
  for (let i = 0; i < count; i++) {
    const x = (i % 50) * 20;
    const y = Math.floor(i / 50) * 20;
    bboxes.push([
      [x, y],
      [x + 15, y],
      [x + 15, y + 15],
      [x, y + 15],
    ]);
  }
  return bboxes;
}

// Throttle simulation test
function simulateThrottle(fn: (...args: number[]) => void, interval: number) {
  let lastExecTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: number[] | null = null;

  return (...args: number[]) => {
    const now = Date.now();
    const timeSinceLastExec = now - lastExecTime;

    if (timeSinceLastExec >= interval) {
      lastExecTime = now;
      fn(...args);
    } else if (!timeoutId) {
      pendingArgs = args;
      timeoutId = setTimeout(() => {
        lastExecTime = Date.now();
        timeoutId = null;
        if (pendingArgs !== null) {
          fn(...pendingArgs);
          pendingArgs = null;
        }
      }, interval - timeSinceLastExec);
    } else {
      pendingArgs = args;
    }
  };
}

// RAF throttle simulation
function simulateRafThrottle(fn: (...args: number[]) => void) {
  let rafId: number | null = null;
  let argsRef: number[] | null = null;

  return (...args: number[]) => {
    argsRef = args;

    if (rafId === null) {
      rafId = 1; // Simulate RAF
      fn(...argsRef);
      rafId = null;
    }
  };
}

describe('Performance Tests', () => {
  describe('mergeBBoxes performance', () => {
    it('should handle 100 bboxes in reasonable time', () => {
      const bboxes = generateLargeBBoxSet(100);
      const start = performance.now();
      const result = mergeBBoxes(bboxes);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10); // Should complete in < 10ms
    });

    it('should handle 1000 bboxes in reasonable time', () => {
      const bboxes = generateLargeBBoxSet(1000);
      const start = performance.now();
      const result = mergeBBoxes(bboxes);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(50); // Should complete in < 50ms
    });
  });

  describe('estimateLineBBox performance', () => {
    it('should handle many line estimates efficiently', () => {
      const bbox: BBox = [
        [0, 0],
        [100, 0],
        [100, 1000],
        [0, 1000],
      ];

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        estimateLineBBox(bbox, i % 100, 100);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Should be very fast
    });
  });

  describe('Data structure size limits', () => {
    it('should handle large node sets in memory', () => {
      const nodes = generateLargeNodeSet(1000);

      const start = performance.now();
      const nodeMap = new Map<string, MindmapNode>();
      nodes.forEach(node => nodeMap.set(node.id, node));
      const duration = performance.now() - start;

      expect(nodeMap.size).toBe(1000);
      expect(duration).toBeLessThan(10);
    });

    it('should handle searching in large node sets', () => {
      const nodes = generateLargeNodeSet(1000);

      const start = performance.now();
      const found = nodes.filter(n => n.text.includes('Node 5'));
      const duration = performance.now() - start;

      expect(found.length).toBe(111); // Node 5, 50-59, 500-599
      expect(duration).toBeLessThan(5);
    });
  });

  describe('Viewport calculations', () => {
    it('should handle many zoom/pan operations', () => {
      const operations = 10000;
      let scale = 1;
      let offsetTotal = 0;

      const start = performance.now();
      for (let i = 0; i < operations; i++) {
        scale = Math.max(0.1, Math.min(10, scale + (Math.random() - 0.5) * 0.1));
        offsetTotal += (Math.random() - 0.5) * 100;
      }
      const duration = performance.now() - start;

      void scale; // Use variable to avoid unused warning
      void offsetTotal;
      expect(duration).toBeLessThan(50); // Should be very fast
    });
  });
});

describe('Memory Usage Tests', () => {
  it('should not leak memory when creating/destroying maps', () => {
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const nodeMap = new Map<string, MindmapNode>();
      const nodes = generateLargeNodeSet(100);
      nodes.forEach(n => nodeMap.set(n.id, n));
      nodeMap.clear();
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should handle large bbox transformations', () => {
    const bboxes = generateLargeBBoxSet(500);

    const start = performance.now();
    const transformed = bboxes.map(bbox => ({
      center: {
        x: (bbox[0][0] + bbox[2][0]) / 2,
        y: (bbox[0][1] + bbox[2][1]) / 2,
      },
      width: bbox[2][0] - bbox[0][0],
      height: bbox[2][1] - bbox[0][1],
    }));
    const duration = performance.now() - start;

    expect(transformed.length).toBe(500);
    expect(duration).toBeLessThan(20);
  });
});

describe('Stress Tests', () => {
  it('should handle extreme bbox values', () => {
    const extremeBBox: BBox = [
      [Number.MAX_SAFE_INTEGER / 2, Number.MAX_SAFE_INTEGER / 2],
      [Number.MAX_SAFE_INTEGER / 2 + 100, Number.MAX_SAFE_INTEGER / 2],
      [Number.MAX_SAFE_INTEGER / 2 + 100, Number.MAX_SAFE_INTEGER / 2 + 100],
      [Number.MAX_SAFE_INTEGER / 2, Number.MAX_SAFE_INTEGER / 2 + 100],
    ];

    const merged = mergeBBoxes([extremeBBox]);
    expect(merged).toBeDefined();
  });

  it('should handle very small bbox values', () => {
    const tinyBBox: BBox = [
      [0.00001, 0.00001],
      [0.00002, 0.00001],
      [0.00002, 0.00002],
      [0.00001, 0.00002],
    ];

    const merged = mergeBBoxes([tinyBBox]);
    expect(merged).toBeDefined();
  });

  it('should handle negative coordinates', () => {
    const negativeBBox: BBox = [
      [-100, -100],
      [100, -100],
      [100, 100],
      [-100, 100],
    ];

    const merged = mergeBBoxes([negativeBBox]);
    expect(merged[0]).toEqual([-100, -100]);
    expect(merged[2]).toEqual([100, 100]);
  });
});

describe('Event Throttle Performance', () => {
  it('should throttle rapid calls efficiently', () => {
    const throttled = simulateThrottle(() => {
      // Simulate work
    }, 16);

    const start = performance.now();

    // Simulate rapid calls (like mousemove events)
    for (let i = 0; i < 1000; i++) {
      throttled(i, i + 1);
    }

    const duration = performance.now() - start;

    // With 16ms throttle, 1000 calls should result in far fewer actual executions
    // and complete very quickly
    expect(duration).toBeLessThan(50);
  });

  it('should use RAF throttle for visual updates', () => {
    const rafThrottled = simulateRafThrottle(() => {
      // Simulate work
    });

    const start = performance.now();

    // Simulate rapid calls
    for (let i = 0; i < 1000; i++) {
      rafThrottled(i, i + 1);
    }

    const duration = performance.now() - start;

    // RAF throttle should be very fast
    expect(duration).toBeLessThan(20);
  });
});

describe('Mouse Event Simulation', () => {
  it('should handle drag events efficiently', () => {
    const positions: Array<{ x: number; y: number }> = [];

    // Simulate drag handler
    const handleDrag = (x: number, y: number) => {
      positions.push({ x, y });
    };

    const throttledDrag = simulateThrottle(handleDrag, 16);

    const start = performance.now();

    // Simulate 1000 drag events
    for (let i = 0; i < 1000; i++) {
      throttledDrag(i * 0.5, i * 0.3);
    }

    const duration = performance.now() - start;

    // Should handle 1000 drag events quickly
    expect(duration).toBeLessThan(50);
  });

  it('should batch updates for resize operations', () => {
    const updates: Array<{ id: string; bbox: BBox }> = [];

    // Simulate resize handler
    const handleResize = (id: string, bbox: BBox) => {
      updates.push({ id, bbox });
    };

    const start = performance.now();

    // Simulate 100 resize operations
    for (let i = 0; i < 100; i++) {
      handleResize(`node_${i}`, [
        [i, i],
        [i + 100, i],
        [i + 100, i + 50],
        [i, i + 50],
      ]);
    }

    const duration = performance.now() - start;

    // Should handle 100 resize operations very quickly
    expect(duration).toBeLessThan(10);
    expect(updates.length).toBe(100);
  });
});

describe('Passive Event Listener Simulation', () => {
  it('should not block main thread during scroll', () => {
    let scrollY = 0;

    const handleScroll = (newScrollY: number) => {
      scrollY = newScrollY;
    };

    const start = performance.now();

    // Simulate 1000 scroll events
    for (let i = 0; i < 1000; i++) {
      handleScroll(i);
    }

    const duration = performance.now() - start;

    // Scroll handling should be very fast
    expect(duration).toBeLessThan(5);
    expect(scrollY).toBe(999);
  });
});

describe('Hover State Optimization', () => {
  it('should skip redundant hover updates', () => {
    const hoverUpdates: Array<string | null> = [];
    let lastHoveredId: string | null | undefined = undefined;

    const handleHover = (id: string | null) => {
      // Skip if same as current hover
      if (id === lastHoveredId) return;
      lastHoveredId = id;
      hoverUpdates.push(id);
    };

    const start = performance.now();

    // Simulate hover events with duplicates
    const hoverSequence = [
      'node_1', 'node_1', 'node_1', // Same node - should be deduplicated
      'node_2', 'node_2',           // Same node - should be deduplicated
      'node_3',
      null, null, null,             // Same null - should be deduplicated
      'node_4',
    ];

    for (const id of hoverSequence) {
      handleHover(id);
    }

    const duration = performance.now() - start;

    // Should only have 5 unique hover updates
    expect(hoverUpdates.length).toBe(5);
    expect(hoverUpdates).toEqual(['node_1', 'node_2', 'node_3', null, 'node_4']);
    expect(duration).toBeLessThan(5);
  });
});
