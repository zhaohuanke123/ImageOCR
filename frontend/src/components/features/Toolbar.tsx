import { memo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Sun,
  Contrast,
  RotateCcw,
  Square,
  MousePointer,
  Hand,
  FileEdit,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useViewStore, useZoomPercent, useEdgeEditActions } from '@/stores';
import { navigateToBaselineEditor } from '@/App';

// Fine-grained selector for tool mode
const useToolMode = () => useViewStore(state => state.toolMode);

export const Toolbar = memo(function Toolbar() {
  const zoomIn = useViewStore(state => state.zoomIn);
  const zoomOut = useViewStore(state => state.zoomOut);
  const adjustBrightness = useViewStore(state => state.adjustBrightness);
  const adjustContrast = useViewStore(state => state.adjustContrast);
  const resetAdjustments = useViewStore(state => state.resetAdjustments);
  const setToolMode = useViewStore(state => state.setToolMode);
  const toolMode = useToolMode();
  const { clearEdgeEditMode } = useEdgeEditActions();

  const zoomPercent = useZoomPercent();

  // Handle edge edit mode toggle
  const handleEdgeEditToggle = useCallback(() => {
    if (toolMode === 'edge-edit') {
      setToolMode('select');
      clearEdgeEditMode();
    } else {
      setToolMode('edge-edit');
    }
  }, [toolMode, setToolMode, clearEdgeEditMode]);

  const handleSelectTool = useCallback(() => setToolMode('select'), [setToolMode]);
  const handlePanTool = useCallback(() => setToolMode('pan'), [setToolMode]);
  const handleBoxSelectTool = useCallback(() => setToolMode('box-select'), [setToolMode]);

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 p-2 bg-white rounded-[var(--radius-lg)] border border-[var(--color-gray-200)] shadow-[var(--shadow-sm)]">
      {/* Tool selection */}
      <div className="flex items-center gap-1">
        <Button
          variant={toolMode === 'select' ? 'secondary' : 'icon'}
          size="sm"
          onClick={handleSelectTool}
          title="选择工具 (V)"
        >
          <MousePointer className="w-4 h-4" />
        </Button>
        <Button
          variant={toolMode === 'pan' ? 'secondary' : 'icon'}
          size="sm"
          onClick={handlePanTool}
          title="平移工具 (H)"
        >
          <Hand className="w-4 h-4" />
        </Button>
        <Button
          variant={toolMode === 'box-select' ? 'secondary' : 'icon'}
          size="sm"
          onClick={handleBoxSelectTool}
          title="框选 OCR (B)"
        >
          <Square className="w-4 h-4" />
        </Button>
        <Button
          variant={toolMode === 'edge-edit' ? 'secondary' : 'icon'}
          size="sm"
          onClick={handleEdgeEditToggle}
          title="边编辑模式 (E) - 点击两个节点创建父子关系"
        >
          <GitBranch className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-[var(--color-gray-200)]" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <Button variant="icon" size="sm" onClick={zoomOut} title="缩小">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="min-w-[48px] text-center text-[var(--font-size-sm)] text-[var(--text-secondary)]">
          {zoomPercent}
        </span>
        <Button variant="icon" size="sm" onClick={zoomIn} title="放大">
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-[var(--color-gray-200)]" />

      {/* Image adjustments */}
      <div className="flex items-center gap-1">
        <Button
          variant="icon"
          size="sm"
          onClick={() => adjustBrightness(-10)}
          title="降低亮度"
        >
          <Sun className="w-4 h-4 opacity-50" />
        </Button>
        <Button
          variant="icon"
          size="sm"
          onClick={() => adjustBrightness(10)}
          title="增加亮度"
        >
          <Sun className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="icon"
          size="sm"
          onClick={() => adjustContrast(-10)}
          title="降低对比度"
        >
          <Contrast className="w-4 h-4 opacity-50" />
        </Button>
        <Button
          variant="icon"
          size="sm"
          onClick={() => adjustContrast(10)}
          title="增加对比度"
        >
          <Contrast className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-5 bg-[var(--color-gray-200)]" />

      {/* Reset */}
      <Button variant="ghost" size="sm" onClick={resetAdjustments} title="重置图像调整">
        <RotateCcw className="w-4 h-4" />
        <span className="text-[var(--font-size-sm)]">重置</span>
      </Button>

      <div className="w-px h-5 bg-[var(--color-gray-200)]" />

      {/* Baseline Editor */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigateToBaselineEditor()}
        title="打开基准数据编辑器"
      >
        <FileEdit className="w-4 h-4" />
        <span className="text-[var(--font-size-sm)]">基准编辑</span>
      </Button>
    </div>
  );
});
