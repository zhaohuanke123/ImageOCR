import { useMemo } from 'react';
import { Modal, ModalButton } from '@/components/ui';
import { useChangeTrackingStore, useDataStore } from '@/stores';
import type { Operation } from '@/types';
import { Edit, Trash2, Merge, Split, Link, Unlink } from 'lucide-react';
import { cn } from '@/utils';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface OperationItemProps {
  operation: Operation;
  index: number;
}

function getOperationIcon(type: Operation['type']) {
  switch (type) {
    case 'update_node':
      return <Edit className="w-4 h-4" />;
    case 'delete_node':
      return <Trash2 className="w-4 h-4" />;
    case 'merge_nodes':
      return <Merge className="w-4 h-4" />;
    case 'split_node':
      return <Split className="w-4 h-4" />;
    case 'add_edge':
      return <Link className="w-4 h-4" />;
    case 'delete_edge':
      return <Unlink className="w-4 h-4" />;
  }
}

function getOperationLabel(op: Operation): string {
  switch (op.type) {
    case 'update_node':
      return `Updated node ${op.nodeId.slice(0, 12)}...`;
    case 'delete_node':
      return `Deleted node ${op.nodeId.slice(0, 12)}...`;
    case 'merge_nodes':
      return `Merged ${op.nodeIds.length} nodes`;
    case 'split_node':
      return `Split node into ${op.newNodeIds.length} nodes`;
    case 'add_edge':
      return `Added edge: ${op.parentId.slice(0, 8)} -> ${op.childId.slice(0, 8)}`;
    case 'delete_edge':
      return `Deleted edge: ${op.parentId.slice(0, 8)} -> ${op.childId.slice(0, 8)}`;
  }
}

function getOperationColor(type: Operation['type']) {
  switch (type) {
    case 'update_node':
      return 'bg-blue-100 text-blue-600';
    case 'delete_node':
      return 'bg-red-100 text-red-600';
    case 'merge_nodes':
      return 'bg-purple-100 text-purple-600';
    case 'split_node':
      return 'bg-orange-100 text-orange-600';
    case 'add_edge':
      return 'bg-green-100 text-green-600';
    case 'delete_edge':
      return 'bg-yellow-100 text-yellow-600';
  }
}

function OperationItem({ operation, index }: OperationItemProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-[var(--color-gray-50)] rounded-[var(--radius-md)]">
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center',
        getOperationColor(operation.type)
      )}>
        {getOperationIcon(operation.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--text-primary)] truncate">
          {getOperationLabel(operation)}
        </div>
      </div>
      <div className="text-xs text-[var(--text-tertiary)]">
        #{index + 1}
      </div>
    </div>
  );
}

export function SaveModal({ isOpen, onClose, onSave }: SaveModalProps) {
  const operations = useChangeTrackingStore(state => state.operations);
  const data = useDataStore(state => state.data);

  const changesCount = useMemo(() => {
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

    return { nodeChanges, edgeChanges, total: operations.length };
  }, [operations]);

  const hasChanges = operations.length > 0;

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save Changes"
      footer={
        <>
          <ModalButton onClick={onClose}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSave} disabled={!hasChanges}>
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-[var(--color-gray-50)] rounded-[var(--radius-md)] text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{changesCount.total}</div>
            <div className="text-xs text-[var(--text-tertiary)]">Total Changes</div>
          </div>
          <div className="p-3 bg-[var(--color-gray-50)] rounded-[var(--radius-md)] text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{changesCount.nodeChanges}</div>
            <div className="text-xs text-[var(--text-tertiary)]">Node Changes</div>
          </div>
          <div className="p-3 bg-[var(--color-gray-50)] rounded-[var(--radius-md)] text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{changesCount.edgeChanges}</div>
            <div className="text-xs text-[var(--text-tertiary)]">Edge Changes</div>
          </div>
        </div>

        {/* Current data summary */}
        <div className="p-3 border border-[var(--color-gray-200)] rounded-[var(--radius-md)]">
          <div className="text-sm font-medium text-[var(--text-primary)] mb-2">Current Data</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Nodes:</span>
              <span className="font-medium">{data?.summary.node_count ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-tertiary)]">Edges:</span>
              <span className="font-medium">{data?.summary.edge_count ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Operations list */}
        {hasChanges ? (
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
              Change History ({operations.length} operations)
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {operations.map((op, index) => (
                <OperationItem key={index} operation={op} index={index} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-[var(--text-tertiary)]">
            No changes to save
          </div>
        )}

        {/* Export options info */}
        <div className="p-3 bg-blue-50 rounded-[var(--radius-md)] border border-blue-200">
          <div className="text-sm text-blue-800">
            Saving will export the modified graph.json and a change log file.
          </div>
        </div>
      </div>
    </Modal>
  );
}
