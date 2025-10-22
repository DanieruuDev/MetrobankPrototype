import React, { useState, useEffect } from "react";
import DisbursementTable from "../../../components/invoice/DisbursementTable";
import { Student } from "../../../Interface/ITuitionInvoice";
import axios from "axios";
import { toast } from "react-toastify";
import ConfirmationDialog from "../../../components/shared/ConfirmationDialog";
import { useAuth } from "../../../context/AuthContext";
import { useProcess } from "../../../context/ProcessContext";
import { UploadStatusBE } from "./TuitionInvoiceUpload";

interface SemestralUploadProps {
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

interface AllowanceBox {
  yearLevel: string;
  amount: string;
  error?: string;
}

function SemestralInvoice({
  students,
  filteredStudents,
  fetchStudents,
  schoolYear,
  semester,
  isLoading,
  setSelectedBranch,
  setSelectedYearLevel,
  setSelectedProgram,
  type,
}: SemestralUploadProps) {
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [allowances, setAllowances] = useState<AllowanceBox[]>([]);
  const [displayedStudents, setDisplayedStudents] =
    useState<Student[]>(students);
  const auth = useAuth();
  const role = auth?.user?.role_id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // ✅ loading state
  const { processInfo, getProcessInfo } = useProcess();
  const [uploadStatusBE, setIsUploadStatusBE] = useState<UploadStatusBE | null>(
    null
  );
  const [, setIsUploadStatusHR] = useState<UploadStatusBE[] | null>([]);
  // 🎓 Extract year levels
  const availableYearLevels = Array.from(
    new Set(students.map((s) => s.year_level))
  ).filter(Boolean);

  useEffect(() => {
    if (students.length > 0) {
      setDisplayedStudents(students);
      if (allowances.length === 0 && availableYearLevels.length > 0) {
        setAllowances([
          {
            yearLevel: availableYearLevels[0],
            amount: "",
          },
        ]);
      }
    }
  }, [students]);

  const handleAddAllowance = () => {
    if (allowances.length >= availableYearLevels.length) {
      toast.warning("All year levels are already configured.");
      return;
    }

    const unusedLevels = availableYearLevels.filter(
      (lvl) => !allowances.some((a) => a.yearLevel === lvl)
    );

    if (unusedLevels.length > 0) {
      setAllowances([
        ...allowances,
        { yearLevel: unusedLevels[0], amount: "", error: "" },
      ]);
    }
  };

  const handleRemoveAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const handleYearLevelChange = (index: number, newLevel: string) => {
    const updated = [...allowances];
    updated[index].yearLevel = newLevel;
    setAllowances(updated);
  };

  const handleAmountChange = (index: number, value: string) => {
    const updated = [...allowances];
    let numericValue = Number(value);
    if (numericValue < 0) numericValue = 0;
    if (numericValue > 100000) numericValue = 100000;
    updated[index].amount = numericValue.toString();
    updated[index].error =
      numericValue > 100000
        ? "Maximum allowed is ₱100,000."
        : numericValue < 0
        ? "Amount cannot be negative."
        : "";
    setAllowances(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
  };

  // 💾 Confirm and Save
  const handleSaveConfirmed = async () => {
    setIsDialogOpen(false);
    setIsUploading(true);

    const payload = students
      .map((s) => {
        const match = allowances.find((a) => a.yearLevel === s.year_level);
        if (!match) return null;

        const newAmount =
          match.amount === "" || match.amount == null
            ? 0
            : Number(match.amount);
        const oldAmount = Number(s.disbursement_amount) || 0;

        if (newAmount !== oldAmount) {
          return {
            disb_detail_id: s.disb_detail_id,
            disbursement_amount: newAmount,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (payload.length === 0) {
      toast.info("No changes detected.");
      setIsUploading(false);
      return;
    }

    try {
      const response = await axios.put(
        `${VITE_BACKEND_URL}api/invoice/upload-semestral`,
        { data: payload }
      );

      if (response.data.success) {
        toast.success(
          `✅ ${
            response.data.updatedCount || payload.length
          } record(s) updated.`
        );
        fetchStudents();
      } else {
        toast.error("Failed to save allowances.");
      }
    } catch (error) {
      console.error("❌ Error saving:", error);
      toast.error("Server error while saving allowances.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveClick = () => {
    if (allowances.length === 0) {
      toast.warning("Please add at least one year level before uploading.");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleComplete = async () => {
    const program_source = "METROBANK";
    const process_id = processInfo.process_id;
    const branch_name = "-";
    const disbursement_type_id = 2; // ✅ You mentioned "1" — use as fixed or dynamic as needed

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
    const program_source = "METROBANK";
    const process_id = processInfo.process_id;
    const branch_name = "All";
    const disbursement_type_id = 2;

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

  if (role !== 7) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-600">
        <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
        <p className="text-sm text-gray-500">
          You don’t have permission to access the Semestral Allowance section.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        message={`You are about to upload semestral allowance amounts for ${allowances.length} year level(s). 
This will update all scholars under those year levels.`}
        confirmText={isUploading ? "Uploading..." : "Upload Now"}
        cancelText="Cancel"
        onConfirm={!isUploading ? handleSaveConfirmed : () => {}}
        onCancel={() => !isUploading && setIsDialogOpen(false)}
      />

      {/* Overlay while saving */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] text-white">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg font-medium">Uploading allowances...</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Semestral Allowance Configuration
            </h2>
            <p className="text-sm text-gray-500">
              School Year: <span className="font-medium">{schoolYear}</span> |{" "}
              Semester: <span className="font-medium">{semester}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddAllowance}
              disabled={isUploading}
              className={`${
                isUploading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              } text-white px-3 py-2 rounded-lg text-sm font-medium transition`}
            >
              + Add Year Level
            </button>
            <button
              onClick={handleSaveClick}
              disabled={isUploading}
              className={`${
                isUploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white px-4 py-2 rounded-lg text-sm font-medium transition`}
            >
              {isUploading ? "Uploading..." : "Upload Amount"}
            </button>
          </div>
        </div>

        {/* Allowance Inputs */}
        <div className="flex flex-wrap gap-3">
          {allowances.map((a, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-all"
            >
              {/* Dropdown */}
              <select
                value={a.yearLevel}
                onChange={(e) => handleYearLevelChange(index, e.target.value)}
                className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
              >
                {availableYearLevels
                  .filter(
                    (lvl) =>
                      lvl === a.yearLevel ||
                      !allowances.some((al) => al.yearLevel === lvl)
                  )
                  .map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
              </select>

              {/* Amount */}
              <div className="flex items-center gap-1">
                <span className="text-gray-600 text-sm font-medium">₱</span>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  step="1"
                  value={a.amount}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => handleAmountChange(index, e.target.value)}
                  placeholder="0.00"
                  disabled={isUploading}
                  className={`w-24 sm:w-28 border rounded-md px-2 py-1 text-sm text-right focus:ring-2 focus:outline-none ${
                    a.error
                      ? "border-red-500 focus:ring-red-400"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemoveAllowance(index)}
                disabled={isUploading}
                className="text-red-500 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      {filteredStudents?.filter(
        (s) => !s.disbursement_amount || Number(s.disbursement_amount) <= 0
      ).length === 0 &&
        uploadStatusBE &&
        (uploadStatusBE.is_completed ? (
          <div className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold shadow-md border border-blue-700">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="tracking-wide">✅ Ready for Approval</span>
          </div>
        ) : (
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
            <span className="tracking-wide">Finalize</span>
          </button>
        ))}

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
        type={type}
      />
    </div>
  );
}

export default SemestralInvoice;
