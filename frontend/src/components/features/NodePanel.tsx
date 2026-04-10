import { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { useNodes, useNodesById, useChildrenMap, useThresholds, useNodeActions, useAnnotationStore } from '@/stores';
import { useSearchText, useRootsOnly, useLowConfidenceOnly, useSelectedNodeId, useExpandedNodes, useIsMultiSelectMode, useSelectionActions, useAnnotationActions } from '@/stores';
import { CountBadge } from '@/components/ui';
import { Button } from '@/components/ui';
import { cn } from '@/utils';
import { ChevronRight, File, Folder, Edit2, Trash2, Merge, Split, CheckSquare } from 'lucide-react';
import type { MindmapNode } from '@/types';

interface NodePanelProps {
  onEditNode?: (nodeId: string) => void;
  onMergeNodes?: (nodeIds: string[]) => void;
}

export const NodePanel = memo(function NodePanel({ onEditNode, onMergeNodes }: NodePanelProps) {
  // Use fine-grained selectors to avoid unnecessary re-renders
  const nodes = useNodes();
  const nodesById = useNodesById();
  const childrenMap = useChildrenMap();
  const thresholds = useThresholds();
  const { splitNode, updateNode, deleteNode } = useNodeActions();

  // Use optimized single-value selectors
  const searchText = useSearchText();
  const rootsOnly = useRootsOnly();
  const lowConfidenceOnly = useLowConfidenceOnly();
  const selectedNodeId = useSelectedNodeId();
  const expandedNodes = useExpandedNodes();
  const isMultiSelectMode = useIsMultiSelectMode();
  // selectedNodeIds is already a Set from the store
  const selectedNodeIds = useAnnotationStore(state => state.selectedNodeIds);

  // Use optimized action selectors
  const { selectNode, selectNodeWithCtrl, toggleNodeInSelection, setMultiSelectMode, clearMultiSelection } = useSelectionActions();
  const { toggleNodeExpanded } = useAnnotationActions();

  // Inline editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingNodeId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingNodeId]);

  // Get root nodes
  const rootNodes = useMemo(() => {
    return nodes.filter(node => !node.parent_id);
  }, [nodes]);

  // Initialize expanded nodes with roots - use useEffect for side effects
  useEffect(() => {
    if (rootNodes.length > 0 && expandedNodes.size === 0) {
      const rootIds = new Set(rootNodes.map(n => n.id));
      useAnnotationStore.setState({ expandedNodes: rootIds });
    }
  }, [rootNodes, expandedNodes.size]);

  // Auto-expand ancestor nodes when searching
  useEffect(() => {
    if (!searchText) return;

    // Find all nodes that match the search
    const matchingNodeIds = new Set<string>();
    const findMatchingNodes = (node: MindmapNode) => {
      if (node.text.toLowerCase().includes(searchText.toLowerCase())) {
        matchingNodeIds.add(node.id);
      }
      const children = childrenMap.get(node.id) ?? [];
      for (const childId of children) {
        const child = nodesById.get(childId);
        if (child) findMatchingNodes(child);
      }
    };
    rootNodes.forEach(findMatchingNodes);

    // Find all ancestors of matching nodes
    const ancestorIds = new Set<string>();
    const findAncestors = (nodeId: string) => {
      const node = nodesById.get(nodeId);
      if (node?.parent_id) {
        ancestorIds.add(node.parent_id);
        findAncestors(node.parent_id);
      }
    };
    matchingNodeIds.forEach(findAncestors);

    // Expand all ancestors
    if (ancestorIds.size > 0) {
      useAnnotationStore.setState(state => ({
        expandedNodes: new Set([...state.expandedNodes, ...ancestorIds])
      }));
    }
  }, [searchText, rootNodes, childrenMap, nodesById]);

  // Check if node matches filter
  const nodeMatchesFilter = useCallback(
    (node: MindmapNode): boolean => {
      if (rootsOnly && node.parent_id) return false;
      if (lowConfidenceOnly && node.confidence >= thresholds.low_confidence) return false;
      if (searchText && !node.text.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    },
    [rootsOnly, lowConfidenceOnly, searchText, thresholds.low_confidence]
  );

  // Start inline editing
  const startEditing = (node: MindmapNode) => {
    setEditingNodeId(node.id);
    setEditingText(node.text);
  };

  // Save inline edit
  const saveEdit = () => {
    if (editingNodeId && editingText.trim()) {
      updateNode(editingNodeId, {
        text: editingText.trim(),
        lines: editingText.trim().split('\n'),
      });
    }
    setEditingNodeId(null);
    setEditingText('');
  };

  // Cancel inline edit
  const cancelEdit = () => {
    setEditingNodeId(null);
    setEditingText('');
  };

  // Handle key events for inline editing
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Check if node or any descendant matches search
  const nodeOrDescendantMatches = useCallback(
    (node: MindmapNode): boolean => {
      // Check current node
      if (nodeMatchesFilter(node)) return true;

      // Check descendants recursively
      const children = childrenMap.get(node.id) ?? [];
      for (const childId of children) {
        const child = nodesById.get(childId);
        if (child && nodeOrDescendantMatches(child)) return true;
      }
      return false;
    },
    [nodeMatchesFilter, childrenMap, nodesById]
  );

  // Render node tree recursively
  const renderNode = (node: MindmapNode, level: number): React.ReactNode => {
    const children = childrenMap.get(node.id) ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const isInMultiSelection = selectedNodeIds.has(node.id);
    const isEditing = editingNodeId === node.id;

    // Check visibility - when searching, show node if it or any descendant matches
    if (searchText && !nodeOrDescendantMatches(node)) return null;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-[var(--radius-md)]',
            'cursor-pointer transition-all duration-[var(--duration-fast)]',
            'hover:bg-[var(--color-gray-100)] group',
            isSelected && !isMultiSelectMode && 'bg-[var(--color-primary-50)] border border-[var(--color-primary-300)]',
            isInMultiSelection && 'bg-[var(--color-success-50)] border border-[var(--color-success-300)]'
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={(e) => {
            if (e.ctrlKey || e.metaKey) {
              // Ctrl/Cmd + click for multi-select
              selectNodeWithCtrl(node.id);
            } else if (isMultiSelectMode) {
              toggleNodeInSelection(node.id);
            } else {
              selectNode(node.id);
            }
          }}
          onDoubleClick={() => !isMultiSelectMode && startEditing(node)}
        >
          {/* Toggle button */}
          <button
            className={cn(
              'w-4 h-4 flex items-center justify-center',
              'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              hasChildren ? 'visible' : 'invisible'
            )}
            onClick={e => {
              e.stopPropagation();
              toggleNodeExpanded(node.id);
            }}
          >
            <ChevronRight
              className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-90')}
            />
          </button>

          {/* Icon */}
          {hasChildren ? (
            <Folder className="w-3.5 h-3.5 text-[var(--color-warning-600)]" />
          ) : (
            <File className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          )}

          {/* Text - inline editable */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editingText}
              onChange={e => setEditingText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={saveEdit}
              className="flex-1 px-1 py-0.5 text-[var(--font-size-sm)] border border-[var(--color-primary-500)] rounded outline-none"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                'flex-1 truncate text-[var(--font-size-sm)]',
                level === 0 && 'font-semibold'
              )}
            >
              {searchText ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightText(node.text, searchText),
                  }}
                />
              ) : (
                node.text
              )}
            </span>
          )}

          {/* Confidence */}
          {!isEditing && (
            <span className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] font-mono">
              {Math.round(node.confidence * 100)}%
            </span>
          )}

          {/* Action buttons - shown on hover or when selected */}
          {!isEditing && !isMultiSelectMode && (
            <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
              <button
                className="p-1 rounded hover:bg-[var(--color-gray-200)] text-[var(--text-tertiary)]"
                onClick={e => {
                  e.stopPropagation();
                  onEditNode?.(node.id);
                }}
                title="Edit"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              {node.lines.length > 1 && (
                <button
                  className="p-1 rounded hover:bg-[var(--color-gray-200)] text-[var(--text-tertiary)]"
                  onClick={e => {
                    e.stopPropagation();
                    splitNode(node.id);
                  }}
                  title="Split"
                >
                  <Split className="w-3 h-3" />
                </button>
              )}
              <button
                className="p-1 rounded hover:bg-[var(--color-error-100)] text-[var(--color-error-500)]"
                onClick={e => {
                  e.stopPropagation();
                  deleteNode(node.id);
                  selectNode(null);
                }}
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Multi-select checkbox */}
          {isMultiSelectMode && (
            <div
              className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center ml-1',
                isInMultiSelection
                  ? 'bg-[var(--color-success-500)] border-[var(--color-success-500)]'
                  : 'border-[var(--color-gray-300)]'
              )}
            >
              {isInMultiSelection && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {children.map(childId => {
              const child = nodesById.get(childId);
              return child ? renderNode(child, level + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  // Highlight search text
  function highlightText(text: string, search: string): string {
    if (!search) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const pattern = new RegExp(`(${escapeRegex(search)})`, 'gi');
    return escaped.replace(pattern, '<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">$1</mark>');
  }

  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Handle merge action
  const handleMerge = () => {
    if (selectedNodeIds.size >= 2) {
      onMergeNodes?.(Array.from(selectedNodeIds));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[var(--font-size-sm)] text-[var(--text-tertiary)] uppercase tracking-wider">
          Node Tree
        </h2>
        <div className="flex items-center gap-2">
          <CountBadge count={nodes.length} />
        </div>
      </div>

      {/* Multi-select toolbar */}
      {isMultiSelectMode && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-[var(--color-success-50)] border border-[var(--color-success-200)] rounded-[var(--radius-md)]">
          <span className="text-xs text-[var(--color-success-700)]">
            {selectedNodeIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMerge}
            disabled={selectedNodeIds.size < 2}
            className="text-xs"
          >
            <Merge className="w-3 h-3 mr-1" />
            Merge
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMultiSelection}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Node tree */}
      <div className="flex-1 overflow-y-auto border border-[var(--color-gray-200)] rounded-[var(--radius-lg)] bg-white p-2">
        {rootNodes.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-[var(--font-size-sm)]">
            {searchText ? 'No matching nodes' : 'No nodes available'}
          </div>
        ) : (
          rootNodes.map(node => renderNode(node, 0))
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-gray-200)]">
        <Button
          variant={isMultiSelectMode ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setMultiSelectMode(!isMultiSelectMode)}
          className="text-xs"
        >
          <CheckSquare className="w-3 h-3 mr-1" />
          {isMultiSelectMode ? 'Exit Multi-Select' : 'Multi-Select'}
        </Button>
      </div>
    </div>
  );
});
