import { useState, useMemo } from 'react';
import { Modal, ModalButton, Button } from '@/components/ui';
import { useDataStore, useAnnotationStore } from '@/stores';
import { cn } from '@/utils';
import type { MindmapNode } from '@/types';

interface NodeMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedIds?: string[];
}

export function NodeMergeModal({ isOpen, onClose, preselectedIds }: NodeMergeModalProps) {
  const { nodesById, data, mergeNodes } = useDataStore();
  const { selectNode } = useAnnotationStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(preselectedIds || []));

  // Reset selection when modal opens with preselected IDs
  useMemo(() => {
    if (isOpen && preselectedIds) {
      setSelectedIds(new Set(preselectedIds));
    }
  }, [isOpen, preselectedIds]);

  const availableNodes = useMemo(() => {
    if (!data) return [];
    return data.nodes;
  }, [data]);

  const selectedNodes = useMemo(() => {
    return Array.from(selectedIds)
      .map(id => nodesById.get(id))
      .filter((n): n is MindmapNode => n !== undefined);
  }, [selectedIds, nodesById]);

  const toggleNode = (nodeId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(nodeId)) {
      newSet.delete(nodeId);
    } else {
      newSet.add(nodeId);
    }
    setSelectedIds(newSet);
  };

  const handleMerge = () => {
    if (selectedIds.size < 2) return;

    const mergedNode = mergeNodes(Array.from(selectedIds));
    if (mergedNode) {
      selectNode(mergedNode.id);
    }
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  // Preview of merged text
  const previewText = selectedNodes.map(n => n.text).join(' + ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Merge Nodes"
      footer={
        <>
          <ModalButton variant="secondary" onClick={handleClose}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleMerge}
            disabled={selectedIds.size < 2}
          >
            Merge {selectedIds.size} Nodes
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Select 2 or more nodes to merge. The merged node will combine all text lines.
        </p>

        {/* Selected count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Selected: {selectedIds.size}
          </span>
          {selectedIds.size >= 2 && (
            <span className="text-xs text-[var(--color-success-600)]">
              Ready to merge
            </span>
          )}
        </div>

        {/* Preview */}
        {selectedNodes.length >= 2 && (
          <div className="p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-md)] border border-[var(--color-gray-200)]">
            <div className="text-xs text-[var(--text-tertiary)] mb-1">Preview:</div>
            <div className="text-sm text-[var(--text-primary)] line-clamp-3">
              {previewText}
            </div>
          </div>
        )}

        {/* Node list */}
        <div className="max-h-64 overflow-y-auto border border-[var(--color-gray-200)] rounded-[var(--radius-md)]">
          {availableNodes.map(node => {
            const isSelected = selectedIds.has(node.id);
            return (
              <div
                key={node.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                  'hover:bg-[var(--color-gray-50)]',
                  isSelected && 'bg-[var(--color-primary-50)]'
                )}
                onClick={() => toggleNode(node.id)}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center',
                    isSelected
                      ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)]'
                      : 'border-[var(--color-gray-300)]'
                  )}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Text */}
                <span className="flex-1 text-sm truncate">{node.text}</span>

                {/* Confidence */}
                <span className="text-xs text-[var(--text-tertiary)] font-mono">
                  {Math.round(node.confidence * 100)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-[var(--text-tertiary)]"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set(availableNodes.map(n => n.id)))}
            className="text-[var(--text-tertiary)]"
          >
            Select All
          </Button>
        </div>
      </div>
    </Modal>
  );
}
