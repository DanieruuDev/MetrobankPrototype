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

type SemesterType = string;
type SchoolYearType = string;
type DisbursementType = string;

interface ApprovedWorkflow {
  id: number;
  title: string;
  semester_code: number;
  semester_text: string;
  sy_code: number;
  school_year_text: string;
  disbursement_type_id: number;
  request_type_text: string;
}

interface FormData {
  title: string;
  schedule_due: Date | null;
  starting_date: Date | null;
  semester: SemesterType;
  branch: string;
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
    branch: "",
    schoolYear: "",
    disbursementType: "",
    description: "",
    starting_date: null,
  });
  const [branch, setBranch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [approvedWorkflows, setApprovedWorkflows] = useState<
    ApprovedWorkflow[]
  >([]);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<ApprovedWorkflow | null>(null);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleBranchChange = (branch: string) => {
    setBranch(branch);
    setFormData((prev) => ({ ...prev, branch: branch }));
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

  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await axios.get(
          `${VITE_BACKEND_URL}api/approvals/ready-for-scheduling`
        );
        setApprovedWorkflows(res.data || []);
      } catch (err) {
        console.error("Failed to load approved workflows:", err);
      }
    };
    fetchApproved();
  }, []);

  useEffect(() => {
    const checkEligible = async () => {
      try {
        setEligibleCount(null);
        if (!selectedWorkflow || !formData.branch) return;
        const res = await axios.get(
          `${VITE_BACKEND_URL}api/disbursement/eligible-count`,
          {
            params: {
              sy_code: selectedWorkflow.sy_code,
              semester_code: selectedWorkflow.semester_code,
              branch: formData.branch,
              disbursement_type_id: selectedWorkflow.disbursement_type_id,
            },
          }
        );
        setEligibleCount(Number(res.data?.count ?? 0));
      } catch (err) {
        console.error("eligible-count failed", err);
        setEligibleCount(0);
      }
    };
    checkEligible();
  }, [selectedWorkflow, formData.branch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("sent?");
    setLoading(true);
    try {
      console.log("click pass");
      if (!selectedWorkflow) {
        alert("Please select an approved disbursement.");
        return;
      }
      if (!formData.title) {
        alert("Please enter a title.");
        return;
      }
      if (!formData.branch) {
        alert("Please select a branch.");
        return;
      }
      const effectiveStartingDate =
        formData.starting_date || formData.schedule_due;
      if (!effectiveStartingDate) {
        alert("Please select a starting and due date.");
        return;
      }
      if (!formData.description) {
        alert("Please enter a description.");
        return;
      }
      const response = await axios.post(
        `${VITE_BACKEND_URL}api/disbursement/schedule`,
        {
          event_type: 1,
          requester: userId,
          schedule_due: formData.schedule_due
            ? formatDateForInput(new Date(formData.schedule_due))
            : null,
          starting_date: formatDateForInput(new Date(effectiveStartingDate)),
          sched_title: formData.title,
          branch_code: formData.branch,
          semester_code: Number(selectedWorkflow.semester_code),
          sy_code: Number(selectedWorkflow.sy_code),
          disbursement_type_id: Number(selectedWorkflow.disbursement_type_id),
          description: formData.description,
          workflow_id: Number(selectedWorkflow.id),
        }
      );
      toast.success("Event created successfully", {
        position: "top-center",
        autoClose: 3000,
      });
      console.log("Form Data Submitted:", formData);
      console.log(response);
      fetchSchedules();

      onClose(false);
      setFormData({
        title: "",
        schedule_due: null,
        branch: "",
        semester: "",
        schoolYear: "",
        disbursementType: "",
        description: "",
        starting_date: null,
      });
      setSelectedWorkflow(null);
    } catch (error) {
      console.error("Error creating disbursement schedule:", error);
      toast.error("Failed to create event. Please try again.", {
        position: "top-center",
        autoClose: 5000,
      });
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

  const openWorkflowModal = () => setIsWorkflowModalOpen(true);
  const closeWorkflowModal = () => setIsWorkflowModalOpen(false);
  const selectWorkflow = (workflow: ApprovedWorkflow) => {
    setSelectedWorkflow(workflow);
    setFormData((prev) => ({
      ...prev,
      title: !prev.title ? workflow.title : prev.title,
      semester: workflow.semester_text,
      schoolYear: workflow.school_year_text,
      disbursementType: workflow.request_type_text,
    }));
    closeWorkflowModal();
  };

  return (
    <>
      {/* Full-Screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="animate-spin h-10 w-10 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Creating Event
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                Please wait while we create your event...
              </p>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full animate-progress"></div>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Do not close this window
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-50 p-2 sm:p-4">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow-xl w-full max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-3 sm:mb-6">
            <h3 className="text-base sm:text-xl font-bold text-gray-800">
              Create Event
            </h3>
            <button
              className="text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => onClose(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-2.5 sm:space-y-5">
              {!selectedWorkflow && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Select Approved Disbursement
                  </label>
                  <button
                    type="button"
                    onClick={openWorkflowModal}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-left bg-white hover:bg-gray-50"
                  >
                    Select disbursement
                  </button>
                </div>
              )}

              {selectedWorkflow && (
                <div className="p-3 sm:p-4 bg-gray-50 rounded-md shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Selected Disbursement
                    </h4>
                    <button
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => {
                        setSelectedWorkflow(null);
                        setFormData((prev) => ({
                          ...prev,
                          title: "",
                          semester: "",
                          schoolYear: "",
                          disbursementType: "",
                        }));
                      }}
                      aria-label="Change selection"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex justify-between">
                      <span className="font-medium">School Year:</span>
                      <span>{selectedWorkflow.school_year_text}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium">Semester:</span>
                      <span>{selectedWorkflow.semester_text}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span>{selectedWorkflow.request_type_text}</span>
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
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
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
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
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
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
                <BranchDropdown
                  formData={branch}
                  handleInputChange={handleBranchChange}
                />
              </div>

              {selectedWorkflow && formData.branch && (
                <div className="text-sm text-gray-600">
                  Eligible recipients: {eligibleCount ?? "…"}
                </div>
              )}

              <div>
                <label
                  htmlFor="description"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
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

            <div className="flex justify-end space-x-2 sm:space-x-3 mt-3 sm:mt-8">
              <button
                type="button"
                disabled={loading}
                onClick={() => onClose(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  loading ||
                  (selectedWorkflow
                    ? eligibleCount !== null && eligibleCount <= 0
                    : true)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                }`}
                disabled={
                  loading ||
                  (selectedWorkflow
                    ? eligibleCount !== null && eligibleCount <= 0
                    : true)
                }
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </form>

          {isWorkflowModalOpen && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-50 p-2 sm:p-4">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Select Disbursement
                  </h3>
                  <button
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={closeWorkflowModal}
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto flex-1">
                  {approvedWorkflows.map((wf) => (
                    <div
                      key={wf.id}
                      className="p-3 border-b cursor-pointer hover:bg-gray-100"
                      onClick={() => selectWorkflow(wf)}
                    >
                      {`${wf.title} (${wf.school_year_text} - ${wf.semester_text} - ${wf.request_type_text})`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default EventModal;
