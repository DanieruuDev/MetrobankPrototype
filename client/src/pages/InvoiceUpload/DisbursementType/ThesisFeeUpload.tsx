import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import DisbursementTable from "../../../components/invoice/DisbursementTable";
import { Student } from "../../../Interface/InvoiceUpload";
import { Upload, Download, Save } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ConfirmationDialog from "../../../components/shared/ConfirmationDialog";
import { useAuth } from "../../../context/AuthContext";
import { useProcess } from "../../../context/ProcessContext";
import { UploadStatusBE } from "./TuitionInvoiceUpload";

interface ThesisFeeUploadProps {
  students: Student[];
  filteredStudents: Student[];
  fetchStudents: () => void;
  schoolYear: string;
  semester: string;
  role: number | undefined;
  isLoading: boolean;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string>>;
  setSelectedYearLevel: React.Dispatch<React.SetStateAction<string>>;
  setSelectedProgram: React.Dispatch<React.SetStateAction<string>>;
  type: string;
}

interface UploadedThesisFee {
  StudentID: string | number;
  ThesisFeeAmount: number;
}

function ThesisFeeUpload({
  students,
  filteredStudents,
  fetchStudents,
  schoolYear,
  semester,
  isLoading,
  setSelectedBranch,
  setSelectedYearLevel,
  setSelectedProgram,
}: ThesisFeeUploadProps) {
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<UploadedThesisFee[]>([]);
  const [displayedStudents, setDisplayedStudents] =
    useState<Student[]>(students);
  const { processInfo, getProcessInfo } = useProcess();
  const [uploadStatusBE, setIsUploadStatusBE] = useState<UploadStatusBE | null>(
    null
  );
  const [uploadStatusHR, setIsUploadStatusHR] = useState<
    UploadStatusBE[] | null
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const auth = useAuth();
  const role = auth.info?.role_id;

  useEffect(() => {
    setDisplayedStudents(students);
  }, [students]);

  // 📥 Download Template
  const handleDownloadTemplate = () => {
    if (students.length === 0) {
      toast.info("No students available for export.");
      return;
    }

    const data = students.map((s) => ({
      StudentID: s.student_id,
      ScholarName: s.scholar_name,
      Campus: s.campus,
      YearLevel: s.year_level,
      Program: s.program,
      ThesisFeeAmount: s.disbursement_amount || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thesis Fee Data");
    XLSX.writeFile(workbook, `ThesisFee_${schoolYear}_${semester}.xlsx`);
    toast.success("✅ Thesis Fee Excel file downloaded successfully.");
  };

  // 📤 Upload Excel File — Parse and store locally
  const handleUploadExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsed = XLSX.utils.sheet_to_json(sheet) as UploadedThesisFee[];

        setUploadedData(parsed);

        // Merge uploaded data
        const merged = students.map((student) => {
          const found = parsed.find(
            (p) => p.StudentID?.toString() === student.student_id?.toString()
          );
          if (found) {
            return {
              ...student,
              disbursement_amount: found.ThesisFeeAmount || 0,
            };
          }
          return student;
        });

        setDisplayedStudents(merged);
        toast.success(
          `✅ Excel uploaded successfully (${parsed.length} records merged).`
        );
      } catch (error) {
        console.error("❌ Error reading Excel:", error);
        toast.error("Invalid Excel file. Please check format.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 💾 Confirm before saving
  const handleSaveClick = () => {
    if (!excelFile) {
      toast.error("Please upload an Excel file first.");
      return;
    }

    const changedStudents = displayedStudents.filter((student) => {
      const original = students.find(
        (s) => s.disb_detail_id === student.disb_detail_id
      );
      return (
        original &&
        Number(original.disbursement_amount || 0) !==
          Number(student.disbursement_amount || 0)
      );
    });

    if (changedStudents.length === 0) {
      toast.info("No changes detected to save.");
      return;
    }

    setIsDialogOpen(true);
  };

  // 💾 Confirm and Save
  const handleSaveConfirmed = async () => {
    setIsDialogOpen(false);
    setUploading(true);

    const changedStudents = displayedStudents.filter((student) => {
      const original = students.find(
        (s) => s.disb_detail_id === student.disb_detail_id
      );
      return (
        original &&
        Number(original.disbursement_amount || 0) !==
          Number(student.disbursement_amount || 0)
      );
    });

    const payload = changedStudents.map((s) => ({
      disb_detail_id: s.disb_detail_id,
      disbursement_amount: s.disbursement_amount,
    }));

    const formData = new FormData();
    if (excelFile) formData.append("file", excelFile);
    formData.append("data", JSON.stringify(payload));

    try {
      const response = await axios.post(
        `${VITE_BACKEND_URL}api/invoice/upload-thesis-fee`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast.success(
          `✅ ${
            response.data.updatedCount || payload.length
          } students updated successfully.`
        );
        fetchStudents();
      } else {
        toast.error(response.data.message || "Upload failed.");
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.error("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    const program_source = "STI";
    const process_id = processInfo.process_id;
    const branch_name = auth.info?.branch?.branch_name;
    const disbursement_type_id = 3;

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
    const disbursement_type_id = 3;

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

  return (
    <div className="px-4 sm:px-6 space-y-6 relative">
      {/* 🧭 Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        message="You are about to upload the Thesis Fee amounts. This will update disbursement records for all listed scholars."
        confirmText={uploading ? "Saving..." : "Upload Now"}
        cancelText="Cancel"
        onConfirm={!uploading ? handleSaveConfirmed : () => {}}
        onCancel={() => !uploading && setIsDialogOpen(false)}
      />

      {/* 🌀 Overlay while uploading/saving */}
      {uploading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] text-white">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium">Processing upload...</p>
        </div>
      )}

      {/* Header Toolbar */}
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
                  <strong>Action Required:</strong> Waiting for HR to finalize
                  the process. You can upload the thesis fees{" "}
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
                  🎯 All thesis fees have been finalized and submitted
                  successfully. The process is now{" "}
                  <strong>ready for Approvals</strong>.
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
                  ⏰ <strong>Upload now</strong> to complete scholar thesis fee
                  processing
                  {filteredStudents && (
                    <span className="ml-2 text-red-600">
                      Remaining:{" "}
                      <span className="text-red-700 font-semibold">
                        {
                          filteredStudents.filter(
                            (s) =>
                              !s.disbursement_amount ||
                              s.disbursement_amount === 0
                          ).length
                        }
                      </span>
                    </span>
                  )}
                </p>

                {/* Buttons Section */}
                {role === 3 && (
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Download Template Button */}
                    <button
                      className="group w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-blue-700"
                      onClick={handleDownloadTemplate}
                      aria-label="Download template"
                    >
                      <div className="relative">
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                          📥
                        </span>
                      </div>
                      <span className="tracking-wide">Download Excel</span>
                    </button>

                    {/* Upload Excel Button */}
                    <button
                      className="group w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-blue-700"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      aria-label="Upload excel"
                    >
                      <div className="relative">
                        <Upload className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                          📤
                        </span>
                      </div>
                      <span className="tracking-wide">Upload Excel</span>
                    </button>

                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      ref={fileInputRef}
                      onChange={handleUploadExcel}
                      className="hidden"
                    />

                    {/* Save Button */}
                    {uploadedData.length > 0 && (
                      <button
                        className="group w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-blue-700 animate-pulse"
                        onClick={handleSaveClick}
                        disabled={uploading}
                        aria-label="Save changes"
                      >
                        <div className="relative">
                          <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                            💾
                          </span>
                        </div>
                        <span className="tracking-wide">Save</span>
                      </button>
                    )}

                    {/* Finalize Button */}
                    {filteredStudents?.filter(
                      (s) =>
                        !s.disbursement_amount || s.disbursement_amount === 0
                    ).length === 0 &&
                      uploadStatusBE &&
                      !uploadStatusBE.is_completed && (
                        <button
                          className="group w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 border border-transparent hover:border-emerald-700 animate-pulse"
                          aria-label="Finalize thesis fee processing"
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
                          <span className="tracking-wide">Finalize</span>
                        </button>
                      )}
                  </div>
                )}

                {/* Completion Message */}
                {filteredStudents?.filter(
                  (s) => !s.disbursement_amount || s.disbursement_amount === 0
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
                    <span>All thesis fees uploaded successfully!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
                  🎉 All branches have successfully finalized their uploads. The
                  disbursement process is now{" "}
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
                    status.is_completed ? "text-emerald-700" : "text-red-700"
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

      {/* Table Header with SY/Semester and Upload Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg overflow-hidden relative z-0">
        {/* Table */}
        <DisbursementTable
          students={students}
          filteredStudents={filteredStudents.map((s) => {
            const updated = displayedStudents.find(
              (u) => u.renewal_id === s.renewal_id
            );
            return updated || s;
          })}
          isLoading={isLoading}
          schoolYear={schoolYear}
          semester={semester}
          VITE_BACKEND_URL={VITE_BACKEND_URL}
          setSelectedBranch={setSelectedBranch}
          setSelectedYearLevel={setSelectedYearLevel}
          setSelectedProgram={setSelectedProgram}
          type="thesis_fee"
        />
      </div>
    </div>
  );
}

export default ThesisFeeUpload;
