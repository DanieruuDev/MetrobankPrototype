import React from "react";
import PaginationControl from "../shared/PaginationControl";
import { Student } from "../../Interface/ITuitionInvoice";

interface DisbursementTableProps {
  students: Student[];
  filteredStudents: Student[];
  isLoading: boolean;
  schoolYear: string;
  semester: string;
  VITE_BACKEND_URL: string;
  page: number;
  itemsPerPage: number;
  totalPages: number;
  handlePageChange: (newPage: number) => void;
  setSelectedBranch: (val: string) => void;
  setSelectedYearLevel: (val: string) => void;
  setSelectedProgram: (val: string) => void;
}

const DisbursementTable: React.FC<DisbursementTableProps> = ({
  students,
  filteredStudents,
  isLoading,
  schoolYear,
  semester,
  VITE_BACKEND_URL,
  page,
  itemsPerPage,
  totalPages,
  handlePageChange,
  setSelectedBranch,
  setSelectedYearLevel,
  setSelectedProgram,
}) => {
  // ⏳ Loading
  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading data...</div>
    );
  }

  // 🧍‍♂️ Empty State
  if (!isLoading && students.length === 0) {
    return (
      <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg">
        <p className="text-lg font-semibold text-gray-800 mb-1">
          No Students Found
        </p>
        <p className="text-sm text-gray-600">
          There are no students enrolled for {schoolYear} • {semester}
        </p>
      </div>
    );
  }

  // 📋 Table Rendering
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg overflow-hidden relative z-0">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm sm:text-base font-semibold text-gray-800">
          {schoolYear} • {semester}
        </p>
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="text-gray-700">
            Total:{" "}
            <span className="text-gray-900">{filteredStudents.length}</span>
          </span>
          <span className="text-green-600">
            Uploaded:{" "}
            <span className="text-green-700">
              {
                filteredStudents.filter(
                  (s) => s.disbursement_files && s.disbursement_files.length > 0
                ).length
              }
            </span>
          </span>
          <span className="text-red-600">
            Remaining:{" "}
            <span className="text-red-700">
              {
                filteredStudents.filter(
                  (s) =>
                    !s.disbursement_files || s.disbursement_files.length === 0
                ).length
              }
            </span>
          </span>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/90 backdrop-blur-sm">
            <tr className="text-slate-700 text-xs sm:text-sm font-semibold text-left">
              <th className="px-4 py-3 border-r">Student ID</th>
              <th className="px-4 py-3 border-r">Scholar Name</th>
              <th className="px-4 py-3 border-r">Campus</th>
              <th className="px-4 py-3 border-r">Year Level</th>
              <th className="px-4 py-3 border-r">Disbursement Label</th>
              <th className="px-4 py-3 border-r">Status</th>
              <th className="px-4 py-3 border-r text-right">Amount</th>
              <th className="px-4 py-3">Files</th>
            </tr>
          </thead>
          <tbody className="bg-white/50 divide-y divide-slate-200 text-xs sm:text-sm">
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No matching students.
                  <button
                    onClick={() => {
                      setSelectedBranch("all");
                      setSelectedYearLevel("all");
                      setSelectedProgram("all");
                    }}
                    className="ml-2 underline text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredStudents
                .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                .map((s) => (
                  <tr
                    key={s.renewal_id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !s.disbursement_files?.length ? "bg-red-50/70" : ""
                    }`}
                  >
                    <td className="px-4 py-3 border-r font-mono">
                      {s.student_id}
                    </td>
                    <td className="px-4 py-3 border-r">{s.scholar_name}</td>
                    <td className="px-4 py-3 border-r">{s.campus}</td>
                    <td className="px-4 py-3 border-r text-center">
                      {s.year_level}
                    </td>
                    <td className="px-4 py-3 border-r">
                      {s.disbursement_label}
                    </td>
                    <td className="px-4 py-3 border-r">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          s.disbursement_status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : s.disbursement_status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.disbursement_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r text-right font-semibold">
                      {s.disbursement_amount
                        ? `₱${Number(s.disbursement_amount).toLocaleString()}`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {s.disbursement_files?.length ? (
                        s.disbursement_files.map((file, i) => (
                          <a
                            key={i}
                            href={`${VITE_BACKEND_URL}api/document/download/${file.file_name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:underline truncate"
                          >
                            📄 {s.scholar_name} - Invoice
                          </a>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No files</span>
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="px-4 py-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-t border-gray-200">
          <div className="flex justify-center">
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursementTable;
