import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { DisbursementScheduleDetail } from "./RenderDayCell";
import axios from "axios";

interface UpdateEventProps {
  activeSchedule: DisbursementScheduleDetail;
  closeModal: () => void;
}

const UpdateEvent: React.FC<UpdateEventProps> = ({
  activeSchedule,
  closeModal,
}) => {
  const [scheduleData, setScheduleData] =
    useState<DisbursementScheduleDetail>(activeSchedule);
  const [loadingScholarCount, setLoadingScholarCount] = useState(false);
  const todayDate = new Date().toISOString().split("T")[0];
  const [scholarCount, setScholarCount] = useState<number | null>(
    Number(scheduleData.total_scholar)
  );
  const formatDateOnly = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString("en-CA"); // 'YYYY-MM-DD' in local timezone
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setScheduleData((prev) => ({
      ...prev,
      [name]:
        name === "amount"
          ? value === ""
            ? ""
            : Math.min(Number(value), 100000000)
          : name === "date"
          ? new Date(value)
          : value,
    }));
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  console.log(scheduleData.disbursement_date);
  console.log(formatDateOnly(scheduleData.disbursement_date));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("submit");
    try {
      const formattedData = {
        ...scheduleData,
        disbursement_date: formatDateOnly(scheduleData.disbursement_date),
        yr_lvl: scheduleData.yr_lvl.charAt(0),
        semester: scheduleData.semester.charAt(0),
        school_year: scheduleData.school_year.replace(/-/g, ""),
      };
      const response = await axios.put(
        `http://localhost:5000/api/disbursement/schedule/${scheduleData.disb_sched_id}`,
        formattedData
      );
      console.log("Schedule created:", response.data);
      alert("Success");
      closeModal();
    } catch (error) {
      console.log(error);
      alert("Failed");
      closeModal();
    }
  };
  const hasScheduleDataChanged = useCallback(() => {
    return (
      scheduleData.semester.charAt(0) !== activeSchedule.semester.charAt(0) ||
      scheduleData.yr_lvl.charAt(0) !== activeSchedule.yr_lvl.charAt(0) ||
      scheduleData.school_year.replace("-", "") !==
        activeSchedule.school_year.replace("-", "") ||
      scheduleData.disbursement_type !== activeSchedule.disbursement_type
    );
  }, [scheduleData, activeSchedule]);

  useEffect(() => {
    const fetchScholarCount = async () => {
      const { semester, school_year, yr_lvl, disbursement_type } = scheduleData;

      if (!semester || !school_year || !yr_lvl || !disbursement_type) {
        setScholarCount(null);
        return;
      }

      try {
        setLoadingScholarCount(true);
        const response = await axios.get(
          `http://localhost:5000/api/disbursement/scholar/${Number(
            yr_lvl.charAt(0)
          )}/${Number(school_year.replace("-", ""))}/${Number(
            semester.charAt(0)
          )}`,
          { params: { disbursement_type } }
        );

        setScholarCount(response.data.count.count);
      } catch (error) {
        console.error("Failed to fetch scholar count:", error);
        setScholarCount(null);
      } finally {
        setLoadingScholarCount(false);
      }
    };

    if (hasScheduleDataChanged()) {
      fetchScholarCount();
    } else {
      setScholarCount(Number(scheduleData.total_scholar));
    }
  }, [
    scheduleData.semester,
    scheduleData.school_year,
    scheduleData.yr_lvl,
    scheduleData.disbursement_type,
    scheduleData,
    hasScheduleDataChanged,
  ]);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-[rgba(0,0,0,0.5)]">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-medium mb-4">Update Event</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              name="title"
              maxLength={25}
              value={scheduleData.title}
              onChange={handleInputChange}
              placeholder="Enter a title"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date
            </label>
            <input
              id="disbursement_date"
              type="date"
              name="disbursement_date"
              min={todayDate}
              value={
                scheduleData.disbursement_date
                  ? formatDateForInput(new Date(scheduleData.disbursement_date))
                  : ""
              }
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="semester"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Semester
              </label>
              <select
                id="semester"
                name="semester"
                value={scheduleData.semester.charAt(0)}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="yr_lvl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Year Level
              </label>
              <select
                id="yr_lvl"
                name="yr_lvl"
                value={scheduleData.yr_lvl.charAt(0)}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="school_year"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                School Year
              </label>
              <select
                id="school_year"
                name="school_year"
                value={scheduleData.school_year.replace("-", "")}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select</option>
                <option value="20242025">2024-2025</option>
                <option value="20252026">2025-2026</option>
              </select>
            </div>
          </div>
          {loadingScholarCount ? (
            <p className="text-sm text-gray-500 mt-2">
              Loading eligible scholars...
            </p>
          ) : scholarCount === null ? (
            <p className="text-sm text-gray-400 mt-2">
              Fill in Semester, Year Level, School Year, and Disbursement Type
              to see eligible scholars
            </p>
          ) : scholarCount == 0 ? (
            <p className="text-sm text-red-600 mt-2">
              No eligible scholars for the selected criteria.
            </p>
          ) : scholarCount > 0 ? (
            <p className="text-sm text-green-600 mt-2">
              Eligible Scholars: {scholarCount}
            </p>
          ) : null}
          <div>
            <label
              htmlFor="branch"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Branch
            </label>
            <select
              id="branch"
              name="branch"
              value={scheduleData.branch}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            >
              <option value="">Select Branch</option>
              <option value="ortigas-cainta">Ortigas-Cainta</option>
              <option value="sta-mesa">Sta. Mesa</option>
              <option value="fairview">Fairview</option>
              <option value="global">Global</option>
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="disbursement_type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Disbursement Type
              </label>
              <select
                id="disbursement_type"
                name="disbursement_type"
                value={scheduleData.disbursement_type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select Type</option>
                <option value="Scholarship Fee">Scholarship Fee</option>
                <option value="Allowance Fee">Allowance Fee</option>
                <option value="Thesis Fee">Thesis Fee</option>
                <option value="Internship Fee">Internship Fee</option>
              </select>
            </div>

            <div className="flex-1">
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Disbursement Amount
              </label>
              <input
                id="amount"
                type="number"
                name="amount"
                value={scheduleData.amount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                placeholder="Enter amount"
                min={1}
                maxLength={12}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEvent;
