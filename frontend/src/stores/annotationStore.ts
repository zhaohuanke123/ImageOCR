import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { IssueType } from '@/types';

// Edge identifier type
export type EdgeId = `${string}:${string}`;

interface AnnotationState {
  // Selection
  selectedNodeId: string | null;
  hoveredNodeId: string | null;

  // Edge selection
  selectedEdgeId: EdgeId | null;
  hoveredEdgeId: EdgeId | null;

  // Multi-selection for merge operations
  selectedNodeIds: Set<string>;
  isMultiSelectMode: boolean;

  // Edge editing mode (click two nodes to create edge)
  edgeEditParentId: string | null; // First selected node (parent)
  isEdgeEditMode: boolean;

  // Visibility toggles
  showBlocks: boolean;
  showNodes: boolean;
  showEdges: boolean;

  // Filters
  issueTypeFilter: IssueType | '';
  searchText: string;
  rootsOnly: boolean;
  lowConfidenceOnly: boolean;

  // Expanded nodes in tree
  expandedNodes: Set<string>;

  // Actions
  selectNode: (nodeId: string | null) => void;
  selectNodeWithCtrl: (nodeId: string) => void; // Ctrl/Cmd + click for multi-select
  hoverNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: EdgeId | null) => void;
  hoverEdge: (edgeId: EdgeId | null) => void;
  toggleNodeInSelection: (nodeId: string) => void;
  clearMultiSelection: () => void;
  setMultiSelectMode: (enabled: boolean) => void;
  selectAllNodes: () => void; // Select all nodes
  deselectAllNodes: () => void; // Deselect all nodes (keep single selection)
  // Edge editing mode
  setEdgeEditParentId: (nodeId: string | null) => void;
  clearEdgeEditMode: () => void;
  toggleShowBlocks: () => void;
  setShowBlocks: (show: boolean) => void;
  toggleShowNodes: () => void;
  toggleShowEdges: () => void;
  setIssueTypeFilter: (type: IssueType | '') => void;
  setSearchText: (text: string) => void;
  toggleRootsOnly: () => void;
  toggleLowConfidenceOnly: () => void;
  toggleNodeExpanded: (nodeId: string) => void;
  expandAllNodes: () => void;
  collapseAllNodes: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set, get) => ({
  selectedNodeId: null,
  hoveredNodeId: null,
  selectedEdgeId: null,
  hoveredEdgeId: null,
  selectedNodeIds: new Set<string>(),
  isMultiSelectMode: false,
  edgeEditParentId: null,
  isEdgeEditMode: false,
  showBlocks: false,
  showNodes: true,
  showEdges: false,
  issueTypeFilter: '',
  searchText: '',
  rootsOnly: false,
  lowConfidenceOnly: false,
  expandedNodes: new Set<string>(),

  selectNode: (nodeId) => {
    const { isMultiSelectMode } = get();
    if (isMultiSelectMode && nodeId) {
      // In multi-select mode, toggle the node in selection
      const newSet = new Set(get().selectedNodeIds);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      set({ selectedNodeIds: newSet, selectedNodeId: nodeId, selectedEdgeId: null });
    } else {
      set({ selectedNodeId: nodeId, selectedEdgeId: null });
    }
  },

  // Ctrl/Cmd + click for multi-select (without needing to enter multi-select mode)
  selectNodeWithCtrl: (nodeId) => {
    const { selectedNodeIds } = get();
    const newSet = new Set(selectedNodeIds);

    if (newSet.has(nodeId)) {
      // Deselect if already in multi-selection
      newSet.delete(nodeId);
      if (newSet.size === 0) {
        // If no more selected, exit multi-select mode
        set({ selectedNodeIds: newSet, selectedNodeId: null, isMultiSelectMode: false });
      } else {
        // Set the first remaining node as primary selection
        const firstId = Array.from(newSet)[0];
        set({ selectedNodeIds: newSet, selectedNodeId: firstId });
      }
    } else {
      // Add to multi-selection
      newSet.add(nodeId);
      set({ selectedNodeIds: newSet, selectedNodeId: nodeId, isMultiSelectMode: true, selectedEdgeId: null });
    }
  },

  hoverNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  hoverEdge: (edgeId) => set({ hoveredEdgeId: edgeId }),

  toggleNodeInSelection: (nodeId) => {
    const newSet = new Set(get().selectedNodeIds);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    set({ selectedNodeIds: newSet });
  },

  clearMultiSelection: () => set({ selectedNodeIds: new Set(), isMultiSelectMode: false }),

  selectAllNodes: () => {
    // This will be called with all node IDs from the component
    // For now, just set the flag - actual node IDs will be set by the component
    set({ isMultiSelectMode: true });
  },

  deselectAllNodes: () => set({ selectedNodeIds: new Set(), isMultiSelectMode: false, selectedNodeId: null }),

  setMultiSelectMode: (enabled) => {
    if (!enabled) {
      set({ isMultiSelectMode: false, selectedNodeIds: new Set() });
    } else {
      set({ isMultiSelectMode: true });
    }
  },

  setEdgeEditParentId: (nodeId) => set({ edgeEditParentId: nodeId, isEdgeEditMode: true }),

  clearEdgeEditMode: () => set({ edgeEditParentId: null, isEdgeEditMode: false }),

  toggleShowBlocks: () => set(state => ({ showBlocks: !state.showBlocks })),
  setShowBlocks: (show) => set({ showBlocks: show }),
  toggleShowNodes: () => set(state => ({ showNodes: !state.showNodes })),
  toggleShowEdges: () => set(state => ({ showEdges: !state.showEdges })),

  setIssueTypeFilter: (type) => set({ issueTypeFilter: type }),
  setSearchText: (text) => set({ searchText: text }),
  toggleRootsOnly: () => set(state => ({ rootsOnly: !state.rootsOnly })),
  toggleLowConfidenceOnly: () => set(state => ({ lowConfidenceOnly: !state.lowConfidenceOnly })),

  toggleNodeExpanded: (nodeId) => {
    const { expandedNodes } = get();
    const newSet = new Set(expandedNodes);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    set({ expandedNodes: newSet });
  },

  expandAllNodes: () => {
    // This should be called with all node IDs
    set({ expandedNodes: new Set() });
  },

  collapseAllNodes: () => set({ expandedNodes: new Set() }),
}));

