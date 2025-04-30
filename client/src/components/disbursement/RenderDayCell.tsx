import React, { useState, useEffect, useRef } from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { DisbursementSchedule } from "../../pages/SchedulingTracking/Schedule";
import { Eye, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import { formatDate } from "../../utils/DateConvertionFormat";
import { Link } from "react-router-dom";
import UpdateEvent from "./UpdateEvent";
export interface DisbursementScheduleDetail {
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
interface DayCellProps {
  day: Date;
  handleDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  scheduleMap: Map<string, DisbursementSchedule[]>;
  getBadgeColor: (type: string) => string;
  currentDate: Date;
  removeScheduleById: (disb_sched_id: number) => void;
}

const RenderDayCell: React.FC<DayCellProps> = ({
  day,
  handleDateSelect,
  selectedDate,
  scheduleMap,
  getBadgeColor,
  currentDate,
  removeScheduleById,
}) => {
  const [activeSchedule, setActiveSchedule] =
    useState<DisbursementScheduleDetail | null>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const isToday = isSameDay(day, new Date());
  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
  const dayKey = format(day, "yyyy-MM-dd");
  const daySchedules = scheduleMap.get(dayKey) || [];
  const [showOptions, setShowOptions] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const toggleOptions = () => setShowOptions((prev) => !prev);
  const getStatusClass = (status: string) => {
    switch (status) {
      case "Not Started":
        return "bg-gray-500";
      case "In Progress":
        return "bg-blue-500";
      case "Completed":
        return "bg-green-500";
      case "Missed":
        return "bg-red-500";
      default:
        return "bg-black";
    }
  };
  const handleScheduleClick = async (
    e: React.MouseEvent<HTMLDivElement>,
    schedule: DisbursementSchedule
  ) => {
    e.stopPropagation();

    if (activeSchedule?.disb_sched_id === schedule.disb_sched_id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const modalWidth = 320;
    const modalHeight = 320;
    const padding = 10;

    let left = rect.right + padding + window.scrollX;
    if (rect.right + modalWidth + padding > window.innerWidth) {
      left = rect.left - modalWidth - padding + window.scrollX;
    }

    let top: number;

    if (rect.bottom + modalHeight + padding < window.innerHeight) {
      top = rect.bottom + window.scrollY + padding;
    } else {
      top = rect.top + window.scrollY - modalHeight - padding;
      if (top < padding) top = padding;
    }
    if (top < padding) {
      top = padding;
    }
    setModalPosition({ top, left });
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/schedule/detailed/1/${schedule.disb_sched_id}`
      );
      setActiveSchedule(response.data);
    } catch (err) {
      setError("Error fetching schedule details.");
      console.error("Error fetching schedule details:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (disb_sched_id: number, user_id: string) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/disbursement/schedule/${1}/${disb_sched_id}`
      );

      alert(response.data.message || "Disbursement schedule deleted.");
      removeScheduleById(disb_sched_id);
      closeModal();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const serverMessage =
          error.response?.data?.message ?? "Failed to delete schedule.";
        alert(serverMessage);
      } else {
        alert("An unexpected error occurred.");
      }

      console.error("Delete Schedule Error:", error);
    }

    console.log(disb_sched_id, user_id);
  };

  const closeModal = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    setActiveSchedule(null);
    setShowOptions(false);
  };
  const handleEditClick = () => {
    setShowUpdateModal(true); // Open update modal
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false); // Close the update modal
    setActiveSchedule(null); // Reset active schedule if necessary
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setActiveSchedule(null);
      }
    };

    if (activeSchedule) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeSchedule]);

  return (
    <div
      key={day.toString()}
      className={`min-h-[100px] border flex flex-col items-start justify-start cursor-pointer transition-all text-[15px]
        ${
          isSelected && !isToday
            ? "border-2 border-blue-500"
            : "border-gray-300"
        }
        ${
          !isSameMonth(day, currentDate)
            ? "text-gray-400 bg-gray-50"
            : "text-gray-800 bg-white"
        }
      `}
      onClick={() => handleDateSelect(day)}
    >
      <div
        className={`text-sm font-medium flex items-center justify-center mx-2 mt-2 ${
          isToday ? "bg-blue-500 text-white w-6 h-6 rounded-xl" : ""
        }`}
      >
        {format(day, "d")}
      </div>

      <div className="mt-1 overflow-hidden w-full">
        {daySchedules.map((schedule) => (
          <div
            key={schedule.disb_sched_id}
            className="text-xs py-1 px-2 mb-1 rounded-xl text-white text-[10px] font-medium truncate relative cursor-pointer hover:opacity-90"
            style={{ backgroundColor: getBadgeColor(schedule.type) }}
            onClick={(e) => handleScheduleClick(e, schedule)}
          >
            {schedule.type}
          </div>
        ))}
      </div>

      {activeSchedule && (
        <div
          ref={modalRef}
          className="fixed z-50 bg-[#F1F1F1] shadow-lg rounded-md border border-gray-200 w-80 transition-all duration-200 ease-out"
          style={{
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 pb-3">
            <div className="flex justify-between items-start relative">
              <p className="text-sm text-gray-600">
                {format(day, "EEEE, MMMM d")}
              </p>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    className="text-gray-600 hover:text-gray-800 p-2 rounded-full transition cursor-pointer"
                    onClick={toggleOptions}
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  {showOptions && (
                    <div className="absolute right-0 mt-2 w-36 bg-[#f4f4f4] border border-gray-200 rounded-xl shadow-md overflow-hidden z-10">
                      <Link
                        to={"/financial"}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-white transition"
                        onClick={() => setShowOptions(false)}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Link>
                      <button
                        className="flex items-center gap-2 px-4 py-2 w-full text-sm text-gray-700 hover:bg-white transition"
                        onClick={() => {
                          console.log("Edit clicked");
                          setShowOptions(false);
                          handleEditClick();
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 w-full text-sm text-red-500 hover:bg-red-100 transition"
                        onClick={() => {
                          deleteSchedule(
                            activeSchedule.disb_sched_id,
                            activeSchedule.created_by
                          );
                          setShowOptions(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  className="text-gray-500 cursor-pointer hover:bg-gray-100 p-1 rounded-full"
                  onClick={closeModal}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {showUpdateModal && activeSchedule && (
              <UpdateEvent
                activeSchedule={activeSchedule} // Pass active schedule
                closeModal={closeUpdateModal} // Close modal handler
              />
            )}
            <div className="text-[20px] font-medium text-[#565656]">
              {loading ? "Loading..." : activeSchedule.title}
            </div>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            {!loading && !error && (
              <>
                <div className="flex items-center gap-1 mt-2">
                  <div
                    className="w-1 h-4 rounded-full"
                    style={{
                      backgroundColor: getBadgeColor(
                        activeSchedule.disbursement_type
                      ),
                    }}
                  ></div>
                  <h3 className="text-[16px] font-medium text-[#565656]">
                    {activeSchedule.disbursement_type}
                  </h3>
                </div>

                <div className="flex gap-1 items-center mt-2">
                  <div
                    className={`w-4 h-4 rounded-xl ${getStatusClass(
                      activeSchedule.schedule_status
                    )}`}
                  ></div>
                  <span className="text-[13px] font-medium">
                    {activeSchedule.schedule_status}
                  </span>
                </div>

                <div className="mt-4 text-[#565656] text-[13px] space-y-1">
                  <div className="flex justify-between">
                    <div>Disbursement Date</div>
                    <div>{formatDate(activeSchedule.disbursement_date)}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Amount</div>
                    <div>{activeSchedule.amount}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Year Level</div>
                    <div>{activeSchedule.yr_lvl}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Semester</div>
                    <div>{activeSchedule.semester}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>School Year</div>
                    <div>{activeSchedule.school_year}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Branch</div>
                    <div>{activeSchedule.branch}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Created By</div>
                    <div>{activeSchedule.created_by}</div>
                  </div>
                  <div className="flex justify-between">
                    <div>Total Scholar</div>
                    <div>{activeSchedule.total_scholar}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderDayCell;
