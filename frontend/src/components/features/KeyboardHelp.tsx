/**
 * Keyboard shortcuts help panel
 * Displays all available shortcuts organized by category
 */

import { memo, useMemo } from 'react';
import { Modal } from '@/components/ui';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { getShortcutDisplay } from '@/hooks/useKeyboardShortcuts';
import { Keyboard } from 'lucide-react';

interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

interface ShortcutGroupProps {
  title: string;
  shortcuts: KeyboardShortcut[];
}

const ShortcutGroup = memo(function ShortcutGroup({ title, shortcuts }: ShortcutGroupProps) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <div
            key={`${shortcut.key}-${shortcut.ctrlKey}-${shortcut.shiftKey}-${index}`}
            className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-gray-50)] transition-colors"
          >
            <span className="text-sm text-[var(--text-secondary)]">
              {shortcut.description}
            </span>
            <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--color-gray-100)] text-[var(--text-primary)] rounded border border-[var(--color-gray-200)] shadow-sm">
              {getShortcutDisplay(shortcut)}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
});

const categoryTitles: Record<string, string> = {
  tools: '工具',
  edit: '编辑',
  view: '视图',
  navigation: '导航',
};

const categoryOrder = ['tools', 'edit', 'view', 'navigation'];

export const KeyboardHelp = memo(function KeyboardHelp({ isOpen, onClose, shortcuts }: KeyboardHelpProps) {
  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};

    for (const shortcut of shortcuts) {
      const category = shortcut.category || 'tools';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(shortcut);
    }

    // Sort by category order
    return categoryOrder
      .filter(cat => groups[cat])
      .map(cat => ({
        title: categoryTitles[cat] || cat,
        shortcuts: groups[cat],
      }));
  }, [shortcuts]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="快捷键帮助">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--color-gray-200)]">
        <Keyboard className="w-5 h-5 text-[var(--color-primary-500)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          使用快捷键可以提高操作效率
        </p>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {groupedShortcuts.map(group => (
          <ShortcutGroup
            key={group.title}
            title={group.title}
            shortcuts={group.shortcuts}
          />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-gray-200)]">
        <p className="text-xs text-[var(--text-tertiary)]">
          提示：按 <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--color-gray-100)] rounded">?</kbd> 或 <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--color-gray-100)] rounded">/</kbd> 可随时打开此帮助面板
        </p>
      </div>
    </Modal>
  );
});
