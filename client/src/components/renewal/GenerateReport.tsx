import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertCircle, Loader2 } from "lucide-react";

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GenerateReportModal: React.FC<GenerateReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [schoolYear, setSchoolYear] = useState<string>("");
  const [yearLevel, setYearLevel] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [yearLevelDropdownOpen, setYearLevelDropdownOpen] =
    useState<boolean>(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] =
    useState<boolean>(false);
  const [schoolYearDropdownOpen, setSchoolYearDropdownOpen] =
    useState<boolean>(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState<boolean>(false);
  const [generateProgress, setGenerateProgress] = useState<number>(0);
  const [generateStatus, setGenerateStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const schoolYearOptions = [
    "2023-2024",
    "2024-2025",
    "2025-2026",
    "2026-2027",
  ];
  const yearLevelOptions: string[] = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
  ];
  const semesterOptions: string[] = ["1st Semester", "2nd Semester"];

  const handleClose = () => {
    if (!loading) {
      resetFormValues();
      onClose();
    }
  };
  const resetFormValues = () => {
    setSchoolYear("");
    setYearLevel("");
    setSemester("");
    setYearLevelDropdownOpen(false);
    setSemesterDropdownOpen(false);
    setSchoolYearDropdownOpen(false);
    setError("");
    setShowConfirmation(false);
  };

  const handleShowConfirmation = () => {
    if (!schoolYear || !yearLevel || !semester) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setShowConfirmation(true);
  };

  useEffect(() => {
    if (!isOpen) {
      resetFormValues();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmGenerate = async () => {
    setShowConfirmation(false);
    console.log(schoolYear, yearLevel, semester);
    setLoading(true);
    setGenerateProgress(0);
    setGenerateStatus("Preparing report generation...");
    setError("");

    let progressInterval: NodeJS.Timeout;
    let statusTimeout1: NodeJS.Timeout;
    let statusTimeout2: NodeJS.Timeout;
    let statusTimeout3: NodeJS.Timeout;

    try {
      // Start progress animation
      progressInterval = setInterval(() => {
        setGenerateProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95; // Stop at 95% until operation completes
          }
          return prev + 1;
        });
      }, 30); // Update every 30ms for smooth animation

      // Update status messages at different progress points
      statusTimeout1 = setTimeout(() => {
        setGenerateStatus("Fetching renewal data...");
      }, 500);

      statusTimeout2 = setTimeout(() => {
        setGenerateStatus("Compiling report data...");
      }, 1500);

      statusTimeout3 = setTimeout(() => {
        setGenerateStatus("Preparing download...");
      }, 2500);

      const response = await axios.get(
        `${VITE_BACKEND_URL}api/renewal/get-renewal-report/${encodeURIComponent(
          yearLevel
        )}/${encodeURIComponent(schoolYear)}/${encodeURIComponent(semester)}`,
        { responseType: "blob" }
      );

      // Clear all timeouts
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
      clearTimeout(statusTimeout3);
      clearInterval(progressInterval); // Ensure interval is cleared

      // Complete the progress
      setGenerateProgress(100);
      setGenerateStatus("Report complete!");

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Renewal_Report(${yearLevel}_${schoolYear}_${semester}).xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("Report generated successfully!");

      // Wait a moment to show completion, then close
      setTimeout(() => {
        setLoading(false);
        setGenerateProgress(0);
        setGenerateStatus("");
        handleClose();
      }, 1000);
    } catch (error) {
      clearInterval(progressInterval);
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
      clearTimeout(statusTimeout3);
      console.error("Error downloading the report:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMsg =
            error.response.data.message || "Failed to download report.";
          setError(errorMsg);
          toast.error(errorMsg);
        } else if (error.request) {
          const errorMsg = "No response from server. Please try again later.";
          setError(errorMsg);
          toast.error(errorMsg);
        } else {
          const errorMsg = "Failed to make request. Please try again.";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } else {
        const errorMsg = "An unexpected error occurred.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
      setLoading(false);
      setGenerateProgress(0);
      setGenerateStatus("");
    }
  };

  return (
    <>
      {!loading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-700">
                Generate Renewal Report
              </h2>
              <button
                onClick={handleClose}
                className="text-xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="mb-3 relative">
              <div
                className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                onClick={() => {
                  setSchoolYearDropdownOpen(!schoolYearDropdownOpen);
                  setSemesterDropdownOpen(false);
                  setYearLevelDropdownOpen(false);
                }}
              >
                <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2">
                  School Year
                </div>
                <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center">
                  <div className="text-gray-700">
                    {schoolYear || (
                      <span className="text-gray-400">Enter School Year</span>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {schoolYearDropdownOpen && (
                <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200">
                  {schoolYearOptions.map((option) => (
                    <div
                      key={option}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setSchoolYear(option);
                        setSchoolYearDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-3 relative">
              <div
                className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                onClick={() => {
                  setYearLevelDropdownOpen(!yearLevelDropdownOpen);
                  setSchoolYearDropdownOpen(false);
                  setSemesterDropdownOpen(false);
                }}
              >
                <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2">
                  Year Level
                </div>
                <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center">
                  <div className="text-gray-700">
                    {yearLevel || (
                      <span className="text-gray-400">Enter Year Level</span>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {yearLevelDropdownOpen && (
                <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200">
                  {yearLevelOptions.map((option) => (
                    <div
                      key={option}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setYearLevel(option);
                        setYearLevelDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4 relative">
              <div
                className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                onClick={() => {
                  setSemesterDropdownOpen(!semesterDropdownOpen);
                  setYearLevelDropdownOpen(false);
                  setSchoolYearDropdownOpen(false);
                }}
              >
                <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2">
                  Semester
                </div>
                <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center">
                  <div className="text-gray-700">
                    {semester || (
                      <span className="text-gray-400">Enter Semester</span>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {semesterDropdownOpen && (
                <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200">
                  {semesterOptions.map((option) => (
                    <div
                      key={option}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setSemester(option);
                        setSemesterDropdownOpen(false);
                      }}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleShowConfirmation}
                disabled={loading}
                className={`${
                  loading ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
                } text-white py-2 px-6 rounded-md text-sm font-medium transition-colors`}
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Generate Renewal Report
              </h3>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-gray-600 text-sm">
                You are about to generate a renewal report for:
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    School Year:
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {schoolYear}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Year Level:</span>
                  <span className="text-gray-900 font-semibold">
                    {yearLevel}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Semester:</span>
                  <span className="text-gray-900 font-semibold">
                    {semester}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                This will download an Excel report with the renewal data. Do you
                want to proceed?
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
                onClick={handleConfirmGenerate}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Yes, Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Loading Overlay for Report Generation */}
      {loading && (
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
                    stroke="#10b981" // Green color for report generation
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 45 * (1 - generateProgress / 100)
                    }`}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                {/* Percentage text inside circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {generateProgress}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {generateProgress === 100 ? "Complete" : "Progress"}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Generating Report
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                {generateStatus ||
                  "Please wait while we compile the renewal data..."}
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
};

export default GenerateReportModal;