// Initialize expanded nodes with root nodes
export const initializeExpandedNodes = (rootIds: string[]) => {
  useAnnotationStore.setState({ expandedNodes: new Set(rootIds) });
};

// =====================================================
// Optimized Selector Hooks
// =====================================================

// Single value selectors - these only re-render when that specific value changes
export const useSelectedNodeId = () => useAnnotationStore(state => state.selectedNodeId);
export const useHoveredNodeId = () => useAnnotationStore(state => state.hoveredNodeId);
export const useSelectedEdgeId = () => useAnnotationStore(state => state.selectedEdgeId);
export const useHoveredEdgeId = () => useAnnotationStore(state => state.hoveredEdgeId);
export const useIsMultiSelectMode = () => useAnnotationStore(state => state.isMultiSelectMode);
export const useIsEdgeEditMode = () => useAnnotationStore(state => state.isEdgeEditMode);
export const useEdgeEditParentId = () => useAnnotationStore(state => state.edgeEditParentId);
export const useShowBlocks = () => useAnnotationStore(state => state.showBlocks);
export const useShowNodes = () => useAnnotationStore(state => state.showNodes);
export const useShowEdges = () => useAnnotationStore(state => state.showEdges);
export const useIssueTypeFilter = () => useAnnotationStore(state => state.issueTypeFilter);
export const useSearchText = () => useAnnotationStore(state => state.searchText);
export const useRootsOnly = () => useAnnotationStore(state => state.rootsOnly);
export const useLowConfidenceOnly = () => useAnnotationStore(state => state.lowConfidenceOnly);
export const useExpandedNodes = () => useAnnotationStore(state => state.expandedNodes);

// Check if a specific node is selected - optimized for NodePanel rendering
export const useIsNodeSelected = (nodeId: string) =>
  useAnnotationStore(state => state.selectedNodeId === nodeId);

// Check if a specific node is hovered
export const useIsNodeHovered = (nodeId: string) =>
  useAnnotationStore(state => state.hoveredNodeId === nodeId);

// Check if a specific node is in multi-selection
export const useIsNodeInMultiSelection = (nodeId: string) =>
  useAnnotationStore(state => state.selectedNodeIds.has(nodeId));

// Check if a specific node is expanded
export const useIsNodeExpanded = (nodeId: string) =>
  useAnnotationStore(state => state.expandedNodes.has(nodeId));

// Check if a specific edge is selected
export const useIsEdgeSelected = (parentId: string, childId: string) =>
  useAnnotationStore(state => state.selectedEdgeId === `${parentId}:${childId}`);

// Check if a specific edge is hovered
export const useIsEdgeHovered = (parentId: string, childId: string) =>
  useAnnotationStore(state => state.hoveredEdgeId === `${parentId}:${childId}`);

// Get selected node IDs as an array (for iteration)
// Note: This creates a new array each time, use sparingly
// Prefer useIsNodeInMultiSelection for checking specific nodes
export const useSelectedNodeIdsArray = () =>
  useAnnotationStore(state => state.selectedNodeIds);

