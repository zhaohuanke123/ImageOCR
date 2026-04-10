import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useAnnotationStore, useChangeTrackingStore, useHasChanges, useViewStore, useNodes, useEdges, useSummary, useImageData, useLoadingState, useAnnotationActions, useFilterActions, useFilterState, useEdgeEditModeState, useSelectedEdgeId, useDataStore } from '@/stores';
import { ImageViewer } from './ImageViewer';
import { AnnotationOverlay } from './AnnotationOverlay';
import { BoxSelect } from './BoxSelect';
import { Toolbar } from './Toolbar';
import { IssuePanel } from './IssuePanel';
import { NodePanel } from './NodePanel';
import { NodeEditModal } from './NodeEditModal';
import { NodeMergeModal } from './NodeMergeModal';
import { EdgeEditModal } from './EdgeEditModal';
import { SaveModal } from './SaveModal';
import { KeyboardHelp } from './KeyboardHelp';
import { Input, ExportModal, ToastContainer, useToast, showToast } from '@/components/ui';
import { Search, Download, Save, X } from 'lucide-react';
import { exportAsJson, exportAsMarkdown, exportGraphJson, exportChangeLog, saveToFile } from '@/utils';
import type { ExportFormat } from '@/components/ui';
import { useKeyboardShortcuts, createDefaultShortcuts } from '@/hooks';

