import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ReviewData, MindmapNode, MindmapEdge, OCRBlock } from '@/types';
import { mergeBBoxes, estimateLineBBox } from '@/utils';
import { useChangeTrackingStore } from './changeTrackingStore';

interface DataState {
  // Raw data
  data: ReviewData | null;
  nodesById: Map<string, MindmapNode>;
  childrenMap: Map<string, string[]>;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setData: (data: ReviewData) => void;
  setError: (message: string) => void;
  addBlocks: (blocks: OCRBlock[]) => void;
  addNodes: (nodes: MindmapNode[]) => void;
  addEdges: (edges: MindmapEdge[]) => void;
  clearError: () => void;

  // Node editing actions
  updateNode: (nodeId: string, updates: Partial<MindmapNode>) => void;
  deleteNode: (nodeId: string) => void;
  deleteNodes: (nodeIds: string[]) => void;
  mergeNodes: (nodeIds: string[]) => MindmapNode | null;
  splitNode: (nodeId: string) => MindmapNode[];

  // Edge editing actions
  addEdge: (parentId: string, childId: string) => boolean;
  deleteEdge: (parentId: string, childId: string) => void;
  updateEdge: (oldParentId: string, oldChildId: string, newParentId: string, newChildId: string) => boolean;
  wouldCreateCycle: (parentId: string, childId: string) => boolean;
}

