import { describe, it, expect, beforeEach } from 'vitest';
import { useViewStore } from '../stores/viewStore';
import { useAnnotationStore, initializeExpandedNodes } from '../stores/annotationStore';
import { useChangeTrackingStore } from '../stores/changeTrackingStore';
import type { MindmapNode, MindmapEdge } from '@/types';

// Mock data for testing
const mockNodes: MindmapNode[] = [
  {
    id: 'node_1',
    text: 'Root Node',
    bbox: [
      [0, 0],
      [100, 0],
      [100, 50],
      [0, 50],
    ],
    lines: ['Root Node'],
    confidence: 0.95,
    parent_id: null,
    children: ['node_2'],
  },
  {
    id: 'node_2',
    text: 'Child Node',
    bbox: [
      [0, 60],
      [100, 60],
      [100, 110],
      [0, 110],
    ],
    lines: ['Child Node'],
    confidence: 0.92,
    parent_id: 'node_1',
    children: [],
  },
];

const mockEdges: MindmapEdge[] = [
  {
    parent_id: 'node_1',
    child_id: 'node_2',
    score: 0.9,
    reason: 'spatial',
  },
];

describe('useViewStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useViewStore.setState({
      scale: 0.6,
      offsetX: 0,
      offsetY: 0,
      brightness: 0,
      contrast: 0,
      toolMode: 'select',
    });
  });

  it('should have correct initial state', () => {
    const state = useViewStore.getState();
    expect(state.scale).toBe(0.6);
    expect(state.offsetX).toBe(0);
    expect(state.offsetY).toBe(0);
    expect(state.brightness).toBe(0);
    expect(state.contrast).toBe(0);
    expect(state.toolMode).toBe('select');
  });

  it('should update scale', () => {
    useViewStore.getState().setScale(2);
    expect(useViewStore.getState().scale).toBe(2);
  });

  it('should update offset', () => {
    useViewStore.getState().setOffset(100, 200);
    const state = useViewStore.getState();
    expect(state.offsetX).toBe(100);
    expect(state.offsetY).toBe(200);
  });

  it('should adjust brightness and contrast', () => {
    useViewStore.getState().adjustBrightness(20);
    useViewStore.getState().adjustContrast(30);
    expect(useViewStore.getState().brightness).toBe(20);
    expect(useViewStore.getState().contrast).toBe(30);
  });

  it('should set tool mode', () => {
    useViewStore.getState().setToolMode('pan');
    expect(useViewStore.getState().toolMode).toBe('pan');
  });

  it('should zoom in and out', () => {
    useViewStore.getState().setScale(0.5);
    useViewStore.getState().zoomIn();
    expect(useViewStore.getState().scale).toBe(0.6);

    useViewStore.getState().zoomOut();
    expect(useViewStore.getState().scale).toBe(0.5);
  });

  it('should reset adjustments', () => {
    useViewStore.getState().adjustBrightness(20);
    useViewStore.getState().adjustContrast(30);
    useViewStore.getState().resetAdjustments();
    expect(useViewStore.getState().brightness).toBe(0);
    expect(useViewStore.getState().contrast).toBe(0);
  });
});

