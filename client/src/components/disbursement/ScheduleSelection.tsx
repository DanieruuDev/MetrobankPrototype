import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { DisbursementScheduleSummary } from "../../pages/Disbursement/Scheduling/ScheduleSidebar";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ScheduleSectionProps {
  title: string;
  schedules: DisbursementScheduleSummary[];
  filterFn: (sched: DisbursementScheduleSummary) => boolean;
  getBadgeColor: (type: string) => string;
  emptyMessage: string;
}

const ScheduleSection = ({
  title,
  schedules,
  filterFn,
  getBadgeColor,
  emptyMessage,
}: ScheduleSectionProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const filtered = schedules.filter(filterFn);

  return (
    <div className="max-w-[260px]">
      {/* Professional Minimalist Section Header */}
      <div
        className="flex justify-between items-center cursor-pointer pb-3 border-b border-gray-200 hover:border-gray-300 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
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
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        </div>
        <ChevronDown
          className={`text-gray-500 w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Professional Minimalist Content */}
      {isOpen && (
        <div className="mt-4">
          {filtered.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <svg
                className="w-8 h-8 text-gray-400 mx-auto mb-2"
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
              <p className="text-sm text-gray-500 font-medium">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((sched) => {
                const formattedDate = sched.schedule_due
                  ? format(new Date(sched.schedule_due), "MMM dd, yyyy")
                  : "No date";

                return (
                  <div
                    key={sched.sched_id}
                    className="bg-white border border-gray-200 p-3 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() =>
                      navigate(`/tracking/detailed/${sched.sched_id}`)
                    }
                  >
                    {/* Enhanced Title */}
                    <h1 className="text-xs font-bold text-gray-900 mb-2 truncate group-hover:text-blue-700 transition-colors">
                      {sched.sched_title}
                    </h1>

                    {/* Enhanced Label */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getBadgeColor(
                            sched.disbursement_label
                          ),
                        }}
                      ></span>
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-md"
                        style={{
                          backgroundColor:
                            sched.disbursement_label ===
                            "Tuition Fee and Other School Fees"
                              ? getBadgeColor(sched.disbursement_label) + "40"
                              : getBadgeColor(sched.disbursement_label) + "20",
                          color: "#374151",
                          border: `1px solid ${getBadgeColor(
                            sched.disbursement_label
                          )}40`,
                          fontWeight: "600",
                        }}
                      >
                        {sched.disbursement_label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Enhanced Date */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span className="font-semibold">{formattedDate}</span>
                      </div>

                      {/* Enhanced Status */}
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            sched.schedule_status === "Completed"
                              ? "bg-green-500"
                              : sched.schedule_status === "In Progress"
                              ? "bg-blue-500"
                              : sched.schedule_status === "Not Started"
                              ? "bg-gray-400"
                              : "bg-red-500"
                          }`}
                        />
                        <span
                          className={`text-xs font-bold ${
                            sched.schedule_status === "Completed"
                              ? "text-green-700"
                              : sched.schedule_status === "In Progress"
                              ? "text-blue-700"
                              : sched.schedule_status === "Not Started"
                              ? "text-gray-600"
                              : "text-red-700"
                          }`}
                        >
                          {sched.schedule_status || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleSection;
