"use client";

import { X, ChevronRight } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import Loading from "../../shared/Loading";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import WorkflowDetails from "./WorkflowDetails";
import type {
  WFApprover,
  WorkflowFormData,
} from "../../../Interface/IWorkflow";
import AddApprover from "./AddApprover";
import WorkflowSummary from "./WorkflowSummary";
import axios from "axios";

export interface Approver {
  approver_id: number;
  role: string;
  user_id: number;
  user_email: string;
  due_date: string; // ISO date string (e.g., "2025-09-27")
  status: string;
  is_current: boolean;
  is_reassigned: boolean;
  assigned_at: string; // ISO datetime string
}

export interface Workflow {
  workflow_id: number;
  request_title: string;
  request_type: string;
  due_date: string; // ISO datetime string (e.g., "2025-09-29T16:00:00.000Z")
  school_year: number;
  semester: number;
  doc_id: number;
  doc_name: string;
  doc_type: string;
  doc_path: string;
  doc_size: number;
  doc_uploaded_at: string; // ISO datetime string
  additional_details: string;
  approvers: Approver[];
}

interface EditApprovalProps {
  editApproval: (workflow_id: number | null) => void;
  fetchWorkflows: (page: number) => void;
  workflowId: number | null;
}

interface ApproverValidationStatus {
  valid: boolean;
  errors: {
    hasInvalidEmail: boolean;
    hasDuplicate: boolean;
    hasEmptyFields: boolean;
    hasInvalidDueDate?: boolean; // Made optional to match AddApprover
  };
}

