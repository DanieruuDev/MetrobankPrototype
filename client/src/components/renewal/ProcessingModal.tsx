import React from "react";
import { Loader2 } from "lucide-react";

interface ProcessingModalProps {
  isOpen: boolean;
  status: string;
  progress: number;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  status,
  progress,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm text-center animate-fadeIn">
        {/* Spinner */}
        <div className="flex justify-center mb-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900">Processing</h3>

        {/* Subtitle */}
        <p className="text-gray-500 text-sm mt-1">
          {status || "Please wait..."}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-6 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 transition-all duration-500 ease-in-out"
            style={{ width: `${progress || 0}%` }}
          />
        </div>

        {/* Percent Label */}
        <p className="text-gray-600 text-sm mt-2">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

export default ProcessingModal;