export const ReviewPage = memo(function ReviewPage() {
  // Use fine-grained selectors to avoid unnecessary re-renders
  const nodes = useNodes();
  const edges = useEdges();
  const summary = useSummary();
  const imageData = useImageData();
  const { isLoading, error } = useLoadingState();

  // Use optimized grouped selectors
  const { searchText, rootsOnly, lowConfidenceOnly } = useFilterState();
  const { isEdgeEditMode, edgeEditParentId } = useEdgeEditModeState();

  // Use optimized action selectors
  const { setSearchText, toggleRootsOnly, toggleLowConfidenceOnly } = useFilterActions();
  const { clearMultiSelection, selectEdge, clearEdgeEditMode } = useAnnotationActions();

  // Visibility state (individual selectors for checkboxes)
  const showBlocks = useAnnotationStore(state => state.showBlocks);
  const showNodes = useAnnotationStore(state => state.showNodes);
  const showEdges = useAnnotationStore(state => state.showEdges);
  const toggleShowBlocks = useAnnotationStore(state => state.toggleShowBlocks);
  const toggleShowNodes = useAnnotationStore(state => state.toggleShowNodes);
  const toggleShowEdges = useAnnotationStore(state => state.toggleShowEdges);

  const { setToolMode } = useViewStore();
  const selectedEdgeId = useSelectedEdgeId();
  const { deleteEdge } = useDataStore();
  const hasChanges = useHasChanges();

  // State declarations must come before shortcuts that reference them
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeNodeIds, setMergeNodeIds] = useState<string[]>([]);
  const [editingEdge, setEditingEdge] = useState<{ parentId: string; childId: string } | null>(null);
  const { toasts, dismiss } = useToast();

  // Create keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    setToolMode: (mode: string) => setToolMode(mode as 'select' | 'pan' | 'box-select' | 'edge-edit'),
    clearEdgeEditMode,
    fitToView: () => {
      const viewStore = useViewStore.getState();
      viewStore.fitToViewCurrent();
    },
    zoomIn: () => useViewStore.getState().zoomIn(),
    zoomOut: () => useViewStore.getState().zoomOut(),
    toggleHelp: () => setIsKeyboardHelpOpen(prev => !prev),
    selectAll: () => {
      const allNodeIds = nodes.map(n => n.id);
      useAnnotationStore.setState({
        selectedNodeIds: new Set(allNodeIds),
        isMultiSelectMode: true,
        selectedNodeId: allNodeIds[0] || null,
      });
    },
    deselectAll: () => {
      useAnnotationStore.getState().deselectAllNodes();
    },
    deleteSelected: () => {
      if (selectedEdgeId) {
        const [parentId, childId] = selectedEdgeId.split(':');
        deleteEdge(parentId, childId);
        useAnnotationStore.getState().selectEdge(null);
      }
    },
    save: () => {
      if (hasChanges) {
        setIsSaveModalOpen(true);
      } else {
        showToast('info', 'No changes to save');
      }
    },
  });

  // Use keyboard shortcuts hook
  useKeyboardShortcuts({ shortcuts });

  // Store the file handle for direct saving (if supported)
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);

  // Handle save functionality
  const handleSave = useCallback(async () => {
    if (!imageData || nodes.length === 0) return;

    try {
      // Get change log first
      const changeLog = useChangeTrackingStore.getState().getChangeLog();
      const hasChanges = changeLog.operations.length > 0;

      // Prepare the graph data with change log included
      const graphData = {
        nodes: nodes,
        edges: edges,
        exported_at: new Date().toISOString(),
        image_width: imageData.image_width,
        image_height: imageData.image_height,
        // Preserve image_src if available (for dev mode compatibility)
        ...(imageData.image_src && { image_src: imageData.image_src }),
        // Include change log in the same file
        ...(hasChanges && { change_log: changeLog }),
      };
      const jsonContent = JSON.stringify(graphData, null, 2);

      // Try to use File System Access API if available and we have a file handle
      if ('showSaveFilePicker' in window) {
        try {
          // If we don't have a handle yet, ask user to pick a file
          if (!fileHandleRef.current) {
            const handle = await (window as Window & { showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
              suggestedName: 'graph.json',
              types: [{
                description: 'JSON File',
                accept: { 'application/json': ['.json'] },
              }],
            });
            fileHandleRef.current = handle;
          }

          // Write to the file
          const writable = await fileHandleRef.current.createWritable();
          await writable.write(jsonContent);
          await writable.close();

          // Mark as saved
          useChangeTrackingStore.getState().markAsSaved();
          showToast('success', hasChanges ? `Changes saved (${changeLog.operations.length} operations)` : 'Graph saved');
          return;
        } catch (err) {
          // User cancelled or error
          if ((err as Error).name === 'AbortError') {
            // User cancelled the file picker
            return;
          }
          console.warn('File System Access API failed, falling back to download:', err);
          // Fall through to fallback
        }
      }

      // Fallback: download files
      exportGraphJson(nodes, edges, imageData.image_width, imageData.image_height);

      // Also download change log separately as fallback
      if (hasChanges) {
        exportChangeLog(changeLog);
      }

      // Mark as saved in the change tracker
      useChangeTrackingStore.getState().markAsSaved();

      showToast('success', hasChanges ? `Changes downloaded (${changeLog.operations.length} operations)` : 'Graph downloaded');
    } catch (err) {
      console.error('Save failed:', err);
      showToast('error', 'Failed to save changes');
    }
  }, [nodes, edges, imageData]);

  // Handle export
  const handleExport = useCallback((format: ExportFormat) => {
    try {
      if (format === 'json') {
        exportAsJson(nodes, edges);
        showToast('success', 'Exported graph.json');
      } else {
        exportAsMarkdown(nodes, edges);
        showToast('success', 'Exported mindmap_outline.md');
      }
    } catch (err) {
      console.error('Export failed:', err);
      showToast('error', 'Export failed. Please try again.');
    }
  }, [nodes, edges]);

  const handleEditNode = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const handleMergeNodes = useCallback((nodeIds: string[]) => {
    setMergeNodeIds(nodeIds);
    setIsMergeModalOpen(true);
  }, []);

  const handleCloseMergeModal = useCallback(() => {
    setIsMergeModalOpen(false);
    setMergeNodeIds([]);
    clearMultiSelection();
  }, [clearMultiSelection]);

  const handleEditEdge = useCallback((parentId: string, childId: string) => {
    setEditingEdge({ parentId, childId });
  }, []);

  const handleCloseEdgeEditModal = useCallback(() => {
    setEditingEdge(null);
    selectEdge(null);
  }, [selectEdge]);

  // Beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we need to set returnValue
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-gray-50)]">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  if (error || !imageData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-gray-50)]">
        <div className="text-[var(--color-error-500)]">{error || 'Failed to load data'}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[380px_1fr] h-screen">
      {/* Sidebar */}
      <aside className="flex flex-col h-full overflow-hidden border-r border-[var(--color-gray-200)] bg-white">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-gray-200)]">
          <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-3">OCR 复核器</h1>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-md)]">
              <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">Nodes</div>
              <div className="text-lg font-semibold">{summary?.node_count ?? 0}</div>
            </div>
            <div className="p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-md)]">
              <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">Edges</div>
              <div className="text-lg font-semibold">{summary?.edge_count ?? 0}</div>
            </div>
            <div className="p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-md)]">
              <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">Roots</div>
              <div className="text-lg font-semibold">{summary?.root_count ?? 0}</div>
            </div>
            <div className="p-2 bg-[var(--color-gray-50)] rounded-[var(--radius-md)]">
              <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">Issues</div>
              <div className="text-lg font-semibold">{summary?.issue_count ?? 0}</div>
            </div>
          </div>

          {/* Search */}
          <Input
            placeholder="搜索文本..."
            icon={<Search className="w-4 h-4" />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />

          {/* Filters */}
          <div className="mt-3 space-y-1">
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={showBlocks}
                onChange={toggleShowBlocks}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              显示 OCR blocks
            </label>
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={showNodes}
                onChange={toggleShowNodes}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              显示 nodes
            </label>
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={showEdges}
                onChange={toggleShowEdges}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              显示 edges
            </label>
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={rootsOnly}
                onChange={toggleRootsOnly}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              只看 roots
            </label>
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] cursor-pointer">
              <input
                type="checkbox"
                checked={lowConfidenceOnly}
                onChange={toggleLowConfidenceOnly}
                className="w-4 h-4 rounded border-[var(--color-gray-300)]"
              />
              只看低置信节点
            </label>
          </div>
        </div>

        {/* Panels */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
          <div className="flex-1 min-h-0">
            <IssuePanel />
          </div>
          <div className="flex-1 min-h-0">
            <NodePanel
              onEditNode={handleEditNode}
              onMergeNodes={handleMergeNodes}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-gray-200)]">
          {/* Unsaved changes indicator */}
          {hasChanges && (
            <div className="mb-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-[var(--radius-md)] text-sm text-yellow-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Unsaved changes
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="h-10 flex items-center justify-center gap-2 bg-white text-[var(--text-primary)] border border-[var(--color-gray-300)] rounded-[var(--radius-md)] font-medium hover:bg-[var(--color-gray-50)] transition-colors disabled:opacity-50"
              onClick={() => setIsSaveModalOpen(true)}
              disabled={!hasChanges}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              className="h-10 flex items-center justify-center gap-2 bg-[var(--color-primary-500)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--color-primary-600)] transition-colors"
              onClick={() => setIsExportModalOpen(true)}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </aside>

      {/* Main viewer */}
      <main className="relative overflow-hidden bg-[var(--color-gray-100)]">
        <ImageViewer
          imageSrc={imageData.image_src}
          imageWidth={imageData.image_width}
          imageHeight={imageData.image_height}
        >
          <AnnotationOverlay
            imageWidth={imageData.image_width}
            imageHeight={imageData.image_height}
            onEditNode={handleEditNode}
            onEditEdge={handleEditEdge}
          />
          <BoxSelect
            imageWidth={imageData.image_width}
            imageHeight={imageData.image_height}
            imageSrc={imageData.image_src}
          />
        </ImageViewer>
        <Toolbar />

        {/* Edge Edit Mode Indicator */}
        {isEdgeEditMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 px-4 py-2 bg-purple-100 border border-purple-300 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
            <span className="text-sm font-medium text-purple-800">
              {edgeEditParentId ? '第2步：点击子节点完成连线' : '第1步：点击父节点（上级概念）'}
            </span>
            <span className="text-xs text-purple-600">
              {edgeEditParentId ? '子节点将连接到已选父节点' : '父节点是子节点的上级概念'}
            </span>
            <button
              className="absolute -right-2 -top-2 p-1 bg-white hover:bg-purple-200 rounded-full transition-colors shadow"
              onClick={() => {
                clearEdgeEditMode();
                setToolMode('select');
              }}
              title="取消边编辑模式"
            >
              <X className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />

      {/* Node Edit Modal */}
      <NodeEditModal
        isOpen={editingNodeId !== null}
        onClose={handleCloseEditModal}
        nodeId={editingNodeId}
      />

      {/* Node Merge Modal */}
      <NodeMergeModal
        isOpen={isMergeModalOpen}
        onClose={handleCloseMergeModal}
        preselectedIds={mergeNodeIds}
      />

      {/* Edge Edit Modal */}
      <EdgeEditModal
        isOpen={editingEdge !== null}
        onClose={handleCloseEdgeEditModal}
        parentId={editingEdge?.parentId ?? null}
        childId={editingEdge?.childId ?? null}
      />

      {/* Save Modal */}
      <SaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
      />

      {/* Keyboard Help */}
      <KeyboardHelp
        isOpen={isKeyboardHelpOpen}
        onClose={() => setIsKeyboardHelpOpen(false)}
        shortcuts={shortcuts}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
});
