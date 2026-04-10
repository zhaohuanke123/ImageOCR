import { create } from 'zustand';
import type {
  RegressionSummary,
  FailCase,
  RegressionHistoryEntry,
  RegionTestResult,
} from '@/types';

interface RegressionState {
  // Current test results
  summary: RegressionSummary | null;
  failCases: Map<string, FailCase>;
  diffOverlays: Map<string, string>; // region_id -> image URL

  // History
  history: RegressionHistoryEntry[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Selected region for detail view
  selectedRegionId: string | null;

  // Running test state
  isRunningTest: boolean;
  testProgress: string;

  // Actions
  loadSummary: (data: RegressionSummary) => void;
  loadSummaryFromFile: (file: File) => Promise<void>;
  loadFailCase: (regionId: string, data: FailCase) => void;
  loadFailCaseFromFile: (regionId: string, file: File) => Promise<void>;
  setDiffOverlay: (regionId: string, imageUrl: string) => void;
  selectRegion: (regionId: string | null) => void;
  addToHistory: (entry: RegressionHistoryEntry) => void;
  clearHistory: () => void;
  setError: (message: string | null) => void;
  setIsRunningTest: (running: boolean, progress?: string) => void;
  reset: () => void;
}

const initialState = {
  summary: null,
  failCases: new Map<string, FailCase>(),
  diffOverlays: new Map<string, string>(),
  history: [],
  isLoading: false,
  error: null,
  selectedRegionId: null,
  isRunningTest: false,
  testProgress: '',
};

export const useRegressionStore = create<RegressionState>((set, get) => ({
  ...initialState,

  loadSummary: (data) => {
    set({
      summary: data,
      isLoading: false,
      error: null,
    });

    // Add to history
    const entry: RegressionHistoryEntry = {
      timestamp: data.timestamp || new Date().toISOString(),
      dataset_dir: data.dataset_dir,
      passed: data.passed,
      averages: data.averages,
      region_count: data.region_count,
      fail_case_count: data.fail_case_count,
    };

    set((state) => ({
      history: [entry, ...state.history.slice(0, 19)], // Keep last 20 entries
    }));
  },

  loadSummaryFromFile: async (file) => {
    set({ isLoading: true, error: null });

    try {
      const text = await file.text();
      const data = JSON.parse(text) as RegressionSummary;

      // Validate required fields
      if (!data.dataset_dir || !data.regions || !Array.isArray(data.regions)) {
        throw new Error('Invalid summary.json format');
      }

      get().loadSummary(data);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Failed to load summary.json',
        isLoading: false,
      });
    }
  },

  loadFailCase: (regionId, data) => {
    set((state) => {
      const newFailCases = new Map(state.failCases);
      newFailCases.set(regionId, data);
      return { failCases: newFailCases };
    });
  },

  loadFailCaseFromFile: async (regionId, file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as FailCase;

      get().loadFailCase(regionId, data);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : `Failed to load fail case for ${regionId}`,
      });
    }
  },

  setDiffOverlay: (regionId, imageUrl) => {
    set((state) => {
      const newDiffOverlays = new Map(state.diffOverlays);
      newDiffOverlays.set(regionId, imageUrl);
      return { diffOverlays: newDiffOverlays };
    });
  },

  selectRegion: (regionId) => {
    set({ selectedRegionId: regionId });
  },

  addToHistory: (entry) => {
    set((state) => ({
      history: [entry, ...state.history.slice(0, 19)],
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },

  setError: (message) => {
    set({ error: message, isLoading: false });
  },

  setIsRunningTest: (running, progress = '') => {
    set({ isRunningTest: running, testProgress: progress });
  },

  reset: () => {
    set(initialState);
  },
}));

// Selector hooks
export const useRegressionSummary = () => useRegressionStore((state) => state.summary);
export const useRegressionFailCases = () => useRegressionStore((state) => state.failCases);
export const useRegressionHistory = () => useRegressionStore((state) => state.history);
export const useRegressionIsLoading = () => useRegressionStore((state) => state.isLoading);
export const useRegressionError = () => useRegressionStore((state) => state.error);
export const useSelectedRegionId = () => useRegressionStore((state) => state.selectedRegionId);
export const useIsRunningTest = () => useRegressionStore((state) => state.isRunningTest);
export const useTestProgress = () => useRegressionStore((state) => state.testProgress);

export const useRegionResult = (regionId: string): RegionTestResult | undefined => {
  return useRegressionStore((state) =>
    state.summary?.regions.find((r) => r.region_id === regionId)
  );
};

export const useFailCase = (regionId: string): FailCase | undefined => {
  return useRegressionStore((state) => state.failCases.get(regionId));
};

export const useDiffOverlay = (regionId: string): string | undefined => {
  return useRegressionStore((state) => state.diffOverlays.get(regionId));
};
