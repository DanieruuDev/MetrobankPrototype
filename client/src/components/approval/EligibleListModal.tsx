import React from "react";
import { X, Users } from "lucide-react";
import type { EligibleScholar } from "../../Interface/IWorkflow";

interface EligibleListModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleList: EligibleScholar[];
  schoolYear: string; // Can be either "2025-2026" or "20252026"
  semesterCode: string; // Can be "1st Semester" or just "1"
}

const EligibleListModal: React.FC<EligibleListModalProps> = ({
  isOpen,
  onClose,
  eligibleList,
  schoolYear,
  semesterCode,
}) => {
  if (!isOpen) return null;

  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // 🧠 Smart Formatting Logic
  const formattedSY =
    schoolYear && schoolYear.includes("-")
      ? schoolYear // already in correct format (e.g. 2025-2026)
      : schoolYear.replace(/(\d{4})(\d{4})/, "$1-$2");

  const formattedSemester = semesterCode?.toLowerCase().includes("semester")
    ? semesterCode // already descriptive
    : semesterCode === "1"
    ? "1st Semester"
    : semesterCode === "2"
    ? "2nd Semester"
    : semesterCode || "—";
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Eligible Scholars (
              {eligibleList.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Year Level ({formattedSY} {formattedSemester})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={22} />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-6">
          {eligibleList.length > 0 ? (
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700 text-xs sm:text-sm uppercase border-b">
                <tr>
                  <th className="px-5 py-3 text-left w-[10%]">Student ID</th>
                  <th className="px-5 py-3 text-left w-[20%]">Scholar Name</th>
                  <th className="px-5 py-3 text-left w-[15%]">Program</th>
                  <th className="px-5 py-3 text-left w-[20%]">Campus</th>
                  <th className="px-5 py-3 text-left w-[10%]">Year Level</th>
                  <th className="px-5 py-3 text-right w-[15%]">Amount</th>
                  <th className="px-5 py-3 text-center w-[10%]">File</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-xs sm:text-sm">
                {eligibleList.map((student, index) => (
                  <tr
                    key={student.renewal_id || index}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-5 py-3 font-mono text-[13px]">
                      {student.student_id}
                    </td>
                    <td className="px-5 py-3 text-[13px]">
                      {student.scholar_name}
                    </td>
                    <td className="px-5 py-3 text-[13px]">{student.program}</td>
                    <td className="px-5 py-3 text-[13px]">{student.campus}</td>
                    <td className="px-5 py-3 text-[13px]">
                      {student.year_level}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-[13px]">
                      {student.disbursement_amount
                        ? `₱${Number(
                            student.disbursement_amount
                          ).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {student.disbursement_files?.length ? (
                        <a
                          href={`${VITE_BACKEND_URL}api/document/download/${student.disbursement_files[0].file_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-[13px]"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-[13px]">
                          None
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              No eligible scholars found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EligibleListModal;
