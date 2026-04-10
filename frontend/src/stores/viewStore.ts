import { create } from 'zustand';
import type { ToolMode } from '@/types';

interface ViewState {
  // Transform
  scale: number;
  offsetX: number;
  offsetY: number;

  // Image adjustments
  brightness: number;
  contrast: number;

  // Tool mode
  toolMode: ToolMode;

  // Container dimensions (for fitToView without params)
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;

  // Actions
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToView: (containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number) => void;
  fitToViewCurrent: () => void; // Fit to current stored dimensions
  setDimensions: (containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number) => void;
  setOffset: (x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  adjustBrightness: (delta: number) => void;
  adjustContrast: (delta: number) => void;
  resetAdjustments: () => void;
  setToolMode: (mode: ToolMode) => void;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const SCALE_STEP = 0.1;
const MIN_ADJUSTMENT = -100;
const MAX_ADJUSTMENT = 100;

export const useViewStore = create<ViewState>((set, get) => ({
  scale: 0.6,
  offsetX: 0,
  offsetY: 0,
  brightness: 0,
  contrast: 0,
  toolMode: 'select',
  containerWidth: 0,
  containerHeight: 0,
  imageWidth: 0,
  imageHeight: 0,

  setScale: (scale) => {
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
    set({ scale: clampedScale });
  },

  zoomIn: () => {
    const { scale } = get();
    set({ scale: Math.min(MAX_SCALE, scale + SCALE_STEP) });
  },

  zoomOut: () => {
    const { scale } = get();
    set({ scale: Math.max(MIN_SCALE, scale - SCALE_STEP) });
  },

  fitToView: (containerWidth, containerHeight, imageWidth, imageHeight) => {
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const scale = Math.min(scaleX, scaleY, 1) * 0.9;
    set({ scale, offsetX: 0, offsetY: 0, containerWidth, containerHeight, imageWidth, imageHeight });
  },

  fitToViewCurrent: () => {
    const { containerWidth, containerHeight, imageWidth, imageHeight } = get();
    if (containerWidth && containerHeight && imageWidth && imageHeight) {
      const scaleX = containerWidth / imageWidth;
      const scaleY = containerHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY, 1) * 0.9;
      set({ scale, offsetX: 0, offsetY: 0 });
    }
  },

  setDimensions: (containerWidth, containerHeight, imageWidth, imageHeight) => {
    set({ containerWidth, containerHeight, imageWidth, imageHeight });
  },

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  panBy: (dx, dy) => {
    const { offsetX, offsetY } = get();
    set({ offsetX: offsetX + dx, offsetY: offsetY + dy });
  },

  adjustBrightness: (delta) => {
    const { brightness } = get();
    set({ brightness: Math.max(MIN_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, brightness + delta)) });
  },

  adjustContrast: (delta) => {
    const { contrast } = get();
    set({ contrast: Math.max(MIN_ADJUSTMENT, Math.min(MAX_ADJUSTMENT, contrast + delta)) });
  },

  resetAdjustments: () => set({ brightness: 0, contrast: 0 }),

  setToolMode: (mode) => set({ toolMode: mode }),
}));

// Selector hooks
export const useImageFilter = () => {
  const brightness = useViewStore(state => state.brightness);
  const contrast = useViewStore(state => state.contrast);
  return `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`;
};

export const useZoomPercent = () => Math.round(useViewStore(state => state.scale) * 100) + '%';
