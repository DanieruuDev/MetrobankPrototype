import axios from "axios";
import { X } from "lucide-react";
import { useState, FormEvent, ChangeEvent, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import BranchDropdown from "../maintainables/BranchDropdown";
import { toast } from "react-toastify";
interface EventModalProps {
  onClose: (isEventOpen: boolean) => void;
  fetchSchedules: () => void;
  selectedDate: Date | null;
}

type SemesterType = "1st" | "2nd" | "";
type SchoolYearType = "2024-2025" | "2025-2026" | "";
type DisbursementType =
  | "Scholarship Fee"
  | "Allowance Fee"
  | "Thesis Fee"
  | "Internship Fee"
  | "Academic Incentives"
  | "";

interface FormData {
  title: string;
  schedule_due: Date | null;
  starting_date: Date | null;
  semester: SemesterType;
  branch: number | null;
  schoolYear: SchoolYearType;
  disbursementType: DisbursementType;
  description: string;
}

function EventModal({
  onClose,
  fetchSchedules,
  selectedDate,
}: EventModalProps) {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [formData, setFormData] = useState<FormData>({
    title: "",
    schedule_due: selectedDate,
    semester: "",
    branch: null,
    schoolYear: "",
    disbursementType: "",
    description: "",
    starting_date: null,
  });
  const [branch, setBranch] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleBranchChange = (branchId: number) => {
    setBranch(branchId);
    setFormData((prev) => ({ ...prev, branch: branchId }));
  };
  const todayDate = new Date().toISOString().split("T")[0];

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "schedule_due" || name === "starting_date"
          ? new Date(value)
          : value,
    }));
  };
  console.log(formData.branch);

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        schedule_due: selectedDate,
      }));
    }
  }, [selectedDate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("sent?");
    setLoading(true);
    try {
      console.log("click pass");
      const response = await axios.post(
        "http://localhost:5000/api/disbursement/schedule",
        {
          event_type: 1,
          requester: userId,
          schedule_due: formData.schedule_due
            ? formatDateForInput(new Date(formData.schedule_due))
            : null,
          starting_date: formData.starting_date
            ? formatDateForInput(new Date(formData.starting_date))
            : null,
          sched_title: formData.title,
          branch_code: formData.branch,
          semester_code: Number(formData.semester),
          sy_code: Number(formData.schoolYear),
          disbursement_type_id: Number(formData.disbursementType),
          description: formData.description,
        }
      );
      toast("Event created successfully");
      console.log("Form Data Submitted:", formData);
      console.log(response);
      fetchSchedules();

      onClose(false);
      setFormData({
        title: "",
        schedule_due: null,
        semester: "",
        branch: null,
        schoolYear: "",
        disbursementType: "",
        description: "",
        starting_date: null,
      });
    } catch (error) {
      console.error("Error creating disbursement schedule:", error);
      alert("Failed");
      console.log("click fail");
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

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Create Event</h3>
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => onClose(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
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
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a title"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Starting Date
                </label>
                <input
                  id="starting_date"
                  type="date"
                  name="starting_date"
                  min={todayDate}
                  value={
                    formData.starting_date
                      ? formatDateForInput(new Date(formData.starting_date))
                      : ""
                  }
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="date"
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
                    formData.schedule_due
                      ? formatDateForInput(new Date(formData.schedule_due))
                      : ""
                  }
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  value={formData.semester}
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
                  htmlFor="schoolYear"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  School Year
                </label>
                <select
                  id="schoolYear"
                  name="schoolYear"
                  value={formData.schoolYear}
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

            <div className="grid grid-cols-2 gap-3">
              <BranchDropdown
                formData={branch}
                handleInputChange={handleBranchChange}
              />

              <div className="flex-1">
                <label
                  htmlFor="disbursementType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Disbursement Type
                </label>
                <select
                  id="disbursementType"
                  name="disbursementType"
                  value={formData.disbursementType}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="1">Scholarship Fee</option>
                  <option value="2">Allowance Fee</option>
                  <option value="3">Thesis Fee</option>
                  <option value="4">Internship Allowance</option>
                  <option value="5">Academic Incentives</option>
                </select>
              </div>
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
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              disabled={loading}
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              disabled={loading}
            >
              {loading ? "Loading" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
