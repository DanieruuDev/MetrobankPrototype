import { useState } from "react";
import JSZip from "jszip";
import axios from "axios";
import { toast } from "react-toastify";

interface ExtractedData {
  studentName: string;
  studentNumber: string;
  program: string;
  schoolYearTerm: string;
  totalBalance: string;
}

interface LocalFile {
  fileName: string;
  file: File;
}

interface JobStatus {
  jobId: string;
  status: "queued" | "processing" | "done" | "error";
  progress: number;
  result?: {
    documents: {
      fileName: string;
      file: File;
      extracted: ExtractedData | null;
    }[];
  };
}

export const useZipExtraction = () => {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  const handleExtractZip = async (file: File) => {
    if (!file) {
      toast.error("No file selected");
      return;
    }

    if (!file.name.endsWith(".zip")) {
      toast.error("Please upload a ZIP file");
      return;
    }

    try {
      // STEP 1 — Extract PDFs locally
      const zip = await JSZip.loadAsync(file);
      const extractedFiles: LocalFile[] = [];

      for (const [fileName, entry] of Object.entries(zip.files)) {
        if (!entry.dir && fileName.toLowerCase().endsWith(".pdf")) {
          const blob = await entry.async("blob");
          const pdfFile = new File([blob], fileName, {
            type: "application/pdf",
          });
          extractedFiles.push({ fileName, file: pdfFile });
        }
      }

      if (extractedFiles.length === 0) {
        toast.warn("No PDFs found in ZIP");
        return;
      }

      console.log("📁 Locally extracted files:", extractedFiles);

      // STEP 2 — Send ZIP to backend for metadata extraction
      const formData = new FormData();
      formData.append("file", file);

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const { data } = await axios.post<{ jobId: string }>(
        `${backendUrl}api/document/extract`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const { jobId } = data;
      toast.info("Extraction started");

      // STEP 3 — Poll job status
      const pollJob = async () => {
        const response = await axios.get<JobStatus>(
          `${backendUrl}api/jobs/${jobId}`
        );
        const job = response.data;

        if (job.status === "processing") {
          setJobStatus({
            ...job,
            result: job.result,
          });
          setTimeout(pollJob, 1000);
        }

        if (job.status === "done" && job.result) {
          // STEP 4 — Merge extracted metadata with local files
          const mergedDocuments = extractedFiles.map((local) => {
            const match = job.result?.documents?.find(
              (backendDoc) => backendDoc.fileName === local.fileName
            );
            return {
              fileName: local.fileName,
              file: local.file,
              extracted: match?.extracted ?? null,
            };
          });

          setJobStatus({
            jobId,
            status: "done",
            progress: 100,
            result: { documents: mergedDocuments },
          });

          toast.success("Extraction complete!");
        }

        if (job.status === "error") {
          toast.error("Extraction failed");
        }
      };

      pollJob();
    } catch (err) {
      console.error("❌ Extraction error:", err);
      toast.error("Failed to extract ZIP");
    }
  };

  return { jobStatus, handleExtractZip };
};
