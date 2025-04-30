import { ChevronLeft, ChevronRight } from "lucide-react";
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
  isSameDay,
} from "date-fns";
import { useEffect, useState } from "react";

import { useMemo } from "react";
import { DisbursementSchedule } from "../../pages/SchedulingTracking/Schedule";

interface fetchSidebarSchedulesProps {
  fetchSidebarSchedules: (date: Date) => void;
  sidebarSchedule: DisbursementSchedule[] | null;
}
function SideBarCalendar({
  fetchSidebarSchedules,
  sidebarSchedule,
}: fetchSidebarSchedulesProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const startDate = startOfWeek(startOfMonth(currentDate));
  const endDate = endOfWeek(endOfMonth(currentDate));

  console.log(selectedDate);
  const scheduleMap = useMemo(() => {
    const map = new Map<string, boolean>();
    sidebarSchedule?.forEach((schedule) => {
      const dateKey = format(schedule.date, "yyyy-MM-dd");
      map.set(dateKey, true);
    });
    return map;
  }, [sidebarSchedule]);

  const renderDays = () => {
    const rows = [];

    let day = startDate;

    while (day <= endDate) {
      const week = [];

      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isToday = isSameDay(cloneDay, new Date());
        const dateKey = format(cloneDay, "yyyy-MM-dd");
        const hasSchedule = scheduleMap.has(dateKey);
        week.push(
          <div
            key={cloneDay.toString()}
            className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all text-[14px] text-[#565656]
         
          ${!isSameMonth(cloneDay, currentDate) ? "text-gray-400" : ""}
          hover:bg-blue-100 rounded-[20px]`}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div
              className={`${
                isToday
                  ? "bg-blue-500 text-white w-6 h-6 rounded-[20px] flex justify-center items-center"
                  : hasSchedule
                  ? "font-black"
                  : ""
              }`}
            >
              {format(cloneDay, "d")}
            </div>
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div className="flex justify-center gap-1" key={day.toString()}>
          {week}
        </div>
      );
    }

    return rows;
  };
  useEffect(() => {
    fetchSidebarSchedules(visibleMonth);
  }, [visibleMonth]);
  useEffect(() => {
    setVisibleMonth(currentDate);
  }, [currentDate]);

  return (
    <div>
      <div className="max-w-[235px] relative">
        <div className="flex justify-between items-center mb-2 px-1 ">
          <h2 className="text-[16px] font-semibold text-[#565656] ">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="text-md font-bold px-2 text-[#565656] cursor-pointer "
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="text-md font-bold px-2 text-[#565656] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-[#F1F1F1] p-3 rounded-sm">
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm mb-2 text-[#B8B8B8]">
            {["S", "M", "T", "W", "Th", "F", "S"].map((d, index) => (
              <div key={d + index}>{d}</div>
            ))}
          </div>

          <div className="space-y-1">{renderDays()}</div>
        </div>
      </div>
    </div>
  );
}

export default SideBarCalendar;
