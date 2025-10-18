import React, { useState } from "react";
import JSZip from "jszip";
import axios from "axios";
import { extractGradesExcel } from "../../utils/ExtractGradesExcel";
import {
  ScholarGrade,
  ScholarGradeDocument,
  ZipScholarGradeResult,
} from "../../Interface/IRenewal";
import { Loader2, Upload, X, FileCheck, AlertTriangle } from "lucide-react";

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
  const [mode, setMode] = useState<"excel" | "pdf" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<
    "idle" | "processing" | "completed" | "failed"
  >("idle");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ZipScholarGradeResult | null>(null);
  const [isUploadingToRenewal, setIsUploadingToRenewal] = useState(false);

  // 🔹 Validate file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    if (
      (mode === "excel" && !/\.(xlsx|xls)$/i.test(selected.name)) ||
      (mode === "pdf" && !/\.(pdf|zip)$/i.test(selected.name))
    ) {
      setError(
        `Invalid file type. Please upload a ${
          mode === "excel" ? "Excel (.xlsx/.xls)" : "PDF or ZIP"
        } file.`
      );
      return;
    }

    setError(null);
    setFile(selected);
  };

  // 🔹 Extract file logic
  const handleExtract = async () => {
    if (!file || !mode) return;
    setStatus("processing");
    setProgress(0);
    setError(null);
    setMessage("Starting extraction...");

    try {
      // ✅ Excel extraction
      if (mode === "excel") {
        const data = await extractGradesExcel(file);
        const total = data.length;
        let uploaded = 0;

        setMessage(
          `Extracted ${total} scholar records. Uploading to server...`
        );

        // attach Excel file reference to each record
        const enrichedData = data.map((record) => ({
          ...record,
          fileName: file.name,
          fileObject: file,
        }));

        // upload each scholar record
        for (const scholar of enrichedData) {
          await axios.post(
            `${
              import.meta.env.VITE_BACKEND_URL
            }api/renewal/upload-scholar-grades`,
            scholar
          );
          uploaded++;
          setProgress(Math.floor((uploaded / total) * 100));
          setMessage(`Uploaded ${uploaded}/${total} scholars...`);
        }

        const resultData: ZipScholarGradeResult = {
          totalFiles: enrichedData.length,
          results: enrichedData,
        };

        setResult(resultData);
        onExtract(resultData);
        setStatus("completed");
        setMessage("Excel extraction and upload complete!");
        return;
      }

      // ✅ ZIP upload with job tracker
      if (file.name.toLowerCase().endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);
        const pdfEntries = Object.values(zip.files).filter((f) =>
          f.name.toLowerCase().endsWith(".pdf")
        );

        if (pdfEntries.length === 0)
          throw new Error("No PDF files found in ZIP.");

        const total = pdfEntries.length;
        let processed = 0;
        const jobMap: Record<string, { jobId: string; fileObject: File }> = {};

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
            processed++;
            setProgress(Math.floor((processed / total) * 30));
            setMessage(`Uploaded ${processed}/${total} PDFs for extraction...`);
          })
        );

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

        for (const [fileName, { jobId, fileObject }] of Object.entries(
          jobMap
        )) {
          setMessage(`Processing ${fileName}...`);
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
          setProgress((p) => Math.min(p + 70 / total, 100));
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
        setProgress(30);

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
          grades: Array.isArray(extracted.grades)
            ? extracted.grades
            : Array.isArray(extracted.grades)
            ? extracted.grades
            : [],
        };

        // 🔹 Step 4: Save and show results
        // 🔹 Step 5: Upload extracted record to backend (same as Excel logic)
        try {
          setMessage("Uploading extracted grade to server...");
          await axios.post(
            `${
              import.meta.env.VITE_BACKEND_URL
            }api/renewal/upload-scholar-grades`,
            {
              student_id: safeData.student_id,
              fileName: safeData.fileName,
              gradeList: safeData.grades ?? [],
              gwa: safeData.gwa,
              scholar_name: safeData.scholar_name,
              program: safeData.program,
              year_level: safeData.year_level,
              semester: safeData.semester,
              sy: safeData.sy,
              campus: safeData.campus,
            }
          );

          setMessage("Uploaded extracted grade successfully.");
        } catch (uploadErr) {
          console.error("❌ Failed to upload extracted PDF grade:", uploadErr);
          setError(
            "Extraction succeeded but failed to upload grade to server."
          );
          setStatus("failed");
          return;
        }

        const resultData: ZipScholarGradeResult = {
          totalFiles: 1,
          results: [safeData],
        };

        setResult(resultData);
        onExtract(resultData);
        setProgress(100);
        setStatus("completed");
        setMessage("Single PDF extracted and uploaded successfully!");
        return;
      }
    } catch (err) {
      console.error("Extraction failed:", err);
      setError("Extraction failed. Please try again.");
      setStatus("failed");
    }
  };

  const reset = () => {
    setMode(null);
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setStatus("idle");
    setMessage("");
  };
  const saveAllExtractedToRenewal = async () => {
    if (!result || !onSaveToTempRenewals) return;

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

  // 🌀 Processing UI
  if (status === "processing") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50">
        <div className="bg-white rounded-xl p-6 shadow-2xl text-center w-full max-w-sm">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Processing</h2>
          <p className="text-xs text-gray-600 mt-1">{message}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className="h-2.5 bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{progress.toFixed(0)}%</p>
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
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 relative max-h-[85vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <FileCheck className="w-12 h-12 text-green-600 mb-2 animate-bounce" />
            <h2 className="text-xl font-bold text-gray-900">
              Extraction Complete
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              {message || "All files processed successfully!"}
            </p>

            {/* ✅ Match Summary */}
            <p className="text-sm text-gray-800 font-medium mt-2">
              ✅ Matched: {matchedCount} / {result.results.length}
            </p>
          </div>

          {/* ✅ Results */}
          <div className="space-y-4">
            {sortedResults.map((r, i) => {
              const grades = r.grades ?? [];
              const isMatched = renewalData.some(
                (student) =>
                  normalizeId(student.student_id) === normalizeId(r.student_id)
              );

              return (
                <div
                  key={i}
                  className={`flex flex-col md:flex-row justify-between items-start gap-4 border rounded-lg shadow-sm hover:shadow-md p-4 transition-all duration-300 ${
                    isMatched
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  }`}
                >
                  <div className="flex-1 space-y-2">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {r.scholar_name || r.student_name || "Unknown Student"}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {r.program} • {r.year_level || "N/A"} • {r.campus}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <p>ID: {r.student_id}</p>
                      <p>GWA: {r.gwa ?? "N/A"}</p>
                      <p>Semester: {r.semester ?? "N/A"}</p>
                      <p>Year: {r.sy ?? "N/A"}</p>
                      <p>Pages: {r.pageCount ?? "N/A"}</p>
                    </div>

                    {/* ✅ Match badge */}
                    <div className="mt-2">
                      {isMatched ? (
                        <span className="text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">
                          ✅ Matched with Renewal List
                        </span>
                      ) : (
                        <span className="text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-medium">
                          ❌ No Match Found
                        </span>
                      )}
                    </div>

                    <details className="mt-2">
                      <summary className="cursor-pointer text-indigo-600 font-medium text-xs">
                        Grades ({grades.length})
                      </summary>
                      <div className="mt-2 border border-gray-200 rounded overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">
                                Course
                              </th>
                              <th className="text-left px-3 py-1.5 font-semibold text-gray-700">
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
                                <td className="px-3 py-1.5 text-gray-800 font-medium">
                                  {g.course_code}
                                </td>
                                <td
                                  className={`px-3 py-1.5 font-semibold ${
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
                    </details>
                  </div>

                  <div className="md:self-center mt-3 md:mt-0">
                    {r.fileObject ? (
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(r.fileObject!);
                          window.open(url, "_blank");
                        }}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium"
                      >
                        Preview
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        No File
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={saveAllExtractedToRenewal}
              disabled={isUploadingToRenewal}
              className={`flex items-center justify-center gap-2 px-6 py-2 rounded text-sm font-semibold text-white transition-all duration-200
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
                "Upload to Renewal Table"
              )}
            </button>

            <button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
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

  // 🧩 Default UI
  return (
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
          Select a file type to upload
        </p>

        {!mode ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setMode("excel")}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded font-semibold text-sm"
            >
              Excel (.xlsx / .xls)
            </button>
            <button
              onClick={() => setMode("pdf")}
              className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded font-semibold text-sm"
            >
              PDF / ZIP
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 text-xs hover:text-gray-800 underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label
              htmlFor="fileInput"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer"
            >
              <Upload className="w-10 h-10 text-indigo-600 mb-2" />
              <span className="text-sm font-semibold text-gray-800">
                Upload or drag and drop
              </span>
              <span className="text-xs text-gray-600 mt-1">
                {mode === "excel"
                  ? "Excel (.xlsx, .xls)"
                  : "PDF or ZIP (Max 100MB)"}
              </span>
              <input
                id="fileInput"
                type="file"
                accept={mode === "excel" ? ".xlsx,.xls" : ".pdf,.zip"}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

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
                onClick={reset}
                className="flex-1 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-sm"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadGradesModal;
