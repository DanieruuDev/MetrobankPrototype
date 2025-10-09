import React, { ChangeEvent, useEffect, useState } from "react";

import { EdittableDisbursementData } from "./RenderDayCell";
// import BranchDropdown from "../maintainables/BranchDropdown";
import axios from "axios";
import { toast } from "react-toastify";
import ConfirmationDialog from "../shared/ConfirmationDialog";

interface UpdateEventProps {
  edittableData: EdittableDisbursementData | null;
  setEdittableData: React.Dispatch<
    React.SetStateAction<EdittableDisbursementData | null>
  >;
  closeModal: () => void;
  loading: boolean;
  fetchSchedules: (date: Date) => void;
}

const UpdateEvent: React.FC<UpdateEventProps> = ({
  edittableData,
  closeModal,
  fetchSchedules,
}) => {
  const todayDate = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [tempData, setTempData] = useState<EdittableDisbursementData | null>(
    edittableData
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDiscardClick = () => {
    if (hasChanges()) {
      setIsConfirmOpen(true);
    } else {
      closeModal();
    }
  };
  console.log("Original", edittableData);

  const handleConfirmDiscard = () => {
    setIsConfirmOpen(false);
    closeModal();
  };
  const hasChanges = (): boolean => {
    if (!edittableData || !tempData) return false;

    return (
      tempData.sched_title !== edittableData.sched_title ||
      new Date(tempData.schedule_due).getTime() !==
        new Date(edittableData.schedule_due).getTime() ||
      tempData.branch_code !== edittableData.branch_code ||
      tempData.description !== edittableData.description ||
      tempData.disbursement_type_id !== edittableData.disbursement_type_id ||
      tempData.semester_code !== edittableData.semester_code ||
      tempData.sy_code !== edittableData.sy_code
    );
  };
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setTempData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: name === "schedule_due" ? new Date(value) : value,
      };
    });
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!tempData) {
      toast.error("No data to update.", { position: "top-right" });
      setLoading(false);
      return;
    }
    if (!hasChanges()) {
      toast.info("No changes detected.", { position: "top-right" });
      return;
    }
    const localDate = new Date(tempData.schedule_due);
    const scheduleDueUTC = new Date(
      localDate.getTime() - localDate.getTimezoneOffset() * 60000
    ).toISOString();

    console.log(localDate);
    try {
      const response = await axios.put(
        `${VITE_BACKEND_URL}api/disbursement/schedule/${tempData?.sched_id}`,
        {
          sched_title: tempData?.sched_title,
          schedule_due: scheduleDueUTC,
          description: tempData?.description,
          event_type: tempData?.event_type,
        }
      );
      fetchSchedules(localDate);
      console.log("Schedule updated:", response.data);
      toast.success("Schedule updated successfully!", {
        position: "top-right",
      });

      closeModal();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update schedule.", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  // const handleBranchChange = (branchId: number) => {
  //   setTempData((prev) => {
  //     if (!prev) return prev;
  //     return { ...prev, branch_code: branchId };
  //   });
  // };

  useEffect(() => {
    setTempData(edittableData);
  }, [edittableData]);

  console.log("temp", tempData);
  if (!tempData || loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-[rgba(0,0,0,0.5)]">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
        <style>
          {`
          .loader {
            border-top-color: #3498db;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    );
  }

  console.log(tempData?.sched_title);
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-[rgba(0,0,0,0.5)]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold  text-blue-700">Edit Event</h2>
        <p className="text-sm text-gray-500 mb-4">
          Update the details of the selected event below.
        </p>

        <form onSubmit={handleEditSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              id="sched_title"
              type="text"
              name="sched_title"
              maxLength={50}
              value={tempData?.sched_title ?? ""}
              onChange={handleInputChange}
              placeholder="Enter a title"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="schedule_due"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Due Date
            </label>
            <input
              id="schedule_due"
              type="date"
              name="schedule_due"
              min={todayDate}
              value={
                tempData?.schedule_due
                  ? formatDateForInput(new Date(tempData.schedule_due))
                  : ""
              }
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={tempData?.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleDiscardClick}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
            >
              Discard Changes
            </button>
            <ConfirmationDialog
              isOpen={isConfirmOpen}
              message="You have unsaved changes. Do you really want to discard them?"
              onConfirm={handleConfirmDiscard}
              onCancel={() => setIsConfirmOpen(false)}
              confirmText="Discard"
              cancelText="Cancel"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Update Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEvent;
