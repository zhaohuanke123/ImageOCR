/**
 * Image loading optimization hooks
 * Provides progressive loading, canvas rendering, and tile-based loading for large images
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface ImageLoadState {
  status: 'idle' | 'loading' | 'preview' | 'loaded' | 'error';
  progress: number; // 0-100
  error: string | null;
  naturalWidth: number;
  naturalHeight: number;
}

export interface ProgressiveImageOptions {
  /** Size of the preview thumbnail (width) */
  previewWidth?: number;
  /** Enable progressive loading */
  enableProgressive?: boolean;
  /** Enable tile-based loading for very large images */
  enableTiling?: boolean;
  /** Tile size in pixels */
  tileSize?: number;
  /** Threshold for enabling tiling (image width) */
  tilingThreshold?: number;
  /** Callback when image starts loading */
  onLoadStart?: () => void;
  /** Callback when preview is ready */
  onPreviewReady?: () => void;
  /** Callback when full image is loaded */
  onLoadComplete?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Hook for progressive image loading with preview support
 * Loads a low-resolution preview first, then the full image
 */
export function useProgressiveImage(
  src: string | null,
  options: ProgressiveImageOptions = {}
): {
  state: ImageLoadState;
  previewSrc: string | null;
  fullSrc: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageElement: HTMLImageElement | null;
} {
  const {
    previewWidth = 200,
    enableProgressive = true,
    onLoadStart,
    onPreviewReady,
    onLoadComplete,
    onError,
  } = options;

  const [state, setState] = useState<ImageLoadState>({
    status: 'idle',
    progress: 0,
    error: null,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [fullSrc, setFullSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!src) {
      setState({
        status: 'idle',
        progress: 0,
        error: null,
        naturalWidth: 0,
        naturalHeight: 0,
      });
      setPreviewSrc(null);
      setFullSrc(null);
      return;
    }

    // Cancel previous load
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, status: 'loading', progress: 0, error: null }));
    onLoadStart?.();

    const img = new Image();
    imageRef.current = img;

    // For progressive loading, we create a preview URL
    if (enableProgressive) {
      // First, load a small preview
      const previewImg = new Image();
      previewImg.crossOrigin = 'anonymous';

      previewImg.onload = () => {
        // Create preview canvas
        const canvas = document.createElement('canvas');
        const aspectRatio = previewImg.naturalWidth / previewImg.naturalHeight;
        const width = Math.min(previewWidth, previewImg.naturalWidth);
        const height = width / aspectRatio;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(previewImg, 0, 0, width, height);
          setPreviewSrc(canvas.toDataURL('image/jpeg', 0.6));
          setState(prev => ({ ...prev, status: 'preview', progress: 30 }));
          onPreviewReady?.();
        }
      };

      previewImg.src = src;
    }

    // Load full image
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setFullSrc(src);
      setState({
        status: 'loaded',
        progress: 100,
        error: null,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      onLoadComplete?.();
    };

    img.onerror = () => {
      const error = new Error(`Failed to load image: ${src}`);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
      onError?.(error);
    };

    img.src = src;

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [src, previewWidth, enableProgressive, onLoadStart, onPreviewReady, onLoadComplete, onError]);

  return {
    state,
    previewSrc: state.status === 'preview' ? previewSrc : null,
    fullSrc: state.status === 'loaded' ? fullSrc : null,
    canvasRef,
    imageElement: imageRef.current,
  };
}

/**
 * Hook for canvas-based image rendering
 * Better performance for large images with zoom/pan operations
 */
