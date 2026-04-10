import { useMemo, useState, useCallback, useEffect, useRef, memo } from 'react';
import { useDataStore, useAnnotationStore, useViewStore, useNodes, useEdges, useBlocks, useThresholds, useNodesById, useEdgeActions, useSelectionActions, useEdgeEditActions } from '@/stores';
import { getBBoxPath, getBBoxCenter, bboxToArray, arrayToBBox } from '@/utils';
import { useHoverThrottle } from '@/hooks';
import type { EdgeId } from '@/stores/annotationStore';
import type { BBox } from '@/types';

type DragHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

interface AnnotationOverlayProps {
  imageWidth: number;
  imageHeight: number;
  onEditNode?: (nodeId: string) => void;
  onEditEdge?: (parentId: string, childId: string) => void;
}

/**
 * Custom hook for resize/drag operations with RAF-based updates
 */
function useRafDrag(
  scale: number,
  imageWidth: number,
  imageHeight: number,
  updateNode: (id: string, updates: Partial<{ bbox: BBox }>) => void
) {
  const [dragState, setDragState] = useState<{
    nodeId: string;
    handle: DragHandle;
    startX: number;
    startY: number;
    originalBBox: [number, number, number, number];
  } | null>(null);

  // Use refs to store the latest values for RAF callback
  const rafRef = useRef<number | null>(null);
  const dragStateRef = useRef(dragState);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const scaleRef = useRef(scale);
  const imageDimensionsRef = useRef({ width: imageWidth, height: imageHeight });
  const updateNodeRef = useRef(updateNode);

  // Keep refs in sync
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    imageDimensionsRef.current = { width: imageWidth, height: imageHeight };
  }, [imageWidth, imageHeight]);

  useEffect(() => {
    updateNodeRef.current = updateNode;
  }, [updateNode]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Process drag update - called from RAF
  const processDragUpdate = useCallback(() => {
    const state = dragStateRef.current;
    const pos = currentPosRef.current;
    if (!state || !pos) return;

    const dx = (pos.x - state.startX) / scaleRef.current;
    const dy = (pos.y - state.startY) / scaleRef.current;

    const { originalBBox, handle, nodeId } = state;
    let newBBox: [number, number, number, number] = [...originalBBox];

    const minSize = 10;
    const { width: imgWidth, height: imgHeight } = imageDimensionsRef.current;

    switch (handle) {
      case 'move':
        newBBox = [
          originalBBox[0] + dx,
          originalBBox[1] + dy,
          originalBBox[2] + dx,
          originalBBox[3] + dy,
        ];
        break;
      case 'nw':
        newBBox = [
          Math.min(originalBBox[0] + dx, originalBBox[2] - minSize),
          Math.min(originalBBox[1] + dy, originalBBox[3] - minSize),
          originalBBox[2],
          originalBBox[3],
        ];
        break;
      case 'n':
        newBBox = [
          originalBBox[0],
          Math.min(originalBBox[1] + dy, originalBBox[3] - minSize),
          originalBBox[2],
          originalBBox[3],
        ];
        break;
      case 'ne':
        newBBox = [
          originalBBox[0],
          Math.min(originalBBox[1] + dy, originalBBox[3] - minSize),
          Math.max(originalBBox[2] + dx, originalBBox[0] + minSize),
          originalBBox[3],
        ];
        break;
      case 'e':
        newBBox = [
          originalBBox[0],
          originalBBox[1],
          Math.max(originalBBox[2] + dx, originalBBox[0] + minSize),
          originalBBox[3],
        ];
        break;
      case 'se':
        newBBox = [
          originalBBox[0],
          originalBBox[1],
          Math.max(originalBBox[2] + dx, originalBBox[0] + minSize),
          Math.max(originalBBox[3] + dy, originalBBox[1] + minSize),
        ];
        break;
      case 's':
        newBBox = [
          originalBBox[0],
          originalBBox[1],
          originalBBox[2],
          Math.max(originalBBox[3] + dy, originalBBox[1] + minSize),
        ];
        break;
      case 'sw':
        newBBox = [
          Math.min(originalBBox[0] + dx, originalBBox[2] - minSize),
          originalBBox[1],
          originalBBox[2],
          Math.max(originalBBox[3] + dy, originalBBox[1] + minSize),
        ];
        break;
      case 'w':
        newBBox = [
          Math.min(originalBBox[0] + dx, originalBBox[2] - minSize),
          originalBBox[1],
          originalBBox[2],
          originalBBox[3],
        ];
        break;
    }

    // Clamp to image bounds
    newBBox = [
      Math.max(0, Math.min(newBBox[0], imgWidth)),
      Math.max(0, Math.min(newBBox[1], imgHeight)),
      Math.max(0, Math.min(newBBox[2], imgWidth)),
      Math.max(0, Math.min(newBBox[3], imgHeight)),
    ];

    // Update the node's bbox
    updateNodeRef.current(nodeId, { bbox: arrayToBBox(newBBox) });
  }, []);

  // Start drag
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, nodeId: string, handle: DragHandle, bbox: BBox) => {
      e.stopPropagation();
      e.preventDefault();

      const arr = bboxToArray(bbox);
      setDragState({
        nodeId,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        originalBBox: arr,
      });
      currentPosRef.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  // Setup global mouse event handlers when dragging
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      currentPosRef.current = { x: e.clientX, y: e.clientY };

      // Schedule RAF update if not already scheduled
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          processDragUpdate();
          rafRef.current = null;
        });
      }
    };

    const handleMouseUp = () => {
      // Process any pending update
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      processDragUpdate(); // Final update
      setDragState(null);
      currentPosRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [dragState, processDragUpdate]);

  return { dragState, handleResizeStart };
}

