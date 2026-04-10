import { cn } from '@/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  leftBorder?: 'default' | 'warning' | 'error' | 'info';
}

export function Card({ children, className, onClick, selected, leftBorder }: CardProps) {
  const leftBorderColors = {
    default: 'var(--color-gray-300)',
    warning: 'var(--color-warning-500)',
    error: 'var(--color-error-500)',
    info: 'var(--color-info-500)',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-[var(--radius-lg)] border border-[var(--color-gray-200)]',
        'transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]',
        onClick && 'cursor-pointer hover:bg-[var(--color-gray-50)] hover:shadow-[var(--shadow-sm)]',
        selected && 'bg-[var(--color-primary-50)] border-[var(--color-primary-300)]',
        className
      )}
      onClick={onClick}
      style={leftBorder ? { borderLeftWidth: '3px', borderLeftColor: leftBorderColors[leftBorder] } : undefined}
    >
      {children}
    </div>
  );
}

interface IssueCardProps {
  issueType: string;
  text: string;
  reason: string;
  nodeId: string;
  onClick?: () => void;
  selected?: boolean;
}

export function IssueCard({ issueType, text, reason, nodeId, onClick, selected }: IssueCardProps) {
  const getBorderColor = (type: string) => {
    if (type.includes('orphan')) return 'error';
    if (type.includes('low_confidence') || type.includes('weak')) return 'warning';
    return 'default';
  };

  return (
    <Card
      className="p-3 mb-2"
      onClick={onClick}
      selected={selected}
      leftBorder={getBorderColor(issueType)}
    >
      <div className="flex items-start gap-2">
        <span className="text-[var(--color-warning-500)]">⚠️</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[var(--font-size-sm)] text-[var(--text-primary)]">
            {issueType}
          </div>
          <div className="text-[var(--font-size-xs)] text-[var(--text-secondary)] truncate">
            {text}
          </div>
          <div className="text-[var(--font-size-xs)] text-[var(--text-tertiary)]">
            {reason}
          </div>
        </div>
        <span className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] font-mono">
          {nodeId.slice(0, 8)}
        </span>
      </div>
    </Card>
  );
}

interface NodeCardProps {
  text: string;
  confidence: number;
  hasChildren?: boolean;
  level?: number;
  onClick?: () => void;
  selected?: boolean;
  onToggle?: () => void;
  expanded?: boolean;
}

export function NodeCard({
  text,
  confidence,
  hasChildren,
  level = 0,
  onClick,
  selected,
  onToggle,
  expanded,
}: NodeCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 rounded-[var(--radius-md)]',
        'cursor-pointer transition-all duration-[var(--duration-fast)]',
        'hover:bg-[var(--color-gray-100)]',
        selected && 'bg-[var(--color-primary-50)] border border-[var(--color-primary-300)]'
      )}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      onClick={onClick}
    >
      {hasChildren && (
        <button
          className="w-4 h-4 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
        >
          <svg
            className={cn('w-3 h-3 transition-transform', expanded && 'rotate-90')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
      {!hasChildren && <span className="w-4" />}

      <span className={cn(
        'flex-1 truncate text-[var(--font-size-sm)]',
        level === 0 && 'font-semibold'
      )}>
        {text}
      </span>

      <span className="text-[var(--font-size-xs)] text-[var(--text-tertiary)] font-mono">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
}
