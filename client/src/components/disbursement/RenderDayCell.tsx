import React, { useState, useEffect, useRef, useContext } from "react";
import { format, isSameDay, isSameMonth } from "date-fns";
import { DisbursementSchedule } from "../../pages/Disbursement/Scheduling/Schedule";
import { Eye, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import axios from "axios";
import { formatDate } from "../../utils/DateConvertionFormat";
import { Link } from "react-router-dom";
import UpdateEvent from "./UpdateEvent";
import { AuthContext } from "../../context/AuthContext";
import ConfirmDialog from "../approval/ConfirmDialog";
import { toast } from "react-toastify";

interface DayCellProps {
  day: Date;
  handleDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  scheduleMap: Map<string, DisbursementSchedule[]>;
  getBadgeColor: (type: string) => string;
  currentDate: Date;
  removeScheduleById: (disb_sched_id: number) => void;
  fetchSchedules: (date: Date) => void;
}

export interface EdittableDisbursementData {
  sched_id: number;
  sched_title: string;
  schedule_due: string;
  description: string;
  semester_code: number;
  sy_code: number;
  branch_code: number;
  disbursement_type_id: number;
  event_type: number;
}
const RenderDayCell: React.FC<DayCellProps> = ({
  day,
  handleDateSelect,
  selectedDate,
  scheduleMap,
  getBadgeColor,
  currentDate,
  fetchSchedules,
  removeScheduleById,
}) => {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [activeSchedule, setActiveSchedule] =
    useState<DisbursementSchedule | null>(null);
  const [edittableData, setEdittableData] =
    useState<EdittableDisbursementData | null>(null);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEdittable, setLoadingEdittable] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isToday = isSameDay(day, new Date());
  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
  const dayKey = format(day, "yyyy-MM-dd");
  const daySchedules = scheduleMap.get(dayKey) || [];
  const [showOptions, setShowOptions] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

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
  const handleScheduleClick = (
    e: React.MouseEvent<HTMLDivElement>,
    schedule: DisbursementSchedule
  ) => {
    setLoading(true);
    e.stopPropagation();
    if (activeSchedule?.sched_id === schedule.sched_id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const modalWidth = 320;
    const modalHeight = 320;
    const padding = 15;

    let top = rect.bottom + window.scrollY + padding; // default: below
    let left = rect.left + window.scrollX; // default: align left edge

    // ✅ Flip vertically if modal would go off the bottom of the screen
    if (top + modalHeight > window.scrollY + window.innerHeight) {
      top = rect.top + window.scrollY - modalHeight - padding; // place above
    }

    // ✅ Adjust horizontally if modal overflows right
    if (left + modalWidth > window.scrollX + window.innerWidth) {
      left = rect.right + window.scrollX - modalWidth; // align to right edge
    }

    // ✅ Clamp to screen so it never goes off
    if (top < padding) top = padding;
    if (left < padding) left = padding;

    setModalPosition({ top, left });
    setError(null);
    setActiveSchedule(schedule);
    setLoading(false);
  };

  const deleteSchedule = async (sched_id: number, requester: number) => {
    console.log(sched_id, requester);
    setDeleting(true);
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/disbursement/schedule/${sched_id}/${requester}`
      );

      toast.success(response.data.message || "Schedule deleted.");
      removeScheduleById(sched_id);
      closeModal();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ?? "Failed to delete schedule."
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
      console.error("Delete Schedule Error:", error);
    } finally {
      setDeleting(true);
    }
  };
  const closeModal = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    setActiveSchedule(null);
    setShowOptions(false);
  };
  const handleEditClick = async (sched_id: number) => {
    setShowUpdateModal(true);
    setLoadingEdittable(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/disbursement/schedule/detailed/${sched_id}`
      );
      setEdittableData(res.data);
    } catch (error) {
      console.error("Error fetching schedule details:", error);
    } finally {
      setLoadingEdittable(false);
    }
  };
  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setActiveSchedule(null);
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
            key={schedule.sched_id}
            className="text-xs py-1 px-2 mb-1 rounded-xl text-white text-[10px] font-medium truncate relative cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: getBadgeColor(schedule.disbursement_label),
            }}
            onClick={(e) => handleScheduleClick(e, schedule)}
          >
            {schedule.sched_title}
          </div>
        ))}
      </div>

      {activeSchedule && (
        <div
          ref={modalRef}
          className="fixed z-50 bg-[#F1F1F1] shadow-lg rounded-md border border-gray-200 w-80 transition-all duration-200 ease-out"
          style={{
            top: modalPosition?.top,
            left: modalPosition?.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ConfirmDialog
            isOpen={confirmOpen}
            message="Are you sure you want to delete this schedule?"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              if (pendingDeleteId && userId) {
                deleteSchedule(pendingDeleteId, userId);
              }
              setConfirmOpen(false);
              setPendingDeleteId(null);
            }}
            confirmLabel="Delete"
            loading={deleting}
          />

          <div className="p-4 pb-3">
            <div className="flex justify-between items-start relative">
              <p className="text-sm text-gray-600">
                {formatDate(activeSchedule.schedule_due)}
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
                        to={`/tracking/detailed/${activeSchedule.sched_id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-white transition"
                        onClick={() => setShowOptions(false)}
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Link>

                      {activeSchedule.admin_id === userId && (
                        <>
                          {console.log(activeSchedule.sched_id === userId)}
                          <button
                            className="flex items-center gap-2 px-4 py-2 w-full text-sm text-gray-700 hover:bg-white transition"
                            onClick={() => {
                              setShowOptions(false);
                              handleEditClick(activeSchedule.sched_id);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            className="flex items-center gap-2 px-4 py-2 w-full text-sm text-red-500 hover:bg-red-100 transition"
                            onClick={() => {
                              setPendingDeleteId(activeSchedule.sched_id);
                              setConfirmOpen(true);
                              setShowOptions(false);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
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
                edittableData={edittableData}
                closeModal={closeUpdateModal}
                loading={loadingEdittable}
                setEdittableData={setEdittableData}
                fetchSchedules={fetchSchedules}
              />
            )}

            <div className="text-[20px] font-medium text-[#565656]">
              {loading ? "Loading..." : activeSchedule.sched_title}
            </div>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            {!loading && !error && (
              <>
                <div className="flex items-center gap-1 mt-2">
                  <div
                    className="w-1 h-4 rounded-full"
                    style={{
                      backgroundColor: getBadgeColor(
                        activeSchedule.disbursement_label
                      ),
                    }}
                  ></div>
                  <h3 className="text-[16px] font-medium text-[#565656]">
                    {activeSchedule.disbursement_label}
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

                <div className="mt-4 text-[#565656] text-[13px]">
                  <div className="mb-2">
                    <div className="bg-gray-50 p-2 rounded text-sm space-y-1 text-[13px]">
                      <div className="grid grid-cols-2">
                        <span>Description:</span>
                        <span className="font-medium">
                          {activeSchedule.description || "No details provided"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span>Student count:</span>
                        <span className="font-medium">
                          {activeSchedule.student_count}
                        </span>
                      </div>
                      <div className="grid grid-cols-2">
                        <span>Created By:</span>
                        <span className="font-medium">
                          {activeSchedule.admin_name}
                        </span>
                      </div>
                    </div>
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
