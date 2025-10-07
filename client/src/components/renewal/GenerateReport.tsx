import React, { useState, useEffect } from "react";
import axios from "axios";

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
  const [error, setError] = useState<string>("");
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
    resetFormValues();
    onClose();
  };
  const resetFormValues = () => {
    setSchoolYear("");
    setYearLevel("");
    setSemester("");
    setYearLevelDropdownOpen(false);
    setSemesterDropdownOpen(false);
    setSchoolYearDropdownOpen(false);
    setError("");
  };

  useEffect(() => {
    if (!isOpen) {
      resetFormValues();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    if (!schoolYear || !yearLevel || !semester) {
      setError("All fields are required.");
      return;
    }
    console.log(schoolYear, yearLevel, semester);
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/renewal/get-renewal-report/${encodeURIComponent(
          yearLevel
        )}/${encodeURIComponent(schoolYear)}/${encodeURIComponent(semester)}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Renewal_Report(${yearLevel}_${schoolYear}_${semester}).xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      handleClose();
    } catch (error) {
      console.error("Error downloading the report:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          setError(error.response.data.message || "Failed to download report.");
        } else if (error.request) {
          setError("No response from server. Please try again later.");
        } else {
          setError("Failed to make request. Please try again.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
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
            <div className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-100 text-gray-600 text-xs sm:text-sm w-1/2">
              School Year
            </div>
            <div className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-100 text-xs sm:text-sm flex-grow flex justify-between items-center">
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
                  className="px-2 sm:px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm"
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
            <div className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-100 text-gray-600 text-xs sm:text-sm w-1/2">
              Year Level
            </div>
            <div className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-100 text-xs sm:text-sm flex-grow flex justify-between items-center">
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
                  className="px-2 sm:px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm"
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
            <div className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-100 text-gray-600 text-xs sm:text-sm w-1/2">
              Semester
            </div>
            <div className="py-2 sm:py-3 px-2 sm:px-4 bg-gray-100 text-xs sm:text-sm flex-grow flex justify-between items-center">
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
                  className="px-2 sm:px-4 py-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm"
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
            onClick={handleGenerateReport}
            disabled={loading}
            className={`${
              loading ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
            } text-white py-2 px-4 sm:px-6 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;