export const useDataStore = create<DataState>((set, get) => ({
  data: null,
  nodesById: new Map(),
  childrenMap: new Map(),
  isLoading: true,
  error: null,

  setData: (data) => {
    // Validate data structure
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges) || !Array.isArray(data.blocks)) {
      set({ error: '复核数据结构不合法', isLoading: false });
      return;
    }

    const nodesById = new Map<string, MindmapNode>();
    const childrenMap = new Map<string, string[]>();

    data.nodes.forEach(node => {
      nodesById.set(node.id, node);
      childrenMap.set(node.id, node.children || []);
    });

    // Initialize change tracking with original data
    useChangeTrackingStore.getState().initializeOriginalData(data.nodes, data.edges);

    set({ data, nodesById, childrenMap, isLoading: false, error: null });
  },

  setError: (message) => set({ error: message, isLoading: false }),

  addBlocks: (blocks) => {
    const { data } = get();
    if (!data) return;

    set({
      data: {
        ...data,
        blocks: [...data.blocks, ...blocks],
      },
    });
  },

  addNodes: (nodes) => {
    const { nodesById, childrenMap, data } = get();
    if (!data) return;

    nodes.forEach(node => {
      nodesById.set(node.id, node);
      childrenMap.set(node.id, node.children || []);
    });

    set({
      nodesById: new Map(nodesById),
      childrenMap: new Map(childrenMap),
      data: {
        ...data,
        nodes: [...data.nodes, ...nodes],
        summary: {
          ...data.summary,
          node_count: data.nodes.length + nodes.length,
        },
      },
    });
  },

  addEdges: (edges) => {
    const { data } = get();
    if (!data) return;

    set({
      data: {
        ...data,
        edges: [...data.edges, ...edges],
        summary: {
          ...data.summary,
          edge_count: data.edges.length + edges.length,
        },
      },
    });
  },

  clearError: () => set({ error: null }),

  // Update a single node's properties
  updateNode: (nodeId, updates) => {
    const { nodesById, data } = get();
    if (!data) return;

    const existingNode = nodesById.get(nodeId);
    if (!existingNode) return;

    // Record the operation before making changes
    const before: Partial<MindmapNode> = {};
    (Object.keys(updates) as (keyof MindmapNode)[]).forEach(key => {
      const value = existingNode[key];
      if (value !== undefined) {
        (before as Record<string, unknown>)[key] = value;
      }
    });
    useChangeTrackingStore.getState().recordOperation({
      type: 'update_node',
      nodeId,
      before,
      after: updates,
    });

    const updatedNode = { ...existingNode, ...updates };
    nodesById.set(nodeId, updatedNode);

    set({
      nodesById: new Map(nodesById),
      data: {
        ...data,
        nodes: data.nodes.map(n => n.id === nodeId ? updatedNode : n),
      },
    });
  },

  // Delete a single node and its related edges
  deleteNode: (nodeId) => {
    const { nodesById, childrenMap, data } = get();
    if (!data) return;

    const nodeToDelete = nodesById.get(nodeId);
    if (!nodeToDelete) return;

    // Record the operation before making changes
    useChangeTrackingStore.getState().recordOperation({
      type: 'delete_node',
      nodeId,
      node: { ...nodeToDelete },
    });

    // Remove from nodesById
    nodesById.delete(nodeId);
    childrenMap.delete(nodeId);

    // Update parent's children list
    if (nodeToDelete.parent_id) {
      const parentChildren = childrenMap.get(nodeToDelete.parent_id) || [];
      const updatedParentChildren = parentChildren.filter(id => id !== nodeId);
      childrenMap.set(nodeToDelete.parent_id, updatedParentChildren);

      // Update parent node in nodesById
      const parentNode = nodesById.get(nodeToDelete.parent_id);
      if (parentNode) {
        const updatedParent = {
          ...parentNode,
          children: updatedParentChildren,
        };
        nodesById.set(nodeToDelete.parent_id, updatedParent);
      }
    }

    // Re-parent children to this node's parent
    const childIds = nodeToDelete.children || [];
    childIds.forEach(childId => {
      const childNode = nodesById.get(childId);
      if (childNode) {
        const updatedChild = {
          ...childNode,
          parent_id: nodeToDelete.parent_id,
        };
        nodesById.set(childId, updatedChild);
      }
    });

    // Update childrenMap for children re-parenting
    if (nodeToDelete.parent_id) {
      const parentChildren = childrenMap.get(nodeToDelete.parent_id) || [];
      childrenMap.set(nodeToDelete.parent_id, [...parentChildren, ...childIds]);
    } else {
      // If deleted node was root, children become roots
      childIds.forEach(childId => {
        const childNode = nodesById.get(childId);
        if (childNode) {
          nodesById.set(childId, { ...childNode, parent_id: null });
        }
      });
    }

    // Remove edges involving this node
    const remainingEdges = data.edges.filter(
      e => e.parent_id !== nodeId && e.child_id !== nodeId
    );

    // Update edges for re-parented children
    const newEdges: MindmapEdge[] = childIds
      .map(childId => ({
        parent_id: nodeToDelete.parent_id,
        child_id: childId,
        score: 0.5,
        reason: 'auto-reparented after deletion',
      }))
      .filter((e): e is MindmapEdge => e.parent_id !== null);

    // Remove issues related to this node
    const remainingIssues = data.issues.filter(i => i.node_id !== nodeId);

    set({
      nodesById: new Map(nodesById),
      childrenMap: new Map(childrenMap),
      data: {
        ...data,
        nodes: data.nodes.filter(n => n.id !== nodeId),
        edges: [...remainingEdges, ...newEdges],
        issues: remainingIssues,
        summary: {
          ...data.summary,
          node_count: data.nodes.length - 1,
          edge_count: remainingEdges.length + newEdges.length,
          issue_count: remainingIssues.length,
        },
      },
    });
  },

  // Delete multiple nodes
  deleteNodes: (nodeIds) => {
    const { deleteNode } = get();
    nodeIds.forEach(id => deleteNode(id));
  },

  // Merge multiple nodes into one
  mergeNodes: (nodeIds) => {
    const { nodesById, childrenMap, data } = get();
    if (!data || nodeIds.length < 2) return null;

    const nodesToMerge = nodeIds
      .map(id => nodesById.get(id))
      .filter((n): n is MindmapNode => n !== undefined);

    if (nodesToMerge.length < 2) return null;

    // Calculate merged bbox (union of all bboxes)
    const mergedBBox = mergeBBoxes(nodesToMerge.map(n => n.bbox));

    // Merge texts (join with newline, but first combine lines)
    const allLines = nodesToMerge.flatMap(n => n.lines);
    const mergedText = allLines.join('\n');

    // Average confidence weighted by text length
    const totalLength = nodesToMerge.reduce((sum, n) => sum + n.text.length, 0);
    const mergedConfidence = nodesToMerge.reduce(
      (sum, n) => sum + n.confidence * n.text.length,
      0
    ) / totalLength;

    // Create new merged node
    const mergedId = `merged_${Date.now()}`;
    const mergedNode: MindmapNode = {
      id: mergedId,
      text: mergedText,
      bbox: mergedBBox,
      lines: allLines,
      confidence: mergedConfidence,
      parent_id: null, // Will be determined below
      children: [],
    };

    // Find the common parent (if any)
    const parents = new Set(nodesToMerge.map(n => n.parent_id).filter(Boolean));
    const commonParent = parents.size === 1 ? [...parents][0] : null;
    mergedNode.parent_id = commonParent as string | null;

    // Collect all children from merged nodes (excluding nodes being merged)
    const allChildren = nodesToMerge
      .flatMap(n => n.children || [])
      .filter(id => !nodeIds.includes(id));
    mergedNode.children = [...new Set(allChildren)];

    // Record the merge operation
    useChangeTrackingStore.getState().recordOperation({
      type: 'merge_nodes',
      nodeIds,
      newNodeId: mergedId,
    });

    // Update childrenMap
    childrenMap.set(mergedId, mergedNode.children);

    // Remove merged nodes from nodesById and childrenMap
    nodeIds.forEach(id => {
      nodesById.delete(id);
      childrenMap.delete(id);
    });

    // Add merged node
    nodesById.set(mergedId, mergedNode);

    // Update parent's children list
    if (commonParent) {
      const parentChildren = childrenMap.get(commonParent as string) || [];
      const updatedParentChildren = [
        ...parentChildren.filter(id => !nodeIds.includes(id)),
        mergedId,
      ];
      childrenMap.set(commonParent as string, updatedParentChildren);

      const parentNode = nodesById.get(commonParent as string);
      if (parentNode) {
        nodesById.set(commonParent as string, {
          ...parentNode,
          children: updatedParentChildren,
        });
      }
    }

    // Update children to point to merged node as parent
    mergedNode.children.forEach(childId => {
      const childNode = nodesById.get(childId);
      if (childNode) {
        nodesById.set(childId, { ...childNode, parent_id: mergedId });
      }
    });

    // Update edges
    const remainingEdges = data.edges.filter(
      e => !nodeIds.includes(e.parent_id) && !nodeIds.includes(e.child_id)
    );

    // Add edge from parent to merged node
    const newEdges: MindmapEdge[] = [];
    if (commonParent) {
      newEdges.push({
        parent_id: commonParent as string,
        child_id: mergedId,
        score: 0.8,
        reason: 'merged from multiple nodes',
      });
    }

    // Add edges from merged node to its children
    mergedNode.children.forEach(childId => {
      newEdges.push({
        parent_id: mergedId,
        child_id: childId,
        score: 0.8,
        reason: 'inherited from merged node',
      });
    });

    // Remove issues related to merged nodes
    const remainingIssues = data.issues.filter(i => !nodeIds.includes(i.node_id));

    const newNodes = [
      ...data.nodes.filter(n => !nodeIds.includes(n.id)),
      mergedNode,
    ];

    set({
      nodesById: new Map(nodesById),
      childrenMap: new Map(childrenMap),
      data: {
        ...data,
        nodes: newNodes,
        edges: [...remainingEdges, ...newEdges],
        issues: remainingIssues,
        summary: {
          ...data.summary,
          node_count: newNodes.length,
          edge_count: remainingEdges.length + newEdges.length,
          issue_count: remainingIssues.length,
        },
      },
    });

    return mergedNode;
  },

  // Split a multi-line node into multiple nodes
  splitNode: (nodeId) => {
    const { nodesById, childrenMap, data } = get();
    if (!data) return [];

    const nodeToSplit = nodesById.get(nodeId);
    if (!nodeToSplit || nodeToSplit.lines.length <= 1) return [];

    const lines = nodeToSplit.lines;
    const parent_id = nodeToSplit.parent_id;
    const children = nodeToSplit.children || [];

    // Create new nodes for each line
    const newNodes: MindmapNode[] = lines.map((line, index) => {
      // Estimate bbox for each line (split vertically)
      const lineBBox = estimateLineBBox(nodeToSplit.bbox, index, lines.length);

      return {
        id: `${nodeId}_split_${index}`,
        text: line,
        bbox: lineBBox,
        lines: [line],
        confidence: nodeToSplit.confidence,
        parent_id: index === 0 ? parent_id : null, // First line keeps parent
        children: index === 0 ? children : [], // First line keeps children
      };
    });

    // Record the split operation
    useChangeTrackingStore.getState().recordOperation({
      type: 'split_node',
      nodeId,
      newNodeIds: newNodes.map(n => n.id),
    });

    // Remove original node
    nodesById.delete(nodeId);
    childrenMap.delete(nodeId);

    // Add new nodes
    newNodes.forEach(node => {
      nodesById.set(node.id, node);
      childrenMap.set(node.id, node.children);
    });

    // Update parent's children list
    if (parent_id) {
      const parentChildren = childrenMap.get(parent_id) || [];
      const updatedParentChildren = [
        ...parentChildren.filter(id => id !== nodeId),
        newNodes[0].id,
      ];
      childrenMap.set(parent_id, updatedParentChildren);

      const parentNode = nodesById.get(parent_id);
      if (parentNode) {
        nodesById.set(parent_id, {
          ...parentNode,
          children: updatedParentChildren,
        });
      }
    }

    // Update children to point to first split node
    children.forEach(childId => {
      const childNode = nodesById.get(childId);
      if (childNode) {
        nodesById.set(childId, { ...childNode, parent_id: newNodes[0].id });
      }
    });

    // Update edges
    const remainingEdges = data.edges.filter(
      e => e.parent_id !== nodeId && e.child_id !== nodeId
    );

    // Add edge from parent to first split node
    const newEdges: MindmapEdge[] = [];
    if (parent_id) {
      newEdges.push({
        parent_id,
        child_id: newNodes[0].id,
        score: 0.8,
        reason: 'split from original node',
      });
    }

    // Add edges from first split node to children
    children.forEach(childId => {
      newEdges.push({
        parent_id: newNodes[0].id,
        child_id: childId,
        score: 0.8,
        reason: 'inherited from split node',
      });
    });

    // Remove issues related to original node
    const remainingIssues = data.issues.filter(i => i.node_id !== nodeId);

    const updatedNodes = [
      ...data.nodes.filter(n => n.id !== nodeId),
      ...newNodes,
    ];

    set({
      nodesById: new Map(nodesById),
      childrenMap: new Map(childrenMap),
      data: {
        ...data,
        nodes: updatedNodes,
        edges: [...remainingEdges, ...newEdges],
        issues: remainingIssues,
        summary: {
          ...data.summary,
          node_count: updatedNodes.length,
          edge_count: remainingEdges.length + newEdges.length,
          issue_count: remainingIssues.length,
        },
      },
    });

    return newNodes;
  },

  // Check if adding an edge would create a cycle
  wouldCreateCycle: (parentId, childId) => {
    const { nodesById } = get();

    // A node cannot be its own parent
    if (parentId === childId) return true;

    // Check if parent is a descendant of child (would create cycle)
    const visited = new Set<string>();
    const queue = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === childId) return true;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = nodesById.get(currentId);
      if (node?.parent_id) {
        queue.push(node.parent_id);
      }
    }

    return false;
  },

  // Add a new edge between parent and child
  addEdge: (parentId, childId) => {
    const { nodesById, childrenMap, data } = get();
    if (!data) return false;

    // Validate nodes exist
    const parentNode = nodesById.get(parentId);
    const childNode = nodesById.get(childId);
    if (!parentNode || !childNode) return false;

    // Check for cycle
    if (get().wouldCreateCycle(parentId, childId)) return false;

    // Check if edge already exists
    const existingEdge = data.edges.find(
      e => e.parent_id === parentId && e.child_id === childId
    );
    if (existingEdge) return false;

    // Record the add edge operation
    useChangeTrackingStore.getState().recordOperation({
      type: 'add_edge',
      parentId,
      childId,
    });

    // Remove old parent relationship from child
    const oldParentId = childNode.parent_id;
    if (oldParentId) {
      const oldParentChildren = childrenMap.get(oldParentId) || [];
      const updatedOldParentChildren = oldParentChildren.filter(id => id !== childId);
      childrenMap.set(oldParentId, updatedOldParentChildren);

      const oldParentNode = nodesById.get(oldParentId);
      if (oldParentNode) {
        nodesById.set(oldParentId, {
          ...oldParentNode,
          children: updatedOldParentChildren,
        });
      }
    }

    // Update child's parent_id
    nodesById.set(childId, { ...childNode, parent_id: parentId });

    // Update parent's children list
    const parentChildren = childrenMap.get(parentId) || [];
    const updatedParentChildren = [...parentChildren, childId];
    childrenMap.set(parentId, updatedParentChildren);
    nodesById.set(parentId, { ...parentNode, children: updatedParentChildren });

    // Create new edge
    const newEdge: MindmapEdge = {
      parent_id: parentId,
      child_id: childId,
      score: 1.0,
      reason: 'manually added',
    };

    // Update edges array - remove old edge to this child, add new one
    const remainingEdges = data.edges.filter(e => e.child_id !== childId || e.parent_id === parentId);

    set({
      nodesById: new Map(nodesById),
      childrenMap: new Map(childrenMap),
      data: {
        ...data,
        nodes: Array.from(nodesById.values()),
        edges: [...remainingEdges, newEdge],
      },
    });

    return true;
  },

  // Delete an edge between parent and child
  deleteEdge: (parentId, childId) => {
    const { nodesById, childrenMap, data } = get();
    if (!data) return;

    const childNode = nodesById.get(childId);
    const edgeExists = data.edges.some(e => e.parent_id === parentId && e.child_id === childId);
    if (!edgeExists) return;  // edge 不存在，无需删除

    // Record the delete edge operation
    useChangeTrackingStore.getState().recordOperation({
      type: 'delete_edge',
      parentId,
      childId,
    });

    // Update child's parent_id to null
    if (childNode) {
      nodesById.set(childId, { ...childNode, parent_id: null });
    }

    // Update parent's children list
    const parentChildren = childrenMap.get(parentId) || [];
    const updatedParentChildren = parentChildren.filter(id => id !== childId);
    childrenMap.set(parentId, updatedParentChildren);

    const parentNode = nodesById.get(parentId);
    if (parentNode) {
      nodesById.set(parentId, { ...parentNode, children: updatedParentChildren });
    }

    // Remove edge from edges array
    const remainingEdges = data.edges.filter(
      e => !(e.parent_id === parentId && e.child_id === childId)
    );

    set({
      nodesById: new Map(nodesById),
      childrenMap: new Map(childrenMap),
      data: {
        ...data,
        nodes: Array.from(nodesById.values()),
        edges: remainingEdges,
        summary: {
          ...data.summary,
          edge_count: remainingEdges.length,
        },
      },
    });
  },

  // Update an edge (change parent or child)
  updateEdge: (oldParentId, oldChildId, newParentId, newChildId) => {
    const { addEdge, deleteEdge } = get();

    // First delete the old edge
    deleteEdge(oldParentId, oldChildId);

    // Then add the new edge
    const success = addEdge(newParentId, newChildId);

    return success;
  },
}));

