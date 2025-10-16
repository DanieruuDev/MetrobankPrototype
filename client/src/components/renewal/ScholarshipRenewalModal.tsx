import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AlertCircle, Loader2 } from "lucide-react";

interface ScholarshipRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  getRenewalData: (sy: string, semester: string) => void;
  sySemester: string;
  onChangeSySemester?: (value: string) => void; // NEW
  user_id: number;
}

export interface RenewalFormData {
  schoolYear: string;
  yearLevel: string;
  semester: string;
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
  const [yearLevel, setYearLevel] = useState<string>("");
  const [semester, setSemester] = useState<string>(semesterFormatted);
  const [yearLevelDropdownOpen, setYearLevelDropdownOpen] =
    useState<boolean>(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] =
    useState<boolean>(false);
  const [schoolYearDropdownOpen, setSchoolYearDropdownOpen] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const schoolYearOptions = ["2023-2024", "2024-2025", "2025-2026"];
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

  useEffect(() => {
    if (!isOpen) {
      resetFormValues();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidateAndShowConfirmation = () => {
    // Validate form data
    if (!schoolYear || !yearLevel || !semester) {
      setError("All fields are required.");
      return;
    }

    // Show confirmation modal
    setError("");
    setShowConfirmation(true);
  };

  const handleConfirmInitialization = async () => {
    setLoading(true);
    setShowConfirmation(false);
    setError("");

    try {
      const response = await axios.post(
        `${VITE_BACKEND_URL}api/renewal/generate-renewal`,
        {
          school_year: schoolYear,
          year_level: Number(yearLevel.substring(0, 1)),
          semester: Number(semester.substring(0, 1)),
          user_id: user_id,
        }
      );

      console.log("Renewal data retrieved:", response.data);

      // ✅ Construct and send new SY_Semester to parent
      const semCode = semester.startsWith("1") ? "1" : "2";
      const newSySemester = `${schoolYear}_${semCode}`;

      onChangeSySemester?.(newSySemester);
      console.log(newSySemester);
      // ✅ Trigger data refresh
      getRenewalData(newSySemester, "");

      // ✅ Clean up
      setSchoolYear("");
      setYearLevel("");
      setSemester("");
      setError("");

      toast.success("Scholarship renewal initialized successfully!");
      onClose();
    } catch (error) {
      console.error("Error fetching renewal data:", error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (
            error.response.data.message ===
            "All students already have renewals."
          ) {
            toast.info("All students already have renewals.");
            onClose();
            return;
          }

          const errorMessage =
            error.response.data.message || "Failed to retrieve renewal data.";
          setError(errorMessage);
          toast.error(errorMessage);
        } else if (error.request) {
          const errorMessage =
            "No response from server. Please try again later.";
          setError(errorMessage);
          toast.error(errorMessage);
        } else {
          const errorMessage = "Failed to make request. Please try again.";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else {
        const errorMessage = "An unexpected error occurred.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!loading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
            {/* Header with close button */}
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

            {/* Error message display */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* School Year Dropdown */}
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
                  School Year Renewal
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

            {/* Year Level Dropdown */}
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
                  Year Level Renewal
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

            {/* Semester Dropdown */}
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
                  Semester Renewal
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

      {/* Confirmation Modal */}
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

      {/* Full-Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
                </div>
                <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Initializing Renewal
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                Please wait while we process the renewal records...
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
    </>
  );
};

export default ScholarshipRenewalModal;
