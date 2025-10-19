import React from "react";
import { Upload, FileText } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedFile: File | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  fileSize: number;
  setFileSize: React.Dispatch<React.SetStateAction<number>>;
  isProcessing: boolean;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedFile,
  setSelectedFile,
  fileSize,
  setFileSize,
  isProcessing,
}) => {
  if (!isOpen || isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Upload Tuition Invoice
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload a single <b>PDF</b> or <b>ZIP</b> file (Max 100MB)
          </p>
        </div>

        {/* Upload Section */}
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-4"
        >
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 mt-1">Only PDF or ZIP files</p>
        </label>

        <input
          id="file-upload"
          type="file"
          accept=".pdf,.zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const isZip = file.name.toLowerCase().endsWith(".zip");
              const isPdf = file.type === "application/pdf";
              if (!isZip && !isPdf) {
                alert("Only PDF or ZIP files are allowed.");
                return;
              }
              if (file.size > 100 * 1024 * 1024) {
                alert("File size exceeds 100MB limit.");
                return;
              }
              setFileSize(file.size);
              setSelectedFile(file);
            } else {
              setSelectedFile(null);
              setFileSize(0);
            }
          }}
        />

        {selectedFile && (
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setFileSize(0);
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedFile || isProcessing}
            className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Upload & Extract"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
