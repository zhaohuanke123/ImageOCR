import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useBaselineEditorStore,
  useBaselineHasChanges,
} from '@/stores';
import { ImageViewer } from './ImageViewer';
import { BaselineAnnotationOverlay } from './BaselineAnnotationOverlay';
import { Input, Button, ToastContainer, useToast, showToast } from '@/components/ui';
import {
  Upload,
  Save,
  Download,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import type { BaselineBlock, BaselineNode } from '@/types';

interface BaselineEditorProps {
  datasetName?: string;
  regionId?: string;
  onNavigateBack?: () => void;
}

export function BaselineEditor({ datasetName, regionId, onNavigateBack }: BaselineEditorProps) {
  const {
    region,
    isLoading,
    error,
    imageWidth,
    imageHeight,
    loadRegion,
    loadRegionFromFile,
    selectedBlockIndex,
    selectedNodeId,
    selectedEdgeId,
    showBlocks,
    showNodes,
    showEdges,
    toggleShowBlocks,
    toggleShowNodes,
    toggleShowEdges,
    addBlock,
    deleteBlock,
    addNode,
    deleteNode,
    mergeNodes,
    deleteEdge,
    exportRegion,
    resetChanges,
    markAsSaved,
  } = useBaselineEditorStore();

  const hasChanges = useBaselineHasChanges();
  const { toasts, dismiss } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal states
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingEdge, setEditingEdge] = useState<{ parentId: string; childId: string } | null>(null);

  // Multi-select for merge
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());

  // Load region on mount
  useEffect(() => {
    if (datasetName && regionId) {
      loadRegion(datasetName, regionId);
    }
  }, [datasetName, regionId, loadRegion]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) {
          handleSave();
        } else {
          showToast('info', 'No changes to save');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await loadRegionFromFile(file);
  };

  // Handle save
  const handleSave = useCallback(() => {
    const regionData = exportRegion();
    if (!regionData) return;

    const json = JSON.stringify(regionData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${regionData.region_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    markAsSaved();
    showToast('success', 'Baseline data saved successfully');
  }, [exportRegion, markAsSaved]);

  // Handle export
  const handleExport = useCallback(() => {
    const regionData = exportRegion();
    if (!regionData) return;

    const json = JSON.stringify(regionData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${regionData.region_id}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('success', 'Baseline data exported');
  }, [exportRegion]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to discard all changes?')) {
      resetChanges();
      showToast('info', 'Changes discarded');
    }
  }, [resetChanges]);

  // Handle adding new block
  const handleAddBlock = useCallback(() => {
    if (!region) return;

    const newBlock: BaselineBlock = {
      text: 'New Block',
      bbox: [
        region.crop_bbox[0] + 50,
        region.crop_bbox[1] + 50,
        region.crop_bbox[0] + 200,
        region.crop_bbox[1] + 80,
      ],
    };

    addBlock(newBlock);
    showToast('success', 'Block added');
  }, [region, addBlock]);

  // Handle adding new node
  const handleAddNode = useCallback(() => {
    if (!region) return;

    const newNode: BaselineNode = {
      id: `node_${Date.now()}`,
      text: 'New Node',
      bbox: [
        region.crop_bbox[0] + 50,
        region.crop_bbox[1] + 50,
        region.crop_bbox[0] + 200,
        region.crop_bbox[1] + 80,
      ],
      lines: ['New Node'],
    };

    addNode(newNode);
    showToast('success', 'Node added');
  }, [region, addNode]);

  // Handle adding new edge
  const handleAddEdge = useCallback(() => {
    const regionData = region;
    if (!regionData || regionData.expected_nodes.length < 2) {
      showToast('error', 'Need at least 2 nodes to create an edge');
      return;
    }

    // Open edge edit modal with empty values
    setEditingEdge({ parentId: '', childId: '' });
  }, [region]);

  // Handle merge selected nodes
  const handleMergeSelectedNodes = useCallback(() => {
    if (selectedForMerge.size < 2) {
      showToast('error', 'Select at least 2 nodes to merge');
      return;
    }

    mergeNodes(Array.from(selectedForMerge));
    setSelectedForMerge(new Set());
    showToast('success', `${selectedForMerge.size} nodes merged`);
  }, [selectedForMerge, mergeNodes]);

  // Toggle node selection for merge
  const toggleNodeForMerge = useCallback((nodeId: string) => {
    setSelectedForMerge(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Get image source
  const imageSrc = region?.image_path ? `/${region.image_path}` : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-gray-50)]">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-gray-50)] gap-4">
        <div className="text-[var(--color-error-500)]">{error}</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Load JSON File
          </Button>
          {onNavigateBack && (
            <Button variant="secondary" onClick={onNavigateBack}>
              Go Back
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  if (!region) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-gray-50)] gap-4">
        <div className="text-[var(--text-secondary)]">No baseline data loaded</div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4" />
          Load JSON File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
        {onNavigateBack && (
          <Button variant="ghost" onClick={onNavigateBack}>
            Go Back to Review
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[400px_1fr] h-screen">
      {/* Sidebar */}
      <aside className="flex flex-col h-full overflow-hidden border-r border-[var(--color-gray-200)] bg-white">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-gray-200)]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Baseline Editor</h1>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Load JSON">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Region info */}
          <div className="p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-md)] mb-3">
            <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">Region ID</div>
            <div className="text-sm font-medium">{region.region_id}</div>
            <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] mt-1">
              Size: {imageWidth} x {imageHeight}
            </div>
          </div>

          {/* Visibility toggles */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={showBlocks}
                onChange={toggleShowBlocks}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              Show Blocks ({region.expected_blocks.length})
            </label>
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={showNodes}
                onChange={toggleShowNodes}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              Show Nodes ({region.expected_nodes.length})
            </label>
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={showEdges}
                onChange={toggleShowEdges}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              Show Edges ({region.expected_edges.length})
            </label>
          </div>
        </div>

        {/* Panels */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Blocks Panel */}
          <div className="border border-[var(--color-gray-200)] rounded-[var(--radius-md)]">
            <div className="flex items-center justify-between p-3 border-b border-[var(--color-gray-200)]">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">
                Blocks ({region.expected_blocks.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={handleAddBlock}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {region.expected_blocks.map((block, index) => (
                <div
                  key={index}
                  className={`p-2 border-b border-[var(--color-gray-100)] last:border-b-0 cursor-pointer hover:bg-[var(--color-gray-50)] ${
                    selectedBlockIndex === index ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => useBaselineEditorStore.getState().selectBlock(index)}
                >
                  <div className="text-[var(--font-size-sm)] truncate">{block.text}</div>
                  <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
                    [{block.bbox.join(', ')}]
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingBlockIndex(index);
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-red-500"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Delete this block?')) {
                          deleteBlock(index);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {region.expected_blocks.length === 0 && (
                <div className="p-3 text-center text-[var(--text-tertiary)] text-sm">
                  No blocks
                </div>
              )}
            </div>
          </div>

          {/* Nodes Panel */}
          <div className="border border-[var(--color-gray-200)] rounded-[var(--radius-md)]">
            <div className="flex items-center justify-between p-3 border-b border-[var(--color-gray-200)]">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">
                Nodes ({region.expected_nodes.length})
              </h2>
              <div className="flex gap-1">
                {selectedForMerge.size >= 2 && (
                  <Button variant="secondary" size="sm" onClick={handleMergeSelectedNodes}>
                    Merge ({selectedForMerge.size})
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleAddNode}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {region.expected_nodes.map(node => (
                <div
                  key={node.id}
                  className={`p-2 border-b border-[var(--color-gray-100)] last:border-b-0 cursor-pointer hover:bg-[var(--color-gray-50)] ${
                    selectedNodeId === node.id ? 'bg-orange-50' : ''
                  } ${selectedForMerge.has(node.id) ? 'bg-green-50' : ''}`}
                  onClick={() => useBaselineEditorStore.getState().selectNode(node.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--font-size-sm)] truncate">{node.text}</div>
                      <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
                        ID: {node.id} | Lines: {node.lines.length}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedForMerge.has(node.id)}
                      onChange={() => toggleNodeForMerge(node.id)}
                      onClick={e => e.stopPropagation()}
                      className="mt-1 ml-2"
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={e => {
                        e.stopPropagation();
                        setEditingNodeId(node.id);
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-red-500"
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm('Delete this node?')) {
                          deleteNode(node.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {region.expected_nodes.length === 0 && (
                <div className="p-3 text-center text-[var(--text-tertiary)] text-sm">
                  No nodes
                </div>
              )}
            </div>
          </div>

          {/* Edges Panel */}
          <div className="border border-[var(--color-gray-200)] rounded-[var(--radius-md)]">
            <div className="flex items-center justify-between p-3 border-b border-[var(--color-gray-200)]">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">
                Edges ({region.expected_edges.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={handleAddEdge}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {region.expected_edges.map((edge, index) => {
                const edgeId = `${edge.parent_id}:${edge.child_id}`;
                return (
                  <div
                    key={index}
                    className={`p-2 border-b border-[var(--color-gray-100)] last:border-b-0 cursor-pointer hover:bg-[var(--color-gray-50)] ${
                      selectedEdgeId === edgeId ? 'bg-yellow-50' : ''
                    }`}
                    onClick={() => useBaselineEditorStore.getState().selectEdge(edgeId)}
                  >
                    <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
                      {edge.parent_text?.substring(0, 20)}...
                      <ChevronRight className="inline w-3 h-3 mx-1" />
                      {edge.child_text?.substring(0, 20)}...
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={e => {
                          e.stopPropagation();
                          setEditingEdge({ parentId: edge.parent_id, childId: edge.child_id });
                        }}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-red-500"
                        onClick={e => {
                          e.stopPropagation();
                          if (confirm('Delete this edge?')) {
                            deleteEdge(edge.parent_id, edge.child_id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {region.expected_edges.length === 0 && (
                <div className="p-3 text-center text-[var(--text-tertiary)] text-sm">
                  No edges
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-gray-200)]">
          {hasChanges && (
            <div className="mb-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-[var(--radius-md)] text-sm text-yellow-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Unsaved changes
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </aside>

      {/* Main viewer */}
      <main className="relative overflow-hidden bg-[var(--color-gray-100)]">
        {imageSrc ? (
          <ImageViewer
            imageSrc={imageSrc}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          >
            <BaselineAnnotationOverlay
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              cropBBox={region.crop_bbox}
              onEditBlock={setEditingBlockIndex}
              onEditNode={setEditingNodeId}
              onEditEdge={(parentId, childId) => setEditingEdge({ parentId, childId })}
            />
          </ImageViewer>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]">
            <ImageIcon className="w-8 h-8 mr-2" />
            No image available
          </div>
        )}
      </main>

      {/* Edit Modals */}
      {editingBlockIndex !== null && (
        <BlockEditModal
          index={editingBlockIndex}
          onClose={() => setEditingBlockIndex(null)}
        />
      )}

      {editingNodeId !== null && (
        <NodeEditModalBaseline
          nodeId={editingNodeId}
          onClose={() => setEditingNodeId(null)}
        />
      )}

      {editingEdge !== null && (
        <EdgeEditModalBaseline
          initialParentId={editingEdge.parentId}
          initialChildId={editingEdge.childId}
          onClose={() => setEditingEdge(null)}
        />
      )}

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// Block Edit Modal
function BlockEditModal({
  index,
  onClose,
}: {
  index: number;
  onClose: () => void;
}) {
  const { region, updateBlock, deleteBlock } = useBaselineEditorStore();
  const block = region?.expected_blocks[index];

  const [text, setText] = useState(block?.text || '');
  const [bbox, setBbox] = useState(block?.bbox.join(', ') || '');

  useEffect(() => {
    if (block) {
      setText(block.text);
      setBbox(block.bbox.join(', '));
    }
  }, [block]);

  if (!block) return null;

  const handleSave = () => {
    const bboxValues = bbox.split(',').map(v => parseInt(v.trim()));
    if (bboxValues.length !== 4 || bboxValues.some(isNaN)) {
      showToast('error', 'Invalid bbox format. Use: left, top, right, bottom');
      return;
    }

    updateBlock(index, {
      text,
      bbox: bboxValues as [number, number, number, number],
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this block?')) {
      deleteBlock(index);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Edit Block #{index + 1}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-20 px-3 py-2 border rounded-md resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              BBox (left, top, right, bottom)
            </label>
            <Input
              value={bbox}
              onChange={e => setBbox(e.target.value)}
              placeholder="0, 0, 100, 50"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" className="text-red-500" onClick={handleDelete}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Node Edit Modal
function NodeEditModalBaseline({
  nodeId,
  onClose,
}: {
  nodeId: string;
  onClose: () => void;
}) {
  const { region, updateNode, deleteNode } = useBaselineEditorStore();
  const node = region?.expected_nodes.find(n => n.id === nodeId);

  const [id, setId] = useState(node?.id || '');
  const [lines, setLines] = useState(node?.lines.join('\n') || '');
  const [bbox, setBbox] = useState(node?.bbox.join(', ') || '');

  useEffect(() => {
    if (node) {
      setId(node.id);
      setLines(node.lines.join('\n'));
      setBbox(node.bbox.join(', '));
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    const bboxValues = bbox.split(',').map(v => parseInt(v.trim()));
    if (bboxValues.length !== 4 || bboxValues.some(isNaN)) {
      showToast('error', 'Invalid bbox format. Use: left, top, right, bottom');
      return;
    }

    const linesArray = lines.split('\n').filter(l => l.trim());

    updateNode(nodeId, {
      id,
      text: linesArray.join('\n'),
      bbox: bboxValues as [number, number, number, number],
      lines: linesArray,
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this node?')) {
      deleteNode(nodeId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[450px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Edit Node</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Node ID</label>
            <Input
              value={id}
              onChange={e => setId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lines (one per line)</label>
            <textarea
              value={lines}
              onChange={e => {
                setLines(e.target.value);
              }}
              className="w-full h-32 px-3 py-2 border rounded-md resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              BBox (left, top, right, bottom)
            </label>
            <Input
              value={bbox}
              onChange={e => setBbox(e.target.value)}
              placeholder="0, 0, 100, 50"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" className="text-red-500" onClick={handleDelete}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edge Edit Modal
function EdgeEditModalBaseline({
  initialParentId,
  initialChildId,
  onClose,
}: {
  initialParentId: string;
  initialChildId: string;
  onClose: () => void;
}) {
  const { region, addEdge, deleteEdge } = useBaselineEditorStore();
  const nodes = region?.expected_nodes || [];

  const isNew = !initialParentId || !initialChildId;
  const existingEdge = region?.expected_edges.find(
    e => e.parent_id === initialParentId && e.child_id === initialChildId
  );

  const [parentId, setParentId] = useState(initialParentId || '');
  const [childId, setChildId] = useState(initialChildId || '');

  const parentNode = nodes.find(n => n.id === parentId);
  const childNode = nodes.find(n => n.id === childId);

  const handleSave = () => {
    if (!parentId || !childId) {
      showToast('error', 'Please select both parent and child nodes');
      return;
    }

    if (parentId === childId) {
      showToast('error', 'Parent and child cannot be the same node');
      return;
    }

    // If editing existing edge, delete it first
    if (!isNew && existingEdge) {
      deleteEdge(initialParentId, initialChildId);
    }

    // Add the new edge
    addEdge({
      parent_id: parentId,
      child_id: childId,
      parent_text: parentNode?.text || '',
      child_text: childNode?.text || '',
    });

    onClose();
  };

  const handleDelete = () => {
    if (!isNew && confirm('Delete this edge?')) {
      deleteEdge(initialParentId, initialChildId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h2 className="text-lg font-semibold mb-4">
          {isNew ? 'Add Edge' : 'Edit Edge'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Parent Node</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select parent node...</option>
              {nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.text.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Child Node</label>
            <select
              value={childId}
              onChange={e => setChildId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select child node...</option>
              {nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.text.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          {parentId && childId && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              <div className="truncate">
                <strong>Parent:</strong> {parentNode?.text.substring(0, 50)}
              </div>
              <div className="truncate mt-1">
                <strong>Child:</strong> {childNode?.text.substring(0, 50)}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          {!isNew && (
            <Button variant="ghost" className="text-red-500" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isNew ? 'Add' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