// Selector hooks with optimized subscriptions
export const useNodes = () => useDataStore(state => state.data?.nodes ?? []);
export const useEdges = () => useDataStore(state => state.data?.edges ?? []);
export const useIssues = () => useDataStore(state => state.data?.issues ?? []);

// Optimized node-by-id selector that only re-renders when the specific node changes
// This is a stable reference selector - components should use useNodeById for individual nodes
export const useNodesById = () => useDataStore(state => state.nodesById);
export const useChildrenMap = () => useDataStore(state => state.childrenMap);

// Get a single node by ID - components using this will only re-render when that specific node changes
export const useNodeById = (id: string) => useDataStore(state => state.nodesById.get(id));

// Memoized selectors for common data patterns
export const useSummary = () => useDataStore(state => state.data?.summary);
export const useBlocks = () => useDataStore(state => state.data?.blocks ?? []);
export const useThresholds = () => useDataStore(state => state.data?.thresholds ?? { low_confidence: 0.5 });

// Optimized image data selector using useShallow to avoid unnecessary re-renders
export const useImageData = () => useDataStore(useShallow(state => state.data ? {
  image_src: state.data.image_src,
  image_width: state.data.image_width,
  image_height: state.data.image_height,
} : null));

// Optimized loading state selector
export const useLoadingState = () => useDataStore(useShallow(state => ({ isLoading: state.isLoading, error: state.error })));

