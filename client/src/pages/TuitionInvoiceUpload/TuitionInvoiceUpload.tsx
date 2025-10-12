import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useSidebar } from "../../context/SidebarContext";
import { Upload, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import Loading from "../../components/shared/Loading";
import PaginationControl from "../../components/shared/PaginationControl";
import JSZip from "jszip";
import SYSemesterDropdown from "../../components/maintainables/SYSemesterDropdown";
import ExcelDownloadButton from "../../components/shared/DownloadExcel";
import { useAuth } from "../../context/AuthContext";
import { InitialRenewalInfo } from "../../Interface/IRenewal";

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

interface UploadedFile {
  id: number;
  studentId: number;
  filename: string;
  uploadedAt: string;
}

interface Document {
  fileName: string;
  extracted: {
    studentName: string;
    studentNumber: string;
    program: string;
    schoolYearTerm: string;
    totalBalance: string;
  };
  fileObject?: File | null; // ✅ Added this to support the attached PDF file
}

interface JobStatus {
  jobId: string;
  status: string;
  progress?: number;
  result?: {
    fileName: string;
    processedFiles: number;
    status: string;
    progress: number;
    totalFiles: number;
    documents: Document[];
  };
}

const TuitionInvoiceUpload: React.FC = () => {
  const { collapsed } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [initialRenewalInfo, setInitialRenewalInfo] =
    useState<InitialRenewalInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [schoolYear, setSchoolYear] = useState("2025-2026");
  const [semester, setSemester] = useState("1st Semester");
  const [fileSize, setFileSize] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const auth = useAuth();
  // const userId = auth?.user?.user_id;
  const role = auth?.user?.role_id;
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/invoice/list/${schoolYear}/${semester}`,
        {
          params: {
            branch: auth?.user?.branch?.branch_name,
          },
        }
      );
      const data = response.data;
      console.log(data);
      setStudents(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load student data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileExtract = async (file: File) => {
    if (!file) {
      toast.error("Missing file to extract");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // 1️⃣ Send to document extraction endpoint
      const { data } = await axios.post(
        `${VITE_BACKEND_URL}api/document/extract`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const { jobId } = data;
      console.log("Job ID:", jobId);

      setJobStatus({
        jobId,
        status: "processing",
        result: {
          fileName: file.name,
          processedFiles: 0,
          totalFiles: 0,
          status: "processing",
          progress: 0,
          documents: [],
        },
      });

      // 2️⃣ If ZIP — extract PDFs, process each individually
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        const pdfFiles = Object.keys(zipContent.files).filter((fileName) =>
          fileName.toLowerCase().endsWith(".pdf")
        );

        setJobStatus((prev) => ({
          jobId: prev!.jobId,
          status: "processing",
          progress: 0,
          result: {
            ...prev!.result!,
            totalFiles: pdfFiles.length,
            fileName: file.name,
          },
        }));

        let processedFiles = 0;
        const allDocuments: Document[] = [];

        for (const pdfFileName of pdfFiles) {
          const pdfBlob = await zip.file(pdfFileName)!.async("blob");
          if (!pdfBlob.size) {
            toast.error(`Empty or invalid PDF: ${pdfFileName}`);
            continue;
          }

          const pdfFile = new File([pdfBlob], pdfFileName, {
            type: "application/pdf",
          });

          const pdfFormData = new FormData();
          pdfFormData.append("file", pdfFile);

          const { data: pdfData } = await axios.post(
            `${VITE_BACKEND_URL}api/document/extract`,
            pdfFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          const { jobId: pdfJobId } = pdfData;
          console.log(`Extracting ${pdfFileName} (Job ID: ${pdfJobId})`);

          const pollPdfJobStatus = async () => {
            const res = await axios.get(
              `${VITE_BACKEND_URL}api/jobs/${pdfJobId}`
            );
            const pdfJob = res.data;

            if (
              pdfJob.status === "done" &&
              pdfJob.documents &&
              pdfJob.documents.length > 0
            ) {
              processedFiles++;

              // ✅ Attach fileObject for each extracted doc
              const docsWithFile = pdfJob.documents.map((d: Document) => ({
                ...d,
                fileObject: pdfFile,
              }));

              allDocuments.push(...docsWithFile);

              setJobStatus((prev) => ({
                jobId: prev!.jobId,
                status:
                  processedFiles === pdfFiles.length ? "done" : "processing",
                progress: Math.floor((processedFiles / pdfFiles.length) * 100),
                result: {
                  ...prev!.result!,
                  processedFiles,
                  documents: allDocuments,
                },
              }));
            } else if (pdfJob.status === "error") {
              toast.error(`Error processing ${pdfFileName}`);
            } else {
              setTimeout(pollPdfJobStatus, 1000);
            }
          };

          pollPdfJobStatus();
        }
      }

      // 3️⃣ If single PDF — poll the extraction job directly
      else {
        const pollJobStatus = async () => {
          try {
            const res = await axios.get(`${VITE_BACKEND_URL}api/jobs/${jobId}`);
            const job = res.data;
            console.log("Job status:", job);

            if (!job || typeof job !== "object") {
              throw new Error("Invalid job data received");
            }

            if (job.status === "processing" || job.status === "pending") {
              setJobStatus((prev) =>
                prev
                  ? {
                      jobId: prev.jobId,
                      status: job.status,
                      progress: job.progress || 0,
                      result: {
                        ...prev.result,
                        fileName:
                          job.fileName || prev.result?.fileName || file.name,
                        processedFiles:
                          job.processedFiles ||
                          prev.result?.processedFiles ||
                          0,
                        totalFiles:
                          job.totalFiles || prev.result?.totalFiles || 0,
                        status: job.status,
                        progress: job.progress || 0,
                        documents:
                          job.documents || prev.result?.documents || [],
                      },
                    }
                  : {
                      jobId,
                      status: job.status,
                      progress: job.progress || 0,
                      result: {
                        fileName: job.fileName || file.name,
                        processedFiles: job.processedFiles || 0,
                        totalFiles: job.totalFiles || 0,
                        status: job.status,
                        progress: job.progress || 0,
                        documents: job.documents || [],
                      },
                    }
              );
              setTimeout(pollJobStatus, 1000);
            }

            // ✅ When extraction completes
            else if (job.status === "done") {
              setJobStatus((prev) =>
                prev
                  ? {
                      jobId: prev.jobId,
                      status: "done",
                      progress: job.progress || 100,
                      result: {
                        fileName:
                          job.fileName || prev.result?.fileName || file.name,
                        processedFiles:
                          job.processedFiles ||
                          prev.result?.processedFiles ||
                          0,
                        totalFiles:
                          job.totalFiles || prev.result?.totalFiles || 0,
                        status: job.status,
                        progress: job.progress || 100,
                        documents: job.documents || [],
                      },
                    }
                  : {
                      jobId,
                      status: "done",
                      progress: job.progress || 100,
                      result: {
                        fileName: job.fileName || file.name,
                        processedFiles: job.processedFiles || 0,
                        totalFiles: job.totalFiles || 0,
                        status: job.status,
                        progress: job.progress || 100,
                        documents: job.documents || [],
                      },
                    }
              );

              // ✅ Attach the original uploaded file to extracted docs (fix)
              if (job.documents && file) {
                const docsWithFile = job.documents.map((d: Document) => ({
                  ...d,
                  fileObject: file,
                }));

                setJobStatus((prev) => ({
                  ...prev!,
                  result: {
                    ...prev!.result!,
                    documents: docsWithFile,
                  },
                }));
              }

              // optional: maintain uploaded file list
              if (job.documents) {
                const newUploadedFiles = job.documents.map((doc: Document) => ({
                  id: Date.now() + Math.random(),
                  studentId: parseInt(doc.extracted.studentNumber || "0"),
                  filename: doc.fileName,
                  uploadedAt: new Date().toISOString(),
                }));
                setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
              }
            } else if (job.status === "error") {
              toast.error("Upload processing failed");
              setJobStatus((prev) =>
                prev
                  ? { jobId: prev.jobId, status: "error" }
                  : { jobId, status: "error" }
              );
            }
          } catch (err) {
            console.error("Polling error:", err);
            toast.error("Error checking job status");
          }
        };

        pollJobStatus();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadToStudents = async () => {
    if (!jobStatus?.result?.documents) {
      toast.error("No extracted documents found.");
      return;
    }

    const matchedDocs = jobStatus.result.documents.filter((doc) => {
      const studentId = parseInt(doc.extracted.studentNumber || "0");
      return students.some((s) => s.student_id === studentId);
    });

    if (matchedDocs.length === 0) {
      toast.error("No matching students found.");
      return;
    }

    toast.info(`Uploading ${matchedDocs.length} invoices...`);

    for (const doc of matchedDocs) {
      const studentId = parseInt(doc.extracted.studentNumber || "0");
      const student = students.find((s) => s.student_id === studentId);

      if (!student || !doc.fileObject) continue;

      const parsedAmount = parseFloat(
        doc.extracted.totalBalance.replace(/[₱,]/g, "")
      );

      const formData = new FormData();
      formData.append("file", doc.fileObject);
      formData.append("disb_detail_id", String(student.disb_detail_id));
      formData.append("disbursement_amount", String(parsedAmount || 0));

      try {
        setIsUploading(true);
        const res = await axios.post(
          `${VITE_BACKEND_URL}api/invoice/save-updates`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        console.log("✅ Uploaded for student:", student.student_id, res.data);
      } catch (err) {
        console.error("❌ Failed upload for student:", student.student_id, err);
        toast.error(`Failed to upload for ${student.scholar_name}`);
      } finally {
        setIsUploading(false);
      }
    }

    toast.success("All matching invoices uploaded successfully!");
    fetchStudents();
    setIsUploadOpen(false);
    setJobStatus(null);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  console.log(auth?.user?.branch);
  const fetchRenewalInfo = async () => {
    try {
      const semesterCode =
        semester === "1st Semester" ? 1 : semester === "2nd Semester" ? 2 : 3;

      const response = await axios.get(
        `${VITE_BACKEND_URL}api/renewal/count-renewal`,
        {
          params: {
            school_year: schoolYear.replace("-", ""), // send as numeric code
            semester: semesterCode,
            branch: auth?.user?.branch?.branch_id || null, // optional
          },
        }
      );

      if (response.data?.data) {
        setInitialRenewalInfo(response.data.data);
        console.log("Renewal Info:", response.data.data);
      } else {
        setInitialRenewalInfo(null);
        console.log("No renewal info found");
      }
    } catch (error) {
      console.error("Error fetching renewal info:", error);
      toast.error("Failed to load renewal info");
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchRenewalInfo();
  }, [schoolYear, semester]);
  console.log("Check result: ", jobStatus);

  console.log(initialRenewalInfo);
  return (
    <div className="min-h-screen relative">
      <Sidebar />

      <div
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"}
        `}
      >
        <Navbar pageName="Tuition Invoice Upload" />

        <div className="px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            {/* Left side title */}
            <h2 className="text-xl font-bold text-slate-800">
              Tuition Invoice Upload
            </h2>

            {/* Right side controls */}
            <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4">
              {/* Dropdown with fixed width & no vertical stretch */}
              <div className="min-w-[230px] sm:w-auto flex-shrink-0">
                <SYSemesterDropdown
                  value={`${schoolYear}_${
                    semester === "1st Semester"
                      ? 1
                      : semester === "2nd Semester"
                      ? 2
                      : 3
                  }`}
                  onChange={(value) => {
                    const [sy, semCode] = value.split("_");
                    const semesterMap: Record<string, string> = {
                      "1": "1st Semester",
                      "2": "2nd Semester",
                      "3": "Summer",
                    };
                    setSchoolYear(sy);
                    setSemester(semesterMap[semCode] || "1st Semester");
                  }}
                />
              </div>

              {/* Upload button */}
              <div className="flex flex-col sm:flex-row items-end gap-3 sm:gap-4">
                {/* ✅ Role 3: Show Upload only */}
                {role === 3 && (
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                    onClick={() => setIsUploadOpen(true)}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Invoice</span>
                  </button>
                )}

                {/* ✅ Role 7: Show Download only */}
                {role === 7 && (
                  <ExcelDownloadButton
                    students={students}
                    schoolYear={schoolYear}
                    semester={semester}
                    disbursementLabel={
                      students[0]?.disbursement_label ||
                      "Tuition Fee and Other School Fees"
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* Improved Upload Modal */}
          {isUploadOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative transition-all max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsUploadOpen(false);
                    setJobStatus(null);
                    setSelectedFile(null);
                    setFileSize(0);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg"
                >
                  ✕
                </button>

                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-700">
                      {jobStatus
                        ? "Uploading matched invoices..."
                        : "Extracting and processing your file..."}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Please wait, this may take a few moments.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-800">
                        Upload Tuition Invoice
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Upload a single <b>PDF</b> or <b>ZIP</b> file (Max
                        100MB)
                      </p>
                    </div>

                    {/* Upload State */}
                    {!jobStatus && (
                      <>
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-4"
                        >
                          <Upload className="w-10 h-10 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Only one file allowed — PDF or ZIP
                          </p>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.zip"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const isZip = file.name
                                .toLowerCase()
                                .endsWith(".zip");
                              const isPdf = file.type === "application/pdf";
                              if (!isZip && !isPdf) {
                                toast.error(
                                  "Only PDF or ZIP files are allowed."
                                );
                                return;
                              }
                              if (file.size > 100 * 1024 * 1024) {
                                toast.error("File size exceeds 100MB limit.");
                                return;
                              }
                              setFileSize(file.size);
                              setSelectedFile(file);
                            } else {
                              setSelectedFile(null);
                              setFileSize(0);
                            }
                          }}
                        />

                        {selectedFile && (
                          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <FileText className="w-6 h-6 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-800">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedFile(null);
                                setFileSize(0);
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setIsUploadOpen(false)}
                            className="px-5 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() =>
                              selectedFile
                                ? handleFileExtract(selectedFile)
                                : toast.error("Please select a file.")
                            }
                            disabled={!selectedFile || isProcessing}
                            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isProcessing
                              ? "Processing..."
                              : "Upload & Extract"}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Processing State */}
                    {jobStatus && jobStatus.status === "processing" && (
                      <div className="text-center py-8">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          Processing your file...
                        </h4>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${jobStatus.progress || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {jobStatus.result?.processedFiles || 0} /{" "}
                          {jobStatus.result?.totalFiles || 0} files processed
                        </p>
                      </div>
                    )}

                    {/* Done State with Extracted + Match Table */}
                    {jobStatus &&
                      jobStatus.status === "done" &&
                      jobStatus.result && (
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
                              will be uploaded for matched students. Please
                              review carefully before confirming.
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
                                const studentId = parseInt(
                                  doc.extracted.studentNumber || "0"
                                );
                                const matched = students.some(
                                  (s) => s.student_id === studentId
                                );

                                if (filter === "matched") return matched;
                                if (filter === "unmatched") return !matched;
                                return true;
                              })
                              .map((doc, idx) => {
                                const studentId = parseInt(
                                  doc.extracted.studentNumber || "0"
                                );
                                const matchedStudent = students.find(
                                  (s) => s.student_id === studentId
                                );
                                const matched = !!matchedStudent;
                                const amount =
                                  doc.extracted.totalBalance || "0.00";

                                return (
                                  <div
                                    key={idx}
                                    className={`border rounded-lg shadow-sm p-4 transition-all ${
                                      matched
                                        ? "border-green-300 bg-green-50/70 hover:bg-green-100/70"
                                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h6 className="font-semibold text-gray-800 text-sm">
                                          {doc.extracted.studentName ||
                                            "Unknown Student"}
                                        </h6>
                                        <p className="text-xs text-gray-500">
                                          ID:{" "}
                                          {doc.extracted.studentNumber || "—"} •{" "}
                                          {matchedStudent?.campus || "—"}
                                        </p>
                                      </div>
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          matched
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {matched
                                          ? "✅ Matched"
                                          : "⚠️ Unmatched"}
                                      </span>
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
                                        <span className="text-gray-500">
                                          Amount:
                                        </span>{" "}
                                        <span className="font-semibold text-gray-800">
                                          ₱{amount}
                                        </span>
                                      </p>
                                      <p className="col-span-2 truncate">
                                        <span className="text-gray-500">
                                          File:
                                        </span>{" "}
                                        <span className="text-blue-600 font-medium">
                                          {doc.fileName}
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
                                  jobStatus.result.documents.filter((doc) =>
                                    students.some(
                                      (s) =>
                                        s.student_id ===
                                        parseInt(
                                          doc.extracted.studentNumber || "0"
                                        )
                                    )
                                  ).length
                                }{" "}
                                of {jobStatus.result.documents.length}
                              </b>{" "}
                              students matched successfully. Only matched
                              records will be uploaded.
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
                                onClick={handleUploadToStudents}
                                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                              >
                                Upload Matched Only
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Error State */}
                    {jobStatus && jobStatus.status === "error" && (
                      <div className="text-center py-8">
                        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-red-700">
                          Processing Failed
                        </h4>
                        <p className="text-xs text-gray-500 mb-4">
                          Something went wrong. Please try again.
                        </p>
                        <button
                          onClick={() => {
                            setJobStatus(null);
                            setSelectedFile(null);
                            setFileSize(0);
                          }}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Retry Upload
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {isLoading && <Loading />}

          {!isLoading &&
            students.length > 0 &&
            (() => {
              const total = students.length;
              const uploaded = students.filter(
                (s) => s.disbursement_files && s.disbursement_files.length > 0
              ).length;
              const remaining = total - uploaded;

              return (
                <>
                  <div className="flex justify-between items-center mb-4 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-800 font-medium">
                      📊 Upload Summary
                    </p>
                    <div className="flex gap-6 text-sm">
                      <span className="text-gray-700">
                        <b>Total:</b> {total}
                      </span>
                      <span className="text-green-600">
                        <b>Uploaded:</b> {uploaded}
                      </span>
                      <span className="text-red-600">
                        <b>Remaining:</b> {remaining}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/80 backdrop-blur-sm">
                          <tr className="text-slate-700 text-xs sm:text-sm font-medium text-left">
                            <th
                              colSpan={10}
                              className="px-4 py-3 border border-gray-300"
                            >
                              School Year and Semester: {schoolYear} {semester}
                            </th>
                          </tr>
                          <tr className="text-slate-700 text-xs sm:text-sm font-medium text-left">
                            <th className="px-4 py-3 border border-gray-300">
                              Student ID
                            </th>
                            <th className="px-4 py-3 border border-gray-300">
                              Scholar Name
                            </th>
                            <th className="px-4 py-3 border border-gray-300">
                              Campus
                            </th>
                            <th className="px-4 py-3 border border-gray-300">
                              Year Level
                            </th>
                            <th className="px-4 py-3 border border-gray-300">
                              Disbursement Label
                            </th>
                            <th className="px-4 py-3 border border-gray-300">
                              Disbursement Status
                            </th>

                            <th className="px-4 py-3 border border-gray-300">
                              Amount
                            </th>
                            <th className="px-4 py-3 border border-gray-300">
                              Files
                            </th>
                          </tr>
                        </thead>

                        <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200 text-[12px] sm:text-[14px]">
                          {students
                            .slice(
                              (page - 1) * itemsPerPage,
                              page * itemsPerPage
                            )
                            .map((student) => (
                              <tr
                                key={student.renewal_id}
                                className={`border border-gray-300 ${
                                  !student.disbursement_files?.length
                                    ? "bg-red-50/50"
                                    : ""
                                }`}
                              >
                                <td className="px-4 py-2 border border-gray-300">
                                  {student.student_id}
                                </td>
                                <td className="px-4 py-2 border border-gray-300">
                                  {student.scholar_name}
                                </td>
                                <td className="px-4 py-2 border border-gray-300">
                                  {student.campus}
                                </td>
                                <td className="px-4 py-2 border border-gray-300">
                                  {student.year_level}
                                </td>
                                <td className="px-4 py-2 border border-gray-300">
                                  {student.disbursement_label}
                                </td>
                                <td className="px-4 py-2 border border-gray-300">
                                  {student.disbursement_status}
                                </td>

                                <td className="px-4 py-2 border border-gray-300">
                                  {student.disbursement_amount
                                    ? `₱${student.disbursement_amount.toLocaleString()}`
                                    : "N/A"}
                                </td>

                                <td className="px-4 py-2 border border-gray-300 max-w-[300px]">
                                  {student.disbursement_files &&
                                  student.disbursement_files.length > 0 ? (
                                    <ul className="space-y-1">
                                      {student.disbursement_files.map(
                                        (file, index) => (
                                          <li key={index}>
                                            <a
                                              href={`${VITE_BACKEND_URL}api/document/download/${file.file_name}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline text-[13px] "
                                            >
                                              {file.file_name}
                                            </a>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <span className="text-gray-400 text-[13px]">
                                      None
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-4 py-3 bg-slate-50/80 backdrop-blur-sm border-t border-slate-200">
                      <PaginationControl
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          {!isLoading && students.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              No students found for {schoolYear} {semester}.
            </div>
          )}
          {!isLoading && students.length === 0 && (
            <div className="text-center text-gray-500 py-6">
              No students found for {schoolYear} {semester}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TuitionInvoiceUpload;
