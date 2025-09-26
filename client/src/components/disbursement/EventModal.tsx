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

// ---------------------------------------------
// NEW INTERFACE: Data fetched from the workflow API
// ---------------------------------------------
interface ApprovedWorkflow {
  id: number; // This is the workflow_id
  title: string;
  semester_code: number;
  sy_code: number;
  disbursement_type_id: number;
}

// ---------------------------------------------
// UPDATED INTERFACE: Form Data
// Removed: semester, schoolYear, disbursementType
// Added: workflow_id
// ---------------------------------------------
interface FormData {
  title: string;
  schedule_due: Date | null;
  starting_date: Date | null;
  branch: string;
  description: string;
  workflow_id: number | null; // The ID of the selected workflow
}

function EventModal({
  onClose,
  fetchSchedules,
  selectedDate,
}: EventModalProps) {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;

  // NEW STATE for holding the list of approved, unscheduled workflows
  const [approvedWorkflows, setApprovedWorkflows] = useState<
    ApprovedWorkflow[]
  >([]);

  // Initialize workflow_id to null
  const [formData, setFormData] = useState<FormData>({
    title: "",
    schedule_due: selectedDate,
    branch: "",
    description: "",
    starting_date: null,
    workflow_id: null, // New field
  });

  const [branch, setBranch] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleBranchChange = (branch: string) => {
    setBranch(branch);
    setFormData((prev) => ({ ...prev, branch: branch }));
  };
  const todayDate = new Date().toISOString().split("T")[0];

  // ---------------------------------------------
  // UPDATED useEffect: Fetch workflows on mount
  // ---------------------------------------------
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/approvals/ready-for-scheduling"
        );
        setApprovedWorkflows(response.data);
      } catch (error) {
        console.error("Error fetching approved workflows:", error);
        toast.error("Failed to load approved workflows for scheduling.");
      }
    };

    fetchWorkflows();

    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        schedule_due: selectedDate,
      }));
    }
  }, [selectedDate]);

  // ---------------------------------------------
  // UPDATED handleInputChange: Auto-set Title when workflow is selected
  // ---------------------------------------------
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

    // NEW LOGIC: When workflow_id is selected, find the object and set the title/ID
    if (name === "workflow_id" && value) {
      const selectedWorkflow = approvedWorkflows.find(
        (w) => w.id.toString() === value
      );
      if (selectedWorkflow) {
        setFormData((prev) => ({
          ...prev,
          title: selectedWorkflow.title, // Set title automatically
          workflow_id: Number(value),
        }));
      }
    }
  };

  // ---------------------------------------------
  // UPDATED handleSubmit: Use workflow metadata
  // ---------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedWorkflow = approvedWorkflows.find(
      (w) => w.id === formData.workflow_id
    );

    // Stop submission if no workflow is selected or found
    if (!selectedWorkflow) {
      toast.error("Please select an approved disbursement workflow.");
      setLoading(false);
      return;
    }

    try {
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

          // --- DYNAMIC VALUES FROM SELECTED WORKFLOW ---
          semester_code: selectedWorkflow.semester_code,
          sy_code: selectedWorkflow.sy_code,
          disbursement_type_id: selectedWorkflow.disbursement_type_id,
          workflow_id: formData.workflow_id, // Link schedule back to the workflow
          // --------------------------------------------

          description: formData.description,
        }
      );
      toast("Event created successfully");
      console.log("Form Data Submitted:", formData);
      console.log(response);
      fetchSchedules();

      onClose(false);
      // Reset form data for the next use
      setFormData({
        title: "",
        schedule_due: null,
        branch: "",
        description: "",
        starting_date: null,
        workflow_id: null,
      });
    } catch (error) {
      console.error("Error creating disbursement schedule:", error);
      toast.error("Failed to create disbursement schedule.");
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
            {/* Title field is now read-only or removed as it's set by workflow selection. 
                I'm keeping it but making it read-only for clarity. */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title (Set by Approved Workflow)
              </label>
              <input
                id="title"
                type="text"
                name="title"
                maxLength={25}
                value={formData.title}
                readOnly // Title is now automatically set
                placeholder="Select an Approved Workflow below..."
                className="w-full p-2 border border-gray-300 bg-gray-50 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="starting_date"
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
                    formData.schedule_due
                      ? formatDateForInput(new Date(formData.schedule_due))
                      : ""
                  }
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* NEW SECTION: Approved Disbursement Workflow Select (Replaces Semester/SY) */}
            {/* ------------------------------------------------------------- */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label
                  htmlFor="workflow_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Approved Disbursement Workflow
                </label>
                <select
                  id="workflow_id"
                  name="workflow_id"
                  value={formData.workflow_id || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="" disabled>
                    Select Approved Workflow
                  </option>
                  {approvedWorkflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.title} (SY: {workflow.sy_code} - Sem:{" "}
                      {workflow.semester_code})
                    </option>
                  ))}
                </select>
                {approvedWorkflows.length === 0 && !loading && (
                  <p className="text-sm text-red-500 mt-1">
                    No approved disbursements are ready for scheduling.
                  </p>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* UPDATED SECTION: Branch Dropdown (Disbursement Type is removed) */}
            {/* ------------------------------------------------------------- */}
            <div className="grid grid-cols-2 gap-3">
              <BranchDropdown
                formData={branch}
                handleInputChange={handleBranchChange}
              />
              {/* Empty div to preserve the 2-column layout */}
              <div className="flex-1"></div>
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
