import axios from "axios";
import { X } from "lucide-react";
import { useState, FormEvent, ChangeEvent, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

interface EventModalProps {
  onClose: (isEventOpen: boolean) => void;
  fetchSchedules: () => void;
  selectedDate: Date | null;
}

type SemesterType = "1st" | "2nd" | "";
type BranchType =
  | "STI Ortigas-cainta"
  | "STI  Sta.mesa"
  | "STI Fairview"
  | "STI Global"
  | "";
type SchoolYearType = "2024-2025" | "2025-2026" | "";
type DisbursementType =
  | "Scholarship Fee"
  | "Allowance Fee"
  | "Thesis Fee"
  | "Internship Fee"
  | "";

interface FormData {
  title: string;
  date: Date | null;
  semester: SemesterType;
  branch: BranchType;
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
    date: selectedDate,
    semester: "",
    branch: "",
    schoolYear: "",
    disbursementType: "",
    description: "",
  });
  const todayDate = new Date().toISOString().split("T")[0];

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "date" ? new Date(value) : value,
    }));
  };

  useEffect(() => {
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        date: selectedDate,
      }));
    }
  }, [selectedDate]);
  console.log(formData.date);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("sent?");
    try {
      console.log("click pass");
      const response = await axios.post(
        "http://localhost:5000/api/disbursement/schedule",
        {
          created_by: userId,
          disbursement_date: formData.date
            ? formatDateForInput(new Date(formData.date))
            : null,
          disb_title: formData.title,
          branch: formData.branch,
          semester_code: Number(formData.semester),
          sy_code: Number(formData.schoolYear),
          disbursement_type_id: Number(formData.disbursementType),
        }
      );

      console.log("Form Data Submitted:", formData);
      console.log(response);
      fetchSchedules();
      alert("Successs");
      onClose(false);
      setFormData({
        title: "",
        date: null,
        semester: "",
        branch: "",
        schoolYear: "",
        disbursementType: "",
        description: "",
      });
    } catch (error) {
      console.error("Error creating disbursement schedule:", error);
      alert("Failed");
      console.log("click fail");
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
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date
              </label>
              <input
                id="date"
                type="date"
                name="date"
                min={todayDate}
                value={
                  formData.date
                    ? formatDateForInput(new Date(formData.date))
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
                value={formData.branch}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="">Select Branch</option>
                <option value="STI Ortigas-Cainta">STI Ortigas-Cainta</option>
                <option value="STI Sta. Mesa">STI Sta.Mesa</option>
                <option value="STI Fairview">STI Fairview</option>
                <option value="STI Global">STI Global</option>
              </select>
            </div>

            <div className="flex gap-3">
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
                  <option value="4">Internship Fee</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
