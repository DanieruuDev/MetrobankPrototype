import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
        {/* Header Section - Hide when loading */}
        {!isLoading && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Confirmation Required
            </h3>
          </div>
        )}

        {/* Message Content */}
        <div className="mb-6">
          {isLoading ? (
            <div className="text-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-32 h-32 mb-6 mx-auto">
                {/* Animated Background Circle */}
                <svg
                  className="w-32 h-32 transform -rotate-90 animate-pulse"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                    className="animate-pulse"
                  />
                  {/* Progress Circle with Animation */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 50 * (1 - (isLoading ? 75 : 0) / 100)
                    }`}
                    className="transition-all duration-300 ease-out animate-pulse"
                  />
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Percentage Text Inside Circle with Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center animate-bounce">
                    <div className="text-3xl font-bold text-green-600 animate-pulse">
                      {isLoading ? "75" : "0"}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1 animate-pulse">
                      Complete
                    </div>
                  </div>
                </div>

                {/* Rotating Ring Animation */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-300 animate-spin opacity-30"></div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Saving Changes
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                Please wait while we save your changes to the database...
              </p>
              <p className="text-xs text-gray-500 text-center">
                Please do not close this window
              </p>
            </div>
          ) : (
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLoading
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