function EditApproval({
  editApproval,
  fetchWorkflows,
  workflowId,
}: EditApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepNum, setStepNum] = useState(1);
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [approversValidationStatus, setApproversValidationStatus] =
    useState<ApproverValidationStatus>({
      valid: false,
      errors: {
        hasInvalidEmail: false,
        hasDuplicate: false,
        hasEmptyFields: false,
        hasInvalidDueDate: false,
      },
    });
  const [showValidation, setShowValidation] = useState(false);
  const [originalData, setOriginalData] = useState<WorkflowFormData | null>(
    null
  );

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
    rq_type_id: "",
  });

  useEffect(() => {
    const fetchWorkflowData = async () => {
      if (workflowId === null) {
        return;
      }

      setFetchingData(true);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/workflow/get-edit-workflow/${workflowId}`
        );
        const workflowData = response.data[0];
        const mappedData: WorkflowFormData = {
          rq_title: workflowData.rq_title || "",
          requester_id: String(userId),
          description: workflowData.description || "",
          file: workflowData.doc_id
            ? {
                doc_id: workflowData.doc_id,
                doc_name: workflowData.doc_name,
                doc_path: workflowData.doc_path,
              }
            : null, // File will need to be re-uploaded if changed
          approvers:
            workflowData.approvers?.map((approver: WFApprover) => ({
              email: approver.email,
              role: approver.role,
              order: approver.order,
              date: approver.date, // Handle both date field names
            })) || [],
          due_date: workflowData.due_date
            ? new Date(workflowData.due_date).toISOString().slice(0, 10)
            : "",
          semester_code: workflowData.semester_code || "",
          sy_code: workflowData.sy_code || "",
          approval_req_type: workflowData.request_type || "",
          rq_type_id: workflowData.rq_type_id || "",
        };
        setFormData(mappedData);
        setOriginalData(mappedData);
      } catch (error) {
        console.error("Error fetching workflow data:", error);
        toast.error("Failed to load workflow data");
      } finally {
        setFetchingData(false);
      }
    };

    fetchWorkflowData();
  }, [workflowId]);

  const steps = [
    { number: 1, label: "Workflow Details" },
    { number: 2, label: "Edit Approvers" },
    { number: 3, label: "Review Changes" },
  ];

  const isApproverValid = (): boolean => {
    if (!approversValidationStatus.valid) {
      if (approversValidationStatus.errors.hasInvalidEmail) {
        toast.error("Please fix invalid email addresses.");
      }
      if (approversValidationStatus.errors.hasDuplicate) {
        toast.error("Please remove duplicate email addresses.");
      }
      if (approversValidationStatus.errors.hasEmptyFields) {
        toast.error("Please fill in all approver fields.");
      }
      if (approversValidationStatus.errors.hasInvalidDueDate) {
        toast.error("Please fix invalid due dates.");
      }
      return false;
    }
    return true;
  };

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
    return true;
  };

  const clickNextButton = () => {
    if (stepNum !== 3) {
      if (stepNum === 1 && isWorkflowInfoValid(formData)) {
        setStepNum(2);
      } else if (stepNum === 2) {
        setShowValidation(true);
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
          onValidateApprovers={setApproversValidationStatus}
          showValidation={showValidation}
        />
      );
    } else {
      return <WorkflowSummary formData={formData} />;
    }
  };

  const handleUpdate = async () => {
    if (!formData.approvers || formData.approvers.length === 0) {
      toast.error("Please add at least one approver");
      return;
    }

    setError(null);
    setLoading(true);

    const sendData = new FormData();

    // Always send requester_id so backend can validate
    sendData.append("requester_id", String(formData.requester_id));

    (Object.keys(formData) as (keyof WorkflowFormData)[]).forEach((key) => {
      if (!originalData) return;

      const currentValue = formData[key];
      const originalValue = originalData[key];

      // Skip requester_id because we already sent it
      if (key === "requester_id") return;

      // --- skip nulls ---
      if (currentValue == null) return;

      // --- handle file ---
      if (key === "file") {
        if (currentValue instanceof File) {
          sendData.append("file", currentValue);
        }
        return;
      }

      // --- handle approvers ---
      if (key === "approvers") {
        if (Array.isArray(currentValue) && Array.isArray(originalValue)) {
          // Deep compare approvers without order reassignment
          const approversChanged =
            JSON.stringify(
              originalValue.map((a: WFApprover) => ({
                email: a.email,
                role: a.role,
                date: a.date,
              }))
            ) !==
            JSON.stringify(
              currentValue.map((a: WFApprover) => ({
                email: a.email,
                role: a.role,
                date: a.date,
              }))
            );

          if (approversChanged) {
            // Assign order only when sending
            sendData.append(
              "approvers",
              JSON.stringify(
                currentValue.map((approver, index) => ({
                  ...approver,
                  order: index + 1,
                }))
              )
            );
          }
        }
        return;
      }

      // --- handle primitive fields ---
      if (currentValue !== originalValue) {
        sendData.append(key, String(currentValue));
      }
    });

    if ([...sendData.keys()].length === 0) {
      toast.info("No changes to update");
      setLoading(false);
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/workflow/edit-workflow/${workflowId}`,
        sendData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      fetchWorkflows(1);
      editApproval(null);
      toast.success("Workflow updated successfully!");
    } catch (error) {
      toast.error("Failed to update workflow");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  console.log(formData);
  if (fetchingData) {
    return (
      <div className="fixed border inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
        <div className="relative bg-white rounded-lg p-8 shadow-lg">
          <div className="flex justify-center items-center">
            <Loading />
            <span className="ml-3 text-gray-600">Loading workflow data...</span>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="fixed border inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
        <div className="relative bg-white rounded-lg p-5 shadow-lg max-w-xl w-full max-h-[95vh] overflow-y-auto">
          {loading && (
            <div className="flex justify-center mb-4">
              <Loading />
            </div>
          )}

          {error && <p className="text-red-500 text-center mt-2">{error}</p>}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Edit Workflow #{workflowId}
            </h2>
            <button
              className="text-gray-500 hover:text-gray-800 cursor-pointer"
              onClick={() => editApproval(null)}
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
                    } rounded-[25px] w-[25px] h-[25px] flex items-center justify-center ${
                      step.number <= stepNum ? "text-white" : "text-[#6B6B6B]"
                    }`}
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

          <div className="flex justify-end gap-2 mt-5">
            {stepNum > 1 ? (
              <button
                className="p-2 bg-[#E5E5E5] rounded-sm cursor-pointer hover:bg-[#D1D5DB] transition-colors"
                onClick={clickBackButton}
                disabled={loading}
              >
                Back
              </button>
            ) : (
              <button
                className="p-2 bg-[#E5E5E5] rounded-sm cursor-pointer hover:bg-[#D1D5DB] transition-colors"
                onClick={() => editApproval(null)}
                disabled={loading}
              >
                Cancel
              </button>
            )}

            {stepNum === 3 ? (
              <button
                className="p-2 bg-[#2563EB] rounded-sm text-white cursor-pointer hover:bg-[#1D4ED8] transition-colors disabled:opacity-50"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Workflow"}
              </button>
            ) : (
              <button
                className="p-2 bg-[#2563EB] rounded-sm text-white cursor-pointer hover:bg-[#1D4ED8] transition-colors"
                onClick={clickNextButton}
                disabled={loading}
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

export default EditApproval;
