import { useEffect, useState, useCallback } from "react";
import Calendar from "../../../components/disbursement/Calendar";
import Navbar from "../../../components/shared/Navbar";
import ScheduleSidebar from "./ScheduleSidebar";
import Sidebar from "../../../components/shared/Sidebar";
import EventModal from "../../../components/disbursement/EventModal";
import { CalendarDays, ClipboardList, Plus } from "lucide-react";
import axios from "axios";
import { isBefore, startOfDay } from "date-fns";
import AgendaView from "../../../components/disbursement/Agenda";
import { useSidebar } from "../../../context/SidebarContext";

export interface DisbursementSchedule {
  sched_id: number;
  sched_title: string;
  event_type: number;
  schedule_due: string;
  schedule_status: string;
  student_count: number;
  disbursement_label: string;
  description: string;
  admin_id: number;
  admin_job: string;
  admin_email: string;
  admin_name: string;
}

function Schedule() {
  const [schedules, setSchedules] = useState<DisbursementSchedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const { collapsed } = useSidebar();
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const onClose = (isClosed: boolean) => {
    setIsModalOpen(isClosed);
    setSelectedDate(null);
  };

  const disbursementTypeBadge = [
    { type: "Allowance Fee", color: "#4AAFFF" },
    { type: "Internship Allowance", color: "#4AAFFF" },
    { type: "Thesis Fee", color: "#FF9150" },
    { type: "Scholarship Fee", color: "#54BC4E" },
  ];

  const getBadgeColor = (type: string) => {
    return (
      disbursementTypeBadge.find((badge) => badge.type === type)?.color ||
      "#E0E0E0"
    );
  };

  const handleDateSelect = (date: Date) => {
    const today = startOfDay(new Date());

    if (isBefore(date, today)) {
      alert("You cannot schedule on a past date.");
      console.log(date, today);
      return;
    }

    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const fetchSchedules = useCallback(
    async (date: Date) => {
      setLoading(true);
      setError(null);

      // Calculate the full date range visible in the calendar
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Get the start of the week for the first day of the month
      const startOfWeek = new Date(startOfMonth);
      startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay());

      // Get the end of the week for the last day of the month
      const endOfWeek = new Date(endOfMonth);
      endOfWeek.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

      // Add extra buffer to ensure we capture all visible dates
      const bufferStart = new Date(startOfWeek);
      bufferStart.setDate(startOfWeek.getDate() - 1);

      const bufferEnd = new Date(endOfWeek);
      bufferEnd.setDate(endOfWeek.getDate() + 1);

      // Format dates for API call (use local date to avoid timezone issues)
      const startDate = `${bufferStart.getFullYear()}-${String(
        bufferStart.getMonth() + 1
      ).padStart(2, "0")}-${String(bufferStart.getDate()).padStart(2, "0")}`;
      const endDate = `${bufferEnd.getFullYear()}-${String(
        bufferEnd.getMonth() + 1
      ).padStart(2, "0")}-${String(bufferEnd.getDate()).padStart(2, "0")}`;

      console.log("Fetching schedules for date range:", {
        startDate,
        endDate,
        currentMonth: date,
        originalRange: {
          startOfWeek: startOfWeek.toISOString().split("T")[0],
          endOfWeek: endOfWeek.toISOString().split("T")[0],
        },
      });

      try {
        const response = await axios.get(
          `${VITE_BACKEND_URL}api/disbursement/schedule/range?start=${startDate}&end=${endDate}`
        );
        setSchedules(
          response.data.map((schedule: DisbursementSchedule) => ({
            ...schedule,
            schedule_due: new Date(schedule.schedule_due),
          }))
        );
      } catch (error) {
        setError("Error fetching schedules: " + error);
        console.error("Error fetching schedules:", error);
      } finally {
        setLoading(false);
      }
    },
    [VITE_BACKEND_URL]
  );

  useEffect(() => {
    fetchSchedules(visibleMonth);
  }, [visibleMonth, fetchSchedules]);

  const removeScheduleById = (sched_id: number) => {
    console.log(sched_id);
    console.log(schedules);
    setSchedules((prev) => prev.filter((s) => s.sched_id !== sched_id));
    console.log(schedules);
  };

  return (
    <div
      className={`${
        collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"
      } transition-[padding-left] duration-300`}
    >
      <Navbar pageName="Calendar of Activities" />

      <Sidebar />

      <div
        className="pt-2 pr-4 pl-4 lg:pl-10 min-h-0 "
        style={{
          height: "calc(100vh - 64px)", // viewport height minus navbar height
          overflowX: "hidden",
        }}
      >
        {/* Desktop Layout - Sidebar and Calendar Side by Side */}
        <div className="hidden lg:flex lg:h-full lg:gap-4">
          {/* ScheduleSidebar - Only render on desktop */}
          <div className="lg:w-[230px] lg:flex-shrink-0">
            <ScheduleSidebar
              getBadgeColor={getBadgeColor}
              refreshKey={sidebarRefreshKey}
              onClose={() => setSidebarRefreshKey(0)}
            />
          </div>

          {/* Calendar Content */}
          <div className="lg:flex-1 lg:min-w-0">
            {/* Mobile Sidebar Toggle - Hidden on mobile as requested */}

            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0 mb-4">
              <div className="inline-flex items-center border border-gray-400  rounded-md overflow-hidden text-sm">
                <button
                  className={`flex items-center gap-1 px-2 sm:px-4 py-2 cursor-pointer ${
                    viewMode === "month"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                  onClick={() => setViewMode("month")}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className=" xs:inline">Months</span>
                </button>

                <div className="h-6 w-px bg-gray-300" />

                <button
                  className={`flex items-center gap-1 px-2 sm:px-4 py-2 cursor-pointer ${
                    viewMode === "agenda"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                  onClick={() => setViewMode("agenda")}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span className=" xs:inline">Agenda</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <button
                  className="bg-[#3B89FD] text-white rounded-md gap-2 py-2 px-3 sm:px-4 flex items-center cursor-pointer hover:bg-[#3b62fd] w-full sm:w-auto justify-center"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus />
                  <span className="text-[14px]  xs:inline">Schedule</span>
                </button>
              </div>
            </div>

            {/* Mobile Floating Schedule Button */}
            {viewMode === "month" && (
              <div className="sm:hidden fixed bottom-6 right-6 z-50">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#3B89FD] text-white rounded-full p-4 shadow-lg hover:bg-[#3b62fd] transition-colors duration-200 flex items-center justify-center"
                  aria-label="Schedule Event"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            )}

            {isModalOpen && viewMode === "month" && (
              <EventModal
                onClose={onClose}
                fetchSchedules={() => {
                  fetchSchedules(visibleMonth);
                  setSidebarRefreshKey((prev) => prev + 1);
                }}
                selectedDate={selectedDate}
              />
            )}
            {loading && <div className="p-4">Loading schedules...</div>}
            {error && <div className="p-4 text-red-500">{error}</div>}
            <div className="w-full overflow-x-auto min-h-0">
              {viewMode === "month" ? (
                <Calendar
                  handleDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  schedules={schedules}
                  setVisibleMonth={setVisibleMonth}
                  getBadgeColor={getBadgeColor}
                  removeScheduleById={removeScheduleById}
                  fetchSchedules={fetchSchedules}
                />
              ) : (
                <AgendaView getBadgeColor={getBadgeColor} />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout - Calendar Only */}
        <div className="lg:hidden">
          {/* Mobile Sidebar Toggle - Hidden on mobile as requested */}

          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0 mb-4">
            <div className="inline-flex items-center border border-gray-400 rounded-md overflow-hidden text-sm">
              <button
                className={`flex items-center gap-1 px-2 sm:px-4 py-2 cursor-pointer ${
                  viewMode === "month"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={() => setViewMode("month")}
              >
                <CalendarDays className="w-4 h-4" />
                <span className=" xs:inline">Months</span>
              </button>

              <div className="h-6 w-px bg-gray-300" />

              <button
                className={`flex items-center gap-1 px-2 sm:px-4 py-2 cursor-pointer ${
                  viewMode === "agenda"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-700 hover:text-blue-600"
                }`}
                onClick={() => setViewMode("agenda")}
              >
                <ClipboardList className="w-4 h-4" />
                <span className=" xs:inline">Agenda</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                className="bg-[#3B89FD] text-white rounded-md gap-2 py-2 px-3 sm:px-4 flex items-center cursor-pointer hover:bg-[#3b62fd] w-full sm:w-auto justify-center"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus />
                <span className="text-[14px]  xs:inline">Schedule</span>
              </button>
            </div>
          </div>

          {/* Mobile Floating Schedule Button */}
          {viewMode === "month" && (
            <div className="sm:hidden fixed bottom-6 right-6 z-50">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#3B89FD] text-white rounded-full p-4 shadow-lg hover:bg-[#3b62fd] transition-colors duration-200 flex items-center justify-center"
                aria-label="Schedule Event"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          )}

          {isModalOpen && viewMode === "month" && (
            <EventModal
              onClose={onClose}
              fetchSchedules={() => {
                fetchSchedules(visibleMonth);
                setSidebarRefreshKey((prev) => prev + 1);
              }}
              selectedDate={selectedDate}
            />
          )}
          {loading && <div className="p-4">Loading schedules...</div>}
          {error && <div className="p-4 text-red-500">{error}</div>}
          <div className="w-full overflow-x-auto min-h-0">
            {viewMode === "month" ? (
              <Calendar
                handleDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                schedules={schedules}
                setVisibleMonth={setVisibleMonth}
                getBadgeColor={getBadgeColor}
                removeScheduleById={removeScheduleById}
                fetchSchedules={fetchSchedules}
              />
            ) : (
              <AgendaView getBadgeColor={getBadgeColor} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Schedule;
