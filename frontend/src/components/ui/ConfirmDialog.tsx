import { Modal, ModalButton } from '@/components/ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <ModalButton variant="secondary" onClick={onClose}>
            {cancelText}
          </ModalButton>
          <ModalButton variant="primary" onClick={handleConfirm}>
            {confirmText}
          </ModalButton>
        </>
      }
    >
      <div className="text-center py-2">
        <p className="text-[var(--text-secondary)] text-sm">{message}</p>
      </div>
    </Modal>
  );
}
