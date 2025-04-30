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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DisbursementSchedule } from "../../pages/SchedulingTracking/Schedule";
import RenderDayCell from "./RenderDayCell";

interface CalendarProps {
  handleDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  schedules: DisbursementSchedule[];
  setVisibleMonth: (date: Date) => void;
  getBadgeColor: (type: string) => string;
  removeScheduleById: (disb_sched_id: number) => void;
}

function Calendar({
  handleDateSelect,
  selectedDate,
  schedules,
  setVisibleMonth,
  getBadgeColor,
  removeScheduleById,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const startDate = startOfWeek(startOfMonth(currentDate));
  const endDate = endOfWeek(endOfMonth(currentDate));

  const scheduleMap = useMemo(() => {
    const map = new Map<string, DisbursementSchedule[]>();
    schedules.forEach((schedule) => {
      const dateKey = format(schedule.date, "yyyy-MM-dd");
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
          />
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
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
    <div className="w-full max-w-6xl mx-auto p-4">
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
            className="text-gray-700 p-2 hover:bg-gray-200 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="text-gray-700 p-2 hover:bg-gray-200 rounded-full"
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
      <div>{renderDays()}</div>
    </div>
  );
}

export default Calendar;
