import { useEffect, useState } from "react";
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
  const { collapsed } = useSidebar();
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
  const fetchSchedules = async (date: Date) => {
    setLoading(true);
    setError(null);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    // const apiUrl = import.meta.env.VITE_LOCAL_API_URL;
    // console.log(apiUrl);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/schedule/${year}/${month}`
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
  };

  // const [showNotifications, setShowNotifications] = useState(false);
  // const [notifications, setNotifications] = useState([
  //   {
  //     id: 1,
  //     title: "New disbursement scheduled",
  //     message: "Thesis Fee disbursement for May 20, 2025",
  //     read: false,
  //     date: "2025-05-18",
  //   },
  //   {
  //     id: 2,
  //     title: "Reminder",
  //     message: "Scholarship Fee disbursement tomorrow",
  //     read: false,
  //     date: "2025-05-17",
  //   },
  // ]);

  // const toggleNotifications = () => {
  //   setShowNotifications(!showNotifications);
  //   // Mark notifications as read when opened
  //   if (!showNotifications) {
  //     setNotifications((notifs) => notifs.map((n) => ({ ...n, read: true })));
  //   }
  // };

  useEffect(() => {
    fetchSchedules(visibleMonth);
  }, [visibleMonth]);
  const removeScheduleById = (sched_id: number) => {
    console.log(sched_id);
    console.log(schedules);
    setSchedules((prev) => prev.filter((s) => s.sched_id !== sched_id));
    console.log(schedules);
  };
  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300`}
    >
      <Navbar pageName="Schedule and Tracking" />

      <Sidebar />
      <ScheduleSidebar getBadgeColor={getBadgeColor} collapsed={collapsed} />

      <div
        className="pl-[270px] pt-2 pr-4 "
        style={{
          height: "calc(100vh - 64px)", // viewport height minus navbar height
          overflowY: "auto",
        }}
      >
        <div className="flex justify-between">
          <div className="inline-flex items-center border border-gray-400 rounded-md overflow-hidden text-sm ml-4">
            <button
              className={`flex items-center gap-1 px-4 py-2 cursor-pointer ${
                viewMode === "month"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
              onClick={() => setViewMode("month")}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Month</span>
            </button>

            <div className="h-6 w-px bg-gray-300" />

            <button
              className={`flex items-center gap-1 px-4 py-2 cursor-pointer ${
                viewMode === "agenda"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
              onClick={() => setViewMode("agenda")}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Agenda</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* <button
              onClick={toggleNotifications}
              className="bg-[#F1F1F1] py-2 px-3 rounded-md group cursor-pointer relative"
            >
              <Bell className="text-[#565656] group-hover:text-[#2a2a2a]" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}

              {showNotifications && (
                <div className="absolute right-4 mt-3 w-72 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-2 border-b border-gray-200">
                    <h3 className="font-medium text-gray-700">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-800">
                            {notification.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500">
                        No new notifications
                      </div>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200 text-center">
                    <button className="text-xs text-blue-500 hover:text-blue-700">
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </button> */}
            <button
              className="bg-[#3B89FD] text-white rounded-md gap-2 py-2 px-4 flex items-center cursor-pointer hover:bg-[#3b62fd]"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus />
              <span className="text-[14px]">Schedule</span>
            </button>
          </div>
        </div>
        {isModalOpen && (
          <EventModal
            onClose={onClose}
            fetchSchedules={() => fetchSchedules(visibleMonth)}
            selectedDate={selectedDate}
          />
        )}
        {loading && <div>Loading schedules...</div>}{" "}
        {error && <div className="text-red-500">{error} </div>}{" "}
        <div>
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
  );
}

export default Schedule;
