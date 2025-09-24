import { useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { DisbursementSchedule } from "../../pages/Disbursement/Scheduling/Schedule";
import RenderDayCell from "./RenderDayCell";

interface CalendarProps {
  handleDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  schedules: DisbursementSchedule[];
  setVisibleMonth: (date: Date) => void;
  getBadgeColor: (type: string) => string;
  removeScheduleById: (disb_sched_id: number) => void;
  fetchSchedules: (date: Date) => void;
}

function Calendar({
  handleDateSelect,
  selectedDate,
  schedules,
  setVisibleMonth,
  getBadgeColor,
  removeScheduleById,
  fetchSchedules,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfWeek(startOfMonth(currentDate));
  const endDate = endOfWeek(endOfMonth(currentDate));

  const scheduleMap = useMemo(() => {
    const map = new Map<string, DisbursementSchedule[]>();
    schedules.forEach((schedule) => {
      const dateKey = format(schedule.schedule_due, "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(schedule);
    });
    return map;
  }, [schedules]);

  const renderDays = () => {
    const rows = [];
    let day = startDate;

    while (day <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        week.push(
          <RenderDayCell
            key={cloneDay.toString()}
            day={cloneDay}
            handleDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            scheduleMap={scheduleMap}
            getBadgeColor={getBadgeColor}
            currentDate={currentDate}
            removeScheduleById={removeScheduleById}
            fetchSchedules={fetchSchedules}
          />
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 flex-1" key={day.toString()}>
          {week}
        </div>
      );
    }

    return rows;
  };

  useEffect(() => {
    setVisibleMonth(currentDate);
  }, [currentDate, setVisibleMonth]);

  return (
    <div className="w-full mx-auto p-4 h-[70vh] lg:h-[78vh] xl:h-[82vh]">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2
          className={`text-2xl font-semibold ${
            isSameMonth(currentDate, new Date())
              ? "text-blue-500"
              : "text-gray-800"
          }`}
        >
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="inline-flex items-center gap-2 px-4 py-2 mx-2 rounded-full 
                       bg-blue-50 border border-blue-200 
                       text-blue-700 font-medium text-sm
                       hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm
                       active:bg-blue-200 active:scale-95
                       "
            aria-label="Jump to today"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Today</span>
          </button>

          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="text-gray-700 p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center font-semibold text-[15px] text-gray-500 mb-3 px-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, index) => (
          <div key={d + index}>{d}</div>
        ))}
      </div>
      <div className="flex flex-col flex-1 h-[calc(100%-64px)]">
        {renderDays()}
      </div>
    </div>
  );
}

export default Calendar;
