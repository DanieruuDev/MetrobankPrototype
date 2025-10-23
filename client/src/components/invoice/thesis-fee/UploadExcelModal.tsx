import React, { useState, useEffect } from "react";
import { Upload, X, FileCheck, AlertTriangle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

interface UploadExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: Record<string, unknown>[]) => void;
}

const UploadExcelModal: React.FC<UploadExcelModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>("");

  // Reset all modal states
  const resetModalState = () => {
    setFile(null);
    setIsDragOver(false);
    setError(null);
    setIsProcessing(false);
    setProgress(0);
    setMessage("");
  };

  // Reset all states when modal opens
  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to ensure modal is fully closed before resetting
      const timer = setTimeout(() => {
        resetModalState();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 🔹 Validate file
  const validateFile = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      // 10MB limit
      setError("File must be smaller than 10MB.");
      return false;
    }

    if (!/\.(xlsx|xls)$/i.test(selectedFile.name)) {
      setError(
        "Invalid file type. Please upload an Excel file (.xlsx or .xls)."
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (validateFile(selected)) {
      setFile(selected);
    }
  };

  // 🔹 Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
    }
  };

  // 📤 Process Excel file with loading simulation
  const handleExtract = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setMessage("Reading Excel file...");

    // Simulate reading progress
    await new Promise((resolve) => setTimeout(resolve, 500));
    setProgress(25);
    setMessage("Parsing Excel data...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) return;

      try {
        setProgress(50);
        setMessage("Processing student records...");

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsed = XLSX.utils.sheet_to_json(sheet);

        // Simulate processing time based on number of records
        const processingTime = Math.min(parsed.length * 50, 2000); // Max 2 seconds
        const steps = Math.ceil(processingTime / 100);

        for (let i = 0; i < steps; i++) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const currentProgress = 50 + (i / steps) * 40;
          setProgress(Math.round(currentProgress));
          setMessage(
            `Processing ${Math.round((i / steps) * parsed.length)} of ${
              parsed.length
            } records...`
          );
        }

        setProgress(100);
        setMessage("Finalizing data...");

        // Small delay for final processing
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Upload the parsed data directly and close modal
        onUpload(parsed as Record<string, unknown>[]);
        toast.success(
          `✅ Excel file processed successfully (${parsed.length} records).`
        );
        onClose();
      } catch (error) {
        console.error("❌ Error reading Excel:", error);
        toast.error("Invalid Excel file. Please check format.");
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 🌀 Processing UI - Same style as upload grades modal
  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[10001] animate-fadeIn p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm animate-scaleIn">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 animate-spin" />
              </div>
              <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              Processing Excel File
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm text-center mb-4">
              {message || "Processing Excel data..."}
            </p>

            {/* Progress Information */}
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-green-700 font-medium">Progress:</span>
                <span className="text-green-900 font-semibold">
                  {progress}%
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              This may take a few moments. Please do not close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <div className="p-4 sm:p-6">
          <button
            onClick={() => {
              resetModalState();
              onClose();
            }}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>

          <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center mb-2 pr-8">
            Upload Thesis Fee Excel
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 text-center mb-4">
            Upload Excel file with Thesis Fee amounts
          </p>

          <div className="space-y-4">
            {/* Upload Area */}
            <div
              onDragOver={!isProcessing ? handleDragOver : undefined}
              onDragLeave={!isProcessing ? handleDragLeave : undefined}
              onDrop={!isProcessing ? handleDrop : undefined}
              className={`border-2 border-dashed rounded-lg p-4 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                isProcessing
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                  : isDragOver
                  ? "border-indigo-500 bg-indigo-50 cursor-pointer"
                  : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer"
              }`}
              onClick={
                !isProcessing
                  ? () => document.getElementById("fileInput")?.click()
                  : undefined
              }
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-gray-400 animate-spin" />
              ) : (
                <Upload
                  className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 transition-colors ${
                    isDragOver ? "text-indigo-600" : "text-indigo-600"
                  }`}
                />
              )}
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  isProcessing ? "text-gray-500" : "text-gray-800"
                }`}
              >
                {isProcessing
                  ? "Processing Excel file..."
                  : "Drag & drop an Excel file here, or click to browse"}
              </span>
              <input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Warning Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Uploading an Excel file will update
                Thesis Fee amounts for the listed students. Make sure your Excel
                file contains the correct Student IDs and amounts.
              </p>
            </div>

            {/* File Preview */}
            {file && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-800 bg-green-50 p-2 rounded">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span className="truncate">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <p className="text-red-600 text-xs text-center bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleExtract}
                disabled={!file || !!error || isProcessing}
                className={`flex-1 py-2 px-4 rounded text-white font-semibold text-sm transition-colors ${
                  file && !error && !isProcessing
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {isProcessing ? "Processing..." : "Upload & Process"}
              </button>
              <button
                onClick={() => {
                  resetModalState();
                  onClose();
                }}
                disabled={isProcessing}
                className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-colors ${
                  isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-500 hover:bg-gray-600 text-white"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadExcelModal;
