import React, { useState } from "react";
import JSZip from "jszip";
import axios from "axios";
import {
  ScholarGrade,
  ScholarGradeDocument,
  ZipScholarGradeResult,
} from "../../Interface/IRenewal";
import {
  Loader2,
  Upload,
  X,
  FileCheck,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

interface Props {
  onClose: () => void;
  onExtract: (grades: ScholarGradeDocument[] | ZipScholarGradeResult) => void;
  renewalData: { student_id: string | number }[];
  onSaveToTempRenewals?: (
    saved: {
      student_id: string;
      fileURL?: string;
      gradeList?: ScholarGrade[];
      fileName?: string;
      gwa?: number | null;
    }[]
  ) => void;
}

const MAX_FILE_SIZE_MB = 100;

const UploadGradesModal: React.FC<Props> = ({
  onClose,
  onExtract,
  renewalData,
  onSaveToTempRenewals,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<
    "idle" | "processing" | "completed" | "failed"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ZipScholarGradeResult | null>(null);
  const [isUploadingToRenewal, setIsUploadingToRenewal] = useState(false);
  const [totalFilesToProcess, setTotalFilesToProcess] = useState<number>(0);
  const [processedFilesCount, setProcessedFilesCount] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // console.log("🔍 UploadGradesModal rendered. showConfirmModal state:", showConfirmModal);

  // 🔹 Validate file
  const validateFile = (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }

    if (!/\.(pdf|zip)$/i.test(selectedFile.name)) {
      setError("Invalid file type. Please upload a PDF or ZIP file.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (validateFile(selected)) {
      setFile(selected);
    }
  };

  // 🔹 Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  // 🔹 Extract file logic
  const handleExtract = async () => {
    if (!file) return;
    setStatus("processing");
    setProgress(0);
    setProcessedFilesCount(0);
    setError(null);
    setMessage("Starting extraction...");

    try {
      // ✅ ZIP upload with job tracker
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const pdfEntries = Object.values(zip.files).filter((f) =>
          f.name.toLowerCase().endsWith(".pdf")
        );

        if (pdfEntries.length === 0)
          throw new Error("No PDF files found in ZIP.");

        const total = pdfEntries.length;
        setTotalFilesToProcess(total);
        const jobMap: Record<string, { jobId: string; fileObject: File }> = {};

        setMessage(`Found ${total} PDF files. Starting upload...`);
        setProgress(0);
        setProcessedFilesCount(0);

        // Upload all files first (no progress updates during upload)
        await Promise.all(
          pdfEntries.map(async (entry) => {
            const pdfBlob = await entry.async("blob");
            const pdfFile = new File([pdfBlob], entry.name, {
              type: "application/pdf",
            });

            const formData = new FormData();
            formData.append("file", pdfFile);

            const { data } = await axios.post<{ jobId: string }>(
              `${import.meta.env.VITE_BACKEND_URL}api/document/extract-grades`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );

            jobMap[entry.name] = { jobId: data.jobId, fileObject: pdfFile };
          })
        );

        setMessage(`Uploaded ${total} PDFs. Now processing...`);

        const pollJob = async (jobId: string) => {
          return new Promise<ScholarGradeDocument>((resolve, reject) => {
            const interval = setInterval(async () => {
              try {
                const res = await axios.get(
                  `${import.meta.env.VITE_BACKEND_URL}api/jobs/${jobId}`
                );
                const job = res.data;
                if (job.status === "completed") {
                  clearInterval(interval);
                  resolve(job.result as ScholarGradeDocument);
                } else if (job.status === "failed") {
                  clearInterval(interval);
                  reject(new Error(job.message || "Job failed"));
                }
              } catch (err) {
                clearInterval(interval);
                reject(err);
              }
            }, 2000);
          });
        };

        const results: ScholarGradeDocument[] = [];
        let processedCount = 0;

        for (const [fileName, { jobId, fileObject }] of Object.entries(
          jobMap
        )) {
          setMessage(
            `Processing ${fileName}... (${processedCount + 1}/${total})`
          );
          const extracted = await pollJob(jobId);

          const safeExtracted: ScholarGradeDocument = {
            fileName,
            fileObject,
            student_id: extracted.student_id ?? "",
            scholar_name:
              extracted.scholar_name ?? extracted.student_name ?? "",
            campus: extracted.campus ?? "",
            program: extracted.program ?? "",
            sy: extracted.sy ?? null,
            year_level: extracted.year_level ?? extracted.level ?? "",
            semester: extracted.semester ?? null,
            gwa:
              typeof extracted.gwa === "number"
                ? extracted.gwa
                : extracted.gwa
                ? Number(extracted.gwa)
                : null,
            grades: Array.isArray(extracted.grades) ? extracted.grades : [],
          };

          results.push(safeExtracted);
          processedCount++;

          // Calculate progress based on actual files processed
          const progressPercentage = Math.round((processedCount / total) * 100);

          setProgress(progressPercentage);
          setProcessedFilesCount(processedCount);
          setMessage(`Completed ${processedCount}/${total} files`);
        }

        const resultData: ZipScholarGradeResult = {
          totalFiles: results.length,
          results,
        };
        setResult(resultData);
        onExtract(resultData);
        setStatus("completed");
        setMessage("All PDF files extracted successfully!");
        return;
      }

      // ✅ Single PDF upload
      if (file.name.toLowerCase().endsWith(".pdf")) {
        const formData = new FormData();
        formData.append("file", file);

        // 🔹 Step 1: Upload PDF and get Job ID
        const { data } = await axios.post<{ jobId: string }>(
          `${import.meta.env.VITE_BACKEND_URL}api/document/extract-grades`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const jobId = data.jobId;
        if (!jobId) throw new Error("No jobId returned from backend.");

        setMessage("Processing PDF extraction...");
        setProgress(0);
        setTotalFilesToProcess(1);
        setProcessedFilesCount(0);

        // 🔹 Step 2: Poll the job tracker for completion
        const pollJob = async (jobId: string) => {
          return new Promise<ScholarGradeDocument>((resolve, reject) => {
            const interval = setInterval(async () => {
              try {
                const res = await axios.get(
                  `${import.meta.env.VITE_BACKEND_URL}api/jobs/${jobId}`
                );
                const job = res.data;

                if (job.status === "completed") {
                  clearInterval(interval);
                  resolve(job.result as ScholarGradeDocument);
                } else if (job.status === "failed") {
                  clearInterval(interval);
                  reject(new Error(job.message || "Job failed"));
                }
              } catch (err) {
                clearInterval(interval);
                reject(err);
              }
            }, 2000);
          });
        };

        // 🔹 Step 3: Wait for completion and normalize fields
        const extracted = await pollJob(jobId);

        // Update progress to 100% when processing is complete
        setProgress(100);
        setProcessedFilesCount(1);

        const safeData: ScholarGradeDocument = {
          fileName: file.name,
          fileObject: file,
          student_id: extracted.student_id ?? "",
          scholar_name:
            extracted.scholar_name ?? extracted.student_name ?? "N/A",
          campus: extracted.campus ?? "N/A",
          program: extracted.program ?? "N/A",
          sy: extracted.sy ?? null,
          year_level: extracted.year_level ?? extracted.level ?? "N/A",
          semester: extracted.semester ?? "N/A",
          gwa:
            typeof extracted.gwa === "number"
              ? extracted.gwa
              : extracted.gwa
              ? Number(extracted.gwa)
              : null,
          grades: Array.isArray(extracted.grades) ? extracted.grades : [],
        };

        const resultData: ZipScholarGradeResult = {
          totalFiles: 1,
          results: [safeData],
        };

        setResult(resultData);
        onExtract(resultData);
        setProgress(100);
        setStatus("completed");
        setMessage("Single PDF extracted successfully!");
        return;
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      setError("Extraction failed. Please try again.");
      setStatus("failed");
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatus("idle");
    setMessage("");
    setTotalFilesToProcess(0);
    setProcessedFilesCount(0);
  };

  const handleUploadClick = () => {
    setShowConfirmModal(true);
  };

  const saveAllExtractedToRenewal = async () => {
    if (!result || !onSaveToTempRenewals) return;

    setShowConfirmModal(false);

    try {
      setIsUploadingToRenewal(true); // start loading

      const saved = result.results.map((r) => ({
        student_id: String(r.student_id ?? ""),
        fileName: r.fileName ?? "",
        fileURL: r.fileObject ? URL.createObjectURL(r.fileObject) : "",
        gradeList: Array.isArray(r.grades) ? r.grades : [],
        gwa: typeof r.gwa === "number" ? r.gwa : null,
      }));

      // Simulate small delay (optional, for smoother UX)
      await new Promise((res) => setTimeout(res, 300));

      onSaveToTempRenewals(saved);
      setMessage("Extracted grades merged into renewal table!");

      onClose();
    } catch (err) {
      console.error("❌ Error saving extracted grades:", err);
      setError("Failed to upload to renewal table. Please try again.");
    } finally {
      setIsUploadingToRenewal(false); // stop loading
    }
  };

  // 🌀 Processing UI - Upload Invoice Style Loading
  if (status === "processing") {
    return (
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
              Uploading Grades
            </h3>
            <p className="text-gray-600 text-sm text-center mb-4">
              {message || "Processing grade files..."}
            </p>

            {/* File Progress Information */}
            {totalFilesToProcess > 0 && (
              <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 font-medium">
                    Files Processed:
                  </span>
                  <span className="text-green-900 font-semibold">
                    {processedFilesCount} of {totalFilesToProcess}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-green-700 font-medium">Progress:</span>
                  <span className="text-green-900 font-semibold">
                    {progress}%
                  </span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${progress}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4 text-center">
              This may take a few moments. Please do not close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Completed UI
  if (status === "completed" && result) {
    // 🔍 Compare extracted students to renewalData
    // Helper: normalize student IDs by removing leading zeros and converting to number
    const normalizeId = (id: string | number | null | undefined) => {
      if (!id) return "";
      return String(id).replace(/^0+/, ""); // removes leading zeros
    };

    // 🔍 Compare extracted students to renewalData with normalization
    const sortedResults = [...result.results].sort((a, b) => {
      const aMatch = renewalData.some(
        (student) =>
          normalizeId(student.student_id) === normalizeId(a.student_id)
      );
      const bMatch = renewalData.some(
        (student) =>
          normalizeId(student.student_id) === normalizeId(b.student_id)
      );
      return Number(bMatch) - Number(aMatch); // Matched first
    });

    const matchedCount = sortedResults.filter((r) =>
      renewalData.some(
        (student) =>
          normalizeId(student.student_id) === normalizeId(r.student_id)
      )
    ).length;

    return (
      <>
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header - Fixed */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Review Extraction
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {message || "All files processed successfully!"}
                </p>
                {/* ✅ Match Summary */}
                <p className="text-sm text-gray-800 font-medium mt-2">
                  ✅ Matched: {matchedCount} / {result.results.length}
                </p>
              </div>
            </div>

            {/* ✅ Results - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {sortedResults.map((r, i) => {
                  const grades = r.grades ?? [];
                  const isMatched = renewalData.some(
                    (student) =>
                      normalizeId(student.student_id) ===
                      normalizeId(r.student_id)
                  );

                  return (
                    <div
                      key={i}
                      className={`border rounded-lg shadow-sm hover:shadow-md p-4 sm:p-5 transition-all duration-300 ${
                        isMatched
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      {/* Student Info */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                              {r.scholar_name ||
                                r.student_name ||
                                "Unknown Student"}
                            </h3>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {r.program} • {r.year_level || "N/A"} • {r.campus}
                            </p>
                          </div>

                          {/* Preview Button */}
                          <div className="flex-shrink-0">
                            {r.fileObject ? (
                              <button
                                onClick={() => {
                                  const url = URL.createObjectURL(
                                    r.fileObject!
                                  );
                                  window.open(url, "_blank");
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium w-full sm:w-auto transition-colors"
                              >
                                Preview
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500 italic">
                                No File
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Student Details - Dynamic Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                          <div className="bg-white/50 rounded-lg p-2 sm:p-3">
                            <span className="text-gray-500 text-xs font-medium">
                              ID:
                            </span>
                            <p className="font-semibold text-sm">
                              {r.student_id}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-2 sm:p-3">
                            <span className="text-gray-500 text-xs font-medium">
                              GWA:
                            </span>
                            <p className="font-semibold text-sm">
                              {r.gwa ?? "N/A"}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-2 sm:p-3">
                            <span className="text-gray-500 text-xs font-medium">
                              Semester:
                            </span>
                            <p className="font-semibold text-sm">
                              {r.semester ?? "N/A"}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-2 sm:p-3">
                            <span className="text-gray-500 text-xs font-medium">
                              Year:
                            </span>
                            <p className="font-semibold text-sm">
                              {r.sy ?? "N/A"}
                            </p>
                          </div>
                          <div className="bg-white/50 rounded-lg p-2 sm:p-3">
                            <span className="text-gray-500 text-xs font-medium">
                              Pages:
                            </span>
                            <p className="font-semibold text-sm">
                              {r.pageCount ?? "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Match Badge */}
                        <div className="mt-3">
                          {isMatched ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1.5 rounded-full text-sm font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Matched with Renewal List
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1.5 rounded-full text-sm font-medium">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              No Match Found
                            </span>
                          )}
                        </div>

                        {/* Grades Details - Dynamic */}
                        <details className="mt-4">
                          <summary className="cursor-pointer text-indigo-600 font-medium text-sm hover:text-indigo-800 flex items-center gap-2">
                            <span>📚</span>
                            <span>
                              Grades ({grades.length}) - Click to expand
                            </span>
                          </summary>
                          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="text-left px-3 py-2 font-semibold text-gray-700">
                                      Course
                                    </th>
                                    <th className="text-left px-3 py-2 font-semibold text-gray-700">
                                      Grade
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {grades.map((g, idx) => (
                                    <tr
                                      key={idx}
                                      className="border-t hover:bg-gray-50 transition"
                                    >
                                      <td className="px-3 py-2 text-gray-800 font-medium">
                                        {g.course_code}
                                      </td>
                                      <td
                                        className={`px-3 py-2 font-semibold ${
                                          g.final_grade > 3
                                            ? "text-red-600"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {g.final_grade}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={onClose}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg text-sm font-semibold w-full sm:w-auto transition-colors shadow-md hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadClick}
                  disabled={isUploadingToRenewal}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 w-full sm:w-auto shadow-lg hover:shadow-xl
      ${
        isUploadingToRenewal
          ? "bg-indigo-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700"
      }`}
                >
                  {isUploadingToRenewal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      <span>Upload to Renewal Table</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Confirmation Modal - Always rendered at component level */}
        <UploadConfirmationModal
          showConfirmModal={showConfirmModal}
          setShowConfirmModal={setShowConfirmModal}
          result={result}
          renewalData={renewalData}
          saveAllExtractedToRenewal={saveAllExtractedToRenewal}
        />
      </>
    );
  }

  // ❌ Error UI
  if (status === "failed" || error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50">
        <div className="bg-white rounded-xl p-6 shadow-2xl text-center w-full max-w-sm">
          <AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="text-xs text-gray-600 mt-2">{error}</p>
          <button
            onClick={reset}
            className="mt-4 bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 🧩 Default UI - Only drag & drop for Excel files
  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Upload Grades
          </h2>
          <p className="text-xs text-gray-600 text-center mb-4">
            Upload PDF files or ZIP containing PDF files
          </p>

          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
              }`}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <Upload
                className={`w-10 h-10 mb-2 transition-colors ${
                  isDragOver ? "text-indigo-600" : "text-indigo-600"
                }`}
              />
              <span className="text-sm font-semibold text-gray-800">
                Drag & drop a PDF or ZIP file here, or click to browse
              </span>
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Warning Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Uploading a file may update or overwrite
                some rows in the renewal table based on the changes inside your
                ZIP and PDF files.
              </p>
            </div>

            {file && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-800 bg-green-50 p-2 rounded">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span className="truncate">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
            {error && (
              <p className="text-red-600 text-xs text-center bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleExtract}
                disabled={!file || !!error}
                className={`flex-1 py-2 rounded text-white font-semibold text-sm ${
                  file && !error
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Upload & Extract
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Confirmation Modal - Always rendered at component level */}
      <UploadConfirmationModal
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        result={result}
        renewalData={renewalData}
        saveAllExtractedToRenewal={saveAllExtractedToRenewal}
      />
    </>
  );
};

// 🔥 Upload Confirmation Modal - Rendered at component level
const UploadConfirmationModal = ({
  showConfirmModal,
  setShowConfirmModal,
  result,
  renewalData,
  saveAllExtractedToRenewal,
}: {
  showConfirmModal: boolean;
  setShowConfirmModal: (show: boolean) => void;
  result: ZipScholarGradeResult | null;
  renewalData: { student_id: string | number }[];
  saveAllExtractedToRenewal: () => void;
}) => {
  if (!showConfirmModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001] animate-fadeIn">
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
            You are about to upload and apply changes from:
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                Records to Upload:
              </span>
              <span className="text-gray-900 font-semibold">
                {result?.results.length || 0} student(s)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">
                Matched Records:
              </span>
              <span className="text-green-600 font-semibold">
                {result?.results.filter((r) =>
                  renewalData.some(
                    (student) =>
                      String(student.student_id).replace(/^0+/, "") ===
                      String(r.student_id).replace(/^0+/, "")
                  )
                ).length || 0}{" "}
                matched
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            This action will update student records. Do you want to proceed?
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowConfirmModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveAllExtractedToRenewal}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadGradesModal;