describe('useAnnotationStore', () => {
  beforeEach(() => {
    // Reset store
    useAnnotationStore.setState({
      selectedNodeId: null,
      hoveredNodeId: null,
      selectedEdgeId: null,
      hoveredEdgeId: null,
      selectedNodeIds: new Set(),
      isMultiSelectMode: false,
      showBlocks: false,
      showNodes: true,
      showEdges: false,
      rootsOnly: false,
      lowConfidenceOnly: false,
      issueTypeFilter: '',
      searchText: '',
      expandedNodes: new Set(),
    });
  });

  it('should have correct initial state', () => {
    const state = useAnnotationStore.getState();
    expect(state.selectedNodeId).toBe(null);
    expect(state.hoveredNodeId).toBe(null);
    expect(state.showBlocks).toBe(false);
    expect(state.showNodes).toBe(true);
    expect(state.showEdges).toBe(false);
  });

  it('should select node', () => {
    useAnnotationStore.getState().selectNode('node_1');
    expect(useAnnotationStore.getState().selectedNodeId).toBe('node_1');
  });

  it('should hover node', () => {
    useAnnotationStore.getState().hoverNode('node_2');
    expect(useAnnotationStore.getState().hoveredNodeId).toBe('node_2');
  });

  it('should toggle visibility options', () => {
    useAnnotationStore.getState().toggleShowBlocks();
    expect(useAnnotationStore.getState().showBlocks).toBe(true);

    useAnnotationStore.getState().toggleShowNodes();
    expect(useAnnotationStore.getState().showNodes).toBe(false);

    useAnnotationStore.getState().toggleShowEdges();
    expect(useAnnotationStore.getState().showEdges).toBe(true);
  });

  it('should toggle expanded nodes', () => {
    useAnnotationStore.getState().toggleNodeExpanded('node_1');
    expect(useAnnotationStore.getState().expandedNodes.has('node_1')).toBe(true);

    useAnnotationStore.getState().toggleNodeExpanded('node_1');
    expect(useAnnotationStore.getState().expandedNodes.has('node_1')).toBe(false);
  });

  it('should handle multi-selection', () => {
    useAnnotationStore.getState().toggleNodeInSelection('node_1');
    expect(useAnnotationStore.getState().selectedNodeIds.has('node_1')).toBe(true);

    useAnnotationStore.getState().toggleNodeInSelection('node_2');
    expect(useAnnotationStore.getState().selectedNodeIds.has('node_2')).toBe(true);

    useAnnotationStore.getState().clearMultiSelection();
    expect(useAnnotationStore.getState().selectedNodeIds.size).toBe(0);
  });

  it('should set search text', () => {
    useAnnotationStore.getState().setSearchText('test');
    expect(useAnnotationStore.getState().searchText).toBe('test');
  });
});

describe('useChangeTrackingStore', () => {
  beforeEach(() => {
    // Reset store
    useChangeTrackingStore.setState({
      originalNodes: new Map(),
      originalEdges: new Set(),
      operations: [],
      hasChanges: false,
    });
  });

  it('should initialize with original data', () => {
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    const state = useChangeTrackingStore.getState();
    expect(state.originalNodes.size).toBe(2);
    expect(state.originalEdges.size).toBe(1);
    expect(state.operations).toEqual([]);
  });

  it('should record update_node operation', () => {
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    useChangeTrackingStore.getState().recordOperation({
      type: 'update_node',
      nodeId: 'node_1',
      before: { text: 'Root Node' },
      after: { text: 'Updated Root Node' },
    });
    expect(useChangeTrackingStore.getState().operations.length).toBe(1);
  });

  it('should record delete_node operation', () => {
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    useChangeTrackingStore.getState().recordOperation({
      type: 'delete_node',
      nodeId: 'node_2',
      node: mockNodes[1],
    });
    expect(useChangeTrackingStore.getState().operations.length).toBe(1);
  });

  it('should record add_edge operation', () => {
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    useChangeTrackingStore.getState().recordOperation({
      type: 'add_edge',
      parentId: 'node_1',
      childId: 'node_3',
    });
    expect(useChangeTrackingStore.getState().operations.length).toBe(1);
  });

  it('should track hasChanges correctly', () => {
    expect(useChangeTrackingStore.getState().hasChanges).toBe(false);
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    useChangeTrackingStore.getState().recordOperation({
      type: 'update_node',
      nodeId: 'node_1',
      before: { text: 'Root Node' },
      after: { text: 'Updated' },
    });
    expect(useChangeTrackingStore.getState().hasChanges).toBe(true);
  });

  it('should mark as saved', () => {
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    useChangeTrackingStore.getState().recordOperation({
      type: 'update_node',
      nodeId: 'node_1',
      before: { text: 'Root Node' },
      after: { text: 'Updated' },
    });
    useChangeTrackingStore.getState().markAsSaved();
    expect(useChangeTrackingStore.getState().hasChanges).toBe(false);
    expect(useChangeTrackingStore.getState().operations.length).toBe(0);
  });

  it('should generate change log', () => {
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    useChangeTrackingStore.getState().recordOperation({
      type: 'update_node',
      nodeId: 'node_1',
      before: { text: 'Root Node' },
      after: { text: 'Updated' },
    });
    const changeLog = useChangeTrackingStore.getState().getChangeLog();
    expect(changeLog.operations.length).toBe(1);
    expect(changeLog.timestamp).toBeDefined();
  });

  it('should count changes correctly', () => {
    useChangeTrackingStore.getState().initializeOriginalData(mockNodes, mockEdges);
    useChangeTrackingStore.getState().recordOperation({
      type: 'update_node',
      nodeId: 'node_1',
      before: { text: 'Root Node' },
      after: { text: 'Updated' },
    });
    useChangeTrackingStore.getState().recordOperation({
      type: 'add_edge',
      parentId: 'node_1',
      childId: 'node_3',
    });
    const counts = useChangeTrackingStore.getState().getChangesCount();
    expect(counts.nodeChanges).toBe(1);
    expect(counts.edgeChanges).toBe(1);
    expect(counts.total).toBe(2);
  });
});

