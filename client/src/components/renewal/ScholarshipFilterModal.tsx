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
  const [yearLevelDropdownOpen, setYearLevelDropdownOpen] = useState<boolean>(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] = useState<boolean>(false);
  const [schoolYearDropdownOpen, setSchoolYearDropdownOpen] = useState<boolean>(false);
  const [campusDropdownOpen, setCampusDropdownOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  const schoolYearOptions = ["2023-2024", "2024-2025", "2025-2026"];
  const yearLevelOptions: string[] = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
  ];

  const semesterOptions: string[] = ["1st Semester", "2nd Semester"];
  const campusOption: string[] = [
    "CAMPUS_1 as Ortigas Cainta",
    "CAMPUS_2 as Sta.Mesa",
    "CAMPUS_3 as Fairview",
    "CAMPUS_4 as Global City",
    "CAMPUS_5 as Novaliches",
    "CAMPUS_6 as Pasay-EDSA",
    "CAMPUS_7 as Cubao",
  ];

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsMounted(false);
    setTimeout(() => {
      resetFormValues();
      onClose();
    }, 200); // Match this with your transition duration
  };

  const resetFormValues = () => {
    setSchoolYear("");
    setYearLevel("");
    setSemester("");
    setCampus("");
    setYearLevelDropdownOpen(false);
    setSemesterDropdownOpen(false);
    setSchoolYearDropdownOpen(false);
    setCampusDropdownOpen(false);
  };

  if (!isOpen && !isMounted) return null;

  return (
    <div className={`fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50 transition-opacity duration-200 ${
      isMounted ? "opacity-100" : "opacity-0"
    }`}>
      <div className={`bg-white rounded-lg w-full max-w-md p-4 shadow-lg transform transition-all duration-200 ${
        isMounted ? "scale-100 opacity-100" : "scale-95 opacity-0"
      }`}>
        {/* Header with title and close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Filter</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-xl">
              <X />
            </span>
          </button>
        </div>

        {/* School Year Dropdown */}
        <div className="mb-3 relative">
          <div
            className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer transition-colors hover:bg-gray-200"
            onClick={() => {
              setSchoolYearDropdownOpen(!schoolYearDropdownOpen);
              setSemesterDropdownOpen(false);
              setYearLevelDropdownOpen(false);
              setCampusDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2 transition-colors">
              School Year
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center transition-colors">
              <div className="text-gray-700">
                {schoolYear || (
                  <span className="text-gray-400">Enter School Year Basis</span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  schoolYearDropdownOpen ? "rotate-180" : ""
                }`}
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
            <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200 transition-all duration-200 transform origin-top">
              {schoolYearOptions.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors"
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
            className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer transition-colors hover:bg-gray-200"
            onClick={() => {
              setYearLevelDropdownOpen(!yearLevelDropdownOpen);
              setSchoolYearDropdownOpen(false);
              setSemesterDropdownOpen(false);
              setCampusDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2 transition-colors">
              Year Level
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center transition-colors">
              <div className="text-gray-700">
                {yearLevel || (
                  <span className="text-gray-400">Enter Year Level Basis</span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  yearLevelDropdownOpen ? "rotate-180" : ""
                }`}
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
            <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200 transition-all duration-200 transform origin-top">
              {yearLevelOptions.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors"
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
            className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer transition-colors hover:bg-gray-200"
            onClick={() => {
              setSemesterDropdownOpen(!semesterDropdownOpen);
              setYearLevelDropdownOpen(false);
              setSchoolYearDropdownOpen(false);
              setCampusDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2 transition-colors">
              Semester
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center transition-colors">
              <div className="text-gray-700">
                {semester || (
                  <span className="text-gray-400">Enter Semester Basis</span>
                )}
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  semesterDropdownOpen ? "rotate-180" : ""
                }`}
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
            <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200 transition-all duration-200 transform origin-top">
              {semesterOptions.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors"
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

        {/* Campus Dropdown */}
        <div className="mb-4 relative">
          <div
            className="flex bg-gray-100 rounded-md overflow-hidden cursor-pointer transition-colors hover:bg-gray-200"
            onClick={() => {
              setCampusDropdownOpen(!campusDropdownOpen);
              setSemesterDropdownOpen(false);
              setYearLevelDropdownOpen(false);
              setSchoolYearDropdownOpen(false);
            }}
          >
            <div className="py-3 px-4 bg-gray-100 text-gray-600 text-sm w-1/2 transition-colors">
              Campus
            </div>
            <div className="py-3 px-4 bg-gray-100 text-sm flex-grow flex justify-between items-center transition-colors">
              <div className="text-gray-700">
                {campus || <span className="text-gray-400">Enter Campus</span>}
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  campusDropdownOpen ? "rotate-180" : ""
                }`}
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
            <div className="absolute w-full mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200 transition-all duration-200 transform origin-top">
              {campusOption.map((option) => (
                <div
                  key={option}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm transition-colors"
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
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
            onClick={() => {
              filterRenewalData(
                schoolYear || "",
                yearLevel || "",
                semester || "",
                campus || "",
                ""
              );
              handleClose();
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