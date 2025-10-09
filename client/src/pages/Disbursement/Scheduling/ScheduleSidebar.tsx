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
  }, [fetchTwoWeeksSchedule]);

  useEffect(() => {
    console.log("ScheduleSidebar refreshKey changed:", refreshKey);
  }, [refreshKey]);

  return (
    <div
      className={`
        /* Desktop Styles - Original */
        w-full overflow-y-auto h-full pb-4 overflow-x-hidden bg-white
        lg:border-[#EBEBEB] lg:border-r-3 lg:pt-2 lg:pr-3
        transition-all duration-300
      `}
    >
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Today's Events</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1"
          aria-label="Close sidebar"
        >
          <svg
            className="w-6 h-6"
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

      {/* Content */}
      <div className="p-2 sm:p-4 lg:p-0 lg:mt-0">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 rounded relative text-sm mt-3 mx-2">
            <strong>Error:</strong> {error}
            <button
              onClick={fetchTwoWeeksSchedule}
              className="ml-2 text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Today's Events - Hidden on mobile */}
        <div className="hidden sm:block">
          {loading ? (
            <div className="text-sm text-gray-500 px-3 sm:px-4 py-2 animate-pulse">
              Loading Today&apos;s Events...
            </div>
          ) : (
            <ScheduleSection
              title="All Events Today"
              schedules={twoWeekSched || []}
              getBadgeColor={getBadgeColor}
              emptyMessage="No schedule for today."
              filterFn={(sched) => {
                const schedDate = new Date(sched.schedule_due);
                const today = new Date();
                return schedDate.toDateString() === today.toDateString();
              }}
            />
          )}
        </div>

        {/* Upcoming Events - Hidden on mobile */}
        <div className="hidden sm:block">
          {loading ? (
            <div className="text-sm text-gray-500 px-3 sm:px-4 py-2 animate-pulse">
              Loading Upcoming Events...
            </div>
          ) : (
            <ScheduleSection
              title="Upcoming"
              schedules={twoWeekSched || []}
              getBadgeColor={getBadgeColor}
              emptyMessage="No upcoming schedules."
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
