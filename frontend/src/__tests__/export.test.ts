import { describe, it, expect, vi } from 'vitest';
import {
  exportAsJson,
  exportAsMarkdown,
  exportGraphJson,
  exportChangeLog,
} from '../utils';
import type { MindmapNode, MindmapEdge, ChangeLog } from '@/types';

// Mock DOM methods for file download
const mockAnchor = {
  href: '',
  download: '',
  click: vi.fn(),
};

vi.stubGlobal('document', {
  ...document,
  createElement: vi.fn(() => mockAnchor),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
});

vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:test'),
  revokeObjectURL: vi.fn(),
});

describe('Export Functions', () => {
  const mockNodes: MindmapNode[] = [
    {
      id: 'root',
      text: 'Root',
      bbox: [
        [0, 0],
        [100, 50],
        [100, 100],
        [0, 100],
      ],
      lines: ['Root'],
      confidence: 0.95,
      parent_id: null,
      children: ['child1', 'child2'],
    },
    {
      id: 'child1',
      text: 'Child 1',
      bbox: [
        [100, 0],
        [200, 50],
        [200, 100],
        [100, 100],
      ],
      lines: ['Child 1'],
      confidence: 0.9,
      parent_id: 'root',
      children: ['grandchild'],
    },
    {
      id: 'child2',
      text: 'Child 2',
      bbox: [
        [100, 100],
        [200, 150],
        [200, 200],
        [100, 200],
      ],
      lines: ['Child 2'],
      confidence: 0.92,
      parent_id: 'root',
      children: [],
    },
    {
      id: 'grandchild',
      text: 'Grandchild',
      bbox: [
        [200, 0],
        [300, 50],
        [300, 100],
        [200, 100],
      ],
      lines: ['Grandchild'],
      confidence: 0.88,
      parent_id: 'child1',
      children: [],
    },
  ];

  const mockEdges: MindmapEdge[] = [
    { parent_id: 'root', child_id: 'child1', score: 0.9, reason: 'spatial' },
    { parent_id: 'root', child_id: 'child2', score: 0.85, reason: 'spatial' },
    { parent_id: 'child1', child_id: 'grandchild', score: 0.95, reason: 'spatial' },
  ];

  describe('exportAsJson', () => {
    it('should create downloadable JSON file', () => {
      exportAsJson(mockNodes, mockEdges);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('graph.json');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('exportGraphJson', () => {
    it('should include image dimensions when provided', () => {
      exportGraphJson(mockNodes, mockEdges, 1000, 800);

      expect(mockAnchor.download).toBe('graph.json');
    });
  });

  describe('exportAsMarkdown', () => {
    it('should create downloadable Markdown file', () => {
      exportAsMarkdown(mockNodes, mockEdges);

      expect(mockAnchor.download).toBe('mindmap_outline.md');
      expect(mockAnchor.click).toHaveBeenCalled();
    });
  });

  describe('exportChangeLog', () => {
    it('should export change log with timestamp in filename', () => {
      const changeLog: ChangeLog = {
        timestamp: new Date().toISOString(),
        operations: [
          {
            type: 'update_node',
            nodeId: 'root',
            before: { text: 'Old' },
            after: { text: 'New' },
          },
        ],
      };

      exportChangeLog(changeLog);

      expect(mockAnchor.download).toContain('change_log_');
      expect(mockAnchor.download).toContain('.json');
    });
  });
});

describe('Export Integration', () => {
  it('should handle empty data', () => {
    // Empty nodes/edges should not throw
    expect(() => exportAsJson([], [])).not.toThrow();
    expect(() => exportAsMarkdown([], [])).not.toThrow();
  });

  it('should handle nodes without edges (all roots)', () => {
    const orphanNodes: MindmapNode[] = [
      {
        id: 'orphan1',
        text: 'Orphan 1',
        bbox: [
          [0, 0],
          [100, 50],
          [100, 100],
          [0, 100],
        ],
        lines: ['Orphan 1'],
        confidence: 0.9,
        parent_id: null,
        children: [],
      },
      {
        id: 'orphan2',
        text: 'Orphan 2',
        bbox: [
          [0, 100],
          [100, 150],
          [100, 200],
          [0, 200],
        ],
        lines: ['Orphan 2'],
        confidence: 0.9,
        parent_id: null,
        children: [],
      },
    ];

    // Should not throw
    expect(() => exportAsMarkdown(orphanNodes, [])).not.toThrow();
  });

  it('should handle multi-line nodes in export', () => {
    const multiLineNodes: MindmapNode[] = [
      {
        id: 'multi',
        text: 'Line 1\nLine 2\nLine 3',
        bbox: [
          [0, 0],
          [100, 50],
          [100, 150],
          [0, 150],
        ],
        lines: ['Line 1', 'Line 2', 'Line 3'],
        confidence: 0.9,
        parent_id: null,
        children: [],
      },
    ];

    // Should not throw
    expect(() => exportAsMarkdown(multiLineNodes, [])).not.toThrow();
  });
});
