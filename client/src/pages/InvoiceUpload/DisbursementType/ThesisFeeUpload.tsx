import React, { useState, useEffect } from "react";
import axios from "axios";
import DisbursementTable from "../../../components/invoice/DisbursementTable";
import { Student } from "../../../Interface/InvoiceUpload";
import { Upload, Download, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ConfirmationDialog from "../../../components/shared/ConfirmationDialog";
import { useAuth } from "../../../context/AuthContext";
import UploadExcelModal from "../../../components/invoice/thesis-fee/UploadExcelModal";

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
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState("");
  const [uploadedData, setUploadedData] = useState<UploadedThesisFee[]>([]);
  const [displayedStudents, setDisplayedStudents] =
    useState<Student[]>(students);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
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

  // 📤 Handle Excel Modal Upload
  const handleExcelModalUpload = (parsed: Record<string, unknown>[]) => {
    const typedParsed = parsed as unknown as UploadedThesisFee[];
    setUploadedData(typedParsed);

    // Show preview of what will be updated (without actually applying changes)
    const preview = students.map((student) => {
      const found = typedParsed.find(
        (p) => p.StudentID?.toString() === student.student_id?.toString()
      );
      if (found) {
        return {
          ...student,
          disbursement_amount: found.ThesisFeeAmount || 0,
          _isUpdated: true, // Mark as updated for preview
        };
      }
      return student;
    });

    setDisplayedStudents(preview);
    toast.success(
      `✅ Excel uploaded successfully (${typedParsed.length} records ready for review). Click Save to apply changes.`
    );
  };

  // 💾 Confirm before saving
  const handleSaveClick = () => {
    if (uploadedData.length === 0) {
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

  // ❌ Cancel uploaded data
  const handleCancelUpload = () => {
    setUploadedData([]);
    setDisplayedStudents(students); // Reset to original data
    toast.info("Uploaded data cleared. Table reset to original values.");
  };

  // 💾 Confirm and Save
  const handleSaveConfirmed = async () => {
    setIsDialogOpen(false);
    setIsSaving(true);
    setSaveProgress(0);
    setSaveStatus("Preparing to save changes...");

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

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setSaveProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95; // Stop at 95% until operation completes
          }
          return prev + 1;
        });
      }, 30); // Update every 30ms for smooth animation

      // Update status messages at different progress points
      const statusTimeout1 = setTimeout(() => {
        setSaveStatus("Sending data to server...");
      }, 500);

      const statusTimeout2 = setTimeout(() => {
        setSaveStatus("Processing response...");
      }, 1500);

      const statusTimeout3 = setTimeout(() => {
        setSaveStatus("Refreshing data...");
      }, 2500);

      const response = await axios.put(
        `${VITE_BACKEND_URL}api/invoice/update-thesis-fee-amounts`,
        { data: JSON.stringify(payload) },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Clear timeouts and interval after successful request
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
      clearTimeout(statusTimeout3);
      clearInterval(progressInterval);

      // Complete the progress animation
      setSaveProgress(100);

      if (response.data.success) {
        toast.success(
          `✅ ${
            response.data.updatedCount || payload.length
          } students updated successfully.`
        );
        // Clear uploaded data and reset to original state
        setUploadedData([]);
        setDisplayedStudents(students);
        fetchStudents();
      } else {
        toast.error(response.data.message || "Upload failed.");
      }

      // Add a small delay to show 100% completion before closing
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.error("An error occurred during upload.");
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
      setSaveStatus("");
    }
  };

  return (
    <div className="px-3 sm:px-4 lg:px-6 space-y-4 sm:space-y-6 relative">
      {/* 🧭 Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        message="You are about to save the Thesis Fee amounts to the database. This will permanently update disbursement records for all listed scholars. Are you sure you want to proceed?"
        confirmText="Save Changes"
        cancelText="Cancel"
        isLoading={isSaving}
        onConfirm={!isSaving ? handleSaveConfirmed : () => {}}
        onCancel={() => !isSaving && setIsDialogOpen(false)}
      />

      {/* 📊 Excel Upload Modal */}
      <UploadExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onUpload={handleExcelModalUpload}
      />

      {/* Save Progress Overlay - RenewalListV2 Style */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[10001] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-32 h-32 mb-6">
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
                      2 * Math.PI * 50 * (1 - saveProgress / 100)
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
                      {Math.round(saveProgress)}%
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
                {saveStatus || "Processing your changes..."}
              </p>

              <p className="text-xs text-gray-500 text-center">
                Please do not close this window
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-wrap justify-between items-center bg-white border border-gray-200 rounded-xl shadow-sm p-3 sm:p-4">
        <div className="flex items-center gap-3">
          {/* Mobile: Icon + Compact Text */}
          <div className="flex items-center gap-2 sm:hidden">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
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
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 leading-tight">
                Thesis Fee
              </h2>
              <p className="text-xs text-gray-500 leading-tight">
                {schoolYear} | {semester}
              </p>
            </div>
          </div>

          {/* Desktop: Full Text */}
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-800">
              Thesis Fee Upload
            </h2>
            <p className="text-sm text-gray-500">
              School Year:{" "}
              <span className="font-medium text-gray-700">{schoolYear}</span> |{" "}
              Semester:{" "}
              <span className="font-medium text-gray-700">{semester}</span>
            </p>
          </div>
        </div>

        {/* 🧩 Action Buttons – Visible only to Role 3 */}
        {role === 3 && (
          <div className="grid grid-cols-1 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
            {/* Show Download and Upload buttons when NO uploaded data */}
            {uploadedData.length === 0 && (
              <>
                {/* Download Template - Mobile: Icon only, Desktop: Full text */}
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm w-full whitespace-nowrap"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Download</span>
                  <span className="sm:hidden">Download</span>
                </button>

                {/* Upload Excel - Mobile: Icon only, Desktop: Full text */}
                <button
                  onClick={() => setIsExcelModalOpen(true)}
                  disabled={isSaving}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm w-full whitespace-nowrap ${
                    isSaving
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Upload</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              </>
            )}

            {/* Show Cancel and Save buttons when there IS uploaded data */}
            {uploadedData.length > 0 && (
              <>
                {/* Cancel - Mobile: Icon only, Desktop: Full text */}
                <button
                  onClick={handleCancelUpload}
                  disabled={isSaving}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm w-full ${
                    isSaving
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-500 hover:bg-gray-700 text-white"
                  }`}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">Cancel</span>
                </button>

                {/* Save - Mobile: Icon only, Desktop: Full text */}
                <button
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className={`flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm w-full ${
                    isSaving
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Save</span>
                  <span className="sm:hidden">Save</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

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
  );
}

export default ThesisFeeUpload;
