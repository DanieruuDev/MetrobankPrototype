import React from "react";
import { Loader2 } from "lucide-react";

interface UploadingModalProps {
  uploadStatus: string;
  uploadProgress: number;
  uploadedFilesCount: number;
  totalFilesToUpload: number;
}

const UploadingModal: React.FC<UploadingModalProps> = ({
  uploadStatus,
  uploadProgress,
  uploadedFilesCount,
  totalFilesToUpload,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[10001] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
        <div className="flex flex-col items-center">
          {/* Spinner */}
          <div className="relative">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            </div>
            <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
          </div>

          {/* Title + Status */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Uploading Invoices
          </h3>
          <p className="text-gray-600 text-sm text-center mb-4">
            {uploadStatus || "Uploading matched invoices to student records..."}
          </p>

          {/* File Progress */}
          {totalFilesToUpload > 0 && (
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700 font-medium">
                  Files Processed:
                </span>
                <span className="text-green-900 font-semibold">
                  {uploadedFilesCount} of {totalFilesToUpload}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-green-700 font-medium">Progress:</span>
                <span className="text-green-900 font-semibold">
                  {uploadProgress}%
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            This may take a few moments. Please do not close this window.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadingModal;
