import { create } from 'zustand';
import type { BaselineRegion, BaselineBlock, BaselineNode, BaselineEdge } from '@/types';

interface BaselineEditOperation {
  type: 'add_block' | 'update_block' | 'delete_block'
        | 'add_node' | 'update_node' | 'delete_node' | 'merge_nodes'
        | 'add_edge' | 'delete_edge';
  timestamp: string;
  data: unknown;
}

interface BaselineEditorState {
  // Current region data
  region: BaselineRegion | null;
  originalRegion: BaselineRegion | null;

  // Image dimensions (from crop_bbox)
  imageWidth: number;
  imageHeight: number;

  // Selection
  selectedBlockIndex: number | null;
  selectedNodeId: string | null;
  hoveredBlockIndex: number | null;
  hoveredNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredEdgeId: string | null;

  // Visibility
  showBlocks: boolean;
  showNodes: boolean;
  showEdges: boolean;

  // Edit operations log
  operations: BaselineEditOperation[];
  hasChanges: boolean;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Dataset info
  datasetName: string;

  // Actions - Data loading
  loadRegion: (datasetName: string, regionId: string) => Promise<void>;
  loadRegionFromFile: (file: File) => Promise<void>;
  setError: (error: string | null) => void;

  // Actions - Block editing
  addBlock: (block: BaselineBlock) => void;
  updateBlock: (index: number, updates: Partial<BaselineBlock>) => void;
  deleteBlock: (index: number) => void;

  // Actions - Node editing
  addNode: (node: BaselineNode) => void;
  updateNode: (nodeId: string, updates: Partial<BaselineNode>) => void;
  deleteNode: (nodeId: string) => void;
  mergeNodes: (nodeIds: string[]) => void;

  // Actions - Edge editing
  addEdge: (edge: BaselineEdge) => void;
  deleteEdge: (parentId: string, childId: string) => void;

  // Actions - Selection
  selectBlock: (index: number | null) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  hoverBlock: (index: number | null) => void;
  hoverNode: (nodeId: string | null) => void;
  hoverEdge: (edgeId: string | null) => void;

  // Actions - Visibility
  toggleShowBlocks: () => void;
  toggleShowNodes: () => void;
  toggleShowEdges: () => void;

  // Actions - Save/Export
  exportRegion: () => BaselineRegion | null;
  resetChanges: () => void;
  markAsSaved: () => void;
}