describe('initializeExpandedNodes', () => {
  it('should expand root nodes', () => {
    initializeExpandedNodes(['node_1', 'node_2']);
    expect(useAnnotationStore.getState().expandedNodes.has('node_1')).toBe(true);
    expect(useAnnotationStore.getState().expandedNodes.has('node_2')).toBe(true);
  });
});

// =====================================================
// State Management Performance Tests
// =====================================================

describe('State Management Performance', () => {
  // Generate mock data for performance testing
  function generateLargeNodeSet(count: number): MindmapNode[] {
    const nodes: MindmapNode[] = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `node_${i}`,
        text: `Node ${i} with some longer text to simulate realistic content`,
        bbox: [[i * 10, i * 5], [i * 10 + 80, i * 5], [i * 10 + 80, i * 5 + 40], [i * 10, i * 5 + 40]],
        lines: [`Node ${i} with some longer text`],
        confidence: 0.8 + Math.random() * 0.2,
        parent_id: i === 0 ? null : `node_${Math.floor((i - 1) / 2)}`,
        children: i < count / 2 ? [`node_${i * 2 + 1}`, `node_${i * 2 + 2}`] : [],
      });
    }
    return nodes;
  }

  beforeEach(() => {
    // Reset all stores
    useAnnotationStore.setState({
      selectedNodeId: null,
      hoveredNodeId: null,
      selectedEdgeId: null,
      hoveredEdgeId: null,
      selectedNodeIds: new Set(),
      isMultiSelectMode: false,
      showBlocks: false,
      showNodes: true,
      showEdges: false,
      rootsOnly: false,
      lowConfidenceOnly: false,
      issueTypeFilter: '',
      searchText: '',
      expandedNodes: new Set(),
    });

    useChangeTrackingStore.setState({
      originalNodes: new Map(),
      originalEdges: new Set(),
      operations: [],
      hasChanges: false,
    });
  });

  describe('Selector performance', () => {
    it('should have fast single-value selector access', () => {
      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Simulate accessing single-value selectors
        void useViewStore.getState().scale;
        void useViewStore.getState().toolMode;
        void useAnnotationStore.getState().selectedNodeId;
        void useAnnotationStore.getState().showNodes;
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should be very fast (< 50ms for 10k iterations)
    });

    it('should efficiently handle grouped selector access', () => {
      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Access multiple values from state
        const state = useAnnotationStore.getState();
        void state.selectedNodeId;
        void state.hoveredNodeId;
        void state.showNodes;
        void state.searchText;
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Map operations performance', () => {
    it('should handle nodesById Map efficiently', () => {
      const nodeCount = 1000;
      const nodes = generateLargeNodeSet(nodeCount);

      const start = performance.now();

      // Create Map from nodes
      const nodesById = new Map<string, MindmapNode>();
      nodes.forEach(node => nodesById.set(node.id, node));

      const createDuration = performance.now() - start;

      // Test lookup performance
      const lookupStart = performance.now();
      for (let i = 0; i < 10000; i++) {
        void nodesById.get(`node_${i % nodeCount}`);
      }
      const lookupDuration = performance.now() - lookupStart;

      expect(createDuration).toBeLessThan(20); // Create in < 20ms
      expect(lookupDuration).toBeLessThan(20); // 10k lookups in < 20ms
    });

    it('should handle childrenMap updates efficiently', () => {
      const nodeCount = 500;
      const nodes = generateLargeNodeSet(nodeCount);

      const start = performance.now();

      // Build childrenMap
      const childrenMap = new Map<string, string[]>();
      nodes.forEach(node => {
        childrenMap.set(node.id, node.children || []);
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Set operations performance', () => {
    it('should handle expandedNodes Set efficiently', () => {
      const start = performance.now();

      const expandedNodes = new Set<string>();

      // Add 1000 nodes
      for (let i = 0; i < 1000; i++) {
        expandedNodes.add(`node_${i}`);
      }

      // Check membership 10000 times
      for (let i = 0; i < 10000; i++) {
        expandedNodes.has(`node_${i % 1000}`);
      }

      // Delete all
      for (let i = 0; i < 1000; i++) {
        expandedNodes.delete(`node_${i}`);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(30);
    });

    it('should handle selectedNodeIds Set efficiently', () => {
      const start = performance.now();

      const selectedNodeIds = new Set<string>();

      // Simulate toggle operations
      for (let i = 0; i < 100; i++) {
        selectedNodeIds.add(`node_${i}`);
      }
      for (let i = 0; i < 50; i++) {
        selectedNodeIds.delete(`node_${i}`);
      }
      for (let i = 100; i < 200; i++) {
        selectedNodeIds.add(`node_${i}`);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(5);
      expect(selectedNodeIds.size).toBe(150);
    });
  });

  describe('Update batching', () => {
    it('should handle rapid state updates efficiently', () => {
      const start = performance.now();

      // Simulate rapid selection changes
      for (let i = 0; i < 100; i++) {
        useAnnotationStore.getState().selectNode(`node_${i}`);
        useAnnotationStore.getState().hoverNode(`node_${i + 1}`);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should handle rapid visibility toggles efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        useAnnotationStore.getState().toggleShowBlocks();
        useAnnotationStore.getState().toggleShowNodes();
        useAnnotationStore.getState().toggleShowEdges();
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Allow more time for CI environments
    });
  });

  describe('Change tracking performance', () => {
    it('should efficiently track many operations', () => {
      const start = performance.now();

      useChangeTrackingStore.getState().initializeOriginalData([], []);

      // Record many operations
      for (let i = 0; i < 100; i++) {
        useChangeTrackingStore.getState().recordOperation({
          type: 'update_node',
          nodeId: `node_${i}`,
          before: { text: `Node ${i}` },
          after: { text: `Updated Node ${i}` },
        });
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(20);
      expect(useChangeTrackingStore.getState().operations.length).toBe(100);
    });

    it('should efficiently count changes', () => {
      // Setup: record mixed operations
      useChangeTrackingStore.getState().initializeOriginalData([], []);
      for (let i = 0; i < 50; i++) {
        useChangeTrackingStore.getState().recordOperation({
          type: 'update_node',
          nodeId: `node_${i}`,
          before: {},
          after: {},
        });
      }
      for (let i = 0; i < 30; i++) {
        useChangeTrackingStore.getState().recordOperation({
          type: 'add_edge',
          parentId: `node_${i}`,
          childId: `node_${i + 100}`,
        });
      }

      const start = performance.now();
      const counts = useChangeTrackingStore.getState().getChangesCount();
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5);
      expect(counts.nodeChanges).toBe(50);
      expect(counts.edgeChanges).toBe(30);
      expect(counts.total).toBe(80);
    });
  });

  describe('React.memo optimization verification', () => {
    it('should have stable action references', () => {
      // Verify that action functions are stable (same reference across calls)
      const state1 = useAnnotationStore.getState();
      const state2 = useAnnotationStore.getState();

      expect(state1.selectNode).toBe(state2.selectNode);
      expect(state1.hoverNode).toBe(state2.hoverNode);
      expect(state1.toggleShowNodes).toBe(state2.toggleShowNodes);
    });

    it('should have stable view store action references', () => {
      const state1 = useViewStore.getState();
      const state2 = useViewStore.getState();

      expect(state1.setScale).toBe(state2.setScale);
      expect(state1.setOffset).toBe(state2.setOffset);
      expect(state1.setToolMode).toBe(state2.setToolMode);
    });
  });
});
