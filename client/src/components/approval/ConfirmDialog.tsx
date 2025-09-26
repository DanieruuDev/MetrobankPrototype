interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
  confirmLabel?: "Archive" | "Delete";
  loading: boolean;
}

const ConfirmDialog = ({
  message,
  onConfirm,
  onCancel,
  isOpen,
  confirmLabel = "Archive",
  loading = false,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const confirmButtonStyles =
    confirmLabel === "Delete"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-yellow-600 hover:bg-yellow-700";

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-md p-6 max-w-sm w-full shadow-lg">
        <p className="mb-4 text-gray-800">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${confirmButtonStyles} disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading && (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            )}
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
