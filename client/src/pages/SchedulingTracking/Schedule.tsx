import { useEffect, useState } from "react";
import Calendar from "../../components/disbursement/Calendar";
import Navbar from "../../components/shared/Navbar";
import ScheduleSidebar from "./ScheduleSidebar";
import Sidebar from "../../components/shared/Sidebar";
import EventModal from "../../components/disbursement/EventModal";
import { Bell, CalendarDays, ClipboardList, Plus } from "lucide-react";
import axios from "axios";
import { isBefore, startOfDay } from "date-fns";
import AgendaView from "../../components/disbursement/Agenda";

export interface DisbursementSchedule {
  created_by: number;
  date: Date;
  disb_sched_id: number;
  status: string;
  student_count: number;
  title: string;
  type: string;
}

function Schedule() {
  const [schedules, setSchedules] = useState<DisbursementSchedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");

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

    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/schedule/${year}/${month}`
      );
      setSchedules(
        response.data.map((schedule: DisbursementSchedule) => ({
          ...schedule,
          date: new Date(schedule.date),
        }))
      );
    } catch (error) {
      setError("Error fetching schedules: " + error);
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log(schedules);
  useEffect(() => {
    fetchSchedules(visibleMonth);
  }, [visibleMonth]);
  const removeScheduleById = (disb_sched_id: number) => {
    console.log(disb_sched_id);
    console.log(schedules);
    setSchedules((prev) =>
      prev.filter((s) => s.disb_sched_id !== disb_sched_id)
    );
    console.log(schedules);
  };
  return (
    <div className="pl-[250px] pt-[73px]">
      <div className="fixed top-0 right-0 left-[250px] h-[73px]">
        <Navbar pageName="Schedule and Tracking" />
      </div>

      <Sidebar />
      <ScheduleSidebar getBadgeColor={getBadgeColor} />

      <div className="pl-[270px] pt-2 pr-4">
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
            <button className="bg-[#F1F1F1] py-2 px-3 rounded-md group cursor-pointer">
              <Bell className="text-[#565656] group-hover:text-[#2a2a2a]" />
            </button>
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
