import { useState } from "react";
import axios from "axios";
import JSZip from "jszip";
import { toast } from "react-toastify";

import {
  JobStatus,
  Student,
  ExtractedDocument,
} from "../../../Interface/ITuitionInvoice";

export const useInvoiceUpload = (
  students: Student[],
  fetchStudents: () => void
) => {
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // --- Upload-related state ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadConfirmation, setShowUploadConfirmation] = useState(false);
  const [showUploadMatchedConfirmation, setShowUploadMatchedConfirmation] =
    useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFilesCount, setUploadedFilesCount] = useState(0);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");

  // --- Helper Functions ---

  const handleShowUploadConfirmation = () => {
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }
    setShowUploadConfirmation(true);
  };

  // -------------- FILE EXTRACTION LOGIC --------------
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

      // --- ZIP Extraction ---
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        const pdfFiles = Object.keys(zipContent.files).filter((f) =>
          f.toLowerCase().endsWith(".pdf")
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
        const allDocuments: ExtractedDocument[] = [];

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

              const docsWithFile = pdfJob.documents.map(
                (d: ExtractedDocument) => ({
                  ...d,
                  fileObject: pdfFile,
                })
              );

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

              if (isDone) setIsProcessing(false);
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

      // --- Single PDF Extraction ---
      else {
        const pollJobStatus = async () => {
          try {
            const res = await axios.get(`${VITE_BACKEND_URL}api/jobs/${jobId}`);
            const job = res.data;

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
            } else if (job.status === "done") {
              // --- Completed Job ---
              setJobStatus((prev) =>
                prev
                  ? {
                      jobId: prev.jobId,
                      status: "done",
                      progress: 100,
                      result: {
                        ...prev.result!,
                        fileName: job.fileName || file.name,
                        documents: job.documents || [],
                      },
                    }
                  : {
                      jobId,
                      status: "done",
                      progress: 100,
                      result: {
                        fileName: job.fileName || file.name,
                        processedFiles: job.processedFiles || 0,
                        totalFiles: job.totalFiles || 0,
                        status: job.status,
                        progress: 100,
                        documents: job.documents || [],
                      },
                    }
              );

              if (job.documents && file) {
                const docsWithFile = job.documents.map(
                  (d: ExtractedDocument) => ({
                    ...d,
                    fileObject: file,
                  })
                );
                setJobStatus((prev) => ({
                  ...prev!,
                  result: { ...prev!.result!, documents: docsWithFile },
                }));
              }

              setIsProcessing(false);
            } else if (job.status === "error") {
              toast.error("Upload processing failed");
              setIsProcessing(false);
              setJobStatus((prev) =>
                prev
                  ? { jobId: prev.jobId, status: "error" }
                  : { jobId, status: "error" }
              );
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

  // -------------- UPLOAD TO STUDENTS --------------
  const handleShowUploadMatchedConfirmation = () => {
    if (!jobStatus?.result?.documents) {
      toast.error("No extracted documents found.");
      return;
    }

    const matchedDocs = jobStatus.result.documents.filter((doc) => {
      const currentStudentNumber =
        doc.editedData?.studentNumber || doc.extracted.studentNumber;
      const studentId = parseInt(currentStudentNumber || "0");
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
      const currentStudentNumber =
        doc.editedData?.studentNumber || doc.extracted.studentNumber;
      const studentId = parseInt(currentStudentNumber || "0");
      return students.some((s) => s.student_id === studentId);
    });

    if (matchedDocs.length === 0) {
      toast.error("No matching students found.");
      return;
    }

    setShowUploadMatchedConfirmation(false);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");
    setUploadedFilesCount(0);
    setTotalFilesToUpload(matchedDocs.length);

    try {
      for (let i = 0; i < matchedDocs.length; i++) {
        const doc = matchedDocs[i];
        setUploadStatus(
          `Uploading invoice ${i + 1} of ${matchedDocs.length}...`
        );
        setUploadedFilesCount(i + 1);
        setUploadProgress(Math.round(((i + 1) / matchedDocs.length) * 100));

        const currentStudentNumber =
          doc.editedData?.studentNumber || doc.extracted.studentNumber;
        const studentId = parseInt(currentStudentNumber || "0");
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

      setUploadStatus("Upload completed successfully!");
      setUploadProgress(100);
      setUploadedFilesCount(matchedDocs.length);

      toast.success("All matching invoices uploaded successfully!");
      fetchStudents();
      setIsUploadOpen(false);
      setJobStatus(null);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("Upload failed");
      toast.error("Failed to upload invoices");
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus("");
        setUploadedFilesCount(0);
        setTotalFilesToUpload(0);
      }, 2000);
    }
  };

  // --- Return Hook API ---
  return {
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
    setUploadStatus,
    uploadProgress,
    setUploadProgress,
    uploadedFilesCount,
    totalFilesToUpload,
    jobStatus,
    setJobStatus,
    filter,
    setFilter,
    handleShowUploadConfirmation,
    handleFileExtract,
    handleShowUploadMatchedConfirmation,
    handleUploadToStudents,
  };
};
