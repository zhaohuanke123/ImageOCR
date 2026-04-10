import { useEffect, useState } from 'react';
import { ReviewPage, BaselineEditor, RegressionReport } from '@/components/features';
import { useDataStore } from '@/stores';
import type { ReviewData } from '@/types';

// Embedded data will be injected by the CLI
declare global {
  interface Window {
    __REVIEW_DATA__?: ReviewData;
  }
}

// Simple hash-based routing
type Route =
  | { type: 'review' }
  | { type: 'baseline-editor'; datasetName?: string; regionId?: string }
  | { type: 'regression' };

function parseRoute(): Route {
  const hash = window.location.hash.slice(1); // Remove '#'
  if (!hash || hash === '/' || hash === '/review') {
    return { type: 'review' };
  }

  if (hash.startsWith('/baseline-editor')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    return {
      type: 'baseline-editor',
      datasetName: params.get('dataset') || undefined,
      regionId: params.get('region') || undefined,
    };
  }

  if (hash === '/regression') {
    return { type: 'regression' };
  }

  return { type: 'review' };
}

export function navigateToBaselineEditor(datasetName?: string, regionId?: string) {
  let hash = '#/baseline-editor';
  const params = new URLSearchParams();
  if (datasetName) params.set('dataset', datasetName);
  if (regionId) params.set('region', regionId);
  if (params.toString()) hash += '?' + params.toString();
  window.location.hash = hash;
}

export function navigateToReview() {
  window.location.hash = '#/review';
}

export function navigateToRegression() {
  window.location.hash = '#/regression';
}

function App() {
  const setData = useDataStore(state => state.setData);
  const setError = useDataStore(state => state.setError);
  const isLoading = useDataStore(state => state.isLoading);
  const error = useDataStore(state => state.error);
  const [route, setRoute] = useState<Route>(parseRoute);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load review data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load embedded data (production mode)
        if (window.__REVIEW_DATA__) {
          setData(window.__REVIEW_DATA__);
          return;
        }

        // Try to load from data element (production mode)
        const dataElement = document.getElementById('review-data');
        if (dataElement?.textContent) {
          const data = JSON.parse(dataElement.textContent) as ReviewData;
          setData(data);
          return;
        }

        // Dev mode: load from artifacts directory (via vite middleware)
        if (import.meta.env.DEV) {
          const response = await fetch('/graph.json');
          if (!response.ok) {
            throw new Error('开发模式：请先运行 `uv run ocr-pipeline run --input <image>` 生成数据');
          }
          const graphData = await response.json();

          // Use image metadata from graph.json if available, otherwise use defaults
          // The backend should include image_src, image_width, image_height in graph.json
          let imageSrc = graphData.image_src || '/GameEngine.jpg';
          const imageWidth = graphData.image_width || 7679;
          const imageHeight = graphData.image_height || 14925;

          // In dev mode, convert file:/// URLs to relative paths for vite middleware
          // file:///D:/path/to/GameEngine.jpg -> /GameEngine.jpg
          if (imageSrc.startsWith('file:///')) {
            const filePath = imageSrc.slice(8); // Remove 'file:///'
            const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || '';
            imageSrc = '/' + fileName;
          }

          // Transform graph data to ReviewData format
          const reviewData: ReviewData = {
            image_src: imageSrc,
            image_width: imageWidth,
            image_height: imageHeight,
            blocks: [],
            nodes: graphData.nodes || [],
            edges: graphData.edges || [],
            issues: [],
            summary: {
              node_count: graphData.nodes?.length || 0,
              edge_count: graphData.edges?.length || 0,
              root_count: 0,
              issue_count: 0,
              average_confidence: 0.99,
            },
            thresholds: {
              low_confidence: 0.9,
            },
          };
          setData(reviewData);
          return;
        }

        setError('未找到复核数据');
      } catch (e) {
        console.error('Failed to load review data:', e);
        setError(e instanceof Error ? e.message : '加载复核数据失败');
      }
    };

    loadData();
  }, [setData, setError]);

  // Render based on route
  if (route.type === 'baseline-editor') {
    return (
      <BaselineEditor
        datasetName={route.datasetName}
        regionId={route.regionId}
        onNavigateBack={() => navigateToReview()}
      />
    );
  }

  if (route.type === 'regression') {
    return (
      <RegressionReport
        onNavigateBack={() => navigateToReview()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-gray-50)]">
        <div className="text-[var(--text-secondary)]">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-gray-50)]">
        <div className="text-[var(--color-error-500)]">{error}</div>
      </div>
    );
  }

  return <ReviewPage />;
}

export default App;
