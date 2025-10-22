import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertCircle } from "lucide-react";

interface ScholarshipRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  getRenewalData: (sy: string, semester: string) => void;
  sySemester: string;
  onChangeSySemester?: (value: string) => void;
  user_id: number;
}

export interface RenewalFormData {
  schoolYear: string;
  semester: string;
  renewalDate: string;
}

const ScholarshipRenewalModal: React.FC<ScholarshipRenewalModalProps> = ({
  isOpen,
  onClose,
  getRenewalData,
  sySemester,
  onChangeSySemester,
  user_id,
}) => {
  let sy = "";
  let semCode = "";

  if (typeof sySemester === "string" && sySemester.includes("_")) {
    [sy, semCode] = sySemester.split("_");
  }
  const semesterFormatted = semCode ? `${semCode} Semester` : "";

  const [schoolYear, setSchoolYear] = useState<string>(sy);
  const [semester, setSemester] = useState<string>(semesterFormatted);
  const [renewalDate, setRenewalDate] = useState<string>(""); // 🆕 Renewal Date state

  const [semesterDropdownOpen, setSemesterDropdownOpen] =
    useState<boolean>(false);
  const [schoolYearDropdownOpen, setSchoolYearDropdownOpen] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [initProgress, setInitProgress] = useState<number>(0);
  const [initStatus, setInitStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const schoolYearOptions = ["2024-2025", "2025-2026"];
  const semesterOptions: string[] = ["1st Semester", "2nd Semester"];

  const handleClose = () => {
    if (!loading) {
      resetFormValues();
      onClose();
    }
  };

  const resetFormValues = () => {
    setSchoolYear("");
    setSemester("");
    setRenewalDate("");
    setSemesterDropdownOpen(false);
    setSchoolYearDropdownOpen(false);
    setError("");
    setShowConfirmation(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetFormValues();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidateAndShowConfirmation = () => {
    if (!schoolYear || !semester || !renewalDate) {
      setError("All fields are required, including renewal date.");
      return;
    }

    setError("");
    setShowConfirmation(true);
  };

  const handleConfirmInitialization = async () => {
    setLoading(true);
    setInitProgress(0);
    setInitStatus("Preparing initialization...");
    setShowConfirmation(false);
    setError("");

    let progressInterval: number | undefined;
    let statusTimeout1: number | undefined;
    let statusTimeout2: number | undefined;
    let statusTimeout3: number | undefined;

    try {
      progressInterval = setInterval(() => {
        setInitProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 1;
        });
      }, 30);

      statusTimeout1 = setTimeout(
        () => setInitStatus("Connecting to server..."),
        500
      );
      statusTimeout2 = setTimeout(
        () => setInitStatus("Processing renewal data..."),
        1500
      );
      statusTimeout3 = setTimeout(
        () => setInitStatus("Initializing records..."),
        2500
      );

      const response = await axios.post(
        `${VITE_BACKEND_URL}api/renewal/generate-renewal`,
        {
          school_year: schoolYear,
          semester: Number(semester.substring(0, 1)),
          user_id: user_id,
          renewal_date: renewalDate, // 🆕 Include renewal date
        }
      );
      console.log(response.data);
      clearTimeout(statusTimeout1);
      clearTimeout(statusTimeout2);
      clearTimeout(statusTimeout3);
      clearInterval(progressInterval);

      setInitProgress(100);
      setInitStatus("Initialization complete!");

      const semCode = semester.startsWith("1") ? "1" : "2";
      const newSySemester = `${schoolYear}_${semCode}`;
      onChangeSySemester?.(newSySemester);
      getRenewalData(newSySemester, "");

      resetFormValues();
      toast.success("Scholarship renewal initialized successfully!");

      setTimeout(() => {
        setLoading(false);
        setInitProgress(0);
        setInitStatus("");
        onClose();
      }, 1000);
    } catch (error) {
      if (progressInterval !== undefined) clearInterval(progressInterval);
      if (statusTimeout1 !== undefined) clearTimeout(statusTimeout1);
      if (statusTimeout2 !== undefined) clearTimeout(statusTimeout2);
      if (statusTimeout3 !== undefined) clearTimeout(statusTimeout3);

      console.error("Error fetching renewal data:", error);

      let errorMessage = "An unexpected error occurred.";
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (
            error.response.data.message ===
            "All students already have renewals."
          ) {
            toast.info("All students already have renewals.");
            setLoading(false);
            setInitProgress(0);
            setInitStatus("");
            onClose();
            return;
          }
          errorMessage =
            error.response.data.message || "Failed to retrieve renewal data.";
        } else if (error.request) {
          errorMessage = "No response from server. Please try again later.";
        } else {
          errorMessage = "Failed to make request. Please try again.";
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      setInitProgress(0);
      setInitStatus("");
    }
  };

  return (
    <>
      {!loading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-700">
                Initialize Scholarship Renewal
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

            {/* School Year */}
            <div className="mb-3 relative">
              <div
                className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                onClick={() => {
                  setSchoolYearDropdownOpen(!schoolYearDropdownOpen);
                  setSemesterDropdownOpen(false);
                }}
              >
                <div className="py-3 px-4 text-gray-600 text-sm w-1/2">
                  School Year Renewal
                </div>
                <div className="py-3 px-4 text-sm flex-grow flex justify-between items-center">
                  <div className="text-gray-700">
                    {schoolYear || (
                      <span className="text-gray-400">Select School Year</span>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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

            {/* Semester */}
            <div className="mb-3 relative">
              <div
                className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                onClick={() => {
                  setSemesterDropdownOpen(!semesterDropdownOpen);
                  setSchoolYearDropdownOpen(false);
                }}
              >
                <div className="py-3 px-4 text-gray-600 text-sm w-1/2">
                  Semester Renewal
                </div>
                <div className="py-3 px-4 text-sm flex-grow flex justify-between items-center">
                  <div className="text-gray-700">
                    {semester || (
                      <span className="text-gray-400">Select Semester</span>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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

            {/* Renewal Date Input 🆕 */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-1">
                Renewal Date
              </label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <button
                onClick={handleValidateAndShowConfirmation}
                disabled={loading}
                className={`${
                  loading ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
                } text-white py-2 px-6 rounded-md text-sm font-medium transition-colors`}
              >
                Initialize Renewal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (now includes renewal date) */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Initialization
              </h3>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-gray-600 text-sm">
                You are about to initialize scholarship renewal for:
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
                  <span className="font-medium text-gray-700">Semester:</span>
                  <span className="text-gray-900 font-semibold">
                    {semester}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    Renewal Date:
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {renewalDate}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                This action will create renewal records for eligible students.
                Do you want to proceed?
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
                onClick={handleConfirmInitialization}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay (unchanged) */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-6">
                <svg
                  className="w-24 h-24 transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
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
                      2 * Math.PI * 45 * (1 - initProgress / 100)
                    }`}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {initProgress}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {initProgress === 100 ? "Complete" : "Progress"}
                  </span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Initializing Renewal
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                {initStatus ||
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
};

export default ScholarshipRenewalModal;
