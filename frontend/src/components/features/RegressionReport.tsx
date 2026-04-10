import { useState, useCallback, useRef } from 'react';
import {
  useRegressionStore,
  useRegressionSummary,
  useRegressionHistory,
  useRegressionIsLoading,
  useRegressionError,
  useSelectedRegionId,
  useFailCase,
  useIsRunningTest,
  useTestProgress,
} from '@/stores';
import { Button, Input, ToastContainer, useToast, showToast } from '@/components/ui';
import {
  Upload,
  Play,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { RegressionHistoryEntry } from '@/types';

interface RegressionReportProps {
  onNavigateBack?: () => void;
}

export function RegressionReport({ onNavigateBack }: RegressionReportProps) {
  const summary = useRegressionSummary();
  const history = useRegressionHistory();
  const isLoading = useRegressionIsLoading();
  const error = useRegressionError();
  const selectedRegionId = useSelectedRegionId();
  const isRunningTest = useIsRunningTest();
  const testProgress = useTestProgress();

  const {
    loadSummaryFromFile,
    selectRegion,
    setIsRunningTest,
    setError,
    reset,
  } = useRegressionStore();

  const { toasts, dismiss } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View state
  const [activeTab, setActiveTab] = useState<'overview' | 'regions' | 'history'>('overview');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [historyCompareIndex, setHistoryCompareIndex] = useState<number | null>(null);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await loadSummaryFromFile(file);
  };

  // Handle run regression test
  const handleRunTest = useCallback(async () => {
    setIsRunningTest(true, 'Starting regression test...');

    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate the process
      const stages = [
        'Loading baseline dataset...',
        'Running OCR on test regions...',
        'Merging OCR results...',
        'Building graph structure...',
        'Comparing with expected values...',
        'Generating report...',
      ];

      for (let i = 0; i < stages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsRunningTest(true, stages[i]);
      }

      // Try to load the summary.json
      const response = await fetch('/reports/summary.json');
      if (response.ok) {
        const data = await response.json();
        useRegressionStore.getState().loadSummary(data);
        showToast('success', 'Regression test completed');
      } else {
        showToast('info', 'Test completed. Please load the summary.json file.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to run regression test');
      showToast('error', 'Regression test failed');
    } finally {
      setIsRunningTest(false, '');
    }
  }, [setIsRunningTest, setError]);

  // Handle export
  const handleExport = useCallback((format: 'html' | 'pdf') => {
    if (!summary) return;

    if (format === 'html') {
      exportAsHTML(summary, history);
      showToast('success', 'HTML report exported');
    } else {
      // For PDF, we'll use print dialog
      window.print();
    }
  }, [summary, history]);

  // Toggle region expansion
  const toggleRegion = (regionId: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  };

  // Handle region click
  const handleRegionClick = (regionId: string) => {
    selectRegion(regionId);
    setActiveTab('regions');
  };

  // Reset and go back
  const handleReset = () => {
    reset();
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-gray-50)]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--color-primary-500)]" />
          <div className="text-[var(--text-secondary)]">Loading test results...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-gray-50)] gap-4">
        <div className="text-[var(--color-error-500)]">{error}</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Load summary.json
          </Button>
          {onNavigateBack && (
            <Button variant="ghost" onClick={handleReset}>
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

  // No data state
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-gray-50)] gap-6">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[var(--color-gray-300)]" />
          <div className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            No Test Results
          </div>
          <div className="text-[var(--text-secondary)] mb-6">
            Load a summary.json file to view regression test results
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Load summary.json
          </Button>
          <Button variant="primary" onClick={handleRunTest} disabled={isRunningTest}>
            {isRunningTest ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {testProgress || 'Running...'}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Regression Test
              </>
            )}
          </Button>
          {onNavigateBack && (
            <Button variant="ghost" onClick={handleReset}>
              Go Back to Review
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

  const passRate = summary.region_count > 0
    ? ((summary.region_count - summary.fail_case_count) / summary.region_count * 100).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col h-screen bg-[var(--color-gray-50)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[var(--color-gray-200)]">
        <div className="flex items-center gap-4">
          {onNavigateBack && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Back
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Regression Test Report
            </h1>
            <div className="text-sm text-[var(--text-secondary)]">
              {summary.dataset_dir} - {new Date(summary.timestamp || Date.now()).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Load
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRunTest}
            disabled={isRunningTest}
          >
            {isRunningTest ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Test
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport('html')}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Tabs */}
        <div className="flex flex-col w-64 border-r border-[var(--color-gray-200)] bg-white">
          <div className="p-4 border-b border-[var(--color-gray-200)]">
            <div className="text-sm font-medium text-[var(--text-secondary)] mb-3">
              Test Summary
            </div>

            {/* Pass/Fail indicator */}
            <div className={`p-4 rounded-lg mb-4 ${
              summary.passed
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {summary.passed ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                <span className={`text-lg font-semibold ${
                  summary.passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  {summary.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">
                {summary.region_count - summary.fail_case_count} / {summary.region_count} regions passed ({passRate}%)
              </div>
            </div>

            {/* Quick stats */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Block Recall</span>
                <span className="font-medium">{(summary.averages.block_recall * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Node Recall</span>
                <span className="font-medium">{(summary.averages.node_recall * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Edge Recall</span>
                <span className="font-medium">{(summary.averages.edge_recall * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex-1 p-2">
            <button
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center gap-3 ${
                activeTab === 'overview'
                  ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                  : 'hover:bg-[var(--color-gray-50)]'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 className="w-5 h-5" />
              Overview
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center gap-3 ${
                activeTab === 'regions'
                  ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                  : 'hover:bg-[var(--color-gray-50)]'
              }`}
              onClick={() => setActiveTab('regions')}
            >
              <FileText className="w-5 h-5" />
              Regions ({summary.region_count})
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center gap-3 ${
                activeTab === 'history'
                  ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]'
                  : 'hover:bg-[var(--color-gray-50)]'
              }`}
              onClick={() => setActiveTab('history')}
            >
              <Clock className="w-5 h-5" />
              History ({history.length})
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              summary={summary}
              onRegionClick={handleRegionClick}
            />
          )}

          {activeTab === 'regions' && (
            <RegionsTab
              summary={summary}
              selectedRegionId={selectedRegionId}
              expandedRegions={expandedRegions}
              onToggleRegion={toggleRegion}
              onSelectRegion={selectRegion}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              history={history}
              currentIndex={historyCompareIndex}
              onSelectIndex={setHistoryCompareIndex}
              showComparison={showComparison}
              onToggleComparison={() => setShowComparison(!showComparison)}
            />
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Running test progress overlay */}
      {isRunningTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-[var(--color-primary-500)]" />
            <div className="text-lg font-medium mb-2">Running Regression Test</div>
            <div className="text-[var(--text-secondary)]">{testProgress}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  summary,
  onRegionClick,
}: {
  summary: NonNullable<ReturnType<typeof useRegressionSummary>>;
  onRegionClick: (regionId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Charts section */}
      <div className="grid grid-cols-3 gap-6">
        {/* Block Recall Chart */}
        <div className="bg-white rounded-lg border border-[var(--color-gray-200)] p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Block Recall
          </h3>
          <MetricBarChart
            value={summary.averages.block_recall}
            color="blue"
          />
          <div className="mt-2 text-2xl font-bold">
            {(summary.averages.block_recall * 100).toFixed(1)}%
          </div>
        </div>

        {/* Node Recall Chart */}
        <div className="bg-white rounded-lg border border-[var(--color-gray-200)] p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Node Recall
          </h3>
          <MetricBarChart
            value={summary.averages.node_recall}
            color="green"
          />
          <div className="mt-2 text-2xl font-bold">
            {(summary.averages.node_recall * 100).toFixed(1)}%
          </div>
        </div>

        {/* Edge Recall Chart */}
        <div className="bg-white rounded-lg border border-[var(--color-gray-200)] p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Edge Recall
          </h3>
          <MetricBarChart
            value={summary.averages.edge_recall}
            color="purple"
          />
          <div className="mt-2 text-2xl font-bold">
            {(summary.averages.edge_recall * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Failed regions */}
      {summary.fail_case_count > 0 && (
        <div className="bg-white rounded-lg border border-[var(--color-gray-200)] p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Failed Regions ({summary.fail_case_count})
          </h3>
          <div className="space-y-2">
            {summary.regions
              .filter((r) => !r.passed)
              .map((region) => (
                <button
                  key={region.region_id}
                  className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                  onClick={() => onRegionClick(region.region_id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{region.region_id}</span>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="mt-1 text-sm text-[var(--text-secondary)]">
                    Block: {(region.ocr.block_recall * 100).toFixed(0)}% |
                    Node: {(region.nodes.node_recall * 100).toFixed(0)}% |
                    Edge: {(region.graph.edge_recall * 100).toFixed(0)}%
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* All regions grid */}
      <div className="bg-white rounded-lg border border-[var(--color-gray-200)] p-6">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          All Regions
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {summary.regions.map((region) => (
            <button
              key={region.region_id}
              className={`p-4 rounded-lg border text-left transition-colors ${
                region.passed
                  ? 'border-green-200 bg-green-50 hover:bg-green-100'
                  : 'border-red-200 bg-red-50 hover:bg-red-100'
              }`}
              onClick={() => onRegionClick(region.region_id)}
            >
              <div className="flex items-center gap-2 mb-2">
                {region.passed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-medium text-sm truncate">
                  {region.region_id}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <div className="flex justify-between">
                  <span>Block</span>
                  <span>{(region.ocr.block_recall * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Node</span>
                  <span>{(region.nodes.node_recall * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Edge</span>
                  <span>{(region.graph.edge_recall * 100).toFixed(0)}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Regions Tab Component
function RegionsTab({
  summary,
  selectedRegionId,
  expandedRegions,
  onToggleRegion,
  onSelectRegion,
}: {
  summary: NonNullable<ReturnType<typeof useRegressionSummary>>;
  selectedRegionId: string | null;
  expandedRegions: Set<string>;
  onToggleRegion: (regionId: string) => void;
  onSelectRegion: (regionId: string | null) => void;
}) {
  const failCase = useFailCase(selectedRegionId || '');
  const diffOverlay = useRegressionStore((state) => state.diffOverlays.get(selectedRegionId || ''));

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Region list */}
      <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-gray-200)]">
          <Input
            placeholder="Search regions..."
            className="w-full"
          />
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
          {summary.regions.map((region) => (
            <div key={region.region_id}>
              <button
                className={`w-full text-left p-4 border-b border-[var(--color-gray-100)] hover:bg-[var(--color-gray-50)] transition-colors ${
                  selectedRegionId === region.region_id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectRegion(region.region_id)}
              >
                <div className="flex items-center gap-3">
                  {region.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{region.region_id}</div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Block: {(region.ocr.block_recall * 100).toFixed(0)}% |
                      Node: {(region.nodes.node_recall * 100).toFixed(0)}% |
                      Edge: {(region.graph.edge_recall * 100).toFixed(0)}%
                    </div>
                  </div>
                  <button
                    className="p-1 hover:bg-[var(--color-gray-100)] rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleRegion(region.region_id);
                    }}
                  >
                    {expandedRegions.has(region.region_id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expanded metrics */}
                {expandedRegions.has(region.region_id) && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-gray-100)]">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-[var(--text-tertiary)] mb-1">OCR Metrics</div>
                        <div>Recall: {(region.ocr.block_recall * 100).toFixed(1)}%</div>
                        <div>Precision: {(region.ocr.block_precision * 100).toFixed(1)}%</div>
                        <div>Duplicate: {(region.ocr.duplicate_rate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[var(--text-tertiary)] mb-1">Node Metrics</div>
                        <div>Recall: {(region.nodes.node_recall * 100).toFixed(1)}%</div>
                        <div>Precision: {(region.nodes.node_precision * 100).toFixed(1)}%</div>
                        <div>Merge: {(region.nodes.multiline_merge_accuracy * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[var(--text-tertiary)] mb-1">Graph Metrics</div>
                        <div>Edge Recall: {(region.graph.edge_recall * 100).toFixed(1)}%</div>
                        <div>Roots: {region.graph.root_count}</div>
                        <div>Weak: {(region.graph.weak_edge_ratio * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
        {selectedRegionId ? (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-[var(--color-gray-200)]">
              <h3 className="font-semibold">{selectedRegionId}</h3>
            </div>

            {/* Diff overlay image */}
            {diffOverlay && (
              <div className="p-4 border-b border-[var(--color-gray-200)]">
                <div className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Diff Overlay
                </div>
                <img
                  src={diffOverlay}
                  alt={`Diff overlay for ${selectedRegionId}`}
                  className="w-full rounded border border-[var(--color-gray-200)]"
                />
              </div>
            )}

            {/* Fail case details */}
            {failCase && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Issues Detected
                </div>

                <div className="space-y-2 mb-6">
                  {failCase.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                    >
                      {issue}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-red-50 rounded">
                    <div className="font-medium text-red-700">Missing Blocks</div>
                    <div className="text-2xl font-bold">{failCase.diff_summary.missing_blocks}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium text-blue-700">Extra Blocks</div>
                    <div className="text-2xl font-bold">{failCase.diff_summary.extra_blocks}</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <div className="font-medium text-red-700">Missing Nodes</div>
                    <div className="text-2xl font-bold">{failCase.diff_summary.missing_nodes}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium text-blue-700">Extra Nodes</div>
                    <div className="text-2xl font-bold">{failCase.diff_summary.extra_nodes}</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <div className="font-medium text-red-700">Missing Edges</div>
                    <div className="text-2xl font-bold">{failCase.diff_summary.missing_edges}</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium text-blue-700">Extra Edges</div>
                    <div className="text-2xl font-bold">{failCase.diff_summary.extra_edges}</div>
                  </div>
                </div>
              </div>
            )}

            {!failCase && !diffOverlay && (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)]">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <div>No fail case data available</div>
                  <div className="text-sm mt-1">Load the fail_cases/{selectedRegionId}.json file</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <div>Select a region to view details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// History Tab Component
function HistoryTab({
  history,
  currentIndex,
  onSelectIndex,
  showComparison,
  onToggleComparison,
}: {
  history: RegressionHistoryEntry[];
  currentIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  showComparison: boolean;
  onToggleComparison: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-[var(--text-tertiary)]">
          <Clock className="w-12 h-12 mx-auto mb-2" />
          <div>No history yet</div>
          <div className="text-sm mt-1">Run tests to build history</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Test History</h3>
        <Button
          variant={showComparison ? 'primary' : 'secondary'}
          size="sm"
          onClick={onToggleComparison}
        >
          <TrendingUp className="w-4 h-4" />
          {showComparison ? 'Hide Comparison' : 'Show Comparison'}
        </Button>
      </div>

      {/* Comparison chart */}
      {showComparison && history.length >= 2 && (
        <div className="bg-white rounded-lg border border-[var(--color-gray-200)] p-6">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Metrics Trend
          </h4>
          <div className="space-y-4">
            {/* Block Recall Trend */}
            <div>
              <div className="text-sm text-[var(--text-secondary)] mb-2">Block Recall</div>
              <div className="flex items-end gap-1 h-16">
                {history.slice(0, 10).reverse().map((entry, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${entry.averages.block_recall * 100}%` }}
                    title={`${(entry.averages.block_recall * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>

            {/* Node Recall Trend */}
            <div>
              <div className="text-sm text-[var(--text-secondary)] mb-2">Node Recall</div>
              <div className="flex items-end gap-1 h-16">
                {history.slice(0, 10).reverse().map((entry, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-green-500 rounded-t"
                    style={{ height: `${entry.averages.node_recall * 100}%` }}
                    title={`${(entry.averages.node_recall * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>

            {/* Edge Recall Trend */}
            <div>
              <div className="text-sm text-[var(--text-secondary)] mb-2">Edge Recall</div>
              <div className="flex items-end gap-1 h-16">
                {history.slice(0, 10).reverse().map((entry, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-purple-500 rounded-t"
                    style={{ height: `${entry.averages.edge_recall * 100}%` }}
                    title={`${(entry.averages.edge_recall * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History list */}
      <div className="bg-white rounded-lg border border-[var(--color-gray-200)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--color-gray-50)]">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-[var(--text-secondary)]">
                Timestamp
              </th>
              <th className="text-left p-3 text-sm font-medium text-[var(--text-secondary)]">
                Dataset
              </th>
              <th className="text-center p-3 text-sm font-medium text-[var(--text-secondary)]">
                Status
              </th>
              <th className="text-center p-3 text-sm font-medium text-[var(--text-secondary)]">
                Block
              </th>
              <th className="text-center p-3 text-sm font-medium text-[var(--text-secondary)]">
                Node
              </th>
              <th className="text-center p-3 text-sm font-medium text-[var(--text-secondary)]">
                Edge
              </th>
              <th className="text-center p-3 text-sm font-medium text-[var(--text-secondary)]">
                Failed
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, index) => (
              <tr
                key={index}
                className={`border-t border-[var(--color-gray-100)] cursor-pointer hover:bg-[var(--color-gray-50)] ${
                  currentIndex === index ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectIndex(currentIndex === index ? null : index)}
              >
                <td className="p-3 text-sm">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="p-3 text-sm font-medium">
                  {entry.dataset_dir}
                </td>
                <td className="p-3 text-center">
                  {entry.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                  )}
                </td>
                <td className="p-3 text-center text-sm">
                  {(entry.averages.block_recall * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-center text-sm">
                  {(entry.averages.node_recall * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-center text-sm">
                  {(entry.averages.edge_recall * 100).toFixed(1)}%
                </td>
                <td className="p-3 text-center text-sm">
                  {entry.fail_case_count} / {entry.region_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Metric Bar Chart Component
function MetricBarChart({ value, color }: { value: number; color: 'blue' | 'green' | 'purple' }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="relative h-4 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
      <div
        className={`absolute top-0 left-0 h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
        style={{ width: `${value * 100}%` }}
      />
    </div>
  );
}

// Export HTML function
function exportAsHTML(
  summary: NonNullable<ReturnType<typeof useRegressionSummary>>,
  history: RegressionHistoryEntry[]
) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Regression Test Report - ${summary.dataset_dir}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
    .card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .metric { font-size: 32px; font-weight: bold; }
    .passed { color: #22c55e; }
    .failed { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f5f5f5; }
    .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .status-passed { background: #dcfce7; color: #166534; }
    .status-failed { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h1>Regression Test Report</h1>
  <p><strong>Dataset:</strong> ${summary.dataset_dir}</p>
  <p><strong>Timestamp:</strong> ${new Date(summary.timestamp || Date.now()).toLocaleString()}</p>
  <p><strong>Status:</strong> <span class="status-badge ${summary.passed ? 'status-passed' : 'status-failed'}">${summary.passed ? 'PASSED' : 'FAILED'}</span></p>

  <div class="summary">
    <div class="card">
      <div>Block Recall</div>
      <div class="metric">${(summary.averages.block_recall * 100).toFixed(1)}%</div>
    </div>
    <div class="card">
      <div>Node Recall</div>
      <div class="metric">${(summary.averages.node_recall * 100).toFixed(1)}%</div>
    </div>
    <div class="card">
      <div>Edge Recall</div>
      <div class="metric">${(summary.averages.edge_recall * 100).toFixed(1)}%</div>
    </div>
  </div>

  <h2>Region Results</h2>
  <table>
    <thead>
      <tr>
        <th>Region ID</th>
        <th>Status</th>
        <th>Block Recall</th>
        <th>Node Recall</th>
        <th>Edge Recall</th>
      </tr>
    </thead>
    <tbody>
      ${summary.regions.map(r => `
        <tr>
          <td>${r.region_id}</td>
          <td><span class="status-badge ${r.passed ? 'status-passed' : 'status-failed'}">${r.passed ? 'PASS' : 'FAIL'}</span></td>
          <td>${(r.ocr.block_recall * 100).toFixed(1)}%</td>
          <td>${(r.nodes.node_recall * 100).toFixed(1)}%</td>
          <td>${(r.graph.edge_recall * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${history.length > 0 ? `
    <h2>History</h2>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Status</th>
          <th>Block Recall</th>
          <th>Node Recall</th>
          <th>Edge Recall</th>
        </tr>
      </thead>
      <tbody>
        ${history.map(h => `
          <tr>
            <td>${new Date(h.timestamp).toLocaleString()}</td>
            <td><span class="status-badge ${h.passed ? 'status-passed' : 'status-failed'}">${h.passed ? 'PASS' : 'FAIL'}</span></td>
            <td>${(h.averages.block_recall * 100).toFixed(1)}%</td>
            <td>${(h.averages.node_recall * 100).toFixed(1)}%</td>
            <td>${(h.averages.edge_recall * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
    Generated by OCR Pipeline Regression Tester
  </footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `regression_report_${summary.dataset_dir.replace(/\//g, '_')}_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
