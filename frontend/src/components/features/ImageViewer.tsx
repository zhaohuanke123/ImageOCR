import { memo, useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useViewStore, useSelectionActions } from '@/stores';
import { cn } from '@/utils';
import { useRafThrottle, useThrottle, useSpaceKeyHeld } from '@/hooks';
import { useProgressiveImage, useCanvasImageRenderer } from '@/hooks/useImageLoader';

interface ImageViewerProps {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  children?: React.ReactNode;
  /** Use canvas rendering for better performance with large images */
  useCanvas?: boolean;
  /** Enable progressive loading with preview */
  enableProgressive?: boolean;
}

// Constants for throttling
const WHEEL_THROTTLE_MS = 16; // ~60fps
const PAN_THROTTLE_MS = 16; // ~60fps

// Threshold for enabling canvas rendering (image width)
const CANVAS_THRESHOLD = 4000;

/**
 * Canvas-based image viewer for better performance with large images
 */
function CanvasImageViewer({
  imageSrc,
  imageWidth,
  imageHeight,
  children,
  onContainerClick,
}: {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  children?: React.ReactNode;
  onContainerClick?: (e: React.MouseEvent) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Track if space key is held for temporary pan mode
  const spaceHeld = useSpaceKeyHeld();

  // Use fine-grained selectors for view state
  const scale = useViewStore(state => state.scale);
  const { offsetX, offsetY } = useViewStore(useShallow(state => ({
    offsetX: state.offsetX,
    offsetY: state.offsetY,
  })));
  const brightness = useViewStore(state => state.brightness);
  const contrast = useViewStore(state => state.contrast);
  const toolMode = useViewStore(state => state.toolMode);
  const setScale = useViewStore(state => state.setScale);
  const setOffset = useViewStore(state => state.setOffset);
  const fitToView = useViewStore(state => state.fitToView);

  // Determine if we should be in pan mode
  const isPanMode = toolMode === 'pan' || spaceHeld;

  // Get container dimensions
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setViewportSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Use canvas renderer
  const { isLoading, error, render } = useCanvasImageRenderer(canvasRef, imageSrc, {
    brightness,
    contrast,
    scale,
    offsetX,
    offsetY,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
  });

  // Fit image to view on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    fitToView(container.clientWidth, container.clientHeight, imageWidth, imageHeight);
  }, [imageWidth, imageHeight, fitToView]);

  // Wheel zoom with throttle
  const handleWheelThrottled = useThrottle(
    useCallback(
      (deltaY: number) => {
        const delta = deltaY > 0 ? -0.1 : 0.1;
        setScale(scale + delta);
      },
      [scale, setScale]
    ),
    WHEEL_THROTTLE_MS
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      handleWheelThrottled(e.deltaY);
    },
    [handleWheelThrottled]
  );

  // Pan handling with RAF throttle
  const setOffsetRaf = useRafThrottle(setOffset);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPanMode || e.button === 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
      }
    },
    [isPanMode, offsetX, offsetY]
  );

  const handleMouseMoveThrottled = useThrottle(
    useCallback(
      (clientX: number, clientY: number, startX: number, startY: number) => {
        setOffsetRaf(clientX - startX, clientY - startY);
      },
      [setOffsetRaf]
    ),
    PAN_THROTTLE_MS
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handleMouseMoveThrottled(e.clientX, e.clientY, dragStart.x, dragStart.y);
    },
    [isDragging, dragStart, handleMouseMoveThrottled]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Loading overlay
  if (isLoading) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-[var(--color-gray-200)]">
        <div className="text-[var(--color-gray-500)]">Loading...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-[var(--color-gray-200)]">
        <div className="text-[var(--color-red-500)]">{error}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden',
        'bg-[var(--color-gray-200)]',
        isPanMode ? 'cursor-grab' : 'cursor-default',
        isDragging && 'cursor-grabbing'
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onContainerClick}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{
          width: viewportSize.width,
          height: viewportSize.height,
        }}
      />
      {/* SVG overlay for annotations */}
      <div
        className="absolute pointer-events-none"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: 'top left',
          width: imageWidth,
          height: imageHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Traditional img-based image viewer with progressive loading
 */
