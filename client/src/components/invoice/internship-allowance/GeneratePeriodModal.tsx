import React, { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { format, addDays, parse, isSaturday, isSunday } from "date-fns";

interface GeneratePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (coveredDate: string) => void;
  existingCoveredDates?: string[]; // ✅ from parent
}

const GeneratePeriodModal: React.FC<GeneratePeriodModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  existingCoveredDates = [],
}) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [coveredDate, setCoveredDate] = useState<string>("");

  // ✅ Convert existing covered date strings ("Oct 01 - Oct 15, 2025") → date ranges
  const parsedDateRanges = existingCoveredDates
    .map((cd) => {
      try {
        const [startStr, endStr] = cd.split(" - ");
        const year = endStr.split(", ")[1]; // get the year part
        const start = parse(`${startStr}, ${year}`, "MMM dd, yyyy", new Date());
        const end = parse(endStr, "MMM dd, yyyy", new Date());
        return { start, end };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as { start: Date; end: Date }[];

  // Find the overall range (earliest start to latest end)
  const overallStart =
    parsedDateRanges.length > 0
      ? new Date(Math.min(...parsedDateRanges.map((r) => r.start.getTime())))
      : null;
  const overallEnd =
    parsedDateRanges.length > 0
      ? new Date(Math.max(...parsedDateRanges.map((r) => r.end.getTime())))
      : null;

  // 🧹 Reset inputs when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStartDate("");
      setEndDate("");
      setCoveredDate("");
    }
  }, [isOpen]);

  // Helper function to add business days (including start day, excluding weekends)
  const addBusinessDays = (date: Date, days: number): Date => {
    let result = new Date(date); // Start with the input date
    let addedDays = 1; // Include the start day as day 1
    while (addedDays < days) {
      result = addDays(result, 1);
      if (!isSaturday(result) && !isSunday(result)) {
        addedDays++;
      }
    }
    return result;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    setStartDate(e.target.value);

    // Calculate end date by adding 15 business days (including start day)
    const calculatedEnd = addBusinessDays(selectedDate, 15);
    const formattedEnd = format(calculatedEnd, "yyyy-MM-dd");
    setEndDate(formattedEnd);

    const covered = `${format(selectedDate, "MMM dd")} - ${format(
      calculatedEnd,
      "MMM dd, yyyy"
    )}`;
    setCoveredDate(covered);
  };

  // ✅ Disable dates that overlap the overall range (Oct 21 - Dec 05), default to false if no range
  const isDateDisabled = (dateStr: string): boolean => {
    if (!overallStart || !overallEnd) return false; // No range to disable
    const date = new Date(dateStr);
    return date >= overallStart && date <= overallEnd;
  };

  // Dynamically set min and max dates to enforce range restriction
  const currentDate = new Date(); // Today's date: Oct 21, 2025
  const minDate = overallEnd
    ? format(addDays(overallEnd, 1), "yyyy-MM-dd")
    : format(currentDate, "yyyy-MM-dd"); // Default to today if no range

  const handleSubmit = () => {
    if (!startDate) {
      alert("Please select a start date.");
      return;
    }
    if (isDateDisabled(startDate)) {
      alert("This date range overlaps an existing covered period.");
      return;
    }
    onGenerate(coveredDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2">
          <Calendar className="text-blue-600" />
          <h2 className="text-lg font-semibold">Generate Period</h2>
        </div>

        <p className="text-sm text-gray-600">
          Select the <b>starting date</b> of the internship allowance period.
          The system will automatically compute the <b>15-day</b> duration
          (excluding weekends).
        </p>

        {/* Date Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-full border rounded-lg px-3 py-2"
              min={minDate} // Set min to the day after the latest end date or today
            />
            {startDate && isDateDisabled(startDate) && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ This date overlaps an existing period.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              End Date (auto-calculated)
            </label>
            <input
              type="date"
              value={endDate}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
            />
          </div>

          {coveredDate && (
            <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-sm font-medium">
              Covered Date: {coveredDate}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end space-x-3 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!startDate || isDateDisabled(startDate)}
            className={`px-4 py-2 text-sm rounded-lg text-white ${
              !startDate || isDateDisabled(startDate)
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratePeriodModal;
