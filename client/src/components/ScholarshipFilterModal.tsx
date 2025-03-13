import React, { useState } from "react";

export interface FilterCriteria {
  schoolYear: string;
  yearLevel: string;
  semester: string;
}
interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fetchRenewalData: ({
    schoolYear,
    yearLevel,
    semester,
  }: FilterCriteria) => void;
}

const ScholarshipFilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  fetchRenewalData,
}) => {
  const [schoolYear, setSchoolYear] = useState<string>("");
  const [yearLevel, setYearLevel] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [yearLevelDropdownOpen, setYearLevelDropdownOpen] =
    useState<boolean>(false);
  const [semesterDropdownOpen, setSemesterDropdownOpen] =
    useState<boolean>(false);

  const yearLevelOptions: string[] = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
  ];

  const semesterOptions: string[] = ["1st Semester", "2nd Semester"];

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4 shadow-lg">
        {/* Header with title and close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Generate Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* School Year Input */}
        <div className="mb-3 flex">
          <div className="w-1/3 bg-gray-100 p-3 rounded-l-md">
            <span className="text-gray-600 text-sm">School Year</span>
          </div>
          <input
            type="text"
            placeholder="Enter school year"
            value={schoolYear}
            onChange={(e) => setSchoolYear(e.target.value)}
            className="w-2/3 p-3 bg-gray-100 rounded-r-md text-sm outline-none"
          />
        </div>

        {/* Year Level Dropdown */}
        <div className="mb-3 relative">
          <div className="flex">
            <div className="w-1/3 bg-gray-100 p-3 rounded-l-md">
              <span className="text-gray-600 text-sm">Year Level</span>
            </div>
            <div
              className="w-2/3 p-3 bg-gray-100 rounded-r-md flex justify-between items-center cursor-pointer"
              onClick={() => {
                setYearLevelDropdownOpen(!yearLevelDropdownOpen);
                setSemesterDropdownOpen(false);
              }}
            >
              <span className="text-sm text-gray-700">{yearLevel || ""}</span>
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

          {/* Year Level Dropdown Options */}
          {yearLevelDropdownOpen && (
            <div className="absolute w-2/3 right-0 mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200">
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
          <div className="flex">
            <div className="w-1/3 bg-gray-100 p-3 rounded-l-md">
              <span className="text-gray-600 text-sm">Semester</span>
            </div>
            <div
              className="w-2/3 p-3 bg-gray-100 rounded-r-md flex justify-between items-center cursor-pointer"
              onClick={() => {
                setSemesterDropdownOpen(!semesterDropdownOpen);
                setYearLevelDropdownOpen(false);
              }}
            >
              <span className="text-sm text-gray-700">{semester || ""}</span>
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

          {/* Semester Dropdown Options */}
          {semesterDropdownOpen && (
            <div className="absolute w-2/3 right-0 mt-1 bg-white shadow-md rounded-md z-10 border border-gray-200">
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

        {/* Generate Report Button */}
        <div className="flex justify-center">
          <button
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
            onClick={() => {
              fetchRenewalData({ schoolYear, yearLevel, semester });

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
