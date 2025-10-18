import { ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
import { InitialRenewalInfo } from "../../Interface/IRenewal";
import { AuthContextType } from "../../context/AuthContext";
import { RenewalDetailsClone } from "../../Interface/IRenewal";
interface RenewalInfoSectionProps {
  role_id?: number;
  auth: AuthContextType | undefined;
  selectedBranchFilter: string;
  initialRenewalInfo: InitialRenewalInfo | null;
  renewalData: RenewalDetailsClone[]; // 👈 add this line
  isRenewalInfoVisible: boolean;
  setIsRenewalInfoVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const RenewalInfoSection: React.FC<RenewalInfoSectionProps> = ({
  role_id,
  auth,
  selectedBranchFilter,
  initialRenewalInfo,
  isRenewalInfoVisible,
  setIsRenewalInfoVisible,
  renewalData,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-slate-200">
      {/* Header with Modern Styling */}
      <div className="flex justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">
              Renewal Information
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm"
            onClick={() => setIsRenewalInfoVisible(!isRenewalInfoVisible)}
          >
            {isRenewalInfoVisible ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="hidden xs:inline">
              {isRenewalInfoVisible ? "Hide Details" : "Show Details"}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isRenewalInfoVisible
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        {/* Modern Information Grid */}
        <div
          className={`grid grid-cols-1 xs:grid-cols-2 ${
            role_id === 7
              ? "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          } gap-4`}
        >
          {/* Branch Card */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Branch
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">
              {role_id === 3 || role_id === 4
                ? auth?.info?.branch?.branch_name || "Not Assigned"
                : selectedBranchFilter === "All"
                ? "All Branches"
                : selectedBranchFilter}
            </p>
            {auth?.info?.branch && (
              <p className="text-xs text-slate-500">
                Your branch: {auth.info.branch.branch_name}
              </p>
            )}
          </div>

          {/* Pending Validation Card (Admin Only) */}
          {role_id === 7 && (
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Pending
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">
                {initialRenewalInfo && renewalData
                  ? `${renewalData.length || 0} out of ${
                      initialRenewalInfo.count ?? 0
                    }`
                  : "Loading..."}
              </p>

              <p className="text-xs text-slate-500">
                Awaiting Registrar & D.O. validation
              </p>
            </div>
          )}

          {/* Renewal Date Card */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Renewal Date
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">Not Set</p>
            <p className="text-xs text-slate-500">
              Will be set upon completion
            </p>
          </div>

          {/* Renewal Basis Card */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Basis
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">
              {initialRenewalInfo?.renewal_school_year_basis_text ||
                "Not Started"}
            </p>
            <p className="text-xs text-slate-500">
              {initialRenewalInfo?.renewal_sem_basis_text || "Semester not set"}
            </p>
          </div>

          {/* Renewal For Card */}
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Renewal For
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">
              {initialRenewalInfo?.school_year_text || "None"}
            </p>
            <p className="text-xs text-slate-500">
              {initialRenewalInfo?.semester_text || "Semester not set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenewalInfoSection;
