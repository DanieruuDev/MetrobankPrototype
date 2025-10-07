import { useState } from "react";
import { ChevronDown, Calendar, CircleDot } from "lucide-react";
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
    <div className="w-full max-w-[260px] lg:max-w-[260px] mt-3">
      {/* Section Header */}
      <div
        className="flex justify-between items-center group cursor-pointer pb-1 border-b border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="font-semibold text-sm sm:text-[15px] text-[#444] group-hover:text-[#101010]">
          {title}
        </h2>
        <ChevronDown
          className={`text-[#666] w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Collapsible content */}
      {isOpen && (
        <div className="transition-all duration-300 ease-in-out overflow-hidden mt-2">
          {filtered.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-400 italic">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filtered.map((sched) => {
                const formattedDate = sched.schedule_due
                  ? format(new Date(sched.schedule_due), "MMM dd, yyyy")
                  : "No date";

                return (
                  <div
                    key={sched.sched_id}
                    className="bg-white border border-gray-200 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() =>
                      navigate(`/tracking/detailed/${sched.sched_id}`)
                    }
                  >
                    {/* Title */}
                    <h1 className="text-xs sm:text-[15px] font-semibold text-gray-900 mb-1 sm:mb-2 truncate">
                      {sched.sched_title}
                    </h1>

                    {/* Label Badge */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                      <span
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: getBadgeColor(
                            sched.disbursement_label
                          ),
                        }}
                      ></span>
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-md truncate">
                        {sched.disbursement_label}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 sm:justify-between">
                      {/* Date */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        <span className="truncate">{formattedDate}</span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-1 text-xs font-medium">
                        <CircleDot
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${
                            sched.schedule_status === "Completed"
                              ? "text-green-500"
                              : sched.schedule_status === "In Progress"
                              ? "text-blue-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={`truncate ${
                            sched.schedule_status === "Completed"
                              ? "text-green-600"
                              : sched.schedule_status === "In Progress"
                              ? "text-blue-600"
                              : "text-gray-500"
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
