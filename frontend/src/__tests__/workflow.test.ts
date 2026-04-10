import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '../stores/dataStore';
import { useChangeTrackingStore } from '../stores/changeTrackingStore';
import type { ReviewData, MindmapNode, MindmapEdge, OCRBlock } from '@/types';

// Mock data for testing
const createMockReviewData = (): ReviewData => ({
  image_src: '/test-image.jpg',
  image_width: 1000,
  image_height: 800,
  blocks: [
    {
      id: 'block_1',
      text: 'Block One',
      bbox: [
        [10, 10],
        [100, 10],
        [100, 40],
        [10, 40],
      ],
      confidence: 0.95,
      tile_id: 'tile_0',
    },
    {
      id: 'block_2',
      text: 'Block Two',
      bbox: [
        [10, 50],
        [100, 50],
        [100, 80],
        [10, 80],
      ],
      confidence: 0.92,
      tile_id: 'tile_0',
    },
  ],
  nodes: [
    {
      id: 'node_root',
      text: 'Root Node',
      bbox: [
        [0, 0],
        [200, 0],
        [200, 100],
        [0, 100],
      ],
      lines: ['Root Node'],
      confidence: 0.98,
      parent_id: null,
      children: ['node_child_1'],
    },
    {
      id: 'node_child_1',
      text: 'Child Node 1',
      bbox: [
        [220, 50],
        [400, 50],
        [400, 150],
        [220, 150],
      ],
      lines: ['Child Node 1'],
      confidence: 0.95,
      parent_id: 'node_root',
      children: ['node_child_2'],
    },
    {
      id: 'node_child_2',
      text: 'Child Node 2',
      bbox: [
        [420, 100],
        [600, 100],
        [600, 200],
        [420, 200],
      ],
      lines: ['Child Node 2'],
      confidence: 0.92,
      parent_id: 'node_child_1',
      children: [],
    },
    {
      id: 'node_multi',
      text: 'Line 1\nLine 2\nLine 3',
      bbox: [
        [0, 200],
        [200, 200],
        [200, 350],
        [0, 350],
      ],
      lines: ['Line 1', 'Line 2', 'Line 3'],
      confidence: 0.88,
      parent_id: 'node_root',
      children: [],
    },
  ],
  edges: [
    {
      parent_id: 'node_root',
      child_id: 'node_child_1',
      score: 0.95,
      reason: 'spatial',
    },
    {
      parent_id: 'node_child_1',
      child_id: 'node_child_2',
      score: 0.9,
      reason: 'spatial',
    },
    {
      parent_id: 'node_root',
      child_id: 'node_multi',
      score: 0.85,
      reason: 'spatial',
    },
  ],
  issues: [
    {
      issue_type: 'low_confidence_node',
      node_id: 'node_child_2',
      text: 'Child Node 2',
      reason: 'Confidence below threshold',
      bbox: [
        [420, 100],
        [600, 100],
        [600, 200],
        [420, 200],
      ],
    },
  ],
  summary: {
    node_count: 4,
    edge_count: 3,
    root_count: 1,
    issue_count: 1,
    average_confidence: 0.93,
  },
  thresholds: {
    low_confidence: 0.9,
  },
});

describe('Complete Workflow: Load Data', () => {
  beforeEach(() => {
    // Reset stores
    useDataStore.setState({
      data: null,
      nodesById: new Map(),
      childrenMap: new Map(),
      isLoading: false,
      error: null,
    });
    useChangeTrackingStore.setState({
      operations: [],
      originalNodes: new Map(),
      originalEdges: new Set(),
      hasChanges: false,
    });
  });

  it('should load and validate review data', () => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);

    const state = useDataStore.getState();
    expect(state.data).not.toBeNull();
    expect(state.nodesById.size).toBe(4);
    expect(state.childrenMap.size).toBe(4);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle invalid data structure', () => {
    useDataStore.getState().setData(null as unknown as ReviewData);
    const state = useDataStore.getState();
    expect(state.error).toBe('复核数据结构不合法');
  });

  it('should build nodesById map correctly', () => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);

    const node = useDataStore.getState().nodesById.get('node_root');
    expect(node).toBeDefined();
    expect(node?.text).toBe('Root Node');
    expect(node?.parent_id).toBeNull();
    expect(node?.children).toContain('node_child_1');
  });

  it('should build childrenMap correctly', () => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);

    const children = useDataStore.getState().childrenMap.get('node_root');
    expect(children).toContain('node_child_1');
    // node_multi has parent_id 'node_root', but children array comes from the node's children field
    // which is empty in the mock data
  });
});

