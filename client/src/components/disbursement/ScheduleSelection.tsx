import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DisbursementScheduleSummary } from "../../pages/SchedulingTracking/ScheduleSidebar";

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

  const filtered = schedules.filter(filterFn);

  return (
    <div className="max-w-[230px] mt-3">
      <div
        className="flex justify-between items-center group cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="font-semibold text-[16px] text-[#565656] group-hover:text-[#101010]">
          {title}
        </h2>
        <button className="cursor-pointer transition-transform duration-300">
          <ChevronDown
            className={`text-[#565656] w-5 h-5 group-hover:text-[#101010] transform transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
      {isOpen && (
        <div className="transition-all duration-300 ease-in-out overflow-hidden mt-1">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 mt-2">{emptyMessage}</p>
            ) : (
              filtered.map((sched) => (
                <div
                  key={sched.disb_sched_id}
                  className="bg-[#F1F1F1] p-2 rounded-md text-[#797979] font-medium text-[12px] flex-col flex"
                >
                  <h2 className="text-[#4d4d4d] font-medium text-[14px] mb-2">
                    <span
                      style={{
                        backgroundColor: getBadgeColor(sched.disbursement_type),
                      }}
                      className="p-1 rounded-md mr-1"
                    ></span>
                    {sched.disbursement_type}
                  </h2>
                  <table>
                    <tbody>
                      <tr>
                        <td className="border-r pr-4">Campus Here</td>
                        <td className="pl-4">{sched.year_level}</td>
                      </tr>
                      <tr>
                        <td className="border-r pr-4">{sched.semester}</td>
                        <td className="pl-4">{sched.school_year}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleSection;
