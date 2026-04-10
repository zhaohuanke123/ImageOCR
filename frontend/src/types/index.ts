// OCR Pipeline Types

export interface Point {
  x: number;
  y: number;
}

export interface BBox {
  0: [number, number];
  1: [number, number];
  2: [number, number];
  3: [number, number];
}

export interface OCRBlock {
  id: string;
  text: string;
  bbox: BBox;
  confidence: number;
  tile_id?: string;
}

export interface MindmapNode {
  id: string;
  text: string;
  bbox: BBox;
  lines: string[];
  confidence: number;
  parent_id: string | null;
  children: string[];
}

export interface MindmapEdge {
  parent_id: string;
  child_id: string;
  score: number;
  reason: string;
}

export type IssueType =
  | 'orphan_root'
  | 'low_confidence_node'
  | 'oversized_node'
  | 'oversized_leaf'
  | 'text_outlier'
  | 'dense_overlap_region'
  | 'weak_edge';

export interface Issue {
  issue_type: IssueType;
  node_id: string;
  text: string;
  reason: string;
  bbox: BBox;
}

export interface ReviewData {
  image_src: string;
  image_width: number;
  image_height: number;
  blocks: OCRBlock[];
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  issues: Issue[];
  summary: {
    node_count: number;
    edge_count: number;
    root_count: number;
    issue_count: number;
    average_confidence: number;
  };
  thresholds: {
    low_confidence: number;
  };
}

export type ToolMode = 'select' | 'pan' | 'box-select' | 'edge-edit';

export interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  brightness: number;
  contrast: number;
}

export interface AnnotationState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  showBlocks: boolean;
  showNodes: boolean;
  showEdges: boolean;
}

export interface IssueFilter {
  issueType: IssueType | '';
  searchText: string;
  rootsOnly: boolean;
  lowConfidenceOnly: boolean;
}

// Change tracking types for save functionality
export type Operation =
  | { type: 'update_node'; nodeId: string; before: Partial<MindmapNode>; after: Partial<MindmapNode> }
  | { type: 'delete_node'; nodeId: string; node: MindmapNode }
  | { type: 'merge_nodes'; nodeIds: string[]; newNodeId: string }
  | { type: 'split_node'; nodeId: string; newNodeIds: string[] }
  | { type: 'add_edge'; parentId: string; childId: string }
  | { type: 'delete_edge'; parentId: string; childId: string };

export interface ChangeLog {
  timestamp: string;
  operations: Operation[];
}

export interface GraphExportData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  exported_at: string;
  image_width?: number;
  image_height?: number;
}

// Baseline data types
export interface BaselineBlock {
  text: string;
  bbox: [number, number, number, number]; // [left, top, right, bottom]
}

export interface BaselineNode {
  id: string;
  text: string;
  bbox: [number, number, number, number]; // [left, top, right, bottom]
  lines: string[];
}

export interface BaselineEdge {
  parent_id: string;
  child_id: string;
  parent_text: string;
  child_text: string;
}

export interface BaselineRegion {
  region_id: string;
  image_path: string;
  crop_bbox: [number, number, number, number]; // [x0, y0, x1, y1]
  expected_blocks: BaselineBlock[];
  expected_nodes: BaselineNode[];
  expected_edges: BaselineEdge[];
  seed_source?: string;
  needs_review?: boolean;
  source_path?: string;
}

export interface BaselineDataset {
  name: string;
  regions: BaselineRegion[];
}

// Regression test types
export interface RegionOCRMetrics {
  block_recall: number;
  block_precision: number;
  duplicate_rate: number;
}

export interface RegionNodeMetrics {
  node_recall: number;
  node_precision: number;
  multiline_merge_accuracy: number;
}

export interface RegionGraphMetrics {
  edge_recall: number;
  root_count: number;
  weak_edge_ratio: number;
}

export interface RegionTestResult {
  region_id: string;
  passed: boolean;
  ocr: RegionOCRMetrics;
  nodes: RegionNodeMetrics;
  graph: RegionGraphMetrics;
}

export interface FailCase {
  region_id: string;
  expected_blocks?: BaselineBlock[];
  expected_nodes?: BaselineNode[];
  expected_edges?: BaselineEdge[];
  actual_blocks?: BaselineBlock[];
  actual_nodes?: BaselineNode[];
  actual_edges?: BaselineEdge[];
  issues: string[];
  diff_summary: {
    missing_blocks: number;
    extra_blocks: number;
    missing_nodes: number;
    extra_nodes: number;
    missing_edges: number;
    extra_edges: number;
  };
}

export interface RegressionAverages {
  block_recall: number;
  block_precision: number;
  node_recall: number;
  node_precision: number;
  edge_recall: number;
}

export interface RegressionSummary {
  dataset_dir: string;
  region_count: number;
  fail_case_count: number;
  passed: boolean;
  timestamp: string;
  averages: RegressionAverages;
  regions: RegionTestResult[];
}

export interface RegressionHistoryEntry {
  timestamp: string;
  dataset_dir: string;
  passed: boolean;
  averages: RegressionAverages;
  region_count: number;
  fail_case_count: number;
}
