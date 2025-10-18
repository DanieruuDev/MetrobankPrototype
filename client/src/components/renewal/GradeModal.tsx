import React from "react";
import { FileDown, X } from "lucide-react";

interface GradeModalProps {
  selectedGrades: {
    name: string;
    gradeList: { course_code: string; final_grade: number }[];
    fileURL?: string;
  } | null;
  onClose: () => void;
}

const GradeModal: React.FC<GradeModalProps> = ({ selectedGrades, onClose }) => {
  if (!selectedGrades) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-[95%] max-w-md p-6 animate-fadeIn border border-gray-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <h2 className="text-lg font-bold text-gray-900">
            Grades for{" "}
            <span className="text-blue-600">{selectedGrades.name}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Total Subjects:{" "}
            <span className="font-semibold text-gray-700">
              {selectedGrades.gradeList.length}
            </span>
          </p>
        </div>

        {/* Grade Table */}
        <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-gray-600 text-xs uppercase tracking-wide">
                <th className="py-2 px-4 text-left border-b border-gray-200">
                  Course Code
                </th>
                <th className="py-2 px-4 text-center border-b border-gray-200">
                  Final Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedGrades.gradeList.map((g, i) => {
                const grade = parseFloat(String(g.final_grade));
                const isFail = grade >= 2.5;
                const gradeColor = isFail
                  ? "text-red-600 font-semibold"
                  : grade <= 1.5
                  ? "text-green-600 font-semibold"
                  : "text-yellow-600 font-medium";

                return (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="py-2 px-4 border-b border-gray-100 font-medium text-gray-800">
                      {g.course_code}
                    </td>
                    <td
                      className={`py-2 px-4 text-center border-b border-gray-100 ${gradeColor}`}
                    >
                      {grade.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* File Download */}
        {selectedGrades.fileURL && (
          <div className="flex justify-center mt-5">
            <a
              href={selectedGrades.fileURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition"
            >
              <FileDown className="w-4 h-4" />
              Download Grade PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeModal;
