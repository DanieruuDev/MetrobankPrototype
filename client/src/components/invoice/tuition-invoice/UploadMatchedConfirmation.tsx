import React from "react";
import { AlertCircle } from "lucide-react";
import { JobStatus, Student } from "../../../Interface/ITuitionInvoice";

interface UploadMatchedConfirmationModalProps {
  jobStatus: JobStatus | null;
  students: Student[];
  onCancel: () => void;
  onConfirm: () => void;
}

const UploadMatchedConfirmationModal: React.FC<
  UploadMatchedConfirmationModalProps
> = ({ jobStatus, students, onCancel, onConfirm }) => {
  if (!jobStatus?.result?.documents) return null;

  const matchedCount = jobStatus.result.documents.filter((doc) => {
    const currentStudentNumber =
      doc.editedData?.studentNumber || doc.extracted.studentNumber;
    const studentId = parseInt(currentStudentNumber || "0");
    return students.some((s) => s.student_id === studentId);
  }).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Confirm Upload
          </h3>
        </div>

        <div className="mb-6 space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                Matched Students:
              </span>
              <span className="text-gray-900 font-semibold">
                {matchedCount} of {jobStatus.result.documents.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Action:</span>
              <span className="text-gray-900 font-semibold">
                Upload Files & Amounts
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            Only matched student records will be updated. Continue?
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
            Yes, Upload Invoices
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadMatchedConfirmationModal;