function ProgressiveImgViewer({
  imageSrc,
  imageWidth,
  imageHeight,
  children,
  onContainerClick,
  enableProgressive,
}: {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  children?: React.ReactNode;
  onContainerClick?: (e: React.MouseEvent) => void;
  enableProgressive?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Track if space key is held for temporary pan mode
  const spaceHeld = useSpaceKeyHeld();

  // Use fine-grained selectors for view state
  const scale = useViewStore(state => state.scale);
  const { offsetX, offsetY } = useViewStore(useShallow(state => ({
    offsetX: state.offsetX,
    offsetY: state.offsetY,
  })));
  const brightness = useViewStore(state => state.brightness);
  const contrast = useViewStore(state => state.contrast);
  const toolMode = useViewStore(state => state.toolMode);
  const setScale = useViewStore(state => state.setScale);
  const setOffset = useViewStore(state => state.setOffset);
  const fitToView = useViewStore(state => state.fitToView);

  // Use optimized action selector
  const { selectNode } = useSelectionActions();

  // Determine if we should be in pan mode (either tool mode or space held)
  const isPanMode = toolMode === 'pan' || spaceHeld;

  // Progressive image loading
  const { state: imageState, previewSrc, fullSrc } = useProgressiveImage(imageSrc, {
    enableProgressive,
    previewWidth: 200,
  });

  // Current image source (preview or full)
  const currentSrc = useMemo(() => {
    if (imageState.status === 'loaded' && fullSrc) return fullSrc;
    if (imageState.status === 'preview' && previewSrc) return previewSrc;
    return imageSrc;
  }, [imageState.status, fullSrc, previewSrc, imageSrc]);

  // Fit image to view on mount with resize observer for better performance
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      fitToView(container.clientWidth, container.clientHeight, imageWidth, imageHeight);
    };

    // Initial fit
    handleResize();

    // Use ResizeObserver for more efficient resize detection
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [imageWidth, imageHeight, fitToView]);

  // Wheel zoom with throttle for smooth performance
  const handleWheelThrottled = useThrottle(
    useCallback(
      (deltaY: number) => {
        const delta = deltaY > 0 ? -0.1 : 0.1;
        setScale(scale + delta);
      },
      [scale, setScale]
    ),
    WHEEL_THROTTLE_MS
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      handleWheelThrottled(e.deltaY);
    },
    [handleWheelThrottled]
  );

  // Pan handling with RAF throttle for smooth updates
  const panUpdateRef = useRef({ offsetX, offsetY });
  const setOffsetRaf = useRafThrottle(setOffset);

  // Keep offset ref in sync
  useEffect(() => {
    panUpdateRef.current = { offsetX, offsetY };
  }, [offsetX, offsetY]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isPanMode || e.button === 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
      }
    },
    [isPanMode, offsetX, offsetY]
  );

  const handleMouseMoveThrottled = useThrottle(
    useCallback(
      (clientX: number, clientY: number, startX: number, startY: number) => {
        setOffsetRaf(clientX - startX, clientY - startY);
      },
      [setOffsetRaf]
    ),
    PAN_THROTTLE_MS
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      handleMouseMoveThrottled(e.clientX, e.clientY, dragStart.x, dragStart.y);
    },
    [isDragging, dragStart, handleMouseMoveThrottled]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Click to deselect
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === containerRef.current || target.tagName === 'IMG') {
        selectNode(null);
      }
      onContainerClick?.(e);
    },
    [selectNode, onContainerClick]
  );

  // Setup passive event listeners for touch/wheel on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add passive wheel listener for better scroll performance
    // Note: React's onWheel already uses passive by default in modern browsers
    // but we add this for explicit control
    const handleTouchStart = (e: TouchEvent) => {
      if (isPanMode && e.touches.length === 1) {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - offsetX, y: touch.clientY - offsetY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      handleMouseMoveThrottled(touch.clientX, touch.clientY, dragStart.x, dragStart.y);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    // Use passive listeners for touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPanMode, offsetX, offsetY, isDragging, dragStart, handleMouseMoveThrottled]);

  // Optimize filter by using CSS custom properties
  const filter = useMemo(() => {
    return `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
  }, [brightness, contrast]);

  // Determine image opacity based on loading state
  const imageOpacity = imageState.status === 'preview' ? 0.7 : 1;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden',
        'bg-[var(--color-gray-200)]',
        isPanMode ? 'cursor-grab' : 'cursor-default',
        isDragging && 'cursor-grabbing'
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleContainerClick}
    >
      <div
        className="absolute"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transformOrigin: 'top left',
          width: imageWidth,
          height: imageHeight,
          // Use will-change hint for smooth panning
          willChange: isDragging ? 'transform' : 'auto',
        }}
      >
        <img
          src={currentSrc}
          alt="Mindmap"
          className="block max-w-none select-none"
          width={imageWidth}
          height={imageHeight}
          style={{
            filter,
            opacity: imageOpacity,
            transition: imageState.status === 'loaded' ? 'opacity 0.3s ease-in-out' : 'none',
          }}
          draggable={false}
        />
        {children}
      </div>
      {/* Loading indicator */}
      {imageState.status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/80 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-[var(--color-gray-600)]">Loading image...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main ImageViewer component
 * Automatically selects the best rendering method based on image size
 */
export const ImageViewer = memo(function ImageViewer({
  imageSrc,
  imageWidth,
  imageHeight,
  children,
  useCanvas: forceCanvas = false,
  enableProgressive = true,
}: ImageViewerProps) {
  // Use optimized action selector
  const { selectNode } = useSelectionActions();

  // Determine if we should use canvas rendering
  const shouldUseCanvas = useMemo(() => {
    if (forceCanvas) return true;
    // Use canvas for very large images
    return imageWidth > CANVAS_THRESHOLD || imageHeight > CANVAS_THRESHOLD;
  }, [forceCanvas, imageWidth, imageHeight]);

  // Click to deselect
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      selectNode(null);
    },
    [selectNode]
  );

  if (shouldUseCanvas) {
    return (
      <CanvasImageViewer
        imageSrc={imageSrc}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        onContainerClick={handleContainerClick}
      >
        {children}
      </CanvasImageViewer>
    );
  }

  return (
    <ProgressiveImgViewer
      imageSrc={imageSrc}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      onContainerClick={handleContainerClick}
      enableProgressive={enableProgressive}
    >
      {children}
    </ProgressiveImgViewer>
  );
});
