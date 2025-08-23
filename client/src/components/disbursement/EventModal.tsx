import axios from "axios";
import { X } from "lucide-react";
import { useState, FormEvent, ChangeEvent, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

interface EventModalProps {
  onClose: (isEventOpen: boolean) => void;
  fetchSchedules: () => void;
  selectedDate: Date | null;
}

type BranchType =
  | "STI Ortigas-cainta"
  | "STI  Sta.mesa"
  | "STI Fairview"
  | "STI Global"
  | "";
type DisbursementType =
  | "Scholarship Fee"
  | "Allowance Fee"
  | "Thesis Fee"
  | "Internship Allowance"
  | "Academic Incentives"
  | "";

interface FormData {
  title: string;
  date: Date | null;
  branch: BranchType;
  disbursementType: DisbursementType;
  description: string;
  semester: string;
  school_year: string;
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
    branch: "",
    disbursementType: "",
    description: "",
    semester: "",
    school_year: "",
  });
  const todayDate = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/disbursement/schedule",
        {
          created_by: userId,
          disbursement_date: formData.date
            ? formatDateForInput(new Date(formData.date))
            : null,
          disb_title: formData.title,
          branch: formData.branch,
          description: formData.description,
          disbursement_type_id: Number(formData.disbursementType),
        }
      );

      console.log("Form Data Submitted:", formData);
      console.log(response);
      fetchSchedules();
      alert("Success");
      onClose(false);
      setFormData({
        title: "",
        date: null,
        branch: "",
        disbursementType: "",
        description: "",
        semester: "",
        school_year: "",
      });
    } catch (error) {
      console.error("Error creating disbursement schedule:", error);
      alert("Failed");
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
            disabled={loading}
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
                maxLength={50}
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a title"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
                disabled={loading}
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
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter details (year levels, semesters, amounts, etc.)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all h-20"
                required
                disabled={loading}
              />
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
                disabled={loading}
              >
                <option value="">Select Branch</option>
                <option value="STI Ortigas-Cainta">STI Ortigas-Cainta</option>
                <option value="STI Sta. Mesa">STI Sta.Mesa</option>
                <option value="STI Fairview">STI Fairview</option>
                <option value="STI Global">STI Global</option>
              </select>
            </div>

            <div>
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
                disabled={loading}
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

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventModal;
