import {
  format,
  startOfWeek,
  addDays,
  isToday,
  addWeeks,
  subWeeks,
} from "date-fns";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  ChevronRight as ChevronRightIcon,
  MapPin,
  BookOpen,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface DisbursementScheduleDetail {
  disb_sched_id: number;
  disbursement_type: string;
  disbursement_date: string;
  title: string;
  schedule_status: string;
  amount: string;
  yr_lvl: string;
  semester: string;
  school_year: string;
  branch: string;
  created_by_id: number;
  created_by: string;
  total_scholar: string;
}

interface AgendaViewProps {
  getBadgeColor: (type: string) => string;
  onScheduleClick?: (scheduleId: number) => void;
}

const AgendaView = ({ getBadgeColor, onScheduleClick }: AgendaViewProps) => {
  const [schedules, setSchedules] = useState<DisbursementScheduleDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Use useMemo to calculate week data to prevent recalculations on every render
  const { currentWeekStart, weekDays } = useMemo(() => {
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

    const weekDays = Array.from({ length: 7 }, (_, i) =>
      addDays(currentWeekStart, i)
    );
    return { currentWeekStart, weekDays };
  }, [currentDate]); // Only recalculate when currentDate changes

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  const fetchWeeklySchedules = async () => {
    setIsLoading(true);
    try {
      const formattedDate = format(
        startOfWeek(currentDate, { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/schedule/${formattedDate}`
      );
      console.log(response.data);
      setSchedules(response.data);
    } catch (error) {
      console.error("Failed to fetch weekly schedules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklySchedules();
  }, [currentWeekStart]); // Only triggers when week start changes

  // Use useMemo to process schedules
  const schedulesByDate = useMemo(() => {
    return schedules.reduce((acc, schedule) => {
      const dateKey = format(
        new Date(schedule.disbursement_date),
        "yyyy-MM-dd"
      );
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(schedule);
      return acc;
    }, {} as Record<string, DisbursementScheduleDetail[]>);
  }, [schedules]); // Only recalculate when schedules change

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case "not started":
        return {
          icon: <Clock size={16} />,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
      case "completed":
        return {
          icon: <CheckCircle2 size={16} />,
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "in progress":
        return {
          icon: <AlertCircle size={16} />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "cancelled":
        return {
          icon: <AlertCircle size={16} />,
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      default:
        return {
          icon: <Clock size={16} />,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
    }
  };

  const handleScheduleClick = (scheduleId: number) => {
    if (onScheduleClick) {
      onScheduleClick(scheduleId);
    }
  };

  return (
    <div className="mt-6 mb-8 px-3">
      {/* Week Navigation Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {isToday(currentWeekStart) ? "This week" : "Week of"}
          </h2>
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 mr-4">
              {format(currentWeekStart, "MMM d")} -{" "}
              {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={goToPreviousWeek}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNextWeek}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Next week"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Week Days View */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <span className="text-gray-500">Loading schedules...</span>
            </div>
          </div>
        ) : (
          <div>
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const daySchedules = schedulesByDate[dateKey] || [];
              const isCurrentDay = isToday(day);

              return (
                <div key={dateKey} className="mb-6">
                  {/* Day Header */}
                  <div
                    className={`flex items-center mb-3 ${
                      isCurrentDay ? "text-blue-600" : "text-gray-800"
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isCurrentDay ? "bg-blue-50 px-3 py-1 rounded-full" : ""
                      }`}
                    >
                      <h3
                        className={`text-lg ${
                          isCurrentDay ? "font-medium" : ""
                        }`}
                      >
                        {format(day, "EEE")}{" "}
                        <span className="font-semibold">
                          {format(day, "MMM dd")}
                        </span>
                      </h3>
                      {isCurrentDay && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Day Content */}
                  <div
                    className={`pl-4 border-l-2 ${
                      isCurrentDay ? "border-blue-400" : "border-gray-200"
                    }`}
                  >
                    {daySchedules.length > 0 ? (
                      <div className="space-y-3">
                        {daySchedules.map((schedule) => {
                          const statusInfo = getStatusInfo(
                            schedule.schedule_status
                          );

                          return (
                            <div
                              key={schedule.disb_sched_id}
                              className="rounded-lg shadow-sm border border-gray-100 bg-white hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                              onClick={() =>
                                handleScheduleClick(schedule.disb_sched_id)
                              }
                            >
                              <div className="flex">
                                {/* Colored accent bar */}
                                <div
                                  className="w-1.5"
                                  style={{
                                    backgroundColor: getBadgeColor(
                                      schedule.disbursement_type
                                    ),
                                  }}
                                ></div>

                                <div className="flex-1 p-4">
                                  {/* Header */}
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-medium text-gray-800 flex-1">
                                      {schedule.title}
                                    </h4>
                                    <div className="flex items-center">
                                      <span className="text-sm text-gray-500 mr-2 font-medium">
                                        {schedule.total_scholar}/24
                                      </span>
                                      <Users
                                        size={18}
                                        className="text-gray-400"
                                      />
                                    </div>
                                  </div>

                                  {/* Grid content */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 mt-3">
                                    <div className="flex items-center">
                                      <Tag
                                        size={14}
                                        className="text-gray-400 mr-2"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {schedule.disbursement_type}
                                      </span>
                                    </div>

                                    <div className="flex items-center">
                                      <div
                                        className={`flex items-center px-2 py-0.5 rounded-full ${statusInfo.bgColor}`}
                                      >
                                        {statusInfo.icon}
                                        <span
                                          className={`text-sm ml-1 ${statusInfo.color}`}
                                        >
                                          {schedule.schedule_status}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center">
                                      <BookOpen
                                        size={14}
                                        className="text-gray-400 mr-2"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {schedule.yr_lvl} • {schedule.semester}
                                      </span>
                                    </div>

                                    <div className="flex items-center">
                                      <MapPin
                                        size={14}
                                        className="text-gray-400 mr-2"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {schedule.branch}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Footer */}
                                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                      Created by:{" "}
                                      <span className="font-medium">
                                        {schedule.created_by}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {schedule.school_year}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center pr-3 text-gray-400 hover:text-gray-600">
                                  <ChevronRightIcon size={20} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-4 px-6 text-gray-500 bg-gray-50 rounded-md text-center">
                        <div className="flex flex-col items-center py-2">
                          <p className="text-sm">No schedules for this day</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-400 py-2 border-t border-gray-100">
        End of visible schedules
      </div>
    </div>
  );
};

export default AgendaView;