export function useCanvasImageRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  imageSrc: string | null,
  options: {
    brightness?: number;
    contrast?: number;
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    viewportWidth?: number;
    viewportHeight?: number;
  } = {}
): {
  isLoading: boolean;
  error: string | null;
  render: () => void;
  clear: () => void;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const {
    brightness = 0,
    contrast = 0,
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    viewportWidth = 0,
    viewportHeight = 0,
  } = options;

  // Store options in ref to avoid re-renders
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Load image
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) {
      imageRef.current = null;
      return;
    }

    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageRef.current = img;
      setIsLoading(false);
    };

    img.onerror = () => {
      setError(`Failed to load image: ${imageSrc}`);
      setIsLoading(false);
    };

    img.src = imageSrc;
  }, [imageSrc, canvasRef]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { brightness: b, contrast: c, scale: s, offsetX: ox, offsetY: oy } = optionsRef.current;

    // Set canvas size to viewport
    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewportWidth * dpr;
    canvas.height = viewportHeight * dpr;
    canvas.style.width = `${viewportWidth}px`;
    canvas.style.height = `${viewportHeight}px`;

    // Clear canvas
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transforms
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(ox, oy);
    ctx.scale(s, s);

    // Apply filters
    if (b !== 0 || c !== 0) {
      ctx.filter = `brightness(${100 + b}%) contrast(${100 + c}%)`;
    }

    // Draw image
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    ctx.restore();
  }, [canvasRef, viewportWidth, viewportHeight]);

  // Clear function
  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  // Re-render on options change with RAF throttle
  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      render();
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [render, brightness, contrast, scale, offsetX, offsetY, viewportWidth, viewportHeight]);

  return { isLoading, error, render, clear };
}

/**
 * Tile information for tile-based loading
 */
export interface ImageTile {
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  loaded: boolean;
  loading: boolean;
  error: boolean;
}

/**
 * Hook for tile-based image loading
 * Loads image in tiles for better performance with very large images
 */
export function useImageTiles(
  imageSrc: string | null,
  imageWidth: number,
  imageHeight: number,
  options: {
    tileSize?: number;
    overlap?: number;
    enabled?: boolean;
  } = {}
): {
  tiles: ImageTile[];
  loadTile: (tile: ImageTile) => Promise<void>;
  loadVisibleTiles: (viewport: { x: number; y: number; width: number; height: number; scale: number }) => void;
  loadedCount: number;
  totalCount: number;
} {
  const { tileSize = 512, overlap = 0, enabled = true } = options;

  const [tiles, setTiles] = useState<ImageTile[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  // Generate tiles
  useEffect(() => {
    if (!imageSrc || !enabled) {
      setTiles([]);
      setLoadedCount(0);
      return;
    }

    const newTiles: ImageTile[] = [];
    let tileId = 0;

    for (let y = 0; y < imageHeight; y += tileSize - overlap) {
      for (let x = 0; x < imageWidth; x += tileSize - overlap) {
        const width = Math.min(tileSize, imageWidth - x);
        const height = Math.min(tileSize, imageHeight - y);

        newTiles.push({
          x,
          y,
          width,
          height,
          src: imageSrc, // In real implementation, this would be a tile URL
          loaded: false,
          loading: false,
          error: false,
        });
        tileId++;
      }
    }

    setTiles(newTiles);
    setLoadedCount(0);
  }, [imageSrc, imageWidth, imageHeight, tileSize, overlap, enabled]);

  // Load a single tile
  const loadTile = useCallback(async (tile: ImageTile) => {
    if (tile.loaded || tile.loading) return;

    setTiles(prev =>
      prev.map(t =>
        t.x === tile.x && t.y === tile.y
          ? { ...t, loading: true }
          : t
      )
    );

    // Simulate tile loading (in real implementation, fetch from server)
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        setTiles(prev =>
          prev.map(t =>
            t.x === tile.x && t.y === tile.y
              ? { ...t, loaded: true, loading: false }
              : t
          )
        );
        setLoadedCount(prev => prev + 1);
        resolve();
      };

      img.onerror = () => {
        setTiles(prev =>
          prev.map(t =>
            t.x === tile.x && t.y === tile.y
              ? { ...t, loading: false, error: true }
              : t
          )
        );
        reject(new Error(`Failed to load tile at ${tile.x}, ${tile.y}`));
      };

      // For now, use the full image (in real implementation, use tile URL)
      img.src = tile.src;
    });
  }, []);

  // Load tiles visible in viewport
  const loadVisibleTiles = useCallback(
    (viewport: { x: number; y: number; width: number; height: number; scale: number }) => {
      if (!enabled) return;

      const visibleTiles = tiles.filter(tile => {
        const tileRight = tile.x + tile.width;
        const tileBottom = tile.y + tile.height;

        // Convert viewport to image coordinates
        const viewLeft = -viewport.x / viewport.scale;
        const viewTop = -viewport.y / viewport.scale;
        const viewRight = viewLeft + viewport.width / viewport.scale;
        const viewBottom = viewTop + viewport.height / viewport.scale;

        // Check intersection
        return (
          tile.x < viewRight &&
          tileRight > viewLeft &&
          tile.y < viewBottom &&
          tileBottom > viewTop
        );
      });

      // Load visible tiles
      visibleTiles.forEach(tile => {
        if (!tile.loaded && !tile.loading) {
          loadTile(tile);
        }
      });
    },
    [tiles, enabled, loadTile]
  );

  const totalCount = tiles.length;

  return { tiles, loadTile, loadVisibleTiles, loadedCount, totalCount };
}

