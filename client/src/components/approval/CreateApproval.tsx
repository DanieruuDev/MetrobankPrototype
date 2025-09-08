import { X } from "lucide-react";
import { useContext, useState } from "react";
import { ChevronRight } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import Loading from "../../components/shared/Loading"; // Adjust path as needed
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import WorkflowDetails from "./WorkflowDetails";
import { WorkflowFormData } from "../../Interface/IWorkflow";
import AddApprover from "./AddApprover";
import WorkflowSummary from "./WorkflowSummary";
import axios from "axios";

interface CreateApproval2Props {
  setIsModal: (isOpen: boolean) => void;
  fetchWorkflows: (page: number) => void;
}

//!Notes: Try to change the approval request decription into a checkbox of data for type of reques
function CreateApproval({ setIsModal, fetchWorkflows }: CreateApproval2Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepNum, setStepNum] = useState(1);
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [approversValid, setApproversValid] = useState(false);

  const [showValidation, setShowValidation] = useState(false);

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
    approval_req_type: "",
    request_type_ids: [],
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

  // In CreateApproval.tsx, update the handleSubmit function:
  const handleSubmit = async () => {
    if (!formData.approvers || formData.approvers.length === 0) {
      toast.error("Please add at least one approver");
      return;
    }

    console.log(formData.semester_code, formData.sy_code);
    setError(null);
    setLoading(true);

    console.log("Complete Form Data:", {
      ...formData,
      approvers: formData.approvers,
      file: formData.file ? formData.file.name : "No file",
    });

    const sendData = new FormData();
    sendData.append("rq_title", formData.rq_title);
    sendData.append("requester_id", formData.requester_id);
    sendData.append("approval_req_type", formData.approval_req_type);
    sendData.append("description", formData.description);
    sendData.append("due_date", formData.due_date);
    sendData.append("sy_code", formData.sy_code);
    sendData.append("semester_code", formData.semester_code);

    if (formData.file) {
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
        "http://localhost:5000/api/workflow/create-workflow",
        sendData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      fetchWorkflows(1);
      setIsModal(false);
      toast.success("Approval request created successfully!");
      console.log("Response:", res.data);
    } catch (error) {
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
      setLoading(false);
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
            <div className="flex justify-center mb-4">
              <Loading />
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
                className="p-2 bg-[#2563EB] rounded-sm text-white cursor-pointer"
                onClick={handleSubmit}
                disabled={loading}
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
    </>
  );
}

export default CreateApproval;
