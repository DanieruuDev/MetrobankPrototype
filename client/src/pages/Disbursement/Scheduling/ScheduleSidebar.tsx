import { useEffect, useState, useCallback } from "react";

// import SideBarCalendar from "../../../components/disbursement/SideBarCalendar";
// import { DisbursementSchedule } from "./Schedule";
import axios from "axios";
import ScheduleSection from "../../../components/disbursement/ScheduleSelection";

export interface DisbursementScheduleSummary {
  sched_id: number;
  sched_title: string;
  event_type: number;
  schedule_due: string;
  schedule_status: string;
  disbursement_label: string;
}

interface ScheduleSidebarProps {
  getBadgeColor: (type: string) => string;
  refreshKey: number;
  onClose: () => void;
}
const ScheduleSidebar = ({
  getBadgeColor,
  refreshKey,
  onClose,
}: ScheduleSidebarProps) => {
  // const [sidebarSchedule, setSidebarSchedule] = useState<
  //   DisbursementSchedule[] | null
  // >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoWeekSched, setTwoWeekSched] = useState<
    DisbursementScheduleSummary[] | null
  >([]);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  // const fetchSidebarSchedules = async (date: Date) => {
  //   setLoading(true);
  //   setError(null);
  //   const year = date.getFullYear();
  //   const month = date.getMonth() + 1;

  //   try {
  //     const response = await axios.get(
  //       `${VITE_BACKEND_URL}api/disbursement/schedule/${year}/${month}`
  //     );

  //     setSidebarSchedule(
  //       response.data.map((schedule: DisbursementSchedule) => ({
  //         ...schedule,
  //         date: new Date(schedule.date),
  //       }))
  //     );
  //     console.log("Disb Schedule", response.data);
  //   } catch (err) {
  //     setError(`Failed to load monthly schedule: ${err}`);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchTwoWeeksSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/disbursement/schedule/weeks`
      );
      setTwoWeekSched(response.data);
    } catch (err) {
      setError(`Failed to load upcoming/today schedules: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [VITE_BACKEND_URL]);

  useEffect(() => {
    fetchTwoWeeksSchedule();
  }, [fetchTwoWeeksSchedule, refreshKey]);

  return (
    <div
      className={`
        w-full overflow-y-auto h-full pb-6 overflow-x-hidden 
        bg-white
        lg:border-r lg:border-gray-200 lg:pt-2 lg:pr-6
        
      `}
    >
      {/* Professional Minimalist Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
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
          <div>
            <h2 className="text-base font-semibold text-gray-800">Events</h2>
            <p className="text-xs text-gray-500">Schedule Overview</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Professional Minimalist Content */}
      <div className="p-5 lg:p-0">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
            <div className="flex items-center justify-between">
              <span className="font-medium">{error}</span>
              <button
                onClick={fetchTwoWeeksSchedule}
                className="text-red-600 hover:text-red-800 font-medium text-xs underline hover:no-underline transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Professional Minimalist Today's Events */}
        <div className="hidden sm:block mb-8">
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <ScheduleSection
              title="Today's Events"
              schedules={twoWeekSched || []}
              getBadgeColor={getBadgeColor}
              emptyMessage="No events scheduled for today"
              filterFn={(sched) => {
                const schedDate = new Date(sched.schedule_due);
                const today = new Date();
                return schedDate.toDateString() === today.toDateString();
              }}
            />
          )}
        </div>

        {/* Professional Minimalist Upcoming Events */}
        <div className="hidden sm:block">
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          ) : (
            <ScheduleSection
              title="Upcoming Events"
              schedules={twoWeekSched || []}
              getBadgeColor={getBadgeColor}
              emptyMessage="No upcoming events scheduled"
              filterFn={(sched) => {
                const schedDate = new Date(sched.schedule_due);
                const today = new Date();
                return schedDate > today;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleSidebar;
