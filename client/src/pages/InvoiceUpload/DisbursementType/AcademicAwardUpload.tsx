import React, { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Paperclip, X, Save } from "lucide-react";
import PaginationControl from "../../../components/shared/PaginationControl";
import AddEligibleScholarModal from "../../../components/invoice/academic-award/AddEligibleScholarModal";
import { Student } from "../../../Interface/InvoiceUpload";
import { useAuth } from "../../../context/AuthContext";
import { StudentFile } from "../../../Interface/InvoiceUpload";
import axios from "axios";
import { useProcess } from "../../../context/ProcessContext";
import { UploadStatusBE } from "./TuitionInvoiceUpload";
import { toast } from "react-toastify";

interface AcademicAwardUploadProps {
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

const AcademicAwardUpload: React.FC<AcademicAwardUploadProps> = ({
  students,
  filteredStudents,
  fetchStudents,
  schoolYear,
  semester,
  isLoading,
}) => {
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const auth = useAuth();
  const branch_name = auth.info?.branch?.branch_name;
  const role = auth.info?.role_id;
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedScholar, setSelectedScholar] = useState<{
    id: number | null;
    name: string;
  }>({ id: null, name: "" });
  const { processInfo, getProcessInfo } = useProcess();
  const [uploadStatusBE, setIsUploadStatusBE] = useState<UploadStatusBE | null>(
    null
  );
  const [uploadStatusHR, setIsUploadStatusHR] = useState<
    UploadStatusBE[] | null
  >([]);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const itemsPerPage = 10;

  const [awardData, setAwardData] = useState<
    Record<number, { honor: string; amount: number; file?: File | null }>
  >({});

  const honorMap: Record<string, number> = {
    "Cum Laude": 10000,
    "Magna Cum Laude": 15000,
    "Summa Cum Laude": 20000,
  };

  const safeKey = (id: number | null): number => id ?? -1;

  const handleHonorChange = (disbId: number, honor: string) => {
    const amount = honorMap[honor] || 0;
    setAwardData((prev) => ({
      ...prev,
      [disbId]: { ...prev[disbId], honor, amount },
    }));
  };

