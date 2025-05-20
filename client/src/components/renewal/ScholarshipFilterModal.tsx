import { X } from "lucide-react";
import React, { useState, useEffect } from "react";

export interface FilterCriteria {
  schoolYear: string;
  yearLevel: string;
  semester: string;
}
interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterRenewalData: (
    school_year: string,
    year_level: string,
    semester: string,
    campus: string,
    scholar_name: string
  ) => void;
}

const ScholarshipFilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filterRenewalData,
}) => {
  const [schoolYear, setSchoolYear] = useState<string>("");
  const [yearLevel, setYearLevel] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [campus, setCampus] = useState<string>("");
  const [yearLevelDropdownOpen, setYearLevelDropdownOpen] =
    useState<boolean>(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] =
    useState<boolean>(false);
  const [schoolYearDropdownOpen, setSchoolYearDropdownOpen] =
    useState<boolean>(false);
  const [campusDropdownOpen, setCampusDropdownOpen] = useState<boolean>(false);

  const schoolYearOptions = ["2023-2024", "2024-2025", "2025-2026"];
  const yearLevelOptions: string[] = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
  ];

  const semesterOptions: string[] = ["1st Semester", "2nd Semester"];

  const campusOption: string[] = [
    "STI Ortigas-Cainta",
    "STI Fairview",
    "STI Pasay-EDSA",
    "STI Global City",
    "STI Novaliches",
    "STI Sta Mesa",
  ];

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
  };

  useEffect(() => {
    if (!isOpen) {
      resetFormValues();
    }
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4 shadow-lg">
        {/* Header with title and close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Filter</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-xl">
              <X />
            </span>
          </button>
        </div>

        {/* School Year Dropdown */}
        <div className="mb-3 relative">
          <div
            className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer"
            onClick={() => {
              setSchoolYearDropdownOpen(!schoolYearDropdownOpen);
              setSemesterDropdownOpen(false);
              setYearLevelDropdownOpen(false);
              setCampusDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2">
              Year Level Renewal
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center">
              <div className="text-gray-700">
                {schoolYear || (
                  <span className="text-gray-400">Enter School Year Basis</span>
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
              setCampusDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2">
              Year Level Renewal
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center">
              <div className="text-gray-700">
                {yearLevel || (
                  <span className="text-gray-400">Enter Year Level Basis</span>
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
              setCampusDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2">
              Semester Renewal
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center">
              <div className="text-gray-700">
                {semester || (
                  <span className="text-gray-400">Enter Semester Basis</span>
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

        {/* Cmapus Dropdown */}
        <div className="mb-4 relative">
          <div
            className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer"
            onClick={() => {
              setCampusDropdownOpen(!campusDropdownOpen);
              setSemesterDropdownOpen(false);
              setYearLevelDropdownOpen(false);
              setSchoolYearDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2">
              Campus
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center">
              <div className="text-gray-700">
                {campus || <span className="text-gray-400">Enter Campus</span>}
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

          {campusDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200">
              {campusOption.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setCampus(option);
                    setCampusDropdownOpen(false);
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate Report Button */}
        <div className="flex justify-center">
          <button
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
            onClick={() => {
              console.log("Complete");
              filterRenewalData(
                schoolYear || "",
                yearLevel || "",
                semester || "",
                campus || "",
                ""
              );
              onClose();
            }}
          >
            Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipFilterModal;
