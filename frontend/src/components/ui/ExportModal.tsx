import { useState } from 'react';
import { Modal, ModalButton } from './Modal';
import { FileJson, FileText } from 'lucide-react';
import { cn } from '@/utils';

export type ExportFormat = 'json' | 'markdown';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

function FormatOption({
  format,
  selected,
  onClick,
}: {
  format: ExportFormat;
  selected: boolean;
  onClick: () => void;
}) {
  const config = {
    json: {
      icon: <FileJson className="w-6 h-6" />,
      title: 'JSON 格式',
      description: '包含完整节点和边数据，适合程序处理',
    },
    markdown: {
      icon: <FileText className="w-6 h-6" />,
      title: 'Markdown 格式',
      description: '层级大纲格式，适合人工阅读',
    },
  };

  const { icon, title, description } = config[format];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-[var(--radius-md)] border text-left transition-all',
        selected
          ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
          : 'border-[var(--color-gray-200)] hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]'
      )}
    >
      <div
        className={cn(
          'p-2 rounded-[var(--radius-sm)]',
          selected
            ? 'bg-[var(--color-primary-500)] text-white'
            : 'bg-[var(--color-gray-100)] text-[var(--text-tertiary)]'
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[var(--text-primary)]">{title}</div>
        <div className="text-[var(--font-size-sm)] text-[var(--text-tertiary)]">{description}</div>
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-[var(--color-primary-500)] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');

  const handleExport = () => {
    onExport(selectedFormat);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="导出结果"
      footer={
        <>
          <ModalButton onClick={onClose}>取消</ModalButton>
          <ModalButton variant="primary" onClick={handleExport}>
            确认导出
          </ModalButton>
        </>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          选择导出格式，将包含所有节点和边数据。
        </p>
        <FormatOption
          format="json"
          selected={selectedFormat === 'json'}
          onClick={() => setSelectedFormat('json')}
        />
        <FormatOption
          format="markdown"
          selected={selectedFormat === 'markdown'}
          onClick={() => setSelectedFormat('markdown')}
        />
      </div>
    </Modal>
  );
}