export const AnnotationOverlay = memo(function AnnotationOverlay({ imageWidth, imageHeight, onEditNode, onEditEdge }: AnnotationOverlayProps) {
  // Use fine-grained selectors to avoid unnecessary re-renders
  const nodesById = useNodesById();
  const nodes = useNodes();
  const edges = useEdges();
  const blocks = useBlocks();
  const thresholds = useThresholds();
  const { addEdge, wouldCreateCycle } = useEdgeActions();
  const updateNode = useDataStore(state => state.updateNode);

  // Use optimized single-value selectors for visibility
  const showBlocks = useAnnotationStore(state => state.showBlocks);
  const showNodes = useAnnotationStore(state => state.showNodes);
  const showEdges = useAnnotationStore(state => state.showEdges);

  // Use optimized single-value selectors for filters
  const searchText = useAnnotationStore(state => state.searchText);
  const rootsOnly = useAnnotationStore(state => state.rootsOnly);
  const lowConfidenceOnly = useAnnotationStore(state => state.lowConfidenceOnly);

  // Use optimized single-value selectors for selection
  const selectedNodeId = useAnnotationStore(state => state.selectedNodeId);
  const hoveredNodeId = useAnnotationStore(state => state.hoveredNodeId);
  const selectedNodeIds = useAnnotationStore(state => state.selectedNodeIds);
  const isMultiSelectMode = useAnnotationStore(state => state.isMultiSelectMode);
  const selectedEdgeId = useAnnotationStore(state => state.selectedEdgeId);
  const hoveredEdgeId = useAnnotationStore(state => state.hoveredEdgeId);
  const edgeEditParentId = useAnnotationStore(state => state.edgeEditParentId);
  const isEdgeEditMode = useAnnotationStore(state => state.isEdgeEditMode);

  // Use optimized action selectors
  const { selectNode, selectNodeWithCtrl, toggleNodeInSelection, selectEdge } = useSelectionActions();
  const { setEdgeEditParentId, clearEdgeEditMode } = useEdgeEditActions();

  const { scale, toolMode } = useViewStore();

  // Use throttled hover to reduce re-renders
  const hoverNode = useAnnotationStore(state => state.hoverNode);
  const hoverEdge = useAnnotationStore(state => state.hoverEdge);
  const handleNodeHover = useHoverThrottle(hoverNode, 16);
  // Edge hover uses EdgeId type, create a wrapper for throttling
  const handleEdgeHover = useCallback(
    (edgeId: EdgeId | null) => {
      hoverEdge(edgeId);
    },
    [hoverEdge]
  );

  // Custom RAF-based drag hook
  const { handleResizeStart } = useRafDrag(scale, imageWidth, imageHeight, updateNode);

  // Filter nodes - depend on specific arrays instead of whole data object
  const visibleNodes = useMemo(() => {
    return nodes.filter(node => {
      if (rootsOnly && node.parent_id) return false;
      if (lowConfidenceOnly && node.confidence >= thresholds.low_confidence) return false;
      if (searchText && !node.text.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [nodes, rootsOnly, lowConfidenceOnly, searchText, thresholds.low_confidence]);

  // Filter blocks
  const visibleBlocks = useMemo(() => {
    if (!showBlocks) return [];
    return blocks.filter(block => {
      if (searchText && !block.text.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [showBlocks, blocks, searchText]);

  // Filter edges
  const visibleEdges = useMemo(() => {
    if (!showEdges) return [];
    return edges.filter(edge => {
      const parent = nodesById.get(edge.parent_id);
      const child = nodesById.get(edge.child_id);
      if (!parent || !child) return false;
      if (rootsOnly && (parent.parent_id || child.parent_id)) return false;
      return true;
    });
  }, [showEdges, edges, nodesById, rootsOnly]);

  const handleNodeClick = useCallback((nodeId: string, ctrlKey: boolean = false) => {
    // Handle edge edit mode
    if (toolMode === 'edge-edit') {
      if (!edgeEditParentId) {
        // First click - set as parent
        setEdgeEditParentId(nodeId);
      } else if (edgeEditParentId === nodeId) {
        // Clicked same node - cancel
        clearEdgeEditMode();
      } else {
        // Second click - create edge (parent -> child)
        if (wouldCreateCycle(edgeEditParentId, nodeId)) {
          // Would create cycle, don't allow
          console.warn('Cannot create edge: would create a cycle');
        } else {
          addEdge(edgeEditParentId, nodeId);
        }
        clearEdgeEditMode();
      }
      return;
    }

    // Handle Ctrl/Cmd + click for multi-select
    if (ctrlKey) {
      selectNodeWithCtrl(nodeId);
      return;
    }

    if (isMultiSelectMode) {
      toggleNodeInSelection(nodeId);
    } else {
      selectNode(nodeId === selectedNodeId ? null : nodeId);
    }
  }, [toolMode, edgeEditParentId, setEdgeEditParentId, clearEdgeEditMode, wouldCreateCycle, addEdge, isMultiSelectMode, toggleNodeInSelection, selectNode, selectNodeWithCtrl, selectedNodeId]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    if (!isMultiSelectMode) {
      onEditNode?.(nodeId);
    }
  }, [isMultiSelectMode, onEditNode]);

  const handleEdgeClick = useCallback((parentId: string, childId: string) => {
    const edgeId = `${parentId}:${childId}` as EdgeId;
    selectEdge(selectedEdgeId === edgeId ? null : edgeId);
  }, [selectEdge, selectedEdgeId]);

  const handleEdgeDoubleClick = useCallback((parentId: string, childId: string) => {
    onEditEdge?.(parentId, childId);
  }, [onEditEdge]);

  // Render resize handles for selected node
  const renderResizeHandles = useCallback((nodeId: string, bbox: BBox, isSelected: boolean) => {
    if (!isSelected || toolMode !== 'select') return null;

    const [l, t, r, b] = bboxToArray(bbox);
    const handles: { pos: DragHandle; x: number; y: number; cursor: string }[] = [
      { pos: 'nw', x: l, y: t, cursor: 'nwse-resize' },
      { pos: 'n', x: (l + r) / 2, y: t, cursor: 'ns-resize' },
      { pos: 'ne', x: r, y: t, cursor: 'nesw-resize' },
      { pos: 'e', x: r, y: (t + b) / 2, cursor: 'ew-resize' },
      { pos: 'se', x: r, y: b, cursor: 'nwse-resize' },
      { pos: 's', x: (l + r) / 2, y: b, cursor: 'ns-resize' },
      { pos: 'sw', x: l, y: b, cursor: 'nesw-resize' },
      { pos: 'w', x: l, y: (t + b) / 2, cursor: 'ew-resize' },
    ];

    const handleSize = 8 / scale;

    return handles.map(handle => (
      <rect
        key={handle.pos}
        x={handle.x - handleSize / 2}
        y={handle.y - handleSize / 2}
        width={handleSize}
        height={handleSize}
        fill="white"
        stroke="rgba(59, 130, 246, 1)"
        strokeWidth={1 / scale}
        style={{ cursor: handle.cursor }}
        className="pointer-events-auto"
        onMouseDown={e => handleResizeStart(e, nodeId, handle.pos, bbox)}
      />
    ));
  }, [toolMode, scale, handleResizeStart]);

  // Memoize edge rendering
  const edgeElements = useMemo(() => {
    if (!showEdges) return null;

    return visibleEdges.map(edge => {
      const parent = nodesById.get(edge.parent_id);
      const child = nodesById.get(edge.child_id);
      if (!parent || !child) return null;

      const p1 = getBBoxCenter(parent.bbox);
      const p2 = getBBoxCenter(child.bbox);
      const edgeId = `${edge.parent_id}:${edge.child_id}` as EdgeId;
      const isSelected = selectedEdgeId === edgeId;
      const isHovered = hoveredEdgeId === edgeId;

      // Determine stroke color based on selection state
      let strokeColor = 'rgba(22, 163, 74, 0.55)';
      if (isSelected) {
        strokeColor = 'rgba(245, 158, 11, 0.95)';
      } else if (isHovered) {
        strokeColor = 'rgba(22, 163, 74, 0.85)';
      }

      // Calculate stroke width - make it thicker when hovered/selected
      const baseStrokeWidth = 2 / scale;
      const activeStrokeWidth = (isSelected || isHovered ? 4 : 2) / scale;
      // Invisible wider stroke for easier clicking
      const hitAreaWidth = Math.max(12 / scale, baseStrokeWidth * 4);

      return (
        <g key={edgeId}>
          {/* Invisible hit area for easier clicking */}
          <line
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke="transparent"
            strokeWidth={hitAreaWidth}
            className="pointer-events-auto cursor-pointer"
            onClick={() => handleEdgeClick(edge.parent_id, edge.child_id)}
            onDoubleClick={() => handleEdgeDoubleClick(edge.parent_id, edge.child_id)}
            onMouseEnter={() => handleEdgeHover(edgeId)}
            onMouseLeave={() => handleEdgeHover(null)}
          />
          {/* Visible line */}
          <line
            data-edge={edgeId}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={strokeColor}
            strokeWidth={activeStrokeWidth}
            strokeLinecap="round"
            className="pointer-events-none"
          />
          {/* Arrow indicator on hover/select */}
          {(isSelected || isHovered) && (
            <circle
              cx={(p1.x + p2.x) / 2}
              cy={(p1.y + p2.y) / 2}
              r={6 / scale}
              fill={strokeColor}
              className="pointer-events-none"
            />
          )}
        </g>
      );
    });
  }, [showEdges, visibleEdges, nodesById, selectedEdgeId, hoveredEdgeId, scale, handleEdgeClick, handleEdgeDoubleClick, handleEdgeHover]);

  // Memoize block rendering
  const blockElements = useMemo(() => {
    if (!showBlocks) return null;

    return visibleBlocks.map(block => (
      <path
        key={block.id}
        d={getBBoxPath(block.bbox)}
        fill="rgba(37, 99, 235, 0.08)"
        stroke="rgba(37, 99, 235, 0.55)"
        strokeWidth={1 / scale}
      />
    ));
  }, [showBlocks, visibleBlocks, scale]);

  // Memoize node rendering
  const nodeElements = useMemo(() => {
    if (!showNodes) return null;

    return visibleNodes.map(node => {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const isInMultiSelection = selectedNodeIds.has(node.id);
      const isEdgeEditParent = isEdgeEditMode && edgeEditParentId === node.id;
      const isEdgeEditCandidate = isEdgeEditMode && edgeEditParentId && edgeEditParentId !== node.id;

      // Determine colors based on selection state
      let fillColor = 'rgba(220, 38, 38, 0.08)';
      let strokeColor = 'rgba(220, 38, 38, 0.85)';

      if (isEdgeEditParent) {
        // Node selected as parent in edge edit mode
        fillColor = 'rgba(168, 85, 247, 0.25)';
        strokeColor = 'rgba(168, 85, 247, 0.95)';
      } else if (isEdgeEditCandidate) {
        // Potential child node in edge edit mode
        fillColor = 'rgba(59, 130, 246, 0.15)';
        strokeColor = 'rgba(59, 130, 246, 0.85)';
      } else if (isInMultiSelection) {
        fillColor = 'rgba(34, 197, 94, 0.15)';
        strokeColor = 'rgba(34, 197, 94, 0.95)';
      } else if (isSelected) {
        fillColor = 'rgba(245, 158, 11, 0.25)';
        strokeColor = 'rgba(245, 158, 11, 0.95)';
      }

      return (
        <g key={node.id}>
          <path
            data-node={node.id}
            d={getBBoxPath(node.bbox)}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={(isSelected || isHovered || isInMultiSelection || isEdgeEditParent ? 4 : 2) / scale}
            className="pointer-events-auto cursor-pointer"
            onClick={(e) => handleNodeClick(node.id, e.ctrlKey || e.metaKey)}
            onDoubleClick={() => handleNodeDoubleClick(node.id)}
            onMouseEnter={() => handleNodeHover(node.id)}
            onMouseLeave={() => handleNodeHover(null)}
          />
          {/* Resize handles for selected node */}
          {renderResizeHandles(node.id, node.bbox, isSelected)}
        </g>
      );
    });
  }, [showNodes, visibleNodes, selectedNodeId, hoveredNodeId, selectedNodeIds, isEdgeEditMode, edgeEditParentId, scale, handleNodeClick, handleNodeDoubleClick, handleNodeHover, renderResizeHandles]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      width={imageWidth}
      height={imageHeight}
    >
      {/* Edges */}
      {edgeElements}
      {/* Blocks */}
      {blockElements}
      {/* Nodes */}
      {nodeElements}
    </svg>
  );
});
