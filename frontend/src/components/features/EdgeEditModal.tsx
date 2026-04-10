import { useState, useEffect, useMemo } from 'react';
import { Modal, ModalButton, Button, Input } from '@/components/ui';
import { useDataStore, useAnnotationStore } from '@/stores';

interface EdgeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  childId: string | null;
}

export function EdgeEditModal({ isOpen, onClose, parentId, childId }: EdgeEditModalProps) {
  const { nodesById, deleteEdge, addEdge, wouldCreateCycle } = useDataStore();
  const { selectEdge } = useAnnotationStore();

  const [mode, setMode] = useState<'edit' | 'delete' | 'add'>('edit');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [error, setError] = useState('');
  const [searchParent, setSearchParent] = useState('');
  const [searchChild, setSearchChild] = useState('');

  const parent = parentId ? nodesById.get(parentId) : null;
  const child = childId ? nodesById.get(childId) : null;

  // Initialize form when edge changes
  useEffect(() => {
    if (parentId && childId) {
      setSelectedParentId(parentId);
      setSelectedChildId(childId);
      setMode('edit');
    } else {
      setSelectedParentId('');
      setSelectedChildId('');
      setMode('add');
    }
    setError('');
    setSearchParent('');
    setSearchChild('');
  }, [parentId, childId, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setSearchParent('');
      setSearchChild('');
    }
  }, [isOpen]);

  // Get all nodes for selection
  const allNodes = useMemo(() => {
    return Array.from(nodesById.values());
  }, [nodesById]);

  // Filter nodes for parent selection
  const filteredParentNodes = useMemo(() => {
    if (!searchParent) return allNodes;
    return allNodes.filter(node =>
      node.text.toLowerCase().includes(searchParent.toLowerCase()) ||
      node.id.toLowerCase().includes(searchParent.toLowerCase())
    );
  }, [allNodes, searchParent]);

  // Filter nodes for child selection
  const filteredChildNodes = useMemo(() => {
    if (!searchChild) return allNodes;
    return allNodes.filter(node =>
      node.text.toLowerCase().includes(searchChild.toLowerCase()) ||
      node.id.toLowerCase().includes(searchChild.toLowerCase())
    );
  }, [allNodes, searchChild]);

  // Get display text for selected node
  const getNodeDisplay = (nodeId: string) => {
    const node = nodesById.get(nodeId);
    if (!node) return nodeId;
    const text = node.text.length > 30 ? node.text.slice(0, 30) + '...' : node.text;
    return `${text} (${node.id})`;
  };

  const handleDeleteEdge = () => {
    if (!parentId || !childId) return;

    deleteEdge(parentId, childId);
    selectEdge(null);
    onClose();
  };

  const handleUpdateEdge = () => {
    if (!selectedParentId || !selectedChildId) {
      setError('Please select both parent and child nodes');
      return;
    }

    if (selectedParentId === selectedChildId) {
      setError('A node cannot be its own parent');
      return;
    }

    // Check for cycle
    if (wouldCreateCycle(selectedParentId, selectedChildId)) {
      setError('This would create a cycle in the graph');
      return;
    }

    // If we're editing an existing edge and the values changed
    if (parentId && childId) {
      if (selectedParentId !== parentId || selectedChildId !== childId) {
        // Delete old edge and add new one
        deleteEdge(parentId, childId);
        const success = addEdge(selectedParentId, selectedChildId);
        if (!success) {
          setError('Failed to update edge');
          return;
        }
      }
    } else {
      // Adding a new edge
      const success = addEdge(selectedParentId, selectedChildId);
      if (!success) {
        setError('Failed to add edge. It may already exist or create a cycle.');
        return;
      }
    }

    selectEdge(null);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const isValidSelection = selectedParentId && selectedChildId && selectedParentId !== selectedChildId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={mode === 'add' ? 'Add Edge' : 'Edit Edge'}
      footer={
        <div className="flex items-center gap-2">
          {mode !== 'add' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteEdge}
              className="text-[var(--color-error-500)] hover:text-[var(--color-error-600)]"
            >
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <ModalButton variant="secondary" onClick={handleCancel}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleUpdateEdge}
            disabled={!isValidSelection}
          >
            {mode === 'add' ? 'Add' : 'Save'}
          </ModalButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Edge info for existing edge */}
        {mode === 'edit' && parent && child && (
          <div className="p-3 bg-[var(--color-gray-50)] rounded-[var(--radius-md)] text-sm">
            <div className="text-[var(--text-tertiary)] mb-1">Current Relationship</div>
            <div className="flex items-center gap-2">
              <span className="font-medium truncate max-w-[140px]" title={parent.text}>
                {parent.text}
              </span>
              <span className="text-[var(--text-tertiary)]">→</span>
              <span className="font-medium truncate max-w-[140px]" title={child.text}>
                {child.text}
              </span>
            </div>
          </div>
        )}

        {/* Parent selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Parent Node
          </label>
          <div className="relative">
            <Input
              placeholder="Search parent node..."
              value={searchParent}
              onChange={e => {
                setSearchParent(e.target.value);
                if (!e.target.value) setSelectedParentId(parentId || '');
              }}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            {searchParent && (
              <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-[var(--color-gray-200)] rounded-[var(--radius-md)] shadow-lg">
                {filteredParentNodes.length === 0 ? (
                  <div className="p-2 text-sm text-[var(--text-tertiary)]">No nodes found</div>
                ) : (
                  filteredParentNodes.map(node => (
                    <button
                      key={node.id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-gray-100)] transition-colors ${
                        selectedParentId === node.id ? 'bg-[var(--color-primary-50)]' : ''
                      }`}
                      onClick={() => {
                        setSelectedParentId(node.id);
                        setSearchParent('');
                      }}
                    >
                      <div className="truncate" title={node.text}>{node.text}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{node.id}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedParentId && !searchParent && (
            <div className="mt-1 p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-sm)] text-sm">
              {getNodeDisplay(selectedParentId)}
            </div>
          )}
        </div>

        {/* Child selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Child Node
          </label>
          <div className="relative">
            <Input
              placeholder="Search child node..."
              value={searchChild}
              onChange={e => {
                setSearchChild(e.target.value);
                if (!e.target.value) setSelectedChildId(childId || '');
              }}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            {searchChild && (
              <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-[var(--color-gray-200)] rounded-[var(--radius-md)] shadow-lg">
                {filteredChildNodes.length === 0 ? (
                  <div className="p-2 text-sm text-[var(--text-tertiary)]">No nodes found</div>
                ) : (
                  filteredChildNodes.map(node => (
                    <button
                      key={node.id}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-gray-100)] transition-colors ${
                        selectedChildId === node.id ? 'bg-[var(--color-primary-50)]' : ''
                      }`}
                      onClick={() => {
                        setSelectedChildId(node.id);
                        setSearchChild('');
                      }}
                    >
                      <div className="truncate" title={node.text}>{node.text}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{node.id}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedChildId && !searchChild && (
            <div className="mt-1 p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-sm)] text-sm">
              {getNodeDisplay(selectedChildId)}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2 bg-[var(--color-error-50)] border border-[var(--color-error-200)] rounded-[var(--radius-md)] text-sm text-[var(--color-error-600)]">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-[var(--text-tertiary)] space-y-1 border-t border-[var(--color-gray-200)] pt-3 mt-3">
          <p className="font-medium text-[var(--text-secondary)]">如何编辑父子关系：</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>父节点 (Parent) → 子节点 (Child)</li>
            <li>父节点是上级概念，子节点是下级概念</li>
            <li>点击节点树中的节点，或使用搜索框查找</li>
          </ul>
          <p className="mt-2 text-[var(--color-primary-600)]">快捷方式：按 E 键进入边编辑模式，依次点击两个节点即可创建连线</p>
        </div>
      </div>
    </Modal>
  );
}
