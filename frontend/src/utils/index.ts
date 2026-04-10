import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BBox, IssueType, MindmapNode, MindmapEdge, ChangeLog, GraphExportData } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function getBBoxCenter(bbox: BBox): { x: number; y: number } {
  const xs = [bbox[0][0], bbox[1][0], bbox[2][0], bbox[3][0]];
  const ys = [bbox[0][1], bbox[1][1], bbox[2][1], bbox[3][1]];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}

export function getBBoxPath(bbox: BBox): string {
  const points = [bbox[0], bbox[1], bbox[2], bbox[3]];
  return points
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${point[0]},${point[1]}`)
    .join(' ') + ' Z';
}

/**
 * Convert BBox (polygon format) to array format [left, top, right, bottom]
 */
export function bboxToArray(bbox: BBox): [number, number, number, number] {
  const xs = [bbox[0][0], bbox[1][0], bbox[2][0], bbox[3][0]];
  const ys = [bbox[0][1], bbox[1][1], bbox[2][1], bbox[3][1]];
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/**
 * Convert array format [left, top, right, bottom] to BBox (polygon format)
 */
export function arrayToBBox(arr: [number, number, number, number]): BBox {
  const [left, top, right, bottom] = arr;
  return [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
  ];
}

/**
 * Merge multiple bboxes into one (union)
 */
export function mergeBBoxes(bboxes: BBox[]): BBox {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  bboxes.forEach(bbox => {
    const xs = [bbox[0][0], bbox[1][0], bbox[2][0], bbox[3][0]];
    const ys = [bbox[0][1], bbox[1][1], bbox[2][1], bbox[3][1]];
    minX = Math.min(minX, ...xs);
    minY = Math.min(minY, ...ys);
    maxX = Math.max(maxX, ...xs);
    maxY = Math.max(maxY, ...ys);
  });

  // Return a rectangular bbox
  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ] as BBox;
}

/**
 * Estimate bbox for a single line when splitting a multi-line node
 */
export function estimateLineBBox(originalBBox: BBox, lineIndex: number, totalLines: number): BBox {
  const xs = [originalBBox[0][0], originalBBox[1][0], originalBBox[2][0], originalBBox[3][0]];
  const ys = [originalBBox[0][1], originalBBox[1][1], originalBBox[2][1], originalBBox[3][1]];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const totalHeight = maxY - minY;
  const lineHeight = totalHeight / totalLines;

  const lineMinY = minY + lineIndex * lineHeight;
  const lineMaxY = lineMinY + lineHeight;

  return [
    [minX, lineMinY],
    [maxX, lineMinY],
    [maxX, lineMaxY],
    [minX, lineMaxY],
  ] as BBox;
}

export function getIssueColor(issueType: IssueType): string {
  switch (issueType) {
    case 'orphan_root':
      return 'var(--color-error-500)';
    case 'low_confidence_node':
    case 'weak_edge':
      return 'var(--color-warning-500)';
    case 'oversized_node':
    case 'oversized_leaf':
      return 'var(--color-issue-oversized)';
    default:
      return 'var(--color-gray-500)';
  }
}

export function getIssueLabel(issueType: IssueType): string {
  const labels: Record<IssueType, string> = {
    orphan_root: '孤立节点',
    low_confidence_node: '低置信度',
    oversized_node: '超大节点',
    oversized_leaf: '超大叶节点',
    text_outlier: '文本异常',
    dense_overlap_region: '密集区域',
    weak_edge: '弱连接',
  };
  return labels[issueType] || issueType;
}

/**
 * Export nodes and edges as JSON
 */
export function exportAsJson(nodes: MindmapNode[], edges: MindmapEdge[]): void {
  const data = {
    nodes,
    edges,
    exported_at: new Date().toISOString(),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'graph.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Build a tree structure from nodes for Markdown export
 */
interface MarkdownTreeNode {
  nodeId: string;
  text: string;
  children: MarkdownTreeNode[];
}

function buildMarkdownTree(
  nodes: MindmapNode[],
  edges: MindmapEdge[]
): MarkdownTreeNode[] {
  // Create children map
  const childrenMap = new Map<string, string[]>();
  const nodeMap = new Map<string, MindmapNode>();

  nodes.forEach(node => {
    nodeMap.set(node.id, node);
    childrenMap.set(node.id, []);
  });

  edges.forEach(edge => {
    const children = childrenMap.get(edge.parent_id);
    if (children) {
      children.push(edge.child_id);
    }
  });

  // Find root nodes (no parent_id or parent_id is null)
  const rootIds = nodes
    .filter(node => !node.parent_id)
    .map(node => node.id);

  // Recursive function to build tree
  function buildNode(nodeId: string): MarkdownTreeNode {
    const node = nodeMap.get(nodeId);
    const childIds = childrenMap.get(nodeId) || [];

    return {
      nodeId,
      text: node?.text || '',
      children: childIds.map(childId => buildNode(childId)),
    };
  }

  return rootIds.map(rootId => buildNode(rootId));
}

/**
 * Convert tree to Markdown string
 */
function treeToMarkdown(
  nodes: MarkdownTreeNode[],
  level: number = 0
): string {
  const indent = '  '.repeat(level);
  const bullet = '- ';

  let result = '';
  nodes.forEach(node => {
    result += `${indent}${bullet}${node.text}\n`;
    if (node.children.length > 0) {
      result += treeToMarkdown(node.children, level + 1);
    }
  });

  return result;
}

/**
 * Export nodes and edges as Markdown outline
 */
export function exportAsMarkdown(nodes: MindmapNode[], edges: MindmapEdge[]): void {
  const tree = buildMarkdownTree(nodes, edges);
  const markdown = treeToMarkdown(tree);

  const content = `# Mindmap Outline

Generated: ${new Date().toLocaleString('zh-CN')}

Total nodes: ${nodes.length}
Total edges: ${edges.length}

---

${markdown}
`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindmap_outline.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export modified graph as JSON (compatible with original format)
 */
export function exportGraphJson(
  nodes: MindmapNode[],
  edges: MindmapEdge[],
  imageWidth?: number,
  imageHeight?: number
): void {
  const data: GraphExportData = {
    nodes,
    edges,
    exported_at: new Date().toISOString(),
    image_width: imageWidth,
    image_height: imageHeight,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'graph.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export change log as JSON
 */
export function exportChangeLog(changeLog: ChangeLog): void {
  const json = JSON.stringify(changeLog, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `change_log_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Save file using File System Access API (if supported) or fallback to download
 */
export async function saveToFile(
  content: string,
  suggestedName: string,
  fileType: string = 'application/json'
): Promise<boolean> {
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as Window & { showSaveFilePicker: (options: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'JSON File',
          accept: { [fileType]: ['.json'] },
        }],
      });

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } catch (err) {
      // User cancelled or error - fall back to download
      if ((err as Error).name !== 'AbortError') {
        console.error('File System Access API failed:', err);
      }
      return false;
    }
  }

  // Fallback to download
  const blob = new Blob([content], { type: fileType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
