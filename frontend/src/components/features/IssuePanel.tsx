import { memo, useMemo, useCallback } from 'react';
import { useIssues, useIssueTypeFilter, useSearchText, useSelectedNodeId, useAnnotationActions } from '@/stores';
import { IssueCard, CountBadge } from '@/components/ui';
import { getIssueLabel } from '@/utils';
import type { IssueType } from '@/types';

export const IssuePanel = memo(function IssuePanel() {
  // Use fine-grained selector to avoid re-renders when other data changes
  const issues = useIssues();
  const issueTypeFilter = useIssueTypeFilter();
  const searchText = useSearchText();
  const selectedNodeId = useSelectedNodeId();
  const { setIssueTypeFilter, selectNode } = useAnnotationActions();

  // Get unique issue types
  const issueTypes = useMemo(() => {
    const types = new Set<IssueType>();
    issues.forEach(issue => types.add(issue.issue_type));
    return Array.from(types).sort();
  }, [issues]);

  // Filter issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (issueTypeFilter && issue.issue_type !== issueTypeFilter) return false;
      if (searchText && !issue.text.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [issues, issueTypeFilter, searchText]);

  const handleIssueClick = useCallback((nodeId: string) => {
    selectNode(nodeId === selectedNodeId ? null : nodeId);
  }, [selectNode, selectedNodeId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[var(--font-size-sm)] text-[var(--text-tertiary)] uppercase tracking-wider">
          问题清单
        </h2>
        <CountBadge count={filteredIssues.length} />
      </div>

      {/* Issue type filter */}
      <select
        className="w-full h-8 px-3 mb-3 bg-white border border-[var(--color-gray-300)] rounded-[var(--radius-md)] text-[var(--font-size-sm)] focus:outline-none focus:border-[var(--color-primary-500)]"
        value={issueTypeFilter}
        onChange={e => setIssueTypeFilter(e.target.value as IssueType | '')}
      >
        <option value="">全部问题类型</option>
        {issueTypes.map(type => (
          <option key={type} value={type}>
            {getIssueLabel(type)}
          </option>
        ))}
      </select>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-[var(--font-size-sm)]">
            {searchText ? '未找到匹配问题' : '无待处理问题'}
          </div>
        ) : (
          filteredIssues.map((issue, index) => (
            <IssueCard
              key={`${issue.issue_type}-${issue.node_id}-${index}`}
              issueType={getIssueLabel(issue.issue_type)}
              text={issue.text}
              reason={issue.reason}
              nodeId={issue.node_id}
              selected={selectedNodeId === issue.node_id}
              onClick={() => handleIssueClick(issue.node_id)}
            />
          ))
        )}
      </div>
    </div>
  );
});
