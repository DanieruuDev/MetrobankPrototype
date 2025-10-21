import { X, AlertCircle } from "lucide-react";
import { useContext, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import Loading from "../../shared/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import WorkflowDetails from "./WorkflowDetails";
import { WorkflowFormData } from "../../../Interface/IWorkflow";
import AddApprover from "./AddApprover";
import WorkflowSummary from "./WorkflowSummary";
import axios from "axios";

interface CreateApproval2Props {
  setIsModal: (isOpen: boolean) => void;
  fetchWorkflows: (page: number) => void;
}

//!Notes: Try to change the approval request decription into a checkbox of data for type of reques
function CreateApproval({ setIsModal, fetchWorkflows }: CreateApproval2Props) {
  const [stepNum, setStepNum] = useState(1);
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [approversValid, setApproversValid] = useState(false);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [showValidation, setShowValidation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const loading = isCreating; // Alias for backward compatibility

  const isApproverValid = (): boolean => {
    if (!approversValid) {
      toast.error("Please fix approver errors before continuing.");
      return false;
    }
    return true;
  };
  console.log(userId);

  const [formData, setFormData] = useState<WorkflowFormData>({
    rq_title: "",
    requester_id: String(userId),
    description: "",
    file: null,
    approvers: [],
    due_date: "",
    semester_code: "",
    sy_code: "",
    rq_type_id: "",
    approval_req_type: "",
  });

  const steps = [
    { number: 1, label: "Workflow Details" },
    { number: 2, label: "Add Approvers" },
    { number: 3, label: "Review" },
  ];

  const isWorkflowInfoValid = (data: WorkflowFormData): boolean => {
    if (!data.rq_title.trim()) {
      toast.error("Request Title is required.");
      return false;
    }
    if (!data.approval_req_type) {
      toast.error("Approval Type is required.");
      return false;
    }
    if (!data.due_date) {
      toast.error("Due Date is required.");
      return false;
    }
    if (!data.sy_code) {
      toast.error("School Year is required.");
      return false;
    }
    if (!data.semester_code) {
      toast.error("Semester is required.");
      return false;
    }
    if (!data.description.trim()) {
      toast.error("Description is required.");
      return false;
    }
    if (!data.file) {
      toast.error("A valid file is required.");
      return false;
    }
    return true;
  };

  const clickNextButton = () => {
    if (stepNum !== 3) {
      if (stepNum === 1 && isWorkflowInfoValid(formData)) {
        setStepNum(2);
      } else if (stepNum === 2) {
        // Set showValidation to true to trigger validation display
        setShowValidation(true);
        // Trigger validation event for AddApprover component
        window.dispatchEvent(new Event("validation-attempt"));
        if (isApproverValid()) {
          setStepNum(3);
        }
      }
    }
  };

  const clickBackButton = () => {
    if (stepNum > 1) {
      setStepNum(stepNum - 1);
      setShowValidation(false);
    }
  };

  const PageShow = () => {
    if (stepNum === 1) {
      return <WorkflowDetails formData={formData} setFormData={setFormData} />;
    } else if (stepNum === 2 && isWorkflowInfoValid(formData) === true) {
      return (
        <AddApprover
          formData={formData}
          setFormData={setFormData}
          onValidateApprovers={(status) => setApproversValid(status.valid)}
          showValidation={showValidation} // Pass the showValidation prop
        />
      );
    } else {
      return <WorkflowSummary formData={formData} />;
    }
  };

  const handleShowConfirmation = () => {
    if (!formData.approvers || formData.approvers.length === 0) {
      toast.error("Please add at least one approver");
      return;
    }
    setShowConfirmation(true);
  };

  // In CreateApproval.tsx, update the handleSubmit function:
  const handleSubmit = async () => {
    setShowConfirmation(false);
    console.log(formData.semester_code, formData.sy_code);
    setError(null);
    setIsCreating(true);
    setProgress(0);

    // Start progress animation (like RenewalListV2)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95; // Stop at 95% until operation completes
        }
        return prev + 1;
      });
    }, 30); // Update every 30ms for smooth animation

    const sendData = new FormData();
    sendData.append("rq_title", formData.rq_title);
    sendData.append("requester_id", formData.requester_id);
    sendData.append("approval_req_type", formData.approval_req_type);
    sendData.append("rq_type_id", formData.rq_type_id);
    sendData.append("description", formData.description);
    sendData.append("due_date", formData.due_date);
    sendData.append("sy_code", formData.sy_code);
    sendData.append("semester_code", formData.semester_code);

    if (formData.file instanceof File) {
      sendData.append("file", formData.file);
    }

    sendData.append(
      "approvers",
      JSON.stringify(
        formData.approvers.map((approver, index) => ({
          ...approver,
          order: index + 1,
        }))
      )
    );

    try {
      const res = await axios.post(
        `${VITE_BACKEND_URL}api/workflow/create-workflow`,
        sendData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Complete the progress
      setProgress(100);

      toast.success("Approval request created successfully!");

      // Wait longer to show 100% completion
      setTimeout(() => {
        fetchWorkflows(1);
        setIsModal(false);
      }, 1500);

      console.log("Response:", res.data);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error details:", error);

      if (axios.isAxiosError(error)) {
        console.error("Response data:", error.response?.data);
        console.error("Response status:", error.response?.status);

        if (error.response?.data?.errors) {
          // Handle validation errors from backend
          const errors = error.response.data.errors;
          Object.keys(errors).forEach((key) => {
            toast.error(`${key}: ${errors[key]}`);
          });
        } else {
          toast.error(
            error.response?.data?.message || "Failed to create workflow"
          );
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsCreating(false);
      setProgress(0);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="fixed border inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50 ">
        <div
          className={`relative bg-white rounded-lg p-5 shadow-lg max-w-xl w-full max-h-[95vh] overflow-y-auto`}
        >
          {/* Show loading spinner inside modal */}
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-lg">
              <Loading />
              <p className="mt-2 text-gray-600 text-sm font-medium">
                Processing...
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-center mt-2">{error}</p>}

          <div className="flex justify-end">
            <button
              className="text-gray-500 hover:text-gray-800 cursor-pointer"
              onClick={() => setIsModal(false)}
              disabled={loading}
            >
              <X />
            </button>
          </div>

          <div className="mt-2 max-w-[500px] mx-auto">
            <div className="flex justify-between items-center text-[14px]">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center gap-2">
                  <div
                    className={`${
                      step.number <= stepNum ? "bg-[#2563EB]" : "bg-[#E5E7EB]"
                    } rounded-[25px] w-[25px] h-[25px] flex items-center justify-center  ${
                      step.number <= stepNum ? "text-white" : "text-[#6B6B6B]"
                    } `}
                  >
                    {step.number}
                  </div>
                  <div
                    className={`${
                      step.number <= stepNum
                        ? "text-[#2563EB]"
                        : "text-[#6B6B6B]"
                    }`}
                  >
                    {step.label}
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight size={25} className="ml-2 text-[#a1a1a1]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7">{PageShow()}</div>
          {
            // WOKRFLOW INFO
            // APPROVER
            // REVIEW
          }

          <div className="flex justify-end gap-2 mt-5">
            {stepNum > 1 ? (
              <button
                className="p-2 bg-[#E5E5E5] rounded-sm cursor-pointer"
                onClick={clickBackButton}
              >
                Back
              </button>
            ) : (
              <button
                className="p-2 bg-[#E5E5E5] rounded-sm cursor-pointer"
                onClick={() => setIsModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
            )}

            {stepNum === 3 ? (
              <button
                className="p-2 bg-[#2563EB] rounded-sm text-white cursor-pointer disabled:opacity-50"
                onClick={handleShowConfirmation}
                disabled={loading || isCreating}
              >
                Create Workflow
              </button>
            ) : (
              <button
                className="p-2 bg-[#2563EB] rounded-sm text-white cursor-pointer"
                onClick={clickNextButton}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && !isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Workflow Creation
              </h3>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-gray-600 text-sm">
                You are about to create a new approval workflow:
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="text-gray-900 font-semibold truncate ml-2">
                    {formData.rq_title}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="text-gray-900 font-semibold">
                    {formData.approval_req_type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Approvers:</span>
                  <span className="text-gray-900 font-semibold">
                    {formData.approvers.length} approver(s)
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Due Date:</span>
                  <span className="text-gray-900 font-semibold">
                    {new Date(formData.due_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                This will start the approval process and send notifications to
                all approvers. Do you want to proceed?
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Yes, Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Loading Overlay with Circular Progress */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-scaleIn">
            <div className="flex flex-col items-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-32 h-32 mb-6">
                {/* Animated Background Circle */}
                <svg
                  className="w-32 h-32 transform -rotate-90 animate-pulse"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                    className="animate-pulse"
                  />
                  {/* Progress Circle with Animation */}
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 50 * (1 - progress / 100)
                    }`}
                    className="transition-all duration-300 ease-out animate-pulse"
                  />
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Percentage Text Inside Circle with Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center animate-bounce">
                    <div className="text-3xl font-bold text-green-600 animate-pulse">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1 animate-pulse">
                      Complete
                    </div>
                  </div>
                </div>

                {/* Rotating Ring Animation */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-300 animate-spin opacity-30"></div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Creating Approval
              </h3>
              <p className="text-gray-600 text-sm text-center mb-4">
                Sending data to server...
              </p>

              <p className="text-xs text-gray-500 text-center">
                Please do not close this window
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateApproval;
