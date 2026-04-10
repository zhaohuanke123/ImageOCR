import { useRef, useState, useCallback, useEffect } from 'react';
import { useViewStore, useDataStore, useAnnotationStore } from '@/stores';
import { cn } from '@/utils';
import { useRafThrottle } from '@/hooks';
import type { OCRBlock, MindmapNode, BBox } from '@/types';

interface BoxSelectProps {
  imageWidth: number;
  imageHeight: number;
  imageSrc: string;
  onOCRComplete?: (blocks: OCRBlock[]) => void;
}

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface OCRResponseBlock {
  id: string;
  text: string;
  bbox: [number, number, number, number];
  confidence: number;
}

interface OCRResponse {
  blocks: OCRResponseBlock[];
  suggested_text: string;
  suggested_bbox: [number, number, number, number] | null;
  error?: string;
}

// Convert array bbox [left, top, right, bottom] to polygon format
function arrayToBBox(bbox: [number, number, number, number]): BBox {
  const [left, top, right, bottom] = bbox;
  return [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ];
}

// Generate unique ID for new nodes
function generateNodeId(): string {
  return `ocr_manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Merge multiple bboxes into one containing bbox
function mergeBBoxes(bboxes: BBox[]): BBox {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const bbox of bboxes) {
    // BBox has indices 0-3 as [x, y] tuples
    for (let i = 0; i < 4; i++) {
      const [x, y] = bbox[i as keyof BBox];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    0: [minX, minY],
    1: [maxX, minY],
    2: [maxX, maxY],
    3: [minX, maxY],
  };
}

const OCR_API_URL = 'http://localhost:8765/ocr/region';
const MIN_SELECTION_SIZE = 20;
const REQUEST_TIMEOUT = 30000;

export function BoxSelect({ imageWidth, imageHeight, imageSrc, onOCRComplete }: BoxSelectProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { toolMode, scale, brightness, contrast } = useViewStore();
  const { addNodes, addBlocks } = useDataStore();
  const { showBlocks, setShowBlocks } = useAnnotationStore();

  const isBoxSelectMode = toolMode === 'box-select';

  // Convert screen coordinates to image coordinates
  // The SVG is inside a div with transform: translate(offsetX, offsetY) scale(scale)
  // and has viewBox="0 0 imageWidth imageHeight" with width/height set to image dimensions.
  // When the outer div is transformed, the SVG element's getBoundingClientRect() reflects
  // the transformed position, and the viewBox maps internal coordinates to the SVG's
  // rendered size. So screenX - rect.left gives us position relative to the SVG element,
  // and we need to account for the viewBox scaling (rect.width / imageWidth).
  const screenToImage = useCallback(
    (screenX: number, screenY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();

      // The SVG's viewBox establishes a coordinate system from (0,0) to (imageWidth, imageHeight)
      // The rendered SVG size (rect.width, rect.height) is scaled by the parent's transform
      // To convert screen coords to viewBox coords: screenPos - rect.left/top gives position
      // within the SVG element, then scale by viewBox/rendered size ratio
      const viewBoxToRenderRatioX = imageWidth / rect.width;
      const viewBoxToRenderRatioY = imageHeight / rect.height;

      const x = (screenX - rect.left) * viewBoxToRenderRatioX;
      const y = (screenY - rect.top) * viewBoxToRenderRatioY;

      return { x, y };
    },
    [imageWidth, imageHeight]
  );

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isBoxSelectMode || e.button !== 0) return;

      const { x, y } = screenToImage(e.clientX, e.clientY);
      setIsSelecting(true);
      setSelection({ startX: x, startY: y, endX: x, endY: y });
      setError(null);
      setSuccessMessage(null);
    },
    [isBoxSelectMode, screenToImage]
  );

  const handleMouseMoveRaf = useRafThrottle(
    useCallback(
      (x: number, y: number) => {
        setSelection(prev => prev ? { ...prev, endX: x, endY: y } : null);
      },
      []
    )
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !selection) return;

      const { x, y } = screenToImage(e.clientX, e.clientY);
      handleMouseMoveRaf(x, y);
    },
    [isSelecting, selection, screenToImage, handleMouseMoveRaf]
  );

  // Convert file:/// URL to local file path
  // Also handles relative URLs like /GameEngine.jpg in dev mode
  const fileUrlToPath = useCallback((url: string): string => {
    if (url.startsWith('file:///')) {
      // On Windows, file:///D:/path becomes D:/path
      return decodeURIComponent(url.slice(8));
    }
    // For relative URLs in dev mode, construct the full path
    // The backend expects an absolute path to the image file
    if (url.startsWith('/')) {
      // This is a relative URL - return it as-is and let the backend handle it
      // The backend should be configured to serve files from the project directory
      return url;
    }
    return url;
  }, []);

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || !selection) {
      setIsSelecting(false);
      return;
    }

    setIsSelecting(false);

    // Calculate selection bounds
    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);

    const width = maxX - minX;
    const height = maxY - minY;

    // Check minimum size (20x20 pixels)
    if (width < MIN_SELECTION_SIZE || height < MIN_SELECTION_SIZE) {
      setError('框选区域过小，请扩大选择范围');
      setSelection(null);
      return;
    }

    // Perform OCR
    setIsLoading(true);
    setError(null);

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const imagePath = fileUrlToPath(imageSrc);

      const response = await fetch(OCR_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_path: imagePath,
          crop_bbox: [Math.round(minX), Math.round(minY), Math.round(maxX), Math.round(maxY)],
          brightness: brightness,
          contrast: contrast,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `OCR 服务返回错误 (${response.status})`);
      }

      const result: OCRResponse = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.blocks || result.blocks.length === 0) {
        setError('该区域未识别到文字，请尝试调整对比度后重试');
        setSelection(null);
        return;
      }

      // Convert OCR blocks to OCRBlock format
      const newBlocks: OCRBlock[] = result.blocks.map(block => ({
        id: block.id || generateNodeId(),
        text: block.text,
        bbox: arrayToBBox(block.bbox),
        confidence: block.confidence,
      }));

      // Merge all blocks into a single node
      if (newBlocks.length > 0) {
        // Calculate merged bbox (union of all block bboxes)
        const mergedBBox = mergeBBoxes(newBlocks.map(b => b.bbox));

        // Merge all text as lines
        const mergedLines = newBlocks.map(b => b.text);
        const mergedText = mergedLines.join('\n');

        // Calculate average confidence
        const avgConfidence = newBlocks.reduce((sum, b) => sum + b.confidence, 0) / newBlocks.length;

        const mergedNode: MindmapNode = {
          id: generateNodeId(),
          text: mergedText,
          bbox: mergedBBox,
          lines: mergedLines,
          confidence: avgConfidence,
          parent_id: null,
          children: [],
        };

        // Add new blocks and merged node to store
        addBlocks(newBlocks);
        addNodes([mergedNode]);
      }

      // Ensure blocks are visible
      if (!showBlocks) {
        setShowBlocks(true);
      }

      // Show success message
      setSuccessMessage(`识别到 ${result.blocks.length} 个文本块`);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      onOCRComplete?.(newBlocks);
      setSelection(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('OCR 请求超时，请重试');
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('OCR 服务连接失败，请确保后端服务已启动 (uv run ocr-pipeline serve-editor-ocr)');
      } else {
        setError(err instanceof Error ? err.message : 'OCR 请求失败');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isSelecting,
    selection,
    imageSrc,
    brightness,
    contrast,
    addBlocks,
    addNodes,
    showBlocks,
    setShowBlocks,
    onOCRComplete,
    fileUrlToPath,
  ]);

  // Clear selection on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSelecting(false);
        setSelection(null);
        setError(null);
        setSuccessMessage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isBoxSelectMode) return null;

  // Calculate selection rectangle for rendering
  const renderSelection = () => {
    if (!selection) return null;

    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);

    return (
      <rect
        x={minX}
        y={minY}
        width={maxX - minX}
        height={maxY - minY}
        fill="rgba(14, 165, 233, 0.2)"
        stroke="var(--color-primary-500)"
        strokeWidth={2 / scale}
        strokeDasharray={`${4 / scale}`}
      />
    );
  };

  return (
    <>
      {/* Error toast */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[var(--color-error-500)] text-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] flex items-center gap-2">
          <span>{error}</span>
          <button
            className="opacity-80 hover:opacity-100"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success toast */}
      {successMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-[var(--color-success-500)] text-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] flex items-center gap-2">
          <span>{successMessage}</span>
          <button
            className="opacity-80 hover:opacity-100"
            onClick={() => setSuccessMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
          <div className="px-4 py-3 bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-[var(--color-primary-500)]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-[var(--text-primary)]">识别中...</span>
          </div>
        </div>
      )}

      {/* Selection SVG overlay */}
      <svg
        ref={containerRef}
        className={cn(
          'absolute inset-0 pointer-events-auto',
          isBoxSelectMode && !isSelecting && 'cursor-crosshair',
          isSelecting && 'cursor-crosshair'
        )}
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        width={imageWidth}
        height={imageHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {renderSelection()}
      </svg>
    </>
  );
}
