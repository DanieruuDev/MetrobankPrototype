interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ConfirmDialog = ({
  message,
  onConfirm,
  onCancel,
  isOpen,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 max-w-sm w-full shadow-lg">
        <p className="mb-4 text-gray-800">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
