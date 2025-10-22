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
      <div className="px-3 sm:px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <p className="text-sm sm:text-base font-semibold text-gray-800">
            {schoolYear} • {semester}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium">
            <span className="text-gray-700">
              Total:{" "}
              <span className="text-gray-900 font-semibold">
                {filteredStudents.length}
              </span>
            </span>
            <span className="text-green-600">
              Uploaded:{" "}
              <span className="text-green-700 font-semibold">
                {
                  filteredStudents.filter(
                    (s) =>
                      s.disbursement_files && s.disbursement_files.length > 0
                  ).length
                }
              </span>
            </span>
            <span className="text-red-600">
              Remaining:{" "}
              <span className="text-red-700 font-semibold">
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
      </div>

      {/* Mobile Cards - Small screens */}
      <div className="block md:hidden">
        <div className="p-2.5 space-y-2">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No students found
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Try adjusting your filters to see more results
              </p>
              <button
                onClick={() => {
                  setSelectedBranch("all");
                  setSelectedYearLevel("all");
                  setSelectedProgram("all");
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Clear Filters
              </button>
            </div>
          ) : (
            filteredStudents
              .slice((page - 1) * itemsPerPage, page * itemsPerPage)
              .map((s) => {
                const hasNoFile =
                  !s.disbursement_files || s.disbursement_files.length === 0;

                return (
                  <div
                    key={s.renewal_id}
                    className={`rounded-lg p-3 transition-all duration-200 ${
                      hasNoFile
                        ? "bg-red-50"
                        : "bg-white border border-gray-300 shadow-sm  hover:border-blue-400 hover:shadow-sm"
                    }`}
                  >
                    {/* Compact Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {s.student_id}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            s.disbursement_status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : s.disbursement_status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : s.disbursement_status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {s.disbursement_status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {s.disbursement_amount
                          ? `₱${Number(s.disbursement_amount).toLocaleString()}`
                          : "N/A"}
                      </div>
                    </div>

                    {/* Student Name */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      {s.scholar_name}
                    </h3>

                    {/* Compact Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-500">Campus:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {s.campus}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Year:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {s.year_level}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {s.disbursement_label}
                        </span>
                      </div>
                    </div>

                    {/* Files Section - Reverted to Simple Style */}
                    {showFiles && (
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 font-medium">
                            Files
                          </span>
                          <span className="text-xs text-gray-400">
                            {s.disbursement_files?.length || 0} file(s)
                          </span>
                        </div>
                        {s.disbursement_files?.length ? (
                          <div className="space-y-1">
                            {s.disbursement_files.map((file, i) => {
                              const fileUrl = `${VITE_BACKEND_URL}api/document/download/${file.file_name}`;
                              const isThesisFee = type === "thesis_fee";

                              return (
                                <a
                                  key={i}
                                  href={fileUrl}
                                  {...(isThesisFee
                                    ? { download: file.file_name }
                                    : {
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                      })}
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                  {s.scholar_name} - Invoice
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span className="text-xs">No files available</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Tablet View - Medium screens */}
      <div className="hidden md:block lg:hidden overflow-x-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Campus
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                {showFiles && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Files
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={showFiles ? 5 : 4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        No matching students found
                      </p>
                      <button
                        onClick={() => {
                          setSelectedBranch("all");
                          setSelectedYearLevel("all");
                          setSelectedProgram("all");
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents
                  .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                  .map((s) => {
                    const hasNoFile =
                      !s.disbursement_files ||
                      s.disbursement_files.length === 0;

                    return (
                      <tr
                        key={s.renewal_id}
                        className={`hover:bg-gray-50/50 transition-colors duration-200 ${
                          hasNoFile ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-xs font-mono text-gray-500">
                              {s.student_id}
                            </div>
                            <div className="font-semibold text-sm text-gray-900">
                              {s.scholar_name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {s.year_level} • {s.disbursement_label}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {s.campus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              s.disbursement_status === "Completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : s.disbursement_status === "Pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {s.disbursement_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {s.disbursement_amount
                              ? `₱${Number(
                                  s.disbursement_amount
                                ).toLocaleString()}`
                              : "N/A"}
                          </span>
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
                                      ? { download: file.file_name }
                                      : {
                                          target: "_blank",
                                          rel: "noopener noreferrer",
                                        })}
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    Invoice
                                  </a>
                                );
                              })
                            ) : (
                              <span className="text-sm text-gray-400">
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
      </div>

      {/* Desktop Table - Large screens */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50/80 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Scholar Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Campus
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Year Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Disbursement Label
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                {showFiles && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Files
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={showFiles ? 8 : 7}
                    className="px-6 py-16 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-base text-gray-500 mb-3">
                        No matching students found
                      </p>
                      <button
                        onClick={() => {
                          setSelectedBranch("all");
                          setSelectedYearLevel("all");
                          setSelectedProgram("all");
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents
                  .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                  .map((s) => {
                    const hasNoFile =
                      !s.disbursement_files ||
                      s.disbursement_files.length === 0;

                    return (
                      <tr
                        key={s.renewal_id}
                        className={`hover:bg-gray-50/50 transition-colors duration-200 ${
                          hasNoFile ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-gray-500">
                            {s.student_id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {s.scholar_name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {s.campus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {s.year_level}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {s.disbursement_label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              s.disbursement_status === "Completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : s.disbursement_status === "Pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {s.disbursement_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {s.disbursement_amount
                              ? `₱${Number(
                                  s.disbursement_amount
                                ).toLocaleString()}`
                              : "N/A"}
                          </span>
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
                                      ? { download: file.file_name }
                                      : {
                                          target: "_blank",
                                          rel: "noopener noreferrer",
                                        })}
                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    <svg
                                      className="w-4 h-4 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    Invoice
                                  </a>
                                );
                              })
                            ) : (
                              <span className="text-sm text-gray-400">
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
      </div>

      {/* Pagination */}
      {filteredStudents.length > 0 && (
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
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
