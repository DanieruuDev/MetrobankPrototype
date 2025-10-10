import React, { useMemo, useState } from "react";
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
// import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarEvent {
  title: string;
  description?: string;
  href?: string; // optional navigation target
}

interface MiniCalendarProps {
  value?: Date;
  eventDates?: string[]; // deprecated, use eventsByDate
  eventsByDate?: Record<string, MiniCalendarEvent[]>; // key: yyyy-MM-dd
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ value, eventDates = [], eventsByDate = {} }) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(value || new Date());
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltipAlign, setTooltipAlign] = useState<"left" | "center" | "right">("center");
  // const navigate = useNavigate();

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }
    const chunks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [currentMonth]);

  const handlePrev = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNext = () => setCurrentMonth((prev) => addMonths(prev, 1));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrev} className="p-1.5 rounded hover:bg-gray-100" aria-label="Previous">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="text-sm font-semibold text-gray-800">{format(currentMonth, "MMMM yyyy")}</div>
        <button onClick={handleNext} className="p-1.5 rounded hover:bg-gray-100" aria-label="Next">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-[11px] text-gray-500 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-rows-6 gap-0">
        {weeks.map((week, idx) => (
          <div key={idx} className="grid grid-cols-7">
            {week.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const key = format(day, "yyyy-MM-dd");
              const events = eventsByDate[key] || [];
              const hasEvent = events.length > 0 || eventDates.includes(key);
              return (
                <div
                  key={day.toISOString()}
                  className="relative group"
                  onMouseEnter={(e) => {
                    setHoveredKey(key);
                    try {
                      const tooltipWidth = 224; // w-56
                      const margin = 8;
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const centerX = rect.left + rect.width / 2;
                      if (centerX + tooltipWidth / 2 > window.innerWidth - margin) {
                        setTooltipAlign("right");
                      } else if (centerX - tooltipWidth / 2 < margin) {
                        setTooltipAlign("left");
                      } else {
                        setTooltipAlign("center");
                      }
                    } catch {}
                  }}
                  onMouseLeave={() => setHoveredKey(null)}
                >
                  <button
                    onClick={(e) => {
                      // Make widget non-clickable per request
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className={`h-8 w-full text-[11px] py-0.5 m-0.5 rounded-md transition-colors
                      ${isCurrentMonth ? "text-gray-800" : "text-gray-300"}
                      ${isSameDay(day, new Date()) ? "ring-1 ring-blue-400 bg-blue-50" : "hover:bg-gray-100"}
                    `}
                    aria-label={format(day, "yyyy-MM-dd")}
                  >
                    <div className="flex flex-col items-center leading-none">
                      <span>{format(day, "d")}</span>
                      {hasEvent && (
                        <span className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true"></span>
                      )}
                    </div>
                  </button>
                  {hasEvent && hoveredKey === key && (
                    <div
                      className={`absolute z-50 mt-1 w-56 bg-white border border-gray-200 shadow-lg rounded-md p-2 text-[11px] text-gray-700 pointer-events-none ${
                        tooltipAlign === "center"
                          ? "left-1/2 -translate-x-1/2"
                          : tooltipAlign === "left"
                          ? "left-0"
                          : "right-0"
                      }`}
                    >
                      <div className="font-semibold text-gray-800 mb-1">{format(day, "MMM d, yyyy")}</div>
                      {/* Approvals */}
                      {events.filter((e) => (e as any).type === "approval").length > 0 && (
                        <div className="mb-1">
                          <div className="text-[10px] font-semibold text-blue-700 mb-0.5">Approvals</div>
                          {events
                            .filter((e) => (e as any).type === "approval")
                            .map((e, idx) => (
                              <div key={`ap-${idx}`} className="text-[11px] text-gray-700 truncate">
                                {e.title}
                                {e.description && (
                                  <span className="text-gray-500"> — {e.description}</span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                      {/* Schedules */}
                      {events.filter((e) => (e as any).type === "schedule").length > 0 && (
                        <div>
                          <div className="text-[10px] font-semibold text-emerald-700 mb-0.5">Schedules</div>
                          {events
                            .filter((e) => (e as any).type === "schedule")
                            .map((e, idx) => (
                              <div key={`sc-${idx}`} className="text-[11px] text-gray-700 truncate">
                                {e.title}
                                {e.description && (
                                  <span className="text-gray-500"> — {e.description}</span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniCalendar;


