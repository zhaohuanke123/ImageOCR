import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  useBaselineEditorStore,
  useViewStore,
} from '@/stores';

interface BaselineAnnotationOverlayProps {
  imageWidth: number;
  imageHeight: number;
  cropBBox: [number, number, number, number];
  onEditBlock?: (index: number) => void;
  onEditNode?: (nodeId: string) => void;
  onEditEdge?: (parentId: string, childId: string) => void;
}

type DragHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

export function BaselineAnnotationOverlay({
  imageWidth,
  imageHeight,
  cropBBox,
  onEditBlock,
  onEditNode,
  onEditEdge,
}: BaselineAnnotationOverlayProps) {
  const {
    region,
    showBlocks,
    showNodes,
    showEdges,
    selectedBlockIndex,
    selectedNodeId,
    selectedEdgeId,
    hoveredBlockIndex,
    hoveredNodeId,
    hoveredEdgeId,
    selectBlock,
    selectNode,
    selectEdge,
    hoverBlock,
    hoverNode,
    hoverEdge,
    updateBlock,
    updateNode,
  } = useBaselineEditorStore();

  const { scale } = useViewStore();

  // Drag state
  const [dragState, setDragState] = useState<{
    type: 'block' | 'node';
    id: string | number;
    handle: DragHandle;
    startX: number;
    startY: number;
    originalBBox: [number, number, number, number];
  } | null>(null);

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Convert global bbox to local bbox (relative to crop region)
  const globalToLocal = useCallback(
    (bbox: [number, number, number, number]): [number, number, number, number] => {
      const [x0, y0] = cropBBox;
      return [bbox[0] - x0, bbox[1] - y0, bbox[2] - x0, bbox[3] - y0];
    },
    [cropBBox]
  );

  // Convert local bbox to global bbox
  const localToGlobal = useCallback(
    (bbox: [number, number, number, number]): [number, number, number, number] => {
      const [x0, y0] = cropBBox;
      return [bbox[0] + x0, bbox[1] + y0, bbox[2] + x0, bbox[3] + y0];
    },
    [cropBBox]
  );

  // Get edge center points
  const getEdgePoints = useMemo(() => {
    if (!region || !showEdges) return [];

    return region.expected_edges.map(edge => {
      const parent = region.expected_nodes.find(n => n.id === edge.parent_id);
      const child = region.expected_nodes.find(n => n.id === edge.child_id);

      if (!parent || !child) return null;

      const parentBBox = globalToLocal(parent.bbox);
      const childBBox = globalToLocal(child.bbox);

      const parentCenter = {
        x: (parentBBox[0] + parentBBox[2]) / 2,
        y: (parentBBox[1] + parentBBox[3]) / 2,
      };

      const childCenter = {
        x: (childBBox[0] + childBBox[2]) / 2,
        y: (childBBox[1] + childBBox[3]) / 2,
      };

      return {
        edgeId: `${edge.parent_id}:${edge.child_id}`,
        parentId: edge.parent_id,
        childId: edge.child_id,
        p1: parentCenter,
        p2: childCenter,
      };
    }).filter((e): e is NonNullable<typeof e> => e !== null);
  }, [region, showEdges, globalToLocal]);

  // Handle mouse down on drag handle
  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      type: 'block' | 'node',
      id: string | number,
      handle: DragHandle,
      bbox: [number, number, number, number]
    ) => {
      e.stopPropagation();
      e.preventDefault();

      setDragState({
        type,
        id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        originalBBox: globalToLocal(bbox),
      });

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    },
    [globalToLocal]
  );

  // Handle mouse move for dragging
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragState.startX) / scale;
      const dy = (e.clientY - dragState.startY) / scale;

      const { originalBBox, handle } = dragState;
      let newBBox: [number, number, number, number] = [...originalBBox];

      const minSize = 10; // Minimum width/height

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
        Math.max(0, Math.min(newBBox[0], imageWidth)),
        Math.max(0, Math.min(newBBox[1], imageHeight)),
        Math.max(0, Math.min(newBBox[2], imageWidth)),
        Math.max(0, Math.min(newBBox[3], imageHeight)),
      ];

      // Update the block/node
      const globalBBox = localToGlobal(newBBox);
      if (dragState.type === 'block' && typeof dragState.id === 'number') {
        updateBlock(dragState.id, { bbox: globalBBox });
      } else if (dragState.type === 'node' && typeof dragState.id === 'string') {
        updateNode(dragState.id, { bbox: globalBBox });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, scale, imageWidth, imageHeight, localToGlobal, updateBlock, updateNode]);

  // Handle click on block
  const handleBlockClick = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      selectBlock(index);
    },
    [selectBlock]
  );

  // Handle double click on block
  const handleBlockDoubleClick = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      onEditBlock?.(index);
    },
    [onEditBlock]
  );

  // Handle click on node
  const handleNodeClick = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(nodeId);
    },
    [selectNode]
  );

  // Handle double click on node
  const handleNodeDoubleClick = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onEditNode?.(nodeId);
    },
    [onEditNode]
  );

  // Handle click on edge
  const handleEdgeClick = useCallback(
    (parentId: string, childId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectEdge(`${parentId}:${childId}`);
    },
    [selectEdge]
  );

  // Handle double click on edge
  const handleEdgeDoubleClick = useCallback(
    (parentId: string, childId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onEditEdge?.(parentId, childId);
    },
    [onEditEdge]
  );

  // Render drag handles
  const renderDragHandles = (
    type: 'block' | 'node',
    id: string | number,
    bbox: [number, number, number, number],
    isSelected: boolean
  ) => {
    if (!isSelected) return null;

    const [l, t, r, b] = bbox;
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
        onMouseDown={e => handleMouseDown(e, type, id, handle.pos, bbox)}
      />
    ));
  };

  if (!region) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      width={imageWidth}
      height={imageHeight}
    >
      {/* Edges */}
      {showEdges &&
        getEdgePoints.map(edge => {
          const isSelected = selectedEdgeId === edge.edgeId;
          const isHovered = hoveredEdgeId === edge.edgeId;

          let strokeColor = 'rgba(34, 197, 94, 0.55)';
          if (isSelected) {
            strokeColor = 'rgba(245, 158, 11, 0.95)';
          } else if (isHovered) {
            strokeColor = 'rgba(34, 197, 94, 0.85)';
          }

          return (
            <line
              key={edge.edgeId}
              x1={edge.p1.x}
              y1={edge.p1.y}
              x2={edge.p2.x}
              y2={edge.p2.y}
              stroke={strokeColor}
              strokeWidth={(isSelected || isHovered ? 4 : 2) / scale}
              className="pointer-events-auto cursor-pointer"
              onClick={e => handleEdgeClick(edge.parentId, edge.childId, e)}
              onDoubleClick={e => handleEdgeDoubleClick(edge.parentId, edge.childId, e)}
              onMouseEnter={() => hoverEdge(edge.edgeId)}
              onMouseLeave={() => hoverEdge(null)}
            />
          );
        })}

      {/* Blocks */}
      {showBlocks &&
        region.expected_blocks.map((block, index) => {
          const localBBox = globalToLocal(block.bbox);
          const isSelected = selectedBlockIndex === index;
          const isHovered = hoveredBlockIndex === index;

          let fillColor = 'rgba(59, 130, 246, 0.08)';
          let strokeColor = 'rgba(59, 130, 246, 0.55)';

          if (isSelected) {
            fillColor = 'rgba(245, 158, 11, 0.25)';
            strokeColor = 'rgba(245, 158, 11, 0.95)';
          } else if (isHovered) {
            fillColor = 'rgba(59, 130, 246, 0.15)';
            strokeColor = 'rgba(59, 130, 246, 0.85)';
          }

          return (
            <g key={`block-${index}`}>
              <rect
                x={localBBox[0]}
                y={localBBox[1]}
                width={localBBox[2] - localBBox[0]}
                height={localBBox[3] - localBBox[1]}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={(isSelected || isHovered ? 3 : 1.5) / scale}
                className="pointer-events-auto cursor-pointer"
                onClick={e => handleBlockClick(index, e)}
                onDoubleClick={e => handleBlockDoubleClick(index, e)}
                onMouseEnter={() => hoverBlock(index)}
                onMouseLeave={() => hoverBlock(null)}
                onMouseDown={e => handleMouseDown(e, 'block', index, 'move', block.bbox)}
              />
              {renderDragHandles('block', index, localBBox, isSelected)}
            </g>
          );
        })}

      {/* Nodes */}
      {showNodes &&
        region.expected_nodes.map(node => {
          const localBBox = globalToLocal(node.bbox);
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;

          let fillColor = 'rgba(239, 68, 68, 0.08)';
          let strokeColor = 'rgba(239, 68, 68, 0.65)';

          if (isSelected) {
            fillColor = 'rgba(245, 158, 11, 0.25)';
            strokeColor = 'rgba(245, 158, 11, 0.95)';
          } else if (isHovered) {
            fillColor = 'rgba(239, 68, 68, 0.15)';
            strokeColor = 'rgba(239, 68, 68, 0.85)';
          }

          return (
            <g key={`node-${node.id}`}>
              <rect
                x={localBBox[0]}
                y={localBBox[1]}
                width={localBBox[2] - localBBox[0]}
                height={localBBox[3] - localBBox[1]}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={(isSelected || isHovered ? 3 : 1.5) / scale}
                className="pointer-events-auto cursor-pointer"
                onClick={e => handleNodeClick(node.id, e)}
                onDoubleClick={e => handleNodeDoubleClick(node.id, e)}
                onMouseEnter={() => hoverNode(node.id)}
                onMouseLeave={() => hoverNode(null)}
                onMouseDown={e => handleMouseDown(e, 'node', node.id, 'move', node.bbox)}
              />
              {renderDragHandles('node', node.id, localBBox, isSelected)}
            </g>
          );
        })}
    </svg>
  );
}
