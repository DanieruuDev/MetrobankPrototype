import React from "react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-[rgba(0,0,0,0.5)]">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <p className="text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
