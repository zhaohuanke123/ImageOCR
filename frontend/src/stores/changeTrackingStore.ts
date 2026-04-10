import { create } from 'zustand';
import type { Operation, ChangeLog, MindmapNode } from '@/types';

interface ChangeTrackingState {
  // Original data snapshot for comparison
  originalNodes: Map<string, MindmapNode>;
  originalEdges: Set<string>; // Store as "parentId:childId" strings

  // Operations log
  operations: Operation[];

  // Has unsaved changes
  hasChanges: boolean;

  // Actions
  initializeOriginalData: (nodes: MindmapNode[], edges: { parent_id: string; child_id: string }[]) => void;
  recordOperation: (operation: Operation) => void;
  getChangeLog: () => ChangeLog;
  getChangesCount: () => { nodeChanges: number; edgeChanges: number; total: number };
  clearChanges: () => void;
  markAsSaved: () => void;
}

export const useChangeTrackingStore = create<ChangeTrackingState>((set, get) => ({
  originalNodes: new Map(),
  originalEdges: new Set(),
  operations: [],
  hasChanges: false,

  initializeOriginalData: (nodes, edges) => {
    const originalNodes = new Map<string, MindmapNode>();
    const originalEdges = new Set<string>();

    nodes.forEach(node => {
      originalNodes.set(node.id, { ...node });
    });

    edges.forEach(edge => {
      originalEdges.add(`${edge.parent_id}:${edge.child_id}`);
    });

    set({
      originalNodes,
      originalEdges,
      operations: [],
      hasChanges: false,
    });
  },

  recordOperation: (operation) => {
    set(state => ({
      operations: [...state.operations, operation],
      hasChanges: true,
    }));
  },

  getChangeLog: () => ({
    timestamp: new Date().toISOString(),
    operations: get().operations,
  }),

  getChangesCount: () => {
    const operations = get().operations;
    let nodeChanges = 0;
    let edgeChanges = 0;

    operations.forEach(op => {
      switch (op.type) {
        case 'update_node':
        case 'delete_node':
        case 'merge_nodes':
        case 'split_node':
          nodeChanges++;
          break;
        case 'add_edge':
        case 'delete_edge':
          edgeChanges++;
          break;
      }
    });

    return {
      nodeChanges,
      edgeChanges,
      total: operations.length,
    };
  },

  clearChanges: () => {
    set({
      operations: [],
      hasChanges: false,
    });
  },

  markAsSaved: () => {
    // Update original data to current state and clear operations
    const { operations, originalNodes, originalEdges } = get();

    // Apply all operations to the original data snapshot
    operations.forEach(op => {
      switch (op.type) {
        case 'update_node':
          const node = originalNodes.get(op.nodeId);
          if (node) {
            originalNodes.set(op.nodeId, { ...node, ...op.after });
          }
          break;
        case 'delete_node':
          originalNodes.delete(op.nodeId);
          break;
        case 'merge_nodes':
          // Remove merged nodes (they're already gone from the store)
          op.nodeIds.forEach(id => originalNodes.delete(id));
          // Note: new merged node would be added through other operations
          break;
        case 'split_node':
          // Original node is replaced by new nodes
          originalNodes.delete(op.nodeId);
          break;
        case 'add_edge':
          originalEdges.add(`${op.parentId}:${op.childId}`);
          break;
        case 'delete_edge':
          originalEdges.delete(`${op.parentId}:${op.childId}`);
          break;
      }
    });

    set({
      originalNodes: new Map(originalNodes),
      originalEdges: new Set(originalEdges),
      operations: [],
      hasChanges: false,
    });
  },
}));

// Selector hooks
export const useHasChanges = () => useChangeTrackingStore(state => state.hasChanges);
export const useOperations = () => useChangeTrackingStore(state => state.operations);
// Note: getChangesCount returns a new object each time, use sparingly
// Prefer useHasChanges for checking if there are any changes
export const useChangesCount = () => useChangeTrackingStore(state => state.operations.length);
