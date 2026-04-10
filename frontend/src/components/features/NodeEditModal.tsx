import { memo, useState, useEffect } from 'react';
import { Modal, ModalButton, Button, Input } from '@/components/ui';
import { useDataStore, useNodeActions, useAnnotationActions } from '@/stores';

interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
}

export const NodeEditModal = memo(function NodeEditModal({ isOpen, onClose, nodeId }: NodeEditModalProps) {
  const nodesById = useDataStore(state => state.nodesById);
  const { updateNode, deleteNode, splitNode } = useNodeActions();
  const { selectNode } = useAnnotationActions();

  const [text, setText] = useState('');
  const [confidence, setConfidence] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const node = nodeId ? nodesById.get(nodeId) : null;

  // Initialize form when node changes
  useEffect(() => {
    if (node) {
      setText(node.text);
      setConfidence(String(Math.round(node.confidence * 100)));
    }
  }, [node]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  if (!node) return null;

  const handleSave = () => {
    const confidenceValue = Math.max(0, Math.min(100, parseInt(confidence) || 0)) / 100;
    updateNode(nodeId!, {
      text,
      lines: text.split('\n'),
      confidence: confidenceValue,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteNode(nodeId!);
    selectNode(null);
    onClose();
  };

  const handleSplit = () => {
    if (node.lines.length > 1) {
      const newNodes = splitNode(nodeId!);
      if (newNodes.length > 0) {
        selectNode(newNodes[0].id);
      }
      onClose();
    }
  };

  const handleCancel = () => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Edit Node"
      footer={
        showDeleteConfirm ? (
          <>
            <ModalButton variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={handleDelete}>
              Delete
            </ModalButton>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-[var(--color-gray-500)]"
            >
              Cancel
            </Button>
            <ModalButton variant="primary" onClick={handleSave}>
              Save
            </ModalButton>
          </>
        )
      }
    >
      {showDeleteConfirm ? (
        <div className="text-center py-2">
          <p className="text-[var(--text-primary)] font-medium mb-2">
            Confirm Delete
          </p>
          <p className="text-[var(--text-secondary)] text-sm">
            Are you sure you want to delete this node? This action cannot be undone.
          </p>
          <p className="text-[var(--text-tertiary)] text-xs mt-2 truncate">
            "{node.text}"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Node ID */}
          <div className="text-xs text-[var(--text-tertiary)] font-mono">
            ID: {node.id}
          </div>

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Text
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-40 px-3 py-2 text-sm border border-[var(--color-gray-300)] rounded-[var(--radius-md)] resize-y focus:outline-none focus:border-[var(--color-primary-500)] focus:shadow-[var(--shadow-focus)]"
              placeholder="Enter node text..."
            />
          </div>

          {/* Confidence */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Confidence (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={confidence}
              onChange={e => setConfidence(e.target.value)}
              placeholder="0-100"
            />
          </div>

          {/* Node info */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
            <span>Lines: {node.lines.length}</span>
            <span>Children: {node.children?.length || 0}</span>
            {node.parent_id && <span>Has parent</span>}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-gray-200)]">
            {/* Split button - only show if node has multiple lines */}
            {node.lines.length > 1 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSplit}
                className="text-xs"
              >
                Split ({node.lines.length} lines)
              </Button>
            )}

            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-[var(--color-error-500)] hover:text-[var(--color-error-600)] text-xs"
            >
              Delete Node
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
});