export const useBaselineEditorStore = create<BaselineEditorState>((set, get) => ({
  region: null,
  originalRegion: null,
  imageWidth: 0,
  imageHeight: 0,
  selectedBlockIndex: null,
  selectedNodeId: null,
  hoveredBlockIndex: null,
  hoveredNodeId: null,
  selectedEdgeId: null,
  hoveredEdgeId: null,
  showBlocks: true,
  showNodes: true,
  showEdges: true,
  operations: [],
  hasChanges: false,
  isLoading: false,
  error: null,
  datasetName: '',

  // Data loading
  loadRegion: async (datasetName, regionId) => {
    set({ isLoading: true, error: null });
    try {
      // Try to load from baseline directory
      const response = await fetch(`/baseline/${datasetName}/${regionId}.json`);
      if (!response.ok) {
        // Try artifacts directory as fallback
        const fallbackResponse = await fetch(`/artifacts/baseline/${datasetName}/${regionId}.json`);
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to load region ${regionId} from dataset ${datasetName}`);
        }
        const data = await fallbackResponse.json();
        processRegionData(data, datasetName, set);
        return;
      }
      const data = await response.json();
      processRegionData(data, datasetName, set);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load region',
        isLoading: false,
      });
    }
  },

  loadRegionFromFile: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      processRegionData(data, file.name.replace('.json', ''), set);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to parse file',
        isLoading: false,
      });
    }
  },

  setError: (error) => set({ error }),

  // Block editing
  addBlock: (block) => {
    const { region } = get();
    if (!region) return;

    const operation: BaselineEditOperation = {
      type: 'add_block',
      timestamp: new Date().toISOString(),
      data: block,
    };

    set({
      region: {
        ...region,
        expected_blocks: [...region.expected_blocks, block],
      },
      operations: [...get().operations, operation],
      hasChanges: true,
    });
  },

  updateBlock: (index, updates) => {
    const { region } = get();
    if (!region || index < 0 || index >= region.expected_blocks.length) return;

    const oldBlock = region.expected_blocks[index];
    const newBlock = { ...oldBlock, ...updates };

    const operation: BaselineEditOperation = {
      type: 'update_block',
      timestamp: new Date().toISOString(),
      data: { index, before: oldBlock, after: newBlock },
    };

    const newBlocks = [...region.expected_blocks];
    newBlocks[index] = newBlock;

    set({
      region: {
        ...region,
        expected_blocks: newBlocks,
      },
      operations: [...get().operations, operation],
      hasChanges: true,
    });
  },

  deleteBlock: (index) => {
    const { region } = get();
    if (!region || index < 0 || index >= region.expected_blocks.length) return;

    const deletedBlock = region.expected_blocks[index];

    const operation: BaselineEditOperation = {
      type: 'delete_block',
      timestamp: new Date().toISOString(),
      data: { index, block: deletedBlock },
    };

    set({
      region: {
        ...region,
        expected_blocks: region.expected_blocks.filter((_, i) => i !== index),
      },
      operations: [...get().operations, operation],
      hasChanges: true,
      selectedBlockIndex: null,
    });
  },

  // Node editing
  addNode: (node) => {
    const { region } = get();
    if (!region) return;

    const operation: BaselineEditOperation = {
      type: 'add_node',
      timestamp: new Date().toISOString(),
      data: node,
    };

    set({
      region: {
        ...region,
        expected_nodes: [...region.expected_nodes, node],
      },
      operations: [...get().operations, operation],
      hasChanges: true,
    });
  },

  updateNode: (nodeId, updates) => {
    const { region } = get();
    if (!region) return;

    const nodeIndex = region.expected_nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    const oldNode = region.expected_nodes[nodeIndex];
    const newNode = { ...oldNode, ...updates };

    const operation: BaselineEditOperation = {
      type: 'update_node',
      timestamp: new Date().toISOString(),
      data: { nodeId, before: oldNode, after: newNode },
    };

    const newNodes = [...region.expected_nodes];
    newNodes[nodeIndex] = newNode;

    set({
      region: {
        ...region,
        expected_nodes: newNodes,
      },
      operations: [...get().operations, operation],
      hasChanges: true,
    });
  },

  deleteNode: (nodeId) => {
    const { region } = get();
    if (!region) return;

    const deletedNode = region.expected_nodes.find(n => n.id === nodeId);
    if (!deletedNode) return;

    const operation: BaselineEditOperation = {
      type: 'delete_node',
      timestamp: new Date().toISOString(),
      data: { nodeId, node: deletedNode },
    };

    // Also delete edges involving this node
    const newEdges = region.expected_edges.filter(
      e => e.parent_id !== nodeId && e.child_id !== nodeId
    );

    set({
      region: {
        ...region,
        expected_nodes: region.expected_nodes.filter(n => n.id !== nodeId),
        expected_edges: newEdges,
      },
      operations: [...get().operations, operation],
      hasChanges: true,
      selectedNodeId: null,
    });
  },

  mergeNodes: (nodeIds) => {
    const { region } = get();
    if (!region || nodeIds.length < 2) return;

    const nodesToMerge = region.expected_nodes.filter(n => nodeIds.includes(n.id));
    if (nodesToMerge.length < 2) return;

    // Calculate merged bbox (union)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodesToMerge.forEach(node => {
      const [l, t, r, b] = node.bbox;
      minX = Math.min(minX, l);
      minY = Math.min(minY, t);
      maxX = Math.max(maxX, r);
      maxY = Math.max(maxY, b);
    });

    // Merge texts and lines
    const allLines = nodesToMerge.flatMap(n => n.lines);
    const mergedText = allLines.join('\n');

    // Create new merged node
    const mergedId = `merged_${Date.now()}`;
    const mergedNode: BaselineNode = {
      id: mergedId,
      text: mergedText,
      bbox: [minX, minY, maxX, maxY],
      lines: allLines,
    };

    const operation: BaselineEditOperation = {
      type: 'merge_nodes',
      timestamp: new Date().toISOString(),
      data: { nodeIds, newNode: mergedNode },
    };

    // Update edges: replace references to merged nodes with the new merged node
    const newEdges = region.expected_edges.map(edge => {
      if (nodeIds.includes(edge.child_id)) {
        return { ...edge, child_id: mergedId, child_text: mergedText };
      }
      if (nodeIds.includes(edge.parent_id)) {
        return { ...edge, parent_id: mergedId, parent_text: mergedText };
      }
      return edge;
    }).filter((edge, index, self) => {
      // Remove duplicate edges
      const firstIndex = self.findIndex(e =>
        e.parent_id === edge.parent_id && e.child_id === edge.child_id
      );
      return index === firstIndex && edge.parent_id !== edge.child_id;
    });

    set({
      region: {
        ...region,
        expected_nodes: [
          ...region.expected_nodes.filter(n => !nodeIds.includes(n.id)),
          mergedNode,
        ],
        expected_edges: newEdges,
      },
      operations: [...get().operations, operation],
      hasChanges: true,
      selectedNodeId: mergedId,
    });
  },

  // Edge editing
  addEdge: (edge) => {
    const { region } = get();
    if (!region) return;

    // Check if edge already exists
    const exists = region.expected_edges.some(
      e => e.parent_id === edge.parent_id && e.child_id === edge.child_id
    );
    if (exists) return;

    const operation: BaselineEditOperation = {
      type: 'add_edge',
      timestamp: new Date().toISOString(),
      data: edge,
    };

    set({
      region: {
        ...region,
        expected_edges: [...region.expected_edges, edge],
      },
      operations: [...get().operations, operation],
      hasChanges: true,
    });
  },

  deleteEdge: (parentId, childId) => {
    const { region } = get();
    if (!region) return;

    const deletedEdge = region.expected_edges.find(
      e => e.parent_id === parentId && e.child_id === childId
    );
    if (!deletedEdge) return;

    const operation: BaselineEditOperation = {
      type: 'delete_edge',
      timestamp: new Date().toISOString(),
      data: { parentId, childId, edge: deletedEdge },
    };

    set({
      region: {
        ...region,
        expected_edges: region.expected_edges.filter(
          e => !(e.parent_id === parentId && e.child_id === childId)
        ),
      },
      operations: [...get().operations, operation],
      hasChanges: true,
      selectedEdgeId: null,
    });
  },

  // Selection
  selectBlock: (index) => set({ selectedBlockIndex: index, selectedNodeId: null, selectedEdgeId: null }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedBlockIndex: null, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedBlockIndex: null, selectedNodeId: null }),
  hoverBlock: (index) => set({ hoveredBlockIndex: index }),
  hoverNode: (nodeId) => set({ hoveredNodeId: nodeId }),
  hoverEdge: (edgeId) => set({ hoveredEdgeId: edgeId }),

  // Visibility
  toggleShowBlocks: () => set(state => ({ showBlocks: !state.showBlocks })),
  toggleShowNodes: () => set(state => ({ showNodes: !state.showNodes })),
  toggleShowEdges: () => set(state => ({ showEdges: !state.showEdges })),

  // Save/Export
  exportRegion: () => {
    const { region } = get();
    return region;
  },

  resetChanges: () => {
    const { originalRegion } = get();
    if (!originalRegion) return;

    const [x0, y0, x1, y1] = originalRegion.crop_bbox;
    set({
      region: JSON.parse(JSON.stringify(originalRegion)),
      operations: [],
      hasChanges: false,
      imageWidth: x1 - x0,
      imageHeight: y1 - y0,
      selectedBlockIndex: null,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
  },

  markAsSaved: () => {
    const { region } = get();
    if (!region) return;

    set({
      originalRegion: JSON.parse(JSON.stringify(region)),
      operations: [],
      hasChanges: false,
    });
  },
}));

// Helper function to process region data
function processRegionData(
  data: BaselineRegion,
  datasetName: string,
  set: (partial: Partial<BaselineEditorState>) => void
) {
  const [x0, y0, x1, y1] = data.crop_bbox;
  set({
    region: data,
    originalRegion: JSON.parse(JSON.stringify(data)),
    imageWidth: x1 - x0,
    imageHeight: y1 - y0,
    datasetName,
    isLoading: false,
    error: null,
    operations: [],
    hasChanges: false,
    selectedBlockIndex: null,
    selectedNodeId: null,
    selectedEdgeId: null,
  });
}

// Selector hooks
export const useBaselineRegion = () => useBaselineEditorStore(state => state.region);
export const useBaselineHasChanges = () => useBaselineEditorStore(state => state.hasChanges);
export const useBaselineBlocks = () => useBaselineEditorStore(state => state.region?.expected_blocks ?? []);
export const useBaselineNodes = () => useBaselineEditorStore(state => state.region?.expected_nodes ?? []);
export const useBaselineEdges = () => useBaselineEditorStore(state => state.region?.expected_edges ?? []);
