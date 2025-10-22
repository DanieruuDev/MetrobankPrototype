import React, { useState, useEffect } from "react";
import { Upload, CheckCircle } from "lucide-react";

import Loading from "../../../components/shared/Loading";
import PaginationControl from "../../../components/shared/PaginationControl";

import { useInvoiceUpload } from "../../../components/invoice/tuition-invoice/useTuitionInvoiceUpload";
import UploadInvoiceModal from "../../../components/invoice/tuition-invoice/UploadInvoiceModal";
import UploadConfirmationModal from "../../../components/invoice/tuition-invoice/UploadConfirmationModal";
import UploadProcessingModal from "../../../components/invoice/tuition-invoice/UploadProcessingModal";
import UploadMatchedConfirmationModal from "../../../components/invoice/tuition-invoice/UploadMatchedConfirmation";
import UploadingModal from "../../../components/invoice/tuition-invoice/UploadingModal";
import { useProcess } from "../../../context/ProcessContext";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";

interface StudentFile {
  file_id: number;
  file_name: string;
  file_type: string;
  size: number;
  upload_at: string;
  file?: File | null; // ✅ Added this so TypeScript knows we store a File object here
}

interface Student {
  renewal_id: number;
  student_id: number;
  scholar_name: string;
  campus: string;
  program: string;
  batch: string;
  renewal_date: string;
  is_initial: boolean;
  year_level: string;
  semester: string;
  school_year: string;
  initialized_by: number;
  scholarship_status: string;
  delisted_date: string | null;
  delisting_root_cause: string | null;
  validation_id: number;
  is_validated: boolean | null;
  role_id: number | null;
  hr_completed_at: string | null;
  disbursement_id: number | null;
  disb_detail_id: number | null;
  disbursement_type_id: number;
  disbursement_label: string;
  disbursement_status: string;
  disbursement_amount: number | null;
  disbursement_files: StudentFile[] | null;
}
interface TuitionUploadProps {
  students: Student[];
  filteredStudents: Student[];
  fetchStudents: () => void;
  schoolYear: string;
  semester: string;
  role: number | undefined;
  isLoading: boolean;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedYearLevel: React.Dispatch<React.SetStateAction<string>>;
  setSelectedProgram: React.Dispatch<React.SetStateAction<string>>;
  type: string;
}
export interface UploadStatusBE {
  program_source: "STI" | "METROBANK";
  branch_name: string; // "-" for METROBANK
  process_id: number;
  disbursement_type_id: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string | null;
}

