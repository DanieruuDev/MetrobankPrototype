import React from "react";
import { AlertCircle } from "lucide-react";

interface UploadConfirmationModalProps {
  selectedFile: File | null;
  fileSize: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const UploadConfirmationModal: React.FC<UploadConfirmationModalProps> = ({
  selectedFile,
  fileSize,
  onCancel,
  onConfirm,
}) => {
  if (!selectedFile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Upload & Extract
          </h3>
        </div>

        <div className="mb-6 space-y-2">
          <p className="text-gray-600 text-sm">
            You are about to upload and extract the following file:
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">File:</span>
              <span className="text-gray-900 font-semibold truncate ml-2">
                {selectedFile.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Size:</span>
              <span className="text-gray-900 font-semibold">
                {(fileSize / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Type:</span>
              <span className="text-gray-900 font-semibold">
                {selectedFile.name.toLowerCase().endsWith(".zip")
                  ? "ZIP Archive"
                  : "PDF Document"}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            The system will extract student information and match them with
            existing records. Proceed?
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-lg"
          >
            Yes, Upload & Extract
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadConfirmationModal;
