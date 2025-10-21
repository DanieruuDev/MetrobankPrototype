import React from "react";
import { Upload, FileText } from "lucide-react";
import { toast } from "react-toastify";

interface UploadInvoiceModalProps {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  fileSize: number;
  setFileSize: (size: number) => void;
  setIsUploadOpen: (val: boolean) => void;
  handleShowUploadConfirmation: () => void;
}

const UploadInvoiceModal: React.FC<UploadInvoiceModalProps> = ({
  selectedFile,
  setSelectedFile,
  fileSize,
  setFileSize,
  setIsUploadOpen,
  handleShowUploadConfirmation,
}) => {
  // ✅ Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isZip = file.name.toLowerCase().endsWith(".zip");
    const isPdf = file.type === "application/pdf";

    if (!isZip && !isPdf) {
      toast.error("Only PDF or ZIP files are allowed.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size exceeds 100MB limit.");
      return;
    }

    setSelectedFile(file);
    setFileSize(file.size);
  };

  // ✅ Remove file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileSize(0);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative animate-scaleIn">
        {/* ❌ Close Button */}
        <button
          onClick={() => setIsUploadOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg"
        >
          ✕
        </button>

        {/* 🧾 Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Upload Tuition Invoice
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload a single <b>PDF</b> or <b>ZIP</b> file (max 100MB)
          </p>
        </div>

        {/* 📤 File Upload Box */}
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-4"
        >
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Only PDF or ZIP files are allowed
          </p>
        </label>

        <input
          id="file-upload"
          type="file"
          accept=".pdf,.zip"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* 📂 Selected File Preview */}
        {selectedFile && (
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between mb-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-800 truncate max-w-[220px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(fileSize / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-xs text-red-600 hover:text-red-800 transition"
            >
              Remove
            </button>
          </div>
        )}

        {/* ✅ Action Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => setIsUploadOpen(false)}
            className="px-5 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleShowUploadConfirmation}
            disabled={!selectedFile}
            className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-sm"
          >
            Upload & Extract
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadInvoiceModal;