const TuitionUpload = ({
  students,
  filteredStudents,
  fetchStudents,
  schoolYear,
  semester,
  role,
  isLoading,
}: TuitionUploadProps) => {
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const { processInfo, getProcessInfo } = useProcess();
  const [uploadStatusBE, setIsUploadStatusBE] = useState<UploadStatusBE | null>(
    null
  );
  const [uploadStatusHR, setIsUploadStatusHR] = useState<
    UploadStatusBE[] | null
  >([]);

  useState(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // ✅ Autocomplete states
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<{
    [key: string]: Student[];
  }>({});
  const [showSuggestions, setShowSuggestions] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<{
    [key: string]: number;
  }>({});
  const auth = useAuth();
  const {
    selectedFile,
    setSelectedFile,
    fileSize,
    setFileSize,
    isUploadOpen,
    setIsUploadOpen,
    isProcessing,
    isUploading,
    showUploadConfirmation,
    setShowUploadConfirmation,
    showUploadMatchedConfirmation,
    setShowUploadMatchedConfirmation,
    uploadStatus,
    uploadProgress,

    uploadedFilesCount,
    totalFilesToUpload,
    jobStatus,
    setJobStatus,

    handleShowUploadConfirmation,
    handleFileExtract,
    handleShowUploadMatchedConfirmation,
    handleUploadToStudents,
  } = useInvoiceUpload(students, fetchStudents);
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // ✅ Edit functionality for documents
  const handleEditDocument = (docIndex: number) => {
    if (!jobStatus?.result?.documents) return;

    const updatedDocuments = [...jobStatus.result.documents];
    updatedDocuments[docIndex] = {
      ...updatedDocuments[docIndex],
      isEditing: true,
      editedData: {
        studentName: updatedDocuments[docIndex].extracted.studentName,
        studentNumber: updatedDocuments[docIndex].extracted.studentNumber,
      },
    };

    setJobStatus({
      ...jobStatus,
      result: {
        ...jobStatus.result,
        documents: updatedDocuments,
      },
    });
  };

  const handleSaveEdit = (docIndex: number) => {
    if (!jobStatus?.result?.documents) return;

    const updatedDocuments = [...jobStatus.result.documents];
    const doc = updatedDocuments[docIndex];

    if (!doc.editedData) return;

    // Update the extracted data with edited values
    updatedDocuments[docIndex] = {
      ...doc,
      extracted: {
        ...doc.extracted,
        studentName: doc.editedData.studentName,
        studentNumber: doc.editedData.studentNumber,
      },
      isEditing: false,
      editedData: undefined,
    };

    setJobStatus({
      ...jobStatus,
      result: {
        ...jobStatus.result,
        documents: updatedDocuments,
      },
    });
  };

  const handleCancelEdit = (docIndex: number) => {
    if (!jobStatus?.result?.documents) return;

    const updatedDocuments = [...jobStatus.result.documents];
    updatedDocuments[docIndex] = {
      ...updatedDocuments[docIndex],
      isEditing: false,
      editedData: undefined,
    };

    setJobStatus({
      ...jobStatus,
      result: {
        ...jobStatus.result,
        documents: updatedDocuments,
      },
    });
  };

  const handleEditFieldChange = (
    docIndex: number,
    field: "studentName" | "studentNumber",
    value: string
  ) => {
    if (!jobStatus?.result?.documents) return;

    const updatedDocuments = [...jobStatus.result.documents];
    if (updatedDocuments[docIndex].editedData) {
      updatedDocuments[docIndex].editedData[field] = value;
    }

    setJobStatus({
      ...jobStatus,
      result: {
        ...jobStatus.result,
        documents: updatedDocuments,
      },
    });

    // ✅ Trigger autocomplete suggestions
    const fieldKey = `${docIndex}-${field}`;
    if (value.length >= 1) {
      fetchAutocompleteSuggestions(fieldKey, value, field);
    } else {
      setAutocompleteSuggestions((prev) => ({ ...prev, [fieldKey]: [] }));
      setShowSuggestions((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  // ✅ Autocomplete functionality
  const fetchAutocompleteSuggestions = (
    fieldKey: string,
    query: string,
    field: "studentName" | "studentNumber"
  ) => {
    if (!students.length) return;

    let suggestions: Student[] = [];

    if (field === "studentName") {
      suggestions = students
        .filter((student) =>
          student.scholar_name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions
    } else if (field === "studentNumber") {
      suggestions = students
        .filter((student) => student.student_id.toString().includes(query))
        .slice(0, 5); // Limit to 5 suggestions
    }

    setAutocompleteSuggestions((prev) => ({
      ...prev,
      [fieldKey]: suggestions,
    }));
    setShowSuggestions((prev) => ({
      ...prev,
      [fieldKey]: suggestions.length > 0,
    }));
    setSelectedSuggestionIndex((prev) => ({ ...prev, [fieldKey]: -1 }));
  };

  const selectSuggestion = (
    docIndex: number,
    field: "studentName" | "studentNumber",
    student: Student
  ) => {
    const fieldKey = `${docIndex}-${field}`;

    if (!jobStatus?.result?.documents) return;

    const updatedDocuments = [...jobStatus.result.documents];
    if (updatedDocuments[docIndex].editedData) {
      if (field === "studentName") {
        updatedDocuments[docIndex].editedData.studentName =
          student.scholar_name;
        updatedDocuments[docIndex].editedData.studentNumber =
          student.student_id.toString();
      } else {
        updatedDocuments[docIndex].editedData.studentNumber =
          student.student_id.toString();
        updatedDocuments[docIndex].editedData.studentName =
          student.scholar_name;
      }
    }

    setJobStatus({
      ...jobStatus,
      result: {
        ...jobStatus.result,
        documents: updatedDocuments,
      },
    });

    // Hide suggestions
    setShowSuggestions((prev) => ({ ...prev, [fieldKey]: false }));
    setAutocompleteSuggestions((prev) => ({ ...prev, [fieldKey]: [] }));
  };

  const handleKeyDown = (
    event: React.KeyboardEvent,
    docIndex: number,
    field: "studentName" | "studentNumber"
  ) => {
    const fieldKey = `${docIndex}-${field}`;
    const suggestions = autocompleteSuggestions[fieldKey] || [];
    const currentIndex = selectedSuggestionIndex[fieldKey] || -1;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, suggestions.length - 1);
      setSelectedSuggestionIndex((prev) => ({
        ...prev,
        [fieldKey]: nextIndex,
      }));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, -1);
      setSelectedSuggestionIndex((prev) => ({
        ...prev,
        [fieldKey]: prevIndex,
      }));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (currentIndex >= 0 && suggestions[currentIndex]) {
        selectSuggestion(docIndex, field, suggestions[currentIndex]);
      }
    } else if (event.key === "Escape") {
      setShowSuggestions((prev) => ({ ...prev, [fieldKey]: false }));
      setSelectedSuggestionIndex((prev) => ({ ...prev, [fieldKey]: -1 }));
    }
  };
  const handleComplete = async () => {
    const program_source = "STI";
    const process_id = processInfo.process_id;
    const branch_name = auth.info?.branch?.branch_name;
    const disbursement_type_id = 1; // ✅ You mentioned "1" — use as fixed or dynamic as needed

    // 🔹 Validate inputs before sending
    if (!program_source || !process_id || !branch_name) {
      console.error("❌ Missing required data:", {
        program_source,
        process_id,
        branch_name,
      });
      toast.error("Missing required information to complete upload status.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      const payload = {
        process_id,
        program_source,
        branch_name,
        disbursement_type_id,
      };

      console.log("📤 Sending completion payload:", payload);

      const res = await axios.put(
        `${VITE_BACKEND_URL}api/status/completed`,
        payload
      );

      if (res.status === 200) {
        toast.success("✅ Upload status successfully marked as completed!", {
          position: "top-center",
          autoClose: 3000,
        });
        fetchStudents();
        window.location.reload();
        console.log("✅ Backend response:", res.data);
      } else {
        toast.warn("⚠️ Unexpected response from server.", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("❌ Error completing upload status:", error);
      toast.error(`Failed to mark upload as completed: ${error}`, {
        position: "top-center",
        autoClose: 4000,
      });
    }
  };
  const fetchUploadStatus = async () => {
    const program_source = "STI";
    const process_id = processInfo.process_id;
    const branch_name =
      auth.info?.branch?.branch_name === null
        ? "All"
        : auth.info?.branch?.branch_name;
    const disbursement_type_id = 1;

    if (!process_id) {
      return;
    }
    try {
      const response = await axios.get(`${VITE_BACKEND_URL}api/status/list`, {
        params: {
          process_id,
          program_source,
          branch_name,
          disbursement_type_id,
        },
      });

      if (response.status === 200) {
        console.log("fetch", response.data.data);
        setIsUploadStatusHR(response.data.data);
        setIsUploadStatusBE(response.data.data[0]);
      } else {
        toast.warn("⚠️ Unexpected response from server.");
      }
    } catch (error) {
      console.error("❌ Error fetching upload status:", error);
      toast.error(`Failed to fetch upload status: ${error}`, {
        position: "top-center",
        autoClose: 4000,
      });
    }
  };

  const sySem = `${schoolYear}_${semester.substring(0, 1)}`;

  useEffect(() => {
    fetchUploadStatus();
  }, [processInfo, auth]);
  useEffect(() => {
    if (sySem) {
      getProcessInfo(sySem);
    }
  }, [sySem]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ✅ Close autocomplete suggestions when clicking outside
      const target = event.target as HTMLElement;
      if (!target.closest(".autocomplete-container")) {
        setShowSuggestions({});
        setSelectedSuggestionIndex({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update total pages when filtered students change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredStudents.length / itemsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [filteredStudents.length]);

  console.log("Check result: ", uploadStatusBE?.is_completed);

  return (
    <div>
      <div>
        <div className="px-4 sm:px-6">
          {/* Upload Button for Role 3 */}
          {role === 3 && (
            <div className="mb-8">
              {processInfo.current_stage === "Renewal" ? (
                // 🚨 URGENT - Waiting for HR to finalize renewal
                <div className="relative p-6 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-red-500 shadow-lg rounded-lg">
                  {/* Urgent Badge */}
                  <div className="absolute -top-3 -right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                    ⏰ PENDING
                  </div>

                  <div className="flex items-start gap-4">
                    {/* Alert Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mt-1">
                      <span className="text-2xl">⚠️</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 text-sm uppercase tracking-wide mb-2">
                        HR Approval Pending
                      </h3>
                      <p className="text-sm text-red-800 leading-relaxed">
                        <strong>Action Required:</strong> Waiting for HR to
                        finalize the process. You can upload the invoice{" "}
                        <strong>immediately after approval</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : uploadStatusBE?.is_completed === true ? (
                // 🟩 COMPLETED - Process now in HR's hands
                <div className="relative p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-l-4 border-emerald-600 shadow-md rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                      <span className="text-2xl">🤝</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-emerald-900 text-lg mb-2 leading-tight">
                        Upload Completed
                      </h3>
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        🎯 All invoices have been finalized and submitted
                        successfully. The process is now in{" "}
                        <strong>HR’s hands</strong>approvals. You’ll be notified
                        once HR completes the next stage.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // ✅ READY - Actionable Buttons and Completion Message
                <div className="p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm relative">
                  {/* Success Badge */}
                  <div className="absolute -top-3 -right-3 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold tracking-wide flex items-center gap-2">
                    ✅ READY TO UPLOAD
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                      <span className="text-2xl">🎉</span>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-3 leading-tight">
                        Process Finalized!
                      </h3>
                      <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                        ⏰ <strong>Upload now</strong> to complete scholar
                        invoice processing
                        {filteredStudents && (
                          <span className="ml-2 text-red-600">
                            Remaining:{" "}
                            <span className="text-red-700 font-semibold">
                              {
                                filteredStudents.filter(
                                  (s) =>
                                    !s.disbursement_files ||
                                    s.disbursement_files.length === 0
                                ).length
                              }
                            </span>
                          </span>
                        )}
                      </p>

                      {/* Buttons Section */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        {/* Upload Invoice Button */}
                        {uploadStatusBE && !uploadStatusBE.is_completed && (
                          <button
                            className="group w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-blue-700"
                            onClick={() => setIsUploadOpen(true)}
                            aria-label="Upload invoice"
                          >
                            <div className="relative">
                              <Upload className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                                📤
                              </span>
                            </div>
                            <span className="tracking-wide">
                              Upload Invoice
                            </span>
                          </button>
                        )}

                        {/* Finalize Button */}
                        {filteredStudents?.filter(
                          (s) =>
                            !s.disbursement_files ||
                            s.disbursement_files.length === 0
                        ).length === 0 &&
                          uploadStatusBE &&
                          !uploadStatusBE.is_completed && (
                            <button
                              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-emerald-700 animate-pulse"
                              aria-label="Finalize invoice processing"
                              onClick={handleComplete}
                            >
                              <svg
                                className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="tracking-wide">Finalize tn</span>
                            </button>
                          )}
                      </div>

                      {/* Completion Message */}
                      {filteredStudents?.filter(
                        (s) =>
                          !s.disbursement_files ||
                          s.disbursement_files.length === 0
                      ).length === 0 && (
                        <div
                          className="p-4 bg-emerald-100 rounded-xl flex items-center gap-3 text-sm text-emerald-800 font-semibold border border-emerald-300 animate-pulse"
                          role="alert"
                        >
                          <svg
                            className="w-6 h-6 text-emerald-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>All invoices uploaded successfully!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* 🧭 HR Dashboard: Upload Progress Across Branches */}
          {role === 7 && uploadStatusHR && uploadStatusHR.length > 0 && (
            <div className="mb-10">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                📊 Upload Progress by Branch
              </h2>

              {/* Check completion status */}
              {uploadStatusHR.every((s) => s.is_completed) ? (
                // ✅ All Completed — Ready for Approval
                <div className="p-4 mb-6 rounded-lg border border-emerald-300 bg-emerald-50 shadow-sm flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 text-xl">
                    ✅
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-900">
                      All Branches Completed
                    </h3>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      🎉 All branches have successfully finalized their uploads.
                      The disbursement process is now{" "}
                      <strong>ready for Approvals</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                // 🧭 Not all done — show partial progress
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    ✅ {uploadStatusHR.filter((s) => s.is_completed).length}
                  </span>
                  <span>
                    of {uploadStatusHR.length} branches have completed uploads.
                  </span>
                </div>
              )}

              {/* Inline Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {uploadStatusHR.map((status, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg shadow-sm border transition-all hover:shadow-md flex flex-col justify-between ${
                      status.is_completed
                        ? "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70"
                        : "border-red-200 bg-red-50/70 hover:bg-red-100/70"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                            status.is_completed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status.is_completed ? "✔" : "⚠"}
                        </div>
                        <h3
                          className={`font-semibold text-sm truncate ${
                            status.is_completed
                              ? "text-emerald-800"
                              : "text-red-800"
                          }`}
                          title={status.branch_name}
                        >
                          {status.branch_name}
                        </h3>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                          status.is_completed
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {status.is_completed ? "Completed" : "Pending"}
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      className={`text-xs mb-1 leading-snug ${
                        status.is_completed
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {status.is_completed
                        ? "Finalized. Ready for Approvals."
                        : "Awaiting branch submission."}
                    </p>

                    {/* Timestamps */}
                    <p className="text-[11px] text-gray-500 mt-1">
                      Last updated:{" "}
                      {status.updated_at
                        ? new Date(status.updated_at).toLocaleString("en-PH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </p>

                    {status.is_completed && status.completed_at && (
                      <p className="text-[11px] text-gray-500">
                        Completed:{" "}
                        {new Date(status.completed_at).toLocaleString("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improved Upload Modal */}
          {isUploadOpen && !isProcessing && !jobStatus && (
            <UploadInvoiceModal
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              fileSize={fileSize}
              setFileSize={setFileSize}
              setIsUploadOpen={setIsUploadOpen}
              handleShowUploadConfirmation={handleShowUploadConfirmation}
            />
          )}

          {/* Full-Screen Overlay for Review Modal */}
          {jobStatus &&
            jobStatus.status === "done" &&
            jobStatus.result &&
            !isUploading && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[9999] p-4 animate-fadeIn">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative transition-all max-h-[90vh] overflow-y-auto">
                  <div>
                    {/* HEADER */}
                    <div className="text-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="text-lg font-semibold text-gray-800">
                        Review Extracted Invoices
                      </h4>
                      <p className="text-sm text-gray-500 max-w-lg mx-auto">
                        Matches are based on <b>Student ID</b>. Only the{" "}
                        <b>file</b> and <b>amount</b>
                        will be uploaded for matched students. Please review
                        carefully before confirming.
                      </p>
                    </div>

                    {/* FILTER CONTROL */}
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-sm font-semibold text-gray-700">
                        Showing extracted records
                      </h5>
                      <div className="flex items-center gap-2 text-sm">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="filterView"
                            value="all"
                            checked={filter === "all"}
                            onChange={() => setFilter("all")}
                          />
                          All
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="filterView"
                            value="matched"
                            checked={filter === "matched"}
                            onChange={() => setFilter("matched")}
                          />
                          Matched Only
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="filterView"
                            value="unmatched"
                            checked={filter === "unmatched"}
                            onChange={() => setFilter("unmatched")}
                          />
                          Unmatched Only
                        </label>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {jobStatus.result.documents
                        .filter((doc) => {
                          // Use edited data if available, otherwise use extracted data
                          const currentStudentNumber =
                            doc.editedData?.studentNumber ||
                            doc.extracted.studentNumber;
                          const studentId = parseInt(
                            currentStudentNumber || "0"
                          );
                          const matched = students.some(
                            (s) => s.student_id === studentId
                          );

                          if (filter === "matched") return matched;
                          if (filter === "unmatched") return !matched;
                          return true;
                        })
                        .map((doc, idx) => {
                          // Use edited data if available, otherwise use extracted data
                          const currentStudentNumber =
                            doc.editedData?.studentNumber ||
                            doc.extracted.studentNumber;
                          const studentId = parseInt(
                            currentStudentNumber || "0"
                          );
                          const matchedStudent = students.find(
                            (s) => s.student_id === studentId
                          );
                          const matched = !!matchedStudent;
                          const amount = doc.extracted.totalBalance || "0.00";

                          return (
                            <div
                              key={idx}
                              className={`border rounded-lg shadow-sm p-4 transition-all ${
                                matched
                                  ? "border-green-300 bg-green-50/70 hover:bg-green-100/70"
                                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                              }`}
                            >
                              {/* Header with Student Info and Actions */}
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                  {doc.isEditing ? (
                                    <div className="space-y-3">
                                      <div className="relative autocomplete-container">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Student Name
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            doc.editedData?.studentName || ""
                                          }
                                          onChange={(e) =>
                                            handleEditFieldChange(
                                              idx,
                                              "studentName",
                                              e.target.value
                                            )
                                          }
                                          onKeyDown={(e) =>
                                            handleKeyDown(e, idx, "studentName")
                                          }
                                          onFocus={() => {
                                            const fieldKey = `${idx}-studentName`;
                                            if (
                                              autocompleteSuggestions[fieldKey]
                                                ?.length > 0
                                            ) {
                                              setShowSuggestions((prev) => ({
                                                ...prev,
                                                [fieldKey]: true,
                                              }));
                                            }
                                          }}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Type to search students..."
                                        />
                                        {/* Autocomplete suggestions for student name */}
                                        {showSuggestions[
                                          `${idx}-studentName`
                                        ] &&
                                          autocompleteSuggestions[
                                            `${idx}-studentName`
                                          ]?.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto z-50">
                                              {autocompleteSuggestions[
                                                `${idx}-studentName`
                                              ].map(
                                                (student, suggestionIdx) => (
                                                  <div
                                                    key={student.student_id}
                                                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-blue-50 ${
                                                      selectedSuggestionIndex[
                                                        `${idx}-studentName`
                                                      ] === suggestionIdx
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "text-gray-700"
                                                    }`}
                                                    onClick={() =>
                                                      selectSuggestion(
                                                        idx,
                                                        "studentName",
                                                        student
                                                      )
                                                    }
                                                  >
                                                    <div className="font-medium">
                                                      {student.scholar_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      ID: {student.student_id} •{" "}
                                                      {student.campus}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                      <div className="relative autocomplete-container">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Student ID
                                        </label>
                                        <input
                                          type="text"
                                          value={
                                            doc.editedData?.studentNumber || ""
                                          }
                                          onChange={(e) =>
                                            handleEditFieldChange(
                                              idx,
                                              "studentNumber",
                                              e.target.value
                                            )
                                          }
                                          onKeyDown={(e) =>
                                            handleKeyDown(
                                              e,
                                              idx,
                                              "studentNumber"
                                            )
                                          }
                                          onFocus={() => {
                                            const fieldKey = `${idx}-studentNumber`;
                                            if (
                                              autocompleteSuggestions[fieldKey]
                                                ?.length > 0
                                            ) {
                                              setShowSuggestions((prev) => ({
                                                ...prev,
                                                [fieldKey]: true,
                                              }));
                                            }
                                          }}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Type to search by ID..."
                                        />
                                        {/* Autocomplete suggestions for student ID */}
                                        {showSuggestions[
                                          `${idx}-studentNumber`
                                        ] &&
                                          autocompleteSuggestions[
                                            `${idx}-studentNumber`
                                          ]?.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto z-50">
                                              {autocompleteSuggestions[
                                                `${idx}-studentNumber`
                                              ].map(
                                                (student, suggestionIdx) => (
                                                  <div
                                                    key={student.student_id}
                                                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-blue-50 ${
                                                      selectedSuggestionIndex[
                                                        `${idx}-studentNumber`
                                                      ] === suggestionIdx
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "text-gray-700"
                                                    }`}
                                                    onClick={() =>
                                                      selectSuggestion(
                                                        idx,
                                                        "studentNumber",
                                                        student
                                                      )
                                                    }
                                                  >
                                                    <div className="font-medium">
                                                      ID: {student.student_id}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      {student.scholar_name} •{" "}
                                                      {student.campus}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <h6 className="font-semibold text-gray-800 text-sm mb-1">
                                        {doc.extracted.studentName ||
                                          "Unknown Student"}
                                      </h6>
                                      <p className="text-xs text-gray-500">
                                        ID: {doc.extracted.studentNumber || "—"}{" "}
                                        • {matchedStudent?.campus || "—"}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Status Badge and Action Buttons */}
                                <div className="flex flex-col items-end gap-2 ml-4">
                                  {/* Status Badge */}
                                  <span
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                      matched
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-gray-100 text-gray-600 border border-gray-200"
                                    }`}
                                  >
                                    {matched ? "✅ Matched" : "⚠️ Unmatched"}
                                  </span>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1">
                                    {doc.isEditing ? (
                                      <>
                                        <button
                                          onClick={() => handleSaveEdit(idx)}
                                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                          title="Save changes"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={() => handleCancelEdit(idx)}
                                          className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                                          title="Cancel editing"
                                        >
                                          ✕
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => handleEditDocument(idx)}
                                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                                        title="Edit student info"
                                      >
                                        <span className="flex items-center gap-1">
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
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                          </svg>
                                          Edit
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-700">
                                <p>
                                  <span className="text-gray-500">
                                    Program:
                                  </span>{" "}
                                  {doc.extracted.program || "—"}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    School Year:
                                  </span>{" "}
                                  {matchedStudent?.school_year ||
                                    doc.extracted.schoolYearTerm ||
                                    "—"}
                                </p>
                                <p>
                                  <span className="text-gray-500">
                                    Semester:
                                  </span>{" "}
                                  {matchedStudent?.semester || "—"}
                                </p>
                                <p>
                                  <span className="text-gray-500">Amount:</span>{" "}
                                  <span className="font-semibold text-gray-800">
                                    ₱
                                    {parseFloat(
                                      amount.replace(/[₱,]/g, "")
                                    ).toLocaleString()}
                                  </span>
                                </p>
                                <p className="col-span-2 truncate">
                                  <span className="text-gray-500">File:</span>{" "}
                                  <span className="text-blue-600 font-medium">
                                    {doc.extracted.studentName ||
                                      "Unknown Student"}
                                  </span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* FOOTER SUMMARY + ACTIONS */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 border-t pt-4">
                      <p className="text-sm text-gray-600">
                        <b>
                          {
                            jobStatus.result.documents.filter((doc) => {
                              // Use edited data if available, otherwise use extracted data
                              const currentStudentNumber =
                                doc.editedData?.studentNumber ||
                                doc.extracted.studentNumber;
                              return students.some(
                                (s) =>
                                  s.student_id ===
                                  parseInt(currentStudentNumber || "0")
                              );
                            }).length
                          }{" "}
                          of {jobStatus.result.documents.length}
                        </b>{" "}
                        students matched successfully. Only matched records will
                        be uploaded.
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setJobStatus(null);
                            setSelectedFile(null);
                            setFileSize(0);
                          }}
                          className="px-5 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleShowUploadMatchedConfirmation}
                          className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Upload Matched Only
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {isLoading && <Loading />}

          {!isLoading && students.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg overflow-hidden relative z-0">
              {/* Table Header with SY/Semester and Upload Summary */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  {schoolYear} • {semester}
                </p>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <span className="text-gray-700">
                    Total:{" "}
                    <span className="text-gray-900">
                      {filteredStudents.length}
                    </span>
                  </span>
                  <span className="text-green-600">
                    Uploaded:{" "}
                    <span className="text-green-700">
                      {
                        filteredStudents.filter(
                          (s) =>
                            s.disbursement_files &&
                            s.disbursement_files.length > 0
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
                            !s.disbursement_files ||
                            s.disbursement_files.length === 0
                        ).length
                      }
                    </span>
                  </span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/90 backdrop-blur-sm">
                    <tr className="text-slate-700 text-xs sm:text-sm font-semibold text-left">
                      <th className="px-3 sm:px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                        Student ID
                      </th>
                      <th className="px-3 sm:px-4 py-3 border-r border-gray-200 min-w-[150px]">
                        Scholar Name
                      </th>
                      <th className="px-3 sm:px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                        Campus
                      </th>
                      <th className="px-3 sm:px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                        Year Level
                      </th>
                      <th className="px-3 sm:px-4 py-3 border-r border-gray-200 min-w-[180px]">
                        Disbursement Label
                      </th>

                      <th className="px-3 sm:px-4 py-3 border-r border-gray-200 whitespace-nowrap text-right">
                        Amount
                      </th>
                      <th className="px-3 sm:px-4 py-3 min-w-[200px]">Files</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200 text-xs sm:text-sm">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-orange-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-base font-semibold text-gray-800 mb-1">
                                No Students
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents
                        .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                        .map((student) => (
                          <tr
                            key={student.renewal_id}
                            className={`hover:bg-gray-50 transition-colors ${
                              !student.disbursement_files?.length
                                ? "bg-red-50/70"
                                : "bg-white/30"
                            }`}
                          >
                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 font-mono text-gray-700 whitespace-nowrap">
                              {student.student_id}
                            </td>
                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 font-medium text-gray-800">
                              {student.scholar_name}
                            </td>
                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 text-gray-700 whitespace-nowrap">
                              {student.campus}
                            </td>
                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 text-gray-700 text-center whitespace-nowrap">
                              {student.year_level}
                            </td>
                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 text-gray-700">
                              {student.disbursement_label}
                            </td>

                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 font-semibold text-gray-800 text-right whitespace-nowrap">
                              {student.disbursement_amount ? (
                                `₱${Number(
                                  student.disbursement_amount
                                ).toLocaleString()}`
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-3 max-w-[300px]">
                              {student.disbursement_files &&
                              student.disbursement_files.length > 0 ? (
                                <div className="space-y-1">
                                  {student.disbursement_files.map(
                                    (file, index) => (
                                      <a
                                        key={index}
                                        href={`${VITE_BACKEND_URL}api/document/download/${file.file_name}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-blue-600 hover:text-blue-800 hover:underline truncate"
                                        title={file.file_name}
                                      >
                                        📄 {student.scholar_name} - Invoice
                                      </a>
                                    )
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">
                                  No files
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {filteredStudents.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-800 mb-1">
                          No Students
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3">
                    {filteredStudents
                      .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                      .map((student) => (
                        <div
                          key={student.renewal_id}
                          className={`p-4 rounded-lg shadow-sm border ${
                            !student.disbursement_files?.length
                              ? "bg-red-50/70 border-red-200"
                              : "bg-white/30 border-gray-200"
                          }`}
                        >
                          {/* Student Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                {student.scholar_name}
                              </h3>
                              <p className="text-xs text-gray-600 font-mono mt-0.5">
                                ID: {student.student_id}
                              </p>
                            </div>
                            <span
                              className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                student.disbursement_status === "Completed"
                                  ? "bg-green-100 text-green-700"
                                  : student.disbursement_status === "Pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {student.disbursement_status}
                            </span>
                          </div>

                          {/* Student Details Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div>
                              <span className="text-gray-500 block">
                                Campus
                              </span>
                              <span className="text-gray-700 font-medium">
                                {student.campus}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">
                                Year Level
                              </span>
                              <span className="text-gray-700 font-medium">
                                {student.year_level}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500 block">
                                Program
                              </span>
                              <span className="text-gray-700 font-medium">
                                {student.program}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500 block">
                                Disbursement Label
                              </span>
                              <span className="text-gray-700 font-medium">
                                {student.disbursement_label}
                              </span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="flex justify-between items-center py-2 border-t border-gray-200">
                            <span className="text-xs text-gray-500">
                              Amount
                            </span>
                            <span className="text-sm font-semibold text-gray-800">
                              {student.disbursement_amount ? (
                                `₱${Number(
                                  student.disbursement_amount
                                ).toLocaleString()}`
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </span>
                          </div>

                          {/* Files */}
                          {student.disbursement_files &&
                          student.disbursement_files.length > 0 ? (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-xs text-gray-500 block mb-2">
                                Files
                              </span>
                              <div className="space-y-1.5">
                                {student.disbursement_files.map(
                                  (file, index) => (
                                    <a
                                      key={index}
                                      href={`${VITE_BACKEND_URL}api/document/download/${file.file_name}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                      <svg
                                        className="w-4 h-4 flex-shrink-0"
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
                                      <span className="truncate">
                                        {student.scholar_name} - Invoice
                                      </span>
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-xs text-gray-400 italic">
                                No files uploaded
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Pagination Footer - Only show if there are filtered results */}
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
          )}
          {/* Empty State - No Students */}
          {!isLoading && students.length === 0 && (
            <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-2xl border border-gray-200 shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800 mb-1">
                    No Students Found
                  </p>
                  <p className="text-sm text-gray-600">
                    There are no students enrolled for {schoolYear} • {semester}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {showUploadConfirmation && (
        <UploadConfirmationModal
          selectedFile={selectedFile}
          fileSize={fileSize}
          onCancel={() => setShowUploadConfirmation(false)}
          onConfirm={() => selectedFile && handleFileExtract(selectedFile)}
        />
      )}

      {/* Full-Screen Loading Overlay for Processing */}
      {isProcessing && <UploadProcessingModal jobStatus={jobStatus} />}

      {showUploadMatchedConfirmation && (
        <UploadMatchedConfirmationModal
          jobStatus={jobStatus}
          students={students}
          onCancel={() => setShowUploadMatchedConfirmation(false)}
          onConfirm={handleUploadToStudents}
        />
      )}

      {/* Full-Screen Loading Overlay for Uploading */}
      {isUploading && (
        <UploadingModal
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
          uploadedFilesCount={uploadedFilesCount}
          totalFilesToUpload={totalFilesToUpload}
        />
      )}
    </div>
  );
};

export default TuitionUpload;
