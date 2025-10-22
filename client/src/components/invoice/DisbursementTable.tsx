import React, { useEffect, useState } from "react";
import PaginationControl from "../shared/PaginationControl";
import { Student } from "../../Interface/ITuitionInvoice";

interface DisbursementTableProps {
  students: Student[];
  filteredStudents: Student[];
  isLoading: boolean;
  schoolYear: string;
  semester: string;
  VITE_BACKEND_URL: string;
  setSelectedBranch: (val: string) => void;
  setSelectedYearLevel: (val: string) => void;
  setSelectedProgram: (val: string) => void;
  type?: string;
}

const DisbursementTable: React.FC<DisbursementTableProps> = ({
  students,
  filteredStudents,
  isLoading,
  schoolYear,
  semester,
  VITE_BACKEND_URL,
  setSelectedBranch,
  setSelectedYearLevel,
  setSelectedProgram,
  type,
}) => {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const handlePageChange = (newPage: number) => setPage(newPage);
  // ⏳ Loading

  useEffect(() => {
    setTotalPages(Math.ceil(filteredStudents.length / itemsPerPage) || 1);
    // Ensure current page doesn't exceed the new total
    if (page > Math.ceil(filteredStudents.length / itemsPerPage)) {
      setPage(1);
    }
  }, [filteredStudents, itemsPerPage]);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading data...</div>
    );
  }

  console.log(type);
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

  const showFiles = type !== "semestral_allowance";

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

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">Student ID</th>
              <th className="px-4 py-3 text-left">Scholar Name</th>
              <th className="px-4 py-3 text-left">Campus</th>
              <th className="px-4 py-3 text-left">Year Level</th>
              <th className="px-4 py-3 text-left">Disbursement Label</th>
              <th className="px-4 py-3 text-right">Amount</th>
              {showFiles && <th className="px-4 py-3 text-left">Files</th>}
            </tr>
          </thead>

          <tbody className="text-gray-700 text-xs sm:text-sm">
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={showFiles ? 8 : 7}
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
                .map((s, i) => {
                  const hasNoFile =
                    !s.disbursement_files || s.disbursement_files.length === 0;

                  return (
                    <tr
                      key={s.renewal_id}
                      className={`${
                        hasNoFile
                          ? "bg-red-50/40 hover:bg-red-50" // 🩶 soft tint only
                          : i % 2 === 0
                          ? "bg-white hover:bg-blue-50/40"
                          : "bg-gray-50 hover:bg-blue-50/40"
                      } transition-colors duration-150`}
                    >
                      <td className="px-4 py-3 font-mono">{s.student_id}</td>
                      <td className="px-4 py-3">{s.scholar_name}</td>
                      <td className="px-4 py-3">{s.campus}</td>
                      <td className="px-4 py-3 text-center">{s.year_level}</td>
                      <td className="px-4 py-3">{s.disbursement_label}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {s.disbursement_amount
                          ? `₱${Number(s.disbursement_amount).toLocaleString()}`
                          : "N/A"}
                      </td>

                      {showFiles && (
                        <td className="px-4 py-3">
                          {s.disbursement_files?.length ? (
                            s.disbursement_files.map((file, i) => {
                              const fileUrl = `${VITE_BACKEND_URL}api/document/download/${file.file_name}`;
                              const isThesisFee = type === "thesis_fee";

                              return (
                                <a
                                  key={i}
                                  href={fileUrl}
                                  {...(isThesisFee
                                    ? { download: file.file_name } // force download
                                    : {
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                      })} // normal view
                                  className="block text-blue-600 hover:underline truncate"
                                >
                                  📄 {s.scholar_name} - Invoice
                                </a>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 italic">
                              No files
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
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
