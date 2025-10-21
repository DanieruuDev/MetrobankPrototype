import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import DisbursementTable from "../../../components/invoice/DisbursementTable";
import { Student } from "../../../Interface/InvoiceUpload";
import { Upload, Download, Save } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import ConfirmationDialog from "../../../components/shared/ConfirmationDialog";
import { useAuth } from "../../../context/AuthContext";

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
      <div className="flex flex-wrap justify-between items-center bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div>
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

        {/* 🧩 Action Buttons – Visible only to Role 3 */}
        {role === 3 && (
          <div className="flex items-center gap-2">
            {/* Download Template */}
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>

            {/* Upload Excel */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                uploading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Excel
            </button>

            <input
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleUploadExcel}
              className="hidden"
            />

            {/* Save */}
            <button
              onClick={handleSaveClick}
              disabled={uploading || uploadedData.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${
                uploadedData.length === 0 || uploading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
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