// Action-only selectors - these never cause re-renders on data changes
export const useDataActions = () => useDataStore(useShallow(state => ({
  setData: state.setData,
  setError: state.setError,
  addBlocks: state.addBlocks,
  addNodes: state.addNodes,
  addEdges: state.addEdges,
  clearError: state.clearError,
  updateNode: state.updateNode,
  deleteNode: state.deleteNode,
  deleteNodes: state.deleteNodes,
  mergeNodes: state.mergeNodes,
  splitNode: state.splitNode,
  addEdge: state.addEdge,
  deleteEdge: state.deleteEdge,
  updateEdge: state.updateEdge,
  wouldCreateCycle: state.wouldCreateCycle,
})));

// Selector for node operations only
export const useNodeActions = () => useDataStore(useShallow(state => ({
  updateNode: state.updateNode,
  deleteNode: state.deleteNode,
  deleteNodes: state.deleteNodes,
  mergeNodes: state.mergeNodes,
  splitNode: state.splitNode,
})));

// Selector for edge operations only
export const useEdgeActions = () => useDataStore(useShallow(state => ({
  addEdge: state.addEdge,
  deleteEdge: state.deleteEdge,
  updateEdge: state.updateEdge,
  wouldCreateCycle: state.wouldCreateCycle,
})));

// Optimized selector for getting multiple nodes by IDs
// Note: This returns a new array each time, prefer individual useNodeById calls
export const useNodesByIds = (ids: string[]) =>
  useDataStore(state => ids.map(id => state.nodesById.get(id)).filter(Boolean) as MindmapNode[]);

// Selector for children of a specific node
// Returns the child IDs directly - use with useMemo in component if needed
export const useNodeChildren = (nodeId: string) =>
  useDataStore(state => state.childrenMap.get(nodeId) ?? []);
