import { describe, it, expect } from 'vitest';
import {
  formatConfidence,
  truncateText,
  getBBoxCenter,
  getBBoxPath,
  mergeBBoxes,
  estimateLineBBox,
  getIssueColor,
  getIssueLabel,
} from '../utils';
import type { BBox, IssueType } from '@/types';

describe('formatConfidence', () => {
  it('should format confidence as percentage', () => {
    expect(formatConfidence(0.95)).toBe('95%');
    expect(formatConfidence(0.5)).toBe('50%');
    expect(formatConfidence(1)).toBe('100%');
    expect(formatConfidence(0)).toBe('0%');
  });

  it('should round to nearest percent', () => {
    expect(formatConfidence(0.954)).toBe('95%');
    expect(formatConfidence(0.955)).toBe('96%');
  });
});

describe('truncateText', () => {
  it('should not truncate short text', () => {
    expect(truncateText('short')).toBe('short');
  });

  it('should truncate long text with ellipsis', () => {
    const longText = 'This is a very long text that needs to be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very lo...');
  });

  it('should use default max length of 50', () => {
    const text = 'a'.repeat(60);
    expect(truncateText(text)).toBe('a'.repeat(47) + '...');
  });

  it('should handle exact length text', () => {
    const text = 'a'.repeat(50);
    expect(truncateText(text)).toBe(text);
  });
});

describe('getBBoxCenter', () => {
  it('should return center of bounding box', () => {
    const bbox: BBox = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];
    expect(getBBoxCenter(bbox)).toEqual({ x: 50, y: 50 });
  });

  it('should handle irregular quadrilateral', () => {
    const bbox: BBox = [
      [10, 20],
      [50, 15],
      [55, 80],
      [5, 75],
    ];
    const center = getBBoxCenter(bbox);
    expect(center.x).toBeCloseTo(30);
    expect(center.y).toBeCloseTo(47.5);
  });
});

describe('getBBoxPath', () => {
  it('should generate SVG path string', () => {
    const bbox: BBox = [
      [0, 0],
      [100, 0],
      [100, 50],
      [0, 50],
    ];
    expect(getBBoxPath(bbox)).toBe('M0,0 L100,0 L100,50 L0,50 Z');
  });
});

describe('mergeBBoxes', () => {
  it('should merge multiple bboxes into union', () => {
    const bboxes: BBox[] = [
      [
        [0, 0],
        [50, 0],
        [50, 50],
        [0, 50],
      ],
      [
        [100, 100],
        [150, 100],
        [150, 150],
        [100, 150],
      ],
    ];

    const merged = mergeBBoxes(bboxes);
    expect(merged[0]).toEqual([0, 0]); // top-left
    expect(merged[1]).toEqual([150, 0]); // top-right
    expect(merged[2]).toEqual([150, 150]); // bottom-right
    expect(merged[3]).toEqual([0, 150]); // bottom-left
  });

  it('should handle overlapping bboxes', () => {
    const bboxes: BBox[] = [
      [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ],
      [
        [50, 50],
        [150, 50],
        [150, 150],
        [50, 150],
      ],
    ];

    const merged = mergeBBoxes(bboxes);
    expect(merged[0]).toEqual([0, 0]);
    expect(merged[2]).toEqual([150, 150]);
  });
});

describe('estimateLineBBox', () => {
  it('should split bbox vertically by line count', () => {
    const bbox: BBox = [
      [0, 0],
      [100, 0],
      [100, 100],
      [0, 100],
    ];

    const line0 = estimateLineBBox(bbox, 0, 4);
    expect(line0[0][1]).toBe(0);
    expect(line0[2][1]).toBe(25);

    const line3 = estimateLineBBox(bbox, 3, 4);
    expect(line3[0][1]).toBe(75);
    expect(line3[2][1]).toBe(100);
  });
});

describe('getIssueColor', () => {
  it('should return correct colors for issue types', () => {
    expect(getIssueColor('orphan_root')).toBe('var(--color-error-500)');
    expect(getIssueColor('low_confidence_node')).toBe('var(--color-warning-500)');
    expect(getIssueColor('weak_edge')).toBe('var(--color-warning-500)');
    expect(getIssueColor('oversized_node')).toBe('var(--color-issue-oversized)');
    expect(getIssueColor('oversized_leaf')).toBe('var(--color-issue-oversized)');
  });
});

describe('getIssueLabel', () => {
  it('should return Chinese labels for issue types', () => {
    expect(getIssueLabel('orphan_root')).toBe('孤立节点');
    expect(getIssueLabel('low_confidence_node')).toBe('低置信度');
    expect(getIssueLabel('oversized_node')).toBe('超大节点');
    expect(getIssueLabel('weak_edge')).toBe('弱连接');
  });

  it('should return original type for unknown issues', () => {
    const unknownType = 'unknown_issue' as IssueType;
    expect(getIssueLabel(unknownType)).toBe('unknown_issue');
  });
});
