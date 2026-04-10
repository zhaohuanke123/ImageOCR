/**
 * Keyboard shortcuts management hook
 * Provides centralized keyboard shortcut handling with:
 * - Input element detection (disables shortcuts when typing)
 * - Modifier key support (Ctrl/Cmd, Shift, Alt)
 * - Help panel integration
 */

import { useEffect, useCallback, useRef, useState } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: 'tools' | 'edit' | 'view' | 'navigation';
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Check if the event target is an input element where shortcuts should be disabled
 */
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;

  const tagName = element.tagName.toLowerCase();
  const isEditable = element.isContentEditable;

  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    isEditable ||
    element.closest('[contenteditable="true"]') !== null
  );
}

/**
 * Check if a modal is currently open
 */
function isModalOpen(): boolean {
  return document.querySelector('[role="dialog"][data-state="open"]') !== null;
}

/**
 * Normalize key for comparison (handle both lowercase and uppercase)
 */
function normalizeKey(key: string): string {
  // Handle special keys
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': 'ArrowUp',
    'ArrowDown': 'ArrowDown',
    'ArrowLeft': 'ArrowLeft',
    'ArrowRight': 'ArrowRight',
    'Escape': 'Escape',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
  };

  return keyMap[key] || key.toLowerCase();
}

/**
 * Check if a keyboard event matches a shortcut definition
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const eventKey = normalizeKey(event.key);
  const shortcutKey = normalizeKey(shortcut.key);

  // Check key match
  if (eventKey !== shortcutKey) return false;

  // Check modifiers - use loose comparison for Ctrl/Cmd (cross-platform)
  const eventHasCtrl = event.ctrlKey || event.metaKey;
  const shortcutHasCtrl = !!(shortcut.ctrlKey || shortcut.metaKey);

  if (eventHasCtrl !== shortcutHasCtrl) return false;
  if (event.shiftKey !== !!shortcut.shiftKey) return false;
  if (event.altKey !== !!shortcut.altKey) return false;

  return true;
}

/**
 * Hook for managing keyboard shortcuts
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  // Keep refs in sync
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabledRef.current) return;

      // Skip if focus is on an input element
      if (isInputElement(event.target)) return;

      // Skip if modal is open (except for Escape)
      if (isModalOpen() && event.key !== 'Escape') return;

      // Find matching shortcut
      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Return shortcuts for help panel
  return { shortcuts };
}

/**
 * Hook for Space + drag temporary pan mode
 * Returns whether space is currently held down
 */
export function useSpaceKeyHeld(): boolean {
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isInputElement(event.target)) {
        event.preventDefault();
        setSpaceHeld(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpaceHeld(false);
      }
    };

    // Also handle blur to reset state when window loses focus
    const handleBlur = () => {
      setSpaceHeld(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return spaceHeld;
}

/**
 * Get shortcut display string
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  if (shortcut.altKey) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }

  // Format key
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  if (key === 'ArrowUp') key = '↑';
  if (key === 'ArrowDown') key = '↓';
  if (key === 'ArrowLeft') key = '←';
  if (key === 'ArrowRight') key = '→';

  parts.push(key.length === 1 ? key.toUpperCase() : key);

  return parts.join('+');
}

/**
 * Default shortcuts for the OCR reviewer
 */
export function createDefaultShortcuts(actions: {
  setToolMode: (mode: string) => void;
  clearEdgeEditMode: () => void;
  fitToView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleHelp: () => void;
  selectAll: () => void;
  deselectAll: () => void;
  deleteSelected: () => void;
  save: () => void;
}): KeyboardShortcut[] {
  return [
    // Tools
    {
      key: 'v',
      action: () => { actions.setToolMode('select'); actions.clearEdgeEditMode(); },
      description: '选择工具',
      category: 'tools',
    },
    {
      key: 'h',
      action: () => { actions.setToolMode('pan'); actions.clearEdgeEditMode(); },
      description: '平移工具',
      category: 'tools',
    },
    {
      key: 'b',
      action: () => { actions.setToolMode('box-select'); actions.clearEdgeEditMode(); },
      description: '框选 OCR',
      category: 'tools',
    },
    {
      key: 'e',
      action: () => actions.setToolMode('edge-edit'),
      description: '边编辑模式',
      category: 'tools',
    },
    // View
    {
      key: 'f',
      action: actions.fitToView,
      description: '适应视图',
      category: 'view',
    },
    {
      key: '+',
      action: actions.zoomIn,
      description: '放大',
      category: 'view',
    },
    {
      key: '-',
      action: actions.zoomOut,
      description: '缩小',
      category: 'view',
    },
    {
      key: '=',
      action: actions.zoomIn,
      description: '放大',
      category: 'view',
    },
    // Edit
    {
      key: 'a',
      ctrlKey: true,
      action: actions.selectAll,
      description: '全选节点',
      category: 'edit',
    },
    {
      key: 'd',
      ctrlKey: true,
      action: actions.deselectAll,
      description: '取消全选',
      category: 'edit',
    },
    {
      key: 's',
      ctrlKey: true,
      action: actions.save,
      description: '保存',
      category: 'edit',
    },
    {
      key: 'Delete',
      action: actions.deleteSelected,
      description: '删除选中',
      category: 'edit',
    },
    {
      key: 'Backspace',
      action: actions.deleteSelected,
      description: '删除选中',
      category: 'edit',
    },
    // Help
    {
      key: '?',
      action: actions.toggleHelp,
      description: '显示快捷键帮助',
      category: 'navigation',
    },
    {
      key: '/',
      action: actions.toggleHelp,
      description: '显示快捷键帮助',
      category: 'navigation',
    },
  ];
}