describe('Complete Workflow: Edit Nodes', () => {
  beforeEach(() => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);
  });

  it('should update node text', () => {
    useDataStore.getState().updateNode('node_root', { text: 'Updated Root' });

    const node = useDataStore.getState().nodesById.get('node_root');
    expect(node?.text).toBe('Updated Root');

    // Check change tracking
    const operations = useChangeTrackingStore.getState().operations;
    expect(operations.length).toBe(1);
    expect(operations[0].type).toBe('update_node');
  });

  it('should delete node and update relationships', () => {
    // Delete middle node
    useDataStore.getState().deleteNode('node_child_1');

    const state = useDataStore.getState();
    expect(state.nodesById.has('node_child_1')).toBe(false);

    // Check child_2 is now orphaned or re-parented
    const child2 = state.nodesById.get('node_child_2');
    // Child should be re-parented to root (grandparent)
    expect(child2?.parent_id).toBe('node_root');
  });

  it('should merge nodes correctly', () => {
    const mergedNode = useDataStore.getState().mergeNodes(['node_child_1', 'node_multi']);

    expect(mergedNode).not.toBeNull();
    expect(mergedNode?.lines.length).toBe(4); // 1 + 3 lines

    // Check old nodes are removed
    const state = useDataStore.getState();
    expect(state.nodesById.has('node_child_1')).toBe(false);
    expect(state.nodesById.has('node_multi')).toBe(false);
    expect(state.nodesById.has(mergedNode!.id)).toBe(true);
  });

  it('should split multi-line node', () => {
    const newNodes = useDataStore.getState().splitNode('node_multi');

    expect(newNodes.length).toBe(3);
    expect(newNodes[0].text).toBe('Line 1');
    expect(newNodes[1].text).toBe('Line 2');
    expect(newNodes[2].text).toBe('Line 3');

    // Check original node is removed
    const state = useDataStore.getState();
    expect(state.nodesById.has('node_multi')).toBe(false);
  });
});

describe('Complete Workflow: Edit Edges', () => {
  beforeEach(() => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);
  });

  it('should add new edge', () => {
    // Add edge from root to child_2 (direct connection)
    const success = useDataStore.getState().addEdge('node_root', 'node_child_2');

    expect(success).toBe(true);

    // Check child_2's parent is updated
    const child2 = useDataStore.getState().nodesById.get('node_child_2');
    expect(child2?.parent_id).toBe('node_root');
  });

  it('should prevent cycles', () => {
    // Try to create a cycle: child_1 -> root
    const success = useDataStore.getState().addEdge('node_child_1', 'node_root');

    expect(success).toBe(false);
  });

  it('should prevent self-loop', () => {
    const success = useDataStore.getState().addEdge('node_root', 'node_root');
    expect(success).toBe(false);
  });

  it('should delete edge', () => {
    useDataStore.getState().deleteEdge('node_root', 'node_child_1');

    // Check child_1 is now a root
    const child1 = useDataStore.getState().nodesById.get('node_child_1');
    expect(child1?.parent_id).toBeNull();

    // Check root's children list is updated
    const root = useDataStore.getState().nodesById.get('node_root');
    expect(root?.children).not.toContain('node_child_1');
  });
});