// Get expanded node IDs as an array (for iteration)
// Note: This returns the Set directly, use has() for checking
// Prefer useIsNodeExpanded for checking specific nodes
export const useExpandedNodeIdsArray = () =>
  useAnnotationStore(state => state.expandedNodes);

// Action-only selectors - these never cause re-renders on state changes
export const useAnnotationActions = () => useAnnotationStore(useShallow(state => ({
  selectNode: state.selectNode,
  hoverNode: state.hoverNode,
  selectEdge: state.selectEdge,
  hoverEdge: state.hoverEdge,
  toggleNodeInSelection: state.toggleNodeInSelection,
  clearMultiSelection: state.clearMultiSelection,
  setMultiSelectMode: state.setMultiSelectMode,
  setEdgeEditParentId: state.setEdgeEditParentId,
  clearEdgeEditMode: state.clearEdgeEditMode,
  toggleShowBlocks: state.toggleShowBlocks,
  setShowBlocks: state.setShowBlocks,
  toggleShowNodes: state.toggleShowNodes,
  toggleShowEdges: state.toggleShowEdges,
  setIssueTypeFilter: state.setIssueTypeFilter,
  setSearchText: state.setSearchText,
  toggleRootsOnly: state.toggleRootsOnly,
  toggleLowConfidenceOnly: state.toggleLowConfidenceOnly,
  toggleNodeExpanded: state.toggleNodeExpanded,
  expandAllNodes: state.expandAllNodes,
  collapseAllNodes: state.collapseAllNodes,
})));

// Selection actions only
export const useSelectionActions = () => useAnnotationStore(useShallow(state => ({
  selectNode: state.selectNode,
  selectNodeWithCtrl: state.selectNodeWithCtrl,
  hoverNode: state.hoverNode,
  selectEdge: state.selectEdge,
  hoverEdge: state.hoverEdge,
  toggleNodeInSelection: state.toggleNodeInSelection,
  clearMultiSelection: state.clearMultiSelection,
  setMultiSelectMode: state.setMultiSelectMode,
  selectAllNodes: state.selectAllNodes,
  deselectAllNodes: state.deselectAllNodes,
})));

// Visibility actions only
export const useVisibilityActions = () => useAnnotationStore(useShallow(state => ({
  toggleShowBlocks: state.toggleShowBlocks,
  setShowBlocks: state.setShowBlocks,
  toggleShowNodes: state.toggleShowNodes,
  toggleShowEdges: state.toggleShowEdges,
})));

// Filter actions only
export const useFilterActions = () => useAnnotationStore(useShallow(state => ({
  setIssueTypeFilter: state.setIssueTypeFilter,
  setSearchText: state.setSearchText,
  toggleRootsOnly: state.toggleRootsOnly,
  toggleLowConfidenceOnly: state.toggleLowConfidenceOnly,
})));

// Edge edit actions only
export const useEdgeEditActions = () => useAnnotationStore(useShallow(state => ({
  setEdgeEditParentId: state.setEdgeEditParentId,
  clearEdgeEditMode: state.clearEdgeEditMode,
})));

// Tree actions only
export const useTreeActions = () => useAnnotationStore(useShallow(state => ({
  toggleNodeExpanded: state.toggleNodeExpanded,
  expandAllNodes: state.expandAllNodes,
  collapseAllNodes: state.collapseAllNodes,
})));

// Optimized selector for visibility state (common pattern in AnnotationOverlay)
export const useVisibilityState = () => useAnnotationStore(useShallow(state => ({
  showBlocks: state.showBlocks,
  showNodes: state.showNodes,
  showEdges: state.showEdges,
})));

// Optimized selector for filter state
export const useFilterState = () => useAnnotationStore(useShallow(state => ({
  searchText: state.searchText,
  rootsOnly: state.rootsOnly,
  lowConfidenceOnly: state.lowConfidenceOnly,
  issueTypeFilter: state.issueTypeFilter,
})));

// Optimized selector for selection state (used in overlays)
// Note: selectedNodeIds is a Set, so we need to be careful with shallow comparison
// We return the Set directly - components should use selectedNodeIds.has() for checks
export const useSelectionState = () => useAnnotationStore(state => ({
  selectedNodeId: state.selectedNodeId,
  hoveredNodeId: state.hoveredNodeId,
  selectedEdgeId: state.selectedEdgeId,
  hoveredEdgeId: state.hoveredEdgeId,
  selectedNodeIds: state.selectedNodeIds,
  isMultiSelectMode: state.isMultiSelectMode,
}));

// Optimized selector for edge edit mode state
export const useEdgeEditModeState = () => useAnnotationStore(useShallow(state => ({
  edgeEditParentId: state.edgeEditParentId,
  isEdgeEditMode: state.isEdgeEditMode,
})));