  const openUploadModal = (id: number, name: string) => {
    setSelectedScholar({ id, name });
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    if (selectedScholar.id !== null) {
      setAwardData((prev) => {
        const updated = { ...prev };
        const key = safeKey(selectedScholar.id);
        if (updated[key]) updated[key].file = null;
        return updated;
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedScholar({ id: null, name: "" });
    setShowUploadModal(false);
  };

  const handleFileSelect = (disbId: number, file: File) => {
    setAwardData((prev) => ({
      ...prev,
      [disbId]: { ...prev[disbId], file },
    }));
  };

  const handleMockUploadToStudent = (disbDetailId: number, file: File) => {
    const student = filteredStudents.find(
      (s) => s.disb_detail_id === disbDetailId
    );
    if (!student) return;

    // Update student's disbursement_files locally
    if (!student.disbursement_files) student.disbursement_files = [];
    student.disbursement_files = [
      {
        file_id: Date.now(),
        file_name: file.name,
        file_type: file.type,
        size: file.size,
        upload_at: new Date().toISOString(),
        file,
      } as StudentFile,
    ];

    closeUploadModal();
  };

  const getHonorFromAmount = (amount: number | null | undefined): string => {
    if (!amount) return "";
    if (amount === 10000) return "Cum Laude";
    if (amount === 15000) return "Magna Cum Laude";
    if (amount === 20000) return "Summa Cum Laude";
    return "";
  };

  const handleDelete = async (disb_detail_id: number | null) => {
    if (!disb_detail_id) return;
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(
        `${VITE_BACKEND_URL}api/invoice/remove-academic-award`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disb_detail_id }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("✅ Academic award removed successfully.");
        fetchStudents();
      } else alert(`⚠️ ${data.message || "Failed to delete."}`);
    } catch (err) {
      console.error(err);
      alert("Server error while deleting award.");
    }
  };

  const handleSaveList = async () => {
    const payload = filteredStudents
      .map((student) => {
        const key = safeKey(student.disb_detail_id);
        const award = awardData[key];

        // ✅ Get file either from awardData or student.disbursement_files
        const file =
          award?.file ||
          (student.disbursement_files?.length
            ? student.disbursement_files[0].file
            : null);

        if (award && student.disb_detail_id) {
          return {
            disb_detail_id: student.disb_detail_id,
            amount: award.amount || 0,
            file,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    console.log("📦 Final Payload to upload:", payload);

    try {
      const formData = new FormData();

      payload.forEach((item) => {
        formData.append("disb_detail_ids[]", item.disb_detail_id.toString());
        formData.append("amounts[]", item.amount.toString());
        if (item.file) formData.append("files[]", item.file);
      });

      // 🧠 Debug check
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axios.post(
        `${VITE_BACKEND_URL}api/invoice/upload-academic-award`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response.data);

      if (response.status === 200) {
        alert("✅ Academic award list successfully saved!");
        fetchStudents(); // refresh table
      } else {
        alert(`⚠️ ${response.data?.message || "Failed to save awards."}`);
      }
    } catch (err) {
      console.error("❌ Error saving list:", err);
      alert(`Server error while saving awards: ${err}`);
    }
  };

  const handleComplete = async () => {
    const program_source = "STI";
    const process_id = processInfo.process_id;
    const branch_name = auth.info?.branch?.branch_name;
    const disbursement_type_id = 5;

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
    const disbursement_type_id = 5;

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUploadModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closeUploadModal();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUploadModal]);

  if (isLoading)
    return (
      <div className="text-center py-12 text-gray-500">Loading data...</div>
    );

  if (!students.length)
    return (
      <div className="text-center py-16 bg-white rounded-2xl border shadow-md">
        <p className="text-lg font-semibold text-gray-800">No Students Found</p>
        <p className="text-sm text-gray-600">
          No students enrolled for {schoolYear} • {semester}
        </p>
      </div>
    );

  const paginated = filteredStudents.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="px-4 sm:px-6 space-y-6">
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
                    <strong>Action Required:</strong> Waiting for HR to finalize
                    the process. You can upload the invoice{" "}
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
                    🎯 All awards have been finalized and submitted
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
                    ⏰ <strong>Upload now</strong> to complete scholar award
                    processing
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
                          aria-label="Finalize award processing"
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

                  {/* Completion Message */}
                  {filteredStudents?.filter(
                    (s) =>
                      !s.disbursement_files || s.disbursement_files.length === 0
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
                      <span>All awards uploaded successfully!</span>
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
                  Last updated:
                  {status.updated_at
                    ? new Date(status.updated_at).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </p>

                {status.is_completed && status.completed_at && (
                  <p className="text-[11px] text-gray-500">
                    Completed:
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
      {/* 🏅 Criteria */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl shadow-sm p-5 relative">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🏆 Academic Excellence Award Criteria
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Scholars are granted financial incentives based on GPA:
        </p>
        <table className="mt-4 text-sm w-full text-gray-700">
          <thead>
            <tr className="bg-yellow-100 border-b border-yellow-200 text-gray-800 font-medium">
              <th className="px-4 py-2 text-left">GPA Range</th>
              <th className="px-4 py-2 text-left">Award Amount</th>
              <th className="px-4 py-2 text-left">Recognition</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-yellow-100">
              <td className="px-4 py-2">90.00 – 94.99</td>
              <td className="px-4 py-2 font-semibold">₱10,000</td>
              <td className="px-4 py-2">Cum Laude</td>
            </tr>
            <tr className="border-b border-yellow-100">
              <td className="px-4 py-2">95.00 – 97.99</td>
              <td className="px-4 py-2 font-semibold">₱15,000</td>
              <td className="px-4 py-2">Magna Cum Laude</td>
            </tr>
            <tr>
              <td className="px-4 py-2">98.00 – 100.00</td>
              <td className="px-4 py-2 font-semibold">₱20,000</td>
              <td className="px-4 py-2">Summa Cum Laude</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500 italic">
          Awards are granted once after graduation based on semester GPA.
        </p>

        {role === 3 && !uploadStatusBE?.is_completed && (
          <div className="absolute top-5 right-5 flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Get Eligible Scholars
            </button>
            <button
              onClick={handleSaveList}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
            >
              <Save className="w-4 h-4" /> Save List
            </button>
          </div>
        )}
      </div>
      {/* 📋 Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg overflow-hidden relative z-0">
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex justify-between">
          <div>
            <p className="font-semibold text-gray-800">
              {schoolYear} • {semester}
            </p>
            <span className="text-sm text-gray-700">
              Total: <b>{filteredStudents.length}</b>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Student ID</th>
                <th className="px-4 py-3 text-left">Scholar Name</th>
                <th className="px-4 py-3 text-left">Campus</th>
                <th className="px-4 py-3 text-left">Year Level</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Files</th>
                <th className="px-4 py-3 text-left">Award</th>
                {role !== 7 && !uploadStatusBE?.is_completed ? (
                  <th className="px-4 py-3 text-center">Action</th>
                ) : (
                  <th></th>
                )}
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {paginated.map((s, i) => {
                const key = safeKey(s.disb_detail_id);
                return (
                  <tr
                    key={s.renewal_id}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="px-4 py-3 font-mono">{s.student_id}</td>
                    <td className="px-4 py-3">{s.scholar_name}</td>
                    <td className="px-4 py-3">{s.campus}</td>
                    <td className="px-4 py-3 text-center">{s.year_level}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {awardData[key]?.amount
                        ? `₱${awardData[key]?.amount.toLocaleString()}`
                        : s.disbursement_amount
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
                            📄 {file.file_name}
                          </a>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">No files</span>
                      )}
                    </td>
                    {/* Award Dropdown */}
                    <td className="px-4 py-3">
                      {role === 7 || uploadStatusBE?.is_completed ? (
                        // 🔒 HR or completed state can only view honor (no dropdown)
                        <span className="text-gray-700">
                          {getHonorFromAmount(Number(s.disbursement_amount)) ||
                            "—"}
                        </span>
                      ) : (
                        // 👤 Other roles can modify
                        <select
                          className="border border-gray-300 rounded-md text-sm p-1"
                          value={
                            awardData[key]?.honor ||
                            getHonorFromAmount(Number(s.disbursement_amount)) ||
                            ""
                          }
                          onChange={(e) =>
                            s.disb_detail_id &&
                            handleHonorChange(s.disb_detail_id, e.target.value)
                          }
                        >
                          <option value="">Select Honor</option>
                          <option value="Cum Laude">Cum Laude</option>
                          <option value="Magna Cum Laude">
                            Magna Cum Laude
                          </option>
                          <option value="Summa Cum Laude">
                            Summa Cum Laude
                          </option>
                        </select>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3 text-center">
                      {role !== 7 && !uploadStatusBE?.is_completed && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              s.disb_detail_id &&
                              openUploadModal(s.disb_detail_id, s.scholar_name)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.disb_detail_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="py-4 border-t border-gray-200 flex justify-center bg-gray-50">
          <PaginationControl
            currentPage={page}
            totalPages={Math.ceil(filteredStudents.length / itemsPerPage)}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal &&
        selectedScholar.id !== null &&
        !uploadStatusBE?.is_completed && (
          <div
            ref={modalRef}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-lg shadow-xl w-80 relative">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                  <Paperclip className="w-4 h-4" /> Upload File
                </h3>
                <button
                  onClick={closeUploadModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-600 mb-2 truncate">
                {selectedScholar.name}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && selectedScholar.id !== null) {
                    handleFileSelect(selectedScholar.id, file);
                  }
                }}
                className="block w-full text-xs text-gray-600 file:px-3 file:py-1.5 file:border file:border-gray-300 file:rounded-md file:bg-gray-100 hover:file:bg-gray-200"
              />

              {awardData[safeKey(selectedScholar.id)]?.file && (
                <p className="text-xs text-green-700 mt-2 truncate">
                  ✅ {awardData[safeKey(selectedScholar.id)]?.file?.name}
                </p>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={closeUploadModal}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const file = awardData[safeKey(selectedScholar.id)]?.file;
                    if (file && selectedScholar.id !== null) {
                      handleMockUploadToStudent(selectedScholar.id, file);
                    }
                  }}
                  disabled={!awardData[safeKey(selectedScholar.id)]?.file}
                  className={`px-3 py-1 text-xs rounded-md text-white ${
                    awardData[safeKey(selectedScholar.id)]?.file
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Add Eligible Scholar Modal */}
      <AddEligibleScholarModal
        showModal={showModal}
        setShowModal={setShowModal}
        schoolYear={schoolYear}
        branchName={branch_name}
        fetchStudents={fetchStudents}
      />
    </div>
  );
};

export default AcademicAwardUpload;