describe('Complete Workflow: Change Tracking', () => {
  beforeEach(() => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);
  });

  it('should track multiple operations', () => {
    // Make several changes
    useDataStore.getState().updateNode('node_root', { text: 'Updated' });
    useDataStore.getState().addEdge('node_root', 'node_child_2');
    useDataStore.getState().deleteNode('node_multi');

    const operations = useChangeTrackingStore.getState().operations;
    expect(operations.length).toBe(3);
  });

  it('should generate change log with timestamp', () => {
    useDataStore.getState().updateNode('node_root', { text: 'Updated' });

    const changeLog = useChangeTrackingStore.getState().getChangeLog();
    expect(changeLog.operations.length).toBe(1);
    expect(changeLog.timestamp).toBeDefined();
    expect(new Date(changeLog.timestamp).getTime()).not.toBeNaN();
  });

  it('should report hasChanges correctly', () => {
    expect(useChangeTrackingStore.getState().hasChanges).toBe(false);

    useDataStore.getState().updateNode('node_root', { text: 'Updated' });
    expect(useChangeTrackingStore.getState().hasChanges).toBe(true);

    useChangeTrackingStore.getState().markAsSaved();
    expect(useChangeTrackingStore.getState().hasChanges).toBe(false);
  });
});

describe('Complete Workflow: Add New Content', () => {
  beforeEach(() => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);
  });

  it('should add new blocks', () => {
    const newBlock: OCRBlock = {
      id: 'block_new',
      text: 'New Block',
      bbox: [
        [500, 500],
        [600, 500],
        [600, 530],
        [500, 530],
      ],
      confidence: 0.9,
    };

    useDataStore.getState().addBlocks([newBlock]);

    const data = useDataStore.getState().data;
    expect(data?.blocks.length).toBe(3);
  });

  it('should add new nodes', () => {
    const newNode: MindmapNode = {
      id: 'node_new',
      text: 'New Node',
      bbox: [
        [500, 500],
        [700, 500],
        [700, 600],
        [500, 600],
      ],
      lines: ['New Node'],
      confidence: 0.9,
      parent_id: null,
      children: [],
    };

    useDataStore.getState().addNodes([newNode]);

    const data = useDataStore.getState().data;
    expect(data?.nodes.length).toBe(5);
    expect(useDataStore.getState().nodesById.has('node_new')).toBe(true);
  });

  it('should add new edges', () => {
    const newEdge: MindmapEdge = {
      parent_id: 'node_root',
      child_id: 'node_child_2',
      score: 1.0,
      reason: 'manual',
    };

    useDataStore.getState().addEdges([newEdge]);

    const data = useDataStore.getState().data;
    expect(data?.edges.length).toBe(4);
  });
});

describe('Complete Workflow: Save and Export', () => {
  beforeEach(() => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);
  });

  it('should export modified graph data', () => {
    useDataStore.getState().updateNode('node_root', { text: 'Modified Root' });

    const data = useDataStore.getState().data;
    expect(data?.nodes[0].text).toBe('Modified Root');
  });

  it('should maintain data integrity after multiple operations', () => {
    // Perform a series of operations
    useDataStore.getState().updateNode('node_root', { text: 'Updated' });
    useDataStore.getState().deleteEdge('node_root', 'node_multi');
    const merged = useDataStore.getState().mergeNodes(['node_child_1', 'node_child_2']);

    const state = useDataStore.getState();
    const data = state.data;

    // Check consistency
    expect(data?.nodes.length).toBe(state.nodesById.size);
    expect(data?.summary.node_count).toBe(data?.nodes.length);

    // Check merged node exists and has correct relationships
    if (merged) {
      const mergedInMap = state.nodesById.get(merged.id);
      expect(mergedInMap).toBeDefined();
    }
  });
});

describe('Complete Workflow: Error Handling', () => {
  it('should handle missing node gracefully', () => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);

    // Try to update non-existent node
    useDataStore.getState().updateNode('non_existent', { text: 'Test' });

    // Should not crash and data should remain intact
    expect(useDataStore.getState().nodesById.size).toBe(4);
  });

  it('should handle invalid edge operations', () => {
    const mockData = createMockReviewData();
    useDataStore.getState().setData(mockData);

    // Try to add edge between non-existent nodes
    const success = useDataStore.getState().addEdge('non_existent', 'also_non_existent');
    expect(success).toBe(false);

    // Data should remain intact
    expect(useDataStore.getState().data?.edges.length).toBe(3);
  });
});
