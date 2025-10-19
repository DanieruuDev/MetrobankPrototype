import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { RenewalRow } from "../../Interface/IRenewal";
import * as XLSX from "xlsx";
import { RenewalDetails } from "../../Interface/IRenewal";
import { toast } from "react-toastify";
import { AlertCircle, Loader2 } from "lucide-react";

interface UploadFileRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  renewalData: RenewalDetails[];
  onFileChanges: (updatedRows: RenewalRow[]) => void;
}

function UploadFileRenewalModal({
  isOpen,
  onClose,
  renewalData,
  onFileChanges,
}: UploadFileRenewalModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [excelFile, setExcelFile] = useState<RenewalRow[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const existingData: RenewalRow[] = renewalData.map((r) => ({
    student_id: r.student_id,
    scholar_name: r.scholar_name,
    scholarship_status: r.scholarship_status,
    campus: r.campus,
    batch: r.batch,
    renewal_date: r.renewal_date ?? null,
    renewal_year_level_basis: r.renewal_year_level_basis,
    renewal_semester_basis: r.renewal_semester_basis,
    renewal_school_year_basis: r.renewal_school_year_basis,
    gpa: r.gpa ?? null,
    gpa_validation_stat: r.gpa_validation_stat,
    no_failing_grd_validation: r.no_failing_grd_validation,
    no_other_scholar_validation: r.no_other_scholar_validation,
    goodmoral_validation: r.goodmoral_validation,
    no_derogatory_record: r.no_derogatory_record,

    full_load_validation: r.full_load_validation,
    withdrawal_change_course_validation: r.withdrawal_change_course_validation,
    enrollment_validation: r.enrollment_validation,
    year_level: r.year_level,
    semester: r.semester,
    school_year: r.school_year,
    delisted_date: r.delisted_date ?? null,
    delisting_root_cause: r.delisting_root_cause ?? null,
    is_validated: r.is_validated,
    is_hr_validated: r.is_hr_validated,
    hr_completed_at: r.hr_completed_at,
  }));

  const computeGPAValidationStat = (
    gpa: number | null
  ): "Not Started" | "Passed" | "Failed" => {
    if (gpa === null) return "Not Started";
    return gpa >= 1.0 && gpa <= 2.0 ? "Passed" : "Failed";
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const parsedRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: null }
        );

        const headerMap: Record<string, keyof RenewalRow> = {
          "Student ID": "student_id",
          "Scholar Name": "scholar_name",
          "Scholarship Status": "scholarship_status",
          Campus: "campus",
          Batch: "batch",
          "Renewal Date": "renewal_date",
          "Renewal Year Level Basis": "renewal_year_level_basis",
          "Renewal Semester Basis": "renewal_semester_basis",
          "Renewal School Year Basis": "renewal_school_year_basis",
          GPA: "gpa",
          "GPA Validation": "gpa_validation_stat",
          "No Failing Grades": "no_failing_grd_validation",
          "No Other Scholarship": "no_other_scholar_validation",
          "Good Moral": "goodmoral_validation",
          "No Derogatory Record": "no_derogatory_record",

          "Full Load": "full_load_validation",
          "Withdrawal/Change of Program": "withdrawal_change_course_validation",
          "Enrollment Validation": "enrollment_validation",
          "Is Validated": "is_validated",
          "Renewal Year Level": "year_level",
          "Renewal Semester": "semester",
          "Renewal School Year": "school_year",
          "Delisted Date": "delisted_date",
          "Delisting Root Cause": "delisting_root_cause",
        };

        const parsedData: RenewalRow[] = parsedRaw.map((row) => {
          const mappedRow = {} as RenewalRow;

          Object.entries(row).forEach(([label, value]) => {
            const key = headerMap[label];
            if (key) {
              // Handle GPA specifically to ensure proper type
              if (key === "gpa") {
                mappedRow[key] =
                  value === null || value === ""
                    ? null
                    : typeof value === "number"
                    ? Math.floor(Number(value) * 100) / 100 // Round to 2 decimal places
                    : null;
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (mappedRow as any)[key] = value ?? null;
              }
            }
          });

          // Compute gpa_validation_stat based on gpa
          if ("gpa" in mappedRow) {
            mappedRow.gpa_validation_stat = computeGPAValidationStat(
              mappedRow.gpa
            );
          }

          return mappedRow;
        });

        console.log("Mapped Excel Data:", parsedData);
        setExcelFile(parsedData);
      };

      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setExcelFile([]);
      setShowConfirmation(false);
      onClose();
    }
  };

  const handleShowConfirmation = () => {
    if (!file) {
      toast.warning("Please select a file first.");
      return;
    }
    const changes = compareFile();
    if (changes.length === 0) {
      toast.info("No changes detected in the file.");
      handleClose();
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmedUpload = async () => {
    setShowConfirmation(false);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");

    let progressInterval: NodeJS.Timeout;
    let statusTimeout1: NodeJS.Timeout;
    let statusTimeout2: NodeJS.Timeout;
    let statusTimeout3: NodeJS.Timeout;

    try {
      // Start progress animation
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95; // Stop at 95% until operation completes
          }
          return prev + 1;
        });
      }, 30); // Update every 30ms for smooth animation

      // Update status messages at different progress points
      statusTimeout1 = setTimeout(() => {
        setUploadStatus("Processing file data...");
      }, 500);

      statusTimeout2 = setTimeout(() => {
        setUploadStatus("Validating records...");
      }, 1500);

      statusTimeout3 = setTimeout(() => {
        setUploadStatus("Applying changes...");
      }, 2500);

      // Simulate a small delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const changes = compareFile();
      onFileChanges(changes);

      // Clear all timeouts
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
      clearTimeout(statusTimeout3);
      clearInterval(progressInterval); // Ensure interval is cleared

      // Complete the progress
      setUploadProgress(100);
      setUploadStatus("Upload complete!");

      toast.success(`Successfully uploaded ${changes.length} record(s)`);

      // Wait a moment to show completion, then close
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatus("");
        handleClose();
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
      clearTimeout(statusTimeout3);
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
    }
  };

  const compareFile = () => {
    return excelFile.filter((excelRow) => {
      const existingRow = existingData.find(
        (r) => r.student_id === excelRow.student_id
      );
      if (!existingRow) return true;

      return Object.keys(excelRow).some((key) => {
        const excelValue = excelRow[key as keyof RenewalRow];
        const existingValue = existingRow[key as keyof RenewalRow];

        const normalizedExcel = excelValue ?? "";
        const normalizedExisting = existingValue ?? "";

        return normalizedExcel !== normalizedExisting;
      });
    });
  };

  if (!isOpen) return null;

  const changesPreview = compareFile();
  console.log(changesPreview);

  return (
    <>
      {!isUploading && !showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-[900px] p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            {excelFile.length > 0 ? (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Changes Preview
                  </h3>
                  <button
                    onClick={() => {
                      setExcelFile([]);
                      setFile(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Change File
                  </button>
                </div>
                <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <strong className="text-blue-900 text-lg">
                      Changes Preview
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                      {changesPreview.length} row
                      {changesPreview.length !== 1 ? "s" : ""} affected
                    </span>
                  </div>
                </div>

                {changesPreview.length === 0 ? (
                  <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <p className="text-green-800 font-medium">
                      No changes detected
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      All data matches existing records perfectly
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-slate-100 sticky top-0 z-10">
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 text-left font-semibold text-gray-800 min-w-[120px]">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="w-4 h-4 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  ></path>
                                </svg>
                                Student ID
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-800 min-w-[150px]">
                              Scholar Name
                            </th>
                            {changesPreview.length > 0 &&
                              Object.keys(changesPreview[0]).map((key) => {
                                const hasChanges = changesPreview.some(
                                  (row) => {
                                    const existingRow = existingData.find(
                                      (r) => r.student_id === row.student_id
                                    );
                                    if (!existingRow) return true;

                                    const excelValue =
                                      row[key as keyof RenewalRow];
                                    const existingValue =
                                      existingRow[key as keyof RenewalRow];
                                    const normalizedExcel = excelValue ?? "";
                                    const normalizedExisting =
                                      existingValue ?? "";
                                    return (
                                      normalizedExcel !== normalizedExisting
                                    );
                                  }
                                );

                                if (
                                  !hasChanges ||
                                  key === "student_id" ||
                                  key === "scholar_name"
                                )
                                  return null;

                                return (
                                  <th
                                    key={key}
                                    className="px-4 py-3 text-left font-semibold text-gray-800 min-w-[150px]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                      {key
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}
                                    </div>
                                  </th>
                                );
                              })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {changesPreview.map((row, rowIndex) => {
                            const existingRow = existingData.find(
                              (r) => r.student_id === row.student_id
                            );
                            const isNewRecord = !existingRow;

                            return (
                              <tr
                                key={rowIndex}
                                className={`hover:bg-gray-50 transition-colors ${
                                  isNewRecord
                                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400"
                                    : ""
                                }`}
                              >
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {row.student_id}
                                    {isNewRecord && (
                                      <span className="px-2 py-1 text-xs font-bold bg-emerald-200 text-emerald-800 rounded-full">
                                        NEW
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-gray-700 font-medium">
                                  {row.scholar_name || "N/A"}
                                </td>

                                {Object.keys(row).map((key) => {
                                  if (
                                    key === "student_id" ||
                                    key === "scholar_name"
                                  )
                                    return null;

                                  const columnHasChanges = changesPreview.some(
                                    (r) => {
                                      const existingR = existingData.find(
                                        (er) => er.student_id === r.student_id
                                      );
                                      if (!existingR) return true;

                                      const excelVal =
                                        r[key as keyof RenewalRow];
                                      const existingVal =
                                        existingR[key as keyof RenewalRow];
                                      const normExcel = excelVal ?? "";
                                      const normExisting = existingVal ?? "";
                                      return normExcel !== normExisting;
                                    }
                                  );

                                  if (!columnHasChanges) return null;

                                  const excelValue =
                                    row[key as keyof RenewalRow];
                                  const existingValue =
                                    existingRow?.[key as keyof RenewalRow];
                                  const normalizedExcel = excelValue ?? "";
                                  const normalizedExisting =
                                    existingValue ?? "";
                                  const hasChange =
                                    normalizedExcel !== normalizedExisting;

                                  return (
                                    <td
                                      key={key}
                                      className={`px-4 py-3 ${
                                        hasChange
                                          ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-l-2 border-amber-300"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {hasChange && !isNewRecord ? (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                            <span className="line-through">
                                              {normalizedExisting || "null"}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                                            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                            <span>
                                              {normalizedExcel || "null"}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-gray-700 font-medium">
                                          {normalizedExcel || "null"}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded"></div>
                            <span className="text-gray-600">
                              Modified fields
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-400 rounded"></div>
                            <span className="text-gray-600">New records</span>
                          </div>
                        </div>
                        <span className="text-gray-500">
                          Scroll horizontally to view all columns
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Upload Renewal File
                </h2>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-300 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  {file ? (
                    <p className="text-gray-700 font-medium">{file.name}</p>
                  ) : isDragActive ? (
                    <p>Drop the Excel file here ...</p>
                  ) : (
                    <p>
                      Drag & drop an Excel (.xlsx) file here, or click to browse
                    </p>
                  )}
                </div>

                <p className="mt-3 text-sm text-yellow-600">
                  ⚠️ Note: Uploading a file may update or overwrite some rows in
                  the renewal table based on the changes inside your Excel
                  sheet.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                disabled={!file || isUploading}
                onClick={handleShowConfirmation}
                className={`px-4 py-2 rounded-lg text-white ${
                  file && !isUploading
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

      {/* Upload Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm File Upload
              </h3>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-gray-600 text-sm">
                You are about to upload and apply changes from:
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">File Name:</span>
                  <span className="text-gray-900 font-semibold truncate ml-2 max-w-[200px]">
                    {file?.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    Records Affected:
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {compareFile().length} student(s)
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                This action will update student records. Do you want to proceed?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedUpload}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Yes, Upload File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Loading Overlay for Upload */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-24 h-24 mb-6">
                <svg
                  className="w-24 h-24 transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 45 * (1 - uploadProgress / 100)
                    }`}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                {/* Percentage text inside circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {uploadProgress}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {uploadProgress === 100 ? "Complete" : "Progress"}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Uploading File
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                {uploadStatus ||
                  "Please wait while we process the renewal records..."}
              </p>

              <p className="text-xs text-gray-500 mt-4 text-center">
                This may take a few moments. Please do not close this window.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UploadFileRenewalModal;
