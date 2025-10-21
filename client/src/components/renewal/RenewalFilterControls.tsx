import { Search, History } from "lucide-react";
import React from "react";
import type { AuthContextType } from "../../context/AuthContext"; // ✅ Properly typed

interface RenewalFilterControlsProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void; // ✅ Added
  selectedStatus: "All" | "Not Started" | "Passed" | "Delisted";
  setSelectedStatus: (
    value: "All" | "Not Started" | "Passed" | "Delisted"
  ) => void;
  selectedBranchFilter: string;
  setSelectedBranchFilter: (value: string) => void;
  selectedYearLevelFilter: string;
  setSelectedYearLevelFilter: (value: string) => void;
  sySemester: string;
  setSySemester: (value: string) => void;
  sySemesterOptions: Array<{ label: string; value: string }>;
  role_id: number | undefined;
  auth: AuthContextType | undefined;
  uniqueBranches: string[];
  uniqueYearLevels: string[];
  countPassed: number;
  countDelisted: number;
  countNotStarted: number;
  renewalDataLength: number;
  onClearFilters: () => void;
  onShowAuditLog: () => void;
}

const RenewalFilterControls: React.FC<RenewalFilterControlsProps> = ({
  searchQuery,
  handleSearch, // ✅ Added prop
  selectedStatus,
  setSelectedStatus,
  selectedBranchFilter,
  setSelectedBranchFilter,
  selectedYearLevelFilter,
  setSelectedYearLevelFilter,
  sySemester,
  setSySemester,
  sySemesterOptions,
  role_id,
  auth,
  uniqueBranches,
  uniqueYearLevels,
  countPassed,
  countDelisted,
  countNotStarted,
  renewalDataLength,
  onClearFilters,
  onShowAuditLog,
}) => {
  return (
    <div>
      <div className="flex flex-col gap-4">
        {/* Status Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Mobile-friendly status filter */}
          <div className="flex flex-col sm:hidden gap-2">
            <div className="text-xs text-slate-600 font-medium">
              Filter by Status:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["All", "Not Started", "Passed", "Delisted"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setSelectedStatus(
                      status as "All" | "Not Started" | "Passed" | "Delisted"
                    )
                  }
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedStatus === status
                      ? status === "Passed"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                        : status === "Delisted"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                        : status === "Not Started"
                        ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                      : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md border border-white/50"
                  }`}
                >
                  {status} (
                  {status === "All"
                    ? renewalDataLength
                    : status === "Not Started"
                    ? countNotStarted
                    : status === "Passed"
                    ? countPassed
                    : countDelisted}
                  )
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Status Filter */}
          <div className="hidden sm:flex items-center bg-white/50 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden">
            {["All", "Not Started", "Passed", "Delisted"].map(
              (status, index) => (
                <React.Fragment key={status}>
                  <button
                    className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                      selectedStatus === status
                        ? status === "Passed"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                          : status === "Delisted"
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                          : status === "Not Started"
                          ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/80 hover:shadow-md"
                    }`}
                    onClick={() =>
                      setSelectedStatus(
                        status as "All" | "Not Started" | "Passed" | "Delisted"
                      )
                    }
                  >
                    {status} (
                    {status === "All"
                      ? renewalDataLength
                      : status === "Not Started"
                      ? countNotStarted
                      : status === "Passed"
                      ? countPassed
                      : countDelisted}
                    )
                  </button>
                  {index !== 3 && <div className="w-px h-6 bg-white/50"></div>}
                </React.Fragment>
              )
            )}
          </div>

          {/* Search Input */}
          <div className="flex items-center pl-3 pr-3 bg-white/100 backdrop-blur-sm rounded-lg border border-white/50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 flex-1 h-10">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search scholars..."
              className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm min-w-0"
              value={searchQuery}
              onChange={handleSearch} // ✅ Uses the filter logic
            />
          </div>
        </div>

        {/* Additional Filters Row */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Left side: Filters */}
          <div className="flex flex-col lg:flex-row gap-3 flex-1">
            {/* SY & Semester */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="text-xs text-slate-600 font-medium sm:whitespace-nowrap">
                School Year & Semester:
              </label>
              <select
                value={sySemester}
                onChange={(e) => setSySemester(e.target.value)}
                className="px-3 py-2 bg-white/100 backdrop-blur-sm border border-white/50 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-w-[120px] text-slate-700"
              >
                <option value="">Select SY-Semester</option>
                {sySemesterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Filter */}
            {!(
              (role_id === 3 || role_id === 4 || role_id === 9) &&
              Boolean(auth?.info?.branch?.branch_name)
            ) && (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="text-xs text-slate-600 font-medium sm:whitespace-nowrap">
                  Branch:
                </label>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="px-3 py-2 bg-white/100 backdrop-blur-sm border border-white/50 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-w-[120px] text-slate-700"
                >
                  <option value="All">All Branches</option>
                  {uniqueBranches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Level Filter */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="text-xs text-slate-600 font-medium sm:whitespace-nowrap">
                Year Level:
              </label>
              <select
                value={selectedYearLevelFilter}
                onChange={(e) => setSelectedYearLevelFilter(e.target.value)}
                className="px-3 py-2 bg-white/100 backdrop-blur-sm border border-white/50 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-w-[120px] text-slate-700"
              >
                <option value="All">All Year Levels</option>
                {uniqueYearLevels.map((yearLevel) => (
                  <option key={yearLevel} value={yearLevel}>
                    {yearLevel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right side: Clear Filters & Audit Log */}
          <div className="flex flex-col sm:flex-row gap-2 lg:items-end">
            <button
              onClick={onClearFilters}
              className="px-3 py-2 text-xs font-medium bg-white/100 text-slate-600 hover:text-slate-800 hover:bg-white/80 rounded-lg transition-all duration-200 border border-white/50 backdrop-blur-sm"
            >
              Clear Filters
            </button>

            {role_id === 7 && (
              <button
                className="flex items-center justify-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm text-black rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 text-xs font-medium border border-white/50 cursor-pointer"
                onClick={onShowAuditLog}
              >
                <History className="w-4 h-4" />
                <span>Audit Log</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalFilterControls;
