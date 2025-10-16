import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useSidebar } from "../../context/SidebarContext";
import {
  Upload,
  CheckCircle,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
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
  const [showUploadConfirmation, setShowUploadConfirmation] = useState(false);
  const [showUploadMatchedConfirmation, setShowUploadMatchedConfirmation] =
    useState(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  // Dropdown open states
  const [branchOpen, setBranchOpen] = useState(false);
  const [yearLevelOpen, setYearLevelOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);

  // Filter section collapse state (for mobile)
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Refs for click outside detection
  const branchRef = useRef<HTMLDivElement>(null);
  const yearLevelRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);

  const auth = useAuth();
  // const userId = auth?.user?.user_id;
  const role = auth?.user?.role_id;

  // Extract unique values for filters
  const uniqueBranches = Array.from(
    new Set(students.map((s) => s.campus))
  ).sort();
  const uniqueYearLevels = Array.from(
    new Set(students.map((s) => s.year_level))
  ).sort();
  const uniquePrograms = Array.from(
    new Set(students.map((s) => s.program))
  ).sort();

  // Filtered students based on selected filters
  const filteredStudents = students.filter((student) => {
    const branchMatch =
      selectedBranch === "all" || student.campus === selectedBranch;
    const yearLevelMatch =
      selectedYearLevel === "all" || student.year_level === selectedYearLevel;
    const programMatch =
      selectedProgram === "all" || student.program === selectedProgram;

    return branchMatch && yearLevelMatch && programMatch;
  });

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
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load student data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowUploadConfirmation = () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }
    setShowUploadConfirmation(true);
  };

  const handleFileExtract = async (file: File) => {
    if (!file) {
      toast.error("Missing file to extract");
      return;
    }

    setShowUploadConfirmation(false);
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

              const isDone = processedFiles === pdfFiles.length;

              setJobStatus((prev) => ({
                jobId: prev!.jobId,
                status: isDone ? "done" : "processing",
                progress: Math.floor((processedFiles / pdfFiles.length) * 100),
                result: {
                  ...prev!.result!,
                  processedFiles,
                  documents: allDocuments,
                },
              }));

              // ✅ Turn off loading when all files are processed
              if (isDone) {
                setIsProcessing(false);
              }
            } else if (pdfJob.status === "error") {
              toast.error(`Error processing ${pdfFileName}`);
              setIsProcessing(false);
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

              // ✅ Turn off loading when extraction is complete
              setIsProcessing(false);
            } else if (job.status === "error") {
              toast.error("Upload processing failed");
              setJobStatus((prev) =>
                prev
                  ? { jobId: prev.jobId, status: "error" }
                  : { jobId, status: "error" }
              );
              // ✅ Turn off loading on error
              setIsProcessing(false);
            }
          } catch (err) {
            console.error("Polling error:", err);
            toast.error("Error checking job status");
            setIsProcessing(false);
          }
        };

        pollJobStatus();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
      setIsProcessing(false);
    }
  };

  const handleShowUploadMatchedConfirmation = () => {
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

    setShowUploadMatchedConfirmation(true);
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

    setShowUploadMatchedConfirmation(false);
    setIsUploading(true);

    try {
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
          const res = await axios.post(
            `${VITE_BACKEND_URL}api/invoice/save-updates`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          console.log("✅ Uploaded for student:", student.student_id, res.data);
        } catch (err) {
          console.error(
            "❌ Failed upload for student:",
            student.student_id,
            err
          );
          toast.error(`Failed to upload for ${student.scholar_name}`);
        }
      }

      toast.success("All matching invoices uploaded successfully!");
      fetchStudents();
      setIsUploadOpen(false);
      setJobStatus(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload invoices");
    } finally {
      setIsUploading(false);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolYear, semester]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        branchRef.current &&
        !branchRef.current.contains(event.target as Node)
      ) {
        setBranchOpen(false);
      }
      if (
        yearLevelRef.current &&
        !yearLevelRef.current.contains(event.target as Node)
      ) {
        setYearLevelOpen(false);
      }
      if (
        programRef.current &&
        !programRef.current.contains(event.target as Node)
      ) {
        setProgramOpen(false);
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
          {/* Upload Button for Role 3 */}
          {role === 3 && (
            <div className="mb-6">
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                onClick={() => setIsUploadOpen(true)}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Invoice</span>
              </button>
            </div>
          )}

          {/* Improved Upload Modal */}
          {isUploadOpen && !isProcessing && !jobStatus && (
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

                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Upload Tuition Invoice
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload a single <b>PDF</b> or <b>ZIP</b> file (Max 100MB)
                  </p>
                </div>

                {/* Upload State */}
                <>
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all mb-4"
                  >
                    <Upload className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
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
                        const isZip = file.name.toLowerCase().endsWith(".zip");
                        const isPdf = file.type === "application/pdf";
                        if (!isZip && !isPdf) {
                          toast.error("Only PDF or ZIP files are allowed.");
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
                      onClick={handleShowUploadConfirmation}
                      disabled={!selectedFile || isProcessing}
                      className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isProcessing ? "Processing..." : "Upload & Extract"}
                    </button>
                  </div>
                </>
              </div>
            </div>
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
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h6 className="font-semibold text-gray-800 text-sm">
                                    {doc.extracted.studentName ||
                                      "Unknown Student"}
                                  </h6>
                                  <p className="text-xs text-gray-500">
                                    ID: {doc.extracted.studentNumber || "—"} •{" "}
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
                                  {matched ? "✅ Matched" : "⚠️ Unmatched"}
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
                                  <span className="text-gray-500">Amount:</span>{" "}
                                  <span className="font-semibold text-gray-800">
                                    ₱{amount}
                                  </span>
                                </p>
                                <p className="col-span-2 truncate">
                                  <span className="text-gray-500">File:</span>{" "}
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
                                  parseInt(doc.extracted.studentNumber || "0")
                              )
                            ).length
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

          {/* Filter Section */}
          {!isLoading && (
            <div className="mb-6 bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-2xl p-4 sm:p-6 border border-slate-200 overflow-visible relative z-10 lg:z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                    Filter Students
                  </h3>

                  {/* Mobile toggle button */}
                  <button
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="sm:hidden p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
                    aria-label="Toggle filters"
                  >
                    {filtersExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Right-side actions: Download only */}
                <div
                  className={`flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 ${
                    !filtersExpanded ? "hidden sm:flex" : ""
                  }`}
                >
                  {role === 7 &&
                    students.length > 0 &&
                    filteredStudents.filter(
                      (s) =>
                        !s.disbursement_files ||
                        s.disbursement_files.length === 0
                    ).length === 0 && (
                      <div className="xs:min-w-[220px]">
                        <ExcelDownloadButton
                          students={filteredStudents}
                          schoolYear={schoolYear}
                          semester={semester}
                          disbursementLabel={
                            filteredStudents[0]?.disbursement_label ||
                            "Tuition Fee and Other School Fees"
                          }
                        />
                      </div>
                    )}
                </div>
              </div>

              {/* Filter Dropdowns - Collapsible on mobile */}
              <div
                className={`grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-visible transition-all duration-300 ${
                  !filtersExpanded ? "hidden sm:grid" : ""
                }`}
              >
                {/* SY-Semester Filter */}
                <div className="group relative">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
                    School Year • Semester
                  </label>
                  <div className="w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[70]">
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
                </div>

                {/* Branch Filter - Only show when there are students */}
                {students.length > 0 && (
                  <div ref={branchRef} className="group relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
                      Campus/Branch
                    </label>
                    <div className="w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[60]">
                      <div
                        className="cursor-pointer flex justify-between items-center text-sm text-gray-700"
                        onClick={() => setBranchOpen(!branchOpen)}
                      >
                        <span className="truncate">
                          {selectedBranch === "all"
                            ? `All Campuses (${students.length})`
                            : `${selectedBranch} (${
                                students.filter(
                                  (s) => s.campus === selectedBranch
                                ).length
                              })`}
                        </span>
                        <svg
                          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${
                            branchOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      {branchOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
                          <div
                            className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                              selectedBranch === "all"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                            onClick={() => {
                              setSelectedBranch("all");
                              setBranchOpen(false);
                            }}
                          >
                            All Campuses ({students.length})
                          </div>
                          {uniqueBranches.map((branch) => (
                            <div
                              key={branch}
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                                selectedBranch === branch
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "hover:bg-gray-50 text-gray-700"
                              }`}
                              onClick={() => {
                                setSelectedBranch(branch);
                                setBranchOpen(false);
                              }}
                            >
                              {branch} (
                              {
                                students.filter((s) => s.campus === branch)
                                  .length
                              }
                              )
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Year Level Filter - Only show when there are students */}
                {students.length > 0 && (
                  <div ref={yearLevelRef} className="group relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
                      Year Level
                    </label>
                    <div className="w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[50]">
                      <div
                        className="cursor-pointer flex justify-between items-center text-sm text-gray-700"
                        onClick={() => setYearLevelOpen(!yearLevelOpen)}
                      >
                        <span className="truncate">
                          {selectedYearLevel === "all"
                            ? `All Year Levels (${students.length})`
                            : `${selectedYearLevel} (${
                                students.filter(
                                  (s) => s.year_level === selectedYearLevel
                                ).length
                              })`}
                        </span>
                        <svg
                          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${
                            yearLevelOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      {yearLevelOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
                          <div
                            className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                              selectedYearLevel === "all"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                            onClick={() => {
                              setSelectedYearLevel("all");
                              setYearLevelOpen(false);
                            }}
                          >
                            All Year Levels ({students.length})
                          </div>
                          {uniqueYearLevels.map((yearLevel) => (
                            <div
                              key={yearLevel}
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                                selectedYearLevel === yearLevel
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "hover:bg-gray-50 text-gray-700"
                              }`}
                              onClick={() => {
                                setSelectedYearLevel(yearLevel);
                                setYearLevelOpen(false);
                              }}
                            >
                              {yearLevel} (
                              {
                                students.filter(
                                  (s) => s.year_level === yearLevel
                                ).length
                              }
                              )
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Program Filter - Only show when there are students */}
                {students.length > 0 && (
                  <div ref={programRef} className="group relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
                      Program
                    </label>
                    <div className="w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[40]">
                      <div
                        className="cursor-pointer flex justify-between items-center text-sm text-gray-700"
                        onClick={() => setProgramOpen(!programOpen)}
                      >
                        <span className="truncate">
                          {selectedProgram === "all"
                            ? `All Programs (${students.length})`
                            : `${selectedProgram} (${
                                students.filter(
                                  (s) => s.program === selectedProgram
                                ).length
                              })`}
                        </span>
                        <svg
                          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${
                            programOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                      {programOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
                          <div
                            className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                              selectedProgram === "all"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                            onClick={() => {
                              setSelectedProgram("all");
                              setProgramOpen(false);
                            }}
                          >
                            All Programs ({students.length})
                          </div>
                          {uniquePrograms.map((program) => (
                            <div
                              key={program}
                              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                                selectedProgram === program
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "hover:bg-gray-50 text-gray-700"
                              }`}
                              onClick={() => {
                                setSelectedProgram(program);
                                setProgramOpen(false);
                              }}
                            >
                              {program} (
                              {
                                students.filter((s) => s.program === program)
                                  .length
                              }
                              )
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Clear All Filters Button - Below Dropdowns, Right-aligned on Desktop */}
              {students.length > 0 &&
                (selectedBranch !== "all" ||
                  selectedYearLevel !== "all" ||
                  selectedProgram !== "all") && (
                  <div
                    className={`mt-4 flex justify-end ${
                      !filtersExpanded ? "hidden sm:flex" : "flex"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setSelectedBranch("all");
                        setSelectedYearLevel("all");
                        setSelectedProgram("all");
                      }}
                      className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-medium transition-all duration-200 border border-gray-200 shadow-sm text-sm"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

              {/* Results Summary */}
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
                      <th className="px-3 sm:px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                        Status
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
                                No Matching Students
                              </p>
                              <p className="text-sm text-gray-600 mb-3">
                                Try adjusting your filter criteria
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedBranch("all");
                                  setSelectedYearLevel("all");
                                  setSelectedProgram("all");
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                              >
                                Clear All Filters
                              </button>
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
                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  student.disbursement_status === "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : student.disbursement_status === "Pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {student.disbursement_status}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 py-3 border-r border-gray-200 font-semibold text-gray-800 text-right whitespace-nowrap">
                              {student.disbursement_amount ? (
                                `₱${student.disbursement_amount.toLocaleString()}`
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
                                        📄 {file.file_name}
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
                          No Matching Students
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Try adjusting your filter criteria
                        </p>
                        <button
                          onClick={() => {
                            setSelectedBranch("all");
                            setSelectedYearLevel("all");
                            setSelectedProgram("all");
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md transition-all duration-200"
                        >
                          Clear All Filters
                        </button>
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
                                `₱${student.disbursement_amount.toLocaleString()}`
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
                                        {file.file_name}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Upload & Extract
              </h3>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-gray-600 text-sm">
                You are about to upload and extract the following file:
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">File:</span>
                  <span className="text-gray-900 font-semibold truncate ml-2">
                    {selectedFile?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Size:</span>
                  <span className="text-gray-900 font-semibold">
                    {selectedFile && (fileSize / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="text-gray-900 font-semibold">
                    {selectedFile?.name.toLowerCase().endsWith(".zip")
                      ? "ZIP Archive"
                      : "PDF Document"}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                The system will extract student information from the invoice(s)
                and match them with existing records. Do you want to proceed?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUploadConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedFile && handleFileExtract(selectedFile)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Yes, Upload & Extract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Loading Overlay for Processing */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[10001] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                </div>
                <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Processing Invoice
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                Extracting student information from the file...
              </p>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full animate-progress"></div>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This may take a few moments. Please do not close this window.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Matched Confirmation Modal */}
      {showUploadMatchedConfirmation &&
        jobStatus?.result?.documents &&
        !isUploading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Upload
                </h3>
              </div>

              <div className="mb-6 space-y-2">
                <p className="text-gray-600 text-sm">
                  You are about to upload invoices for matched students.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Matched Students:
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {
                        jobStatus.result.documents.filter((doc) => {
                          const studentId = parseInt(
                            doc.extracted.studentNumber || "0"
                          );
                          return students.some(
                            (s) => s.student_id === studentId
                          );
                        }).length
                      }{" "}
                      of {jobStatus.result.documents.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Action:</span>
                    <span className="text-gray-900 font-semibold">
                      Upload Files & Amounts
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-3">
                  Only matched student records will be updated with invoice
                  files and disbursement amounts. Do you want to proceed?
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowUploadMatchedConfirmation(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadToStudents}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  Yes, Upload Invoices
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Full-Screen Loading Overlay for Uploading */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[10001] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                </div>
                <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Uploading Invoices
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                Uploading matched invoices to student records...
              </p>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full animate-progress"></div>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This may take a few moments. Please do not close this window.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TuitionInvoiceUpload;
