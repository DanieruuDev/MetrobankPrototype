import { useEffect, useState } from "react";

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
  collapsed: boolean;
  refreshKey?: number;
}
const ScheduleSidebar = ({
  getBadgeColor,
  collapsed,
  refreshKey,
}: ScheduleSidebarProps) => {
  // const [sidebarSchedule, setSidebarSchedule] = useState<
  //   DisbursementSchedule[] | null
  // >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoWeekSched, setTwoWeekSched] = useState<
    DisbursementScheduleSummary[] | null
  >([]);

  // const fetchSidebarSchedules = async (date: Date) => {
  //   setLoading(true);
  //   setError(null);
  //   const year = date.getFullYear();
  //   const month = date.getMonth() + 1;

  //   try {
  //     const response = await axios.get(
  //       `http://localhost:5000/api/disbursement/schedule/${year}/${month}`
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

  const fetchTwoWeeksSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/schedule/weeks`
      );
      setTwoWeekSched(response.data);
    } catch (err) {
      setError(`Failed to load upcoming/today schedules: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwoWeeksSchedule();
  }, [refreshKey]);

  return (
    <div
      className={`
    max-w-[250px] w-full overflow-y-auto h-[89.5vh] pb-4 overflow-x-hidden border-[#EBEBEB] border-r-3 pt-2 pr-3 fixed
    top-[73px] bottom-0 bg-white z-0
    ${
      collapsed ? "left-24 ml-0" : "left-[250px] ml-4"
    } transition-all duration-300
  `}
    >
      {/* <SideBarCalendar
        fetchSidebarSchedules={fetchSidebarSchedules}
        sidebarSchedule={sidebarSchedule}
      /> */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm mt-3 mx-2">
          <strong>Error:</strong> {error}
          <button
            onClick={fetchTwoWeeksSchedule}
            className="ml-2 text-blue-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 px-4 py-2 animate-pulse">
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
      {loading ? (
        <div className="text-sm text-gray-500 px-4 py-2 animate-pulse">
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
  );
};

export default ScheduleSidebar;