/**
 * Hook for image preloading
 * Preloads images in the background for faster display
 */
export function useImagePreloader(
  sources: string[],
  options: {
    concurrency?: number;
    onProgress?: (loaded: number, total: number) => void;
    onComplete?: () => void;
    onError?: (src: string, error: Error) => void;
  } = {}
): {
  loadedImages: Map<string, HTMLImageElement>;
  isLoading: boolean;
  progress: number;
  preload: () => Promise<void>;
} {
  const { concurrency = 4, onProgress, onComplete, onError } = options;

  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadedRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const abortRef = useRef(false);

  const preload = useCallback(async () => {
    if (sources.length === 0) return;

    setIsLoading(true);
    setProgress(0);
    loadedRef.current.clear();
    abortRef.current = false;

    let loaded = 0;

    const loadImage = async (src: string): Promise<HTMLImageElement | null> => {
      if (abortRef.current) return null;

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          loadedRef.current.set(src, img);
          loaded++;
          setProgress((loaded / sources.length) * 100);
          onProgress?.(loaded, sources.length);
          resolve(img);
        };

        img.onerror = () => {
          onError?.(src, new Error(`Failed to load: ${src}`));
          resolve(null);
        };

        img.src = src;
      });
    };

    // Load in batches with concurrency limit
    for (let i = 0; i < sources.length; i += concurrency) {
      if (abortRef.current) break;

      const batch = sources.slice(i, i + concurrency);
      await Promise.all(batch.map(loadImage));
    }

    setLoadedImages(new Map(loadedRef.current));
    setIsLoading(false);
    onComplete?.();
  }, [sources, concurrency, onProgress, onComplete, onError]);

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return { loadedImages, isLoading, progress, preload };
}

/**
 * Hook for optimized image source with format detection
 * Automatically selects the best format supported by the browser
 */
export function useOptimizedImageSource(
  sources: {
    original: string;
    webp?: string;
    avif?: string;
  }
): string {
  const [bestSource, setBestSource] = useState(sources.original);

  useEffect(() => {
    // Check for AVIF support
    const avifTest = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAWnWlmAAAAAAAAEAAAAAEAAAAAAAAAAQAAAAEAAAAAAAAAAQAAAAEAAAAAAAAAAQAA';

    const img = new Image();
    img.onload = () => {
      if (img.width > 0 && sources.avif) {
        setBestSource(sources.avif);
        return;
      }
      // Fall back to WebP
      if (sources.webp) {
        setBestSource(sources.webp);
      }
    };
    img.onerror = () => {
      // AVIF not supported, try WebP
      if (sources.webp) {
        setBestSource(sources.webp);
      }
    };
    img.src = avipTest;
  }, [sources]);

  return bestSource;
}

/**
 * Hook for image dimension detection without full loading
 * Uses Image API to get dimensions quickly
 */
export function useImageDimensions(
  src: string | null
): { width: number; height: number; aspectRatio: number } | null {
  const [dimensions, setDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);

  useEffect(() => {
    if (!src) {
      setDimensions(null);
      return;
    }

    const img = new Image();

    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      });
    };

    img.src = src;
  }, [src]);

  return dimensions;
}
