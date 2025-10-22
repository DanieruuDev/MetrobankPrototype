import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SYSemesterDropdown from "../../maintainables/SYSemesterDropdown";
import ExcelDownloadButton from "../../shared/DownloadExcel";
import { Student } from "../../../Interface/ITuitionInvoice";
import BranchDropdown from "../../maintainables/BranchDropdown";

interface StudentFilterProps {
  role: number | undefined;
  students: Student[];
  filteredStudents: Student[];
  schoolYear: string;
  semester: string;
  setSchoolYear: (value: string) => void;
  setSemester: (value: string) => void;
  selectedBranch: string | null; // ✅ Allow null
  setSelectedBranch: (value: string | null) => void; // ✅ Allow null
  selectedYearLevel: string;
  setSelectedYearLevel: (value: string) => void;
  selectedProgram: string;
  setSelectedProgram: (value: string) => void;
  filtersExpanded: boolean;
  setFiltersExpanded: (value: boolean) => void;
  yearLevelOpen: boolean;
  setYearLevelOpen: (value: boolean) => void;
  programOpen: boolean;
  setProgramOpen: (value: boolean) => void;
  uniqueYearLevels: string[];
  uniquePrograms: string[];
  yearLevelRef: React.RefObject<HTMLDivElement | null>;
  programRef: React.RefObject<HTMLDivElement | null>;
}

const StudentFilter: React.FC<StudentFilterProps> = ({
  role,
  students,
  filteredStudents,
  schoolYear,
  semester,
  setSchoolYear,
  setSemester,
  selectedBranch,
  setSelectedBranch,
  selectedYearLevel,
  setSelectedYearLevel,
  selectedProgram,
  setSelectedProgram,
  filtersExpanded,
  setFiltersExpanded,
  yearLevelOpen,
  setYearLevelOpen,
  programOpen,
  setProgramOpen,
  uniqueYearLevels,
  uniquePrograms,
  yearLevelRef,
  programRef,
}) => {
  const handleClearFilters = () => {
    setSelectedBranch(null);
    setSelectedYearLevel("all");
    setSelectedProgram("all");
  };

  const showClearButton =
    students.length > 0 &&
    (selectedBranch !== "all" ||
      selectedYearLevel !== "all" ||
      selectedProgram !== "all");

  return (
    <div className="mb-6 bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-2xl p-4 sm:p-6 border border-slate-200 overflow-visible relative z-10 lg:z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter Students
          </h3>

          {/* Mobile Toggle */}
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="sm:hidden p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
            aria-label="Toggle filters"
          >
            {filtersExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Right Side - Excel Download (HR Only) */}
        <div
          className={`flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 ${
            !filtersExpanded ? "hidden sm:flex" : ""
          }`}
        >
          {role === 7 &&
            students.length > 0 &&
            filteredStudents.filter(
              (s) => !s.disbursement_files || s.disbursement_files.length === 0
            ).length === 0 && (
              <div className="xs:min-w-[220px]">
                <ExcelDownloadButton
                  students={filteredStudents}
                  schoolYear={schoolYear}
                  semester={semester}
                  disbursementLabel={
                    filteredStudents[0]?.disbursement_label ||
                    "Tuition Fee and Other School Fees"
                  }
                />
              </div>
            )}
        </div>
      </div>

      {/* Filters Grid */}
      <div
        className={`grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-visible transition-all duration-300 ${
          !filtersExpanded ? "hidden sm:grid" : ""
        }`}
      >
        {/* SY - Semester Filter */}
        <div className="group relative">
          <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
            School Year • Semester
          </label>
          <div className="w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[70]">
            <SYSemesterDropdown
              value={`${schoolYear}_${
                semester === "1st Semester"
                  ? 1
                  : semester === "2nd Semester"
                  ? 2
                  : 3
              }`}
              onChange={(value) => {
                const [sy, semCode] = value.split("_");
                const semesterMap: Record<string, string> = {
                  "1": "1st Semester",
                  "2": "2nd Semester",
                  "3": "Summer",
                };
                setSchoolYear(sy);
                setSemester(semesterMap[semCode] || "1st Semester");
              }}
            />
          </div>
        </div>

        {/* Branch Dropdown */}
        <div className="group relative">
          <BranchDropdown
            formData={selectedBranch}
            handleInputChange={(value) => {
              setSelectedBranch(value);
            }}
            disabled={role !== 7} // Only HR (role 7) can change
          />
        </div>

        {/* Year Level Filter */}
        {students.length > 0 && (
          <div ref={yearLevelRef} className="group relative">
            <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
              Year Level
            </label>
            <div className="w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[50]">
              <div
                className="cursor-pointer flex justify-between items-center text-sm text-gray-700"
                onClick={() => setYearLevelOpen(!yearLevelOpen)}
              >
                <span className="truncate">
                  {selectedYearLevel === "all"
                    ? `All Year Levels (${students.length})`
                    : `${selectedYearLevel} (${
                        students.filter(
                          (s) => s.year_level === selectedYearLevel
                        ).length
                      })`}
                </span>
                <svg
                  className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${
                    yearLevelOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {yearLevelOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
                  <div
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      selectedYearLevel === "all"
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    onClick={() => {
                      setSelectedYearLevel("all");
                      setYearLevelOpen(false);
                    }}
                  >
                    All Year Levels ({students.length})
                  </div>
                  {uniqueYearLevels.map((yearLevel) => (
                    <div
                      key={yearLevel}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        selectedYearLevel === yearLevel
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedYearLevel(yearLevel);
                        setYearLevelOpen(false);
                      }}
                    >
                      {yearLevel} (
                      {
                        students.filter((s) => s.year_level === yearLevel)
                          .length
                      }
                      )
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Program Filter */}
        {students.length > 0 && (
          <div ref={programRef} className="group relative">
            <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
              Program
            </label>
            <div className="w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[40]">
              <div
                className="cursor-pointer flex justify-between items-center text-sm text-gray-700"
                onClick={() => setProgramOpen(!programOpen)}
              >
                <span className="truncate">
                  {selectedProgram === "all"
                    ? `All Programs (${students.length})`
                    : `${selectedProgram} (${
                        students.filter((s) => s.program === selectedProgram)
                          .length
                      })`}
                </span>
                <svg
                  className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${
                    programOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {programOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
                  <div
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      selectedProgram === "all"
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    onClick={() => {
                      setSelectedProgram("all");
                      setProgramOpen(false);
                    }}
                  >
                    All Programs ({students.length})
                  </div>
                  {uniquePrograms.map((program) => (
                    <div
                      key={program}
                      className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        selectedProgram === program
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                      onClick={() => {
                        setSelectedProgram(program);
                        setProgramOpen(false);
                      }}
                    >
                      {program} (
                      {students.filter((s) => s.program === program).length})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Clear All Filters Button */}
      {showClearButton && (
        <div
          className={`mt-4 flex justify-end ${
            !filtersExpanded ? "hidden sm:flex" : "flex"
          }`}
        >
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-lg font-medium transition-all duration-200 border border-gray-200 shadow-sm text-sm"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentFilter;
