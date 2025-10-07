import { useState, useEffect } from "react";
import axios from "axios";
import {
  DetailedWorkflow,
  Approver,
  WorkflowLog,
  RequesterResponse,
  ReturnFeedback,
} from "../../../Interface/IWorkflow";

import {
  Download,
  FileText,
  X,
  Check,
  ArrowLeft,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";
import { formatFileSize } from "../../../utils/SizeFileFormat";
import { useAuth } from "../../../context/AuthContext";
import ChangeApproverModal from "../../../components/approval/my-approval/ChangeApproverModal";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import { useSidebar } from "../../../context/SidebarContext";
import Sidebar from "../../../components/shared/Sidebar";
import Loading from "../../../components/shared/Loading";

function Approval() {
  const { workflow_id } = useParams();
  const auth = useAuth();
  const userId = auth?.user?.user_id;
  const token = auth;
  const navigate = useNavigate();
  const [detailedWorkflow, setDetailedWorkflow] = useState<
    DetailedWorkflow | undefined
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [isResponseLoading, setIsResponseLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(
    null
  );
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const { collapsed } = useSidebar();
  const [newApprover, setNewApprover] = useState("");
  const [reason, setReason] = useState("");

  const [returnedResponseFile, setReturnedResponseFile] = useState<File | null>(
    null
  );
  const [returnedResponseComment, setReturnedResponseComment] = useState("");

  // Use approver_id for expanded state (instead of approver_order)
  const [expandedApproverId, setExpandedApproverId] = useState<number | null>(
    null
  );
  const fetchWorkflow = async (requester_id: number, workflow_id: number) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/workflow/get-workflow/${requester_id}/${workflow_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
      setDetailedWorkflow(response.data);
    } catch (error) {
      console.error("Error fetching workflow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow(Number(userId), Number(workflow_id));
  }, [workflow_id]);

  const workflow =
    Array.isArray(detailedWorkflow) && detailedWorkflow.length > 0
      ? detailedWorkflow[0]
      : detailedWorkflow;

  useEffect(() => {
    if (detailedWorkflow) {
      setIsLoading(false);
    }
  }, [detailedWorkflow]);

  useEffect(() => {
    if (detailedWorkflow?.approvers) {
      const returnedApprover = detailedWorkflow.approvers.find(
        (approver) => approver.approver_status === "Returned"
      );
      if (returnedApprover && returnedApprover.return_feedback.length > 0) {
        console.log(
          returnedApprover && returnedApprover.return_feedback.length > 0
        );
        setExpandedApproverId(returnedApprover.approver_id);
      }
    }
  }, [detailedWorkflow]);

  const handleBack = () => {
    navigate(-1);
  };

  const openModal = (approver: Approver) => {
    setSelectedApprover(approver);
    setShowModal(true);
  };

  const handleChangeApprover = async () => {
    if (!selectedApprover || !newApprover || !reason || !workflow) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const API_BASE_URL = "http://localhost:5000";

      const response = await axios.put(
        `${API_BASE_URL}/api/workflow/change-approval/${userId}`,
        {
          workflow_id: workflow.workflow_id,
          old_approver_id: selectedApprover.approver_id,
          new_approver_id: newApprover,
          reason,
        }
      );

      fetchWorkflow(workflow.requester_id, workflow.workflow_id);
      alert(response.data.message || "Approver changed successfully.");
      window.location.reload();

      if (response.status === 200) {
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error changing approver:", error);
      alert(error || "Failed to change approver.");
    }
  };
  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "text-green-700";
      case "Pending":
        return "text-yellow-700";
      case "Reject":
        return "text-red-700";
      case "Returned":
        return "text-red-700"; // Changed from orange to red to match reject styling
      default:
        return "text-gray-600";
    }
  };

  // Toggle expansion by approver_id
  const toggleStepExpansion = (approverId: number) => {
    const approver = detailedWorkflow?.approvers?.find(
      (a) => a.approver_id === approverId
    );
    const isReturned = approver?.approver_status === "Returned";

    if (expandedApproverId === approverId) {
      if (!isReturned) {
        setExpandedApproverId(null);
      }
    } else {
      setExpandedApproverId(approverId);
    }
  };

  const handleDownload = () => {
    if (!workflow?.doc_path) {
      console.error("No file to download");
      return;
    }

    const filePath = encodeURIComponent(workflow.doc_name); // encode special chars
    const link = document.createElement("a");
    link.href = `${VITE_BACKEND_URL}api/workflow/download/${filePath}`;
    link.setAttribute("download", workflow.doc_name); // filename for browser
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReturendResponse = async (
    return_id: number,
    response_id: number
  ) => {
    setIsResponseLoading(true);
    if (!returnedResponseComment || !workflow) {
      toast.warn("⚠️ Please provide a comment for your response.");
      return;
    }

    try {
      await axios.post(
        `${VITE_BACKEND_URL}api/workflow/requester-response`,
        {
          return_id,
          comment: returnedResponseComment,
          requester_id: userId,
          file: returnedResponseFile,
          workflow_id: workflow.workflow_id,
          response_id,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("✅ Response submitted successfully!");
      fetchWorkflow(Number(userId), workflow.workflow_id);
    } catch (error) {
      console.log(error);
      toast.error(`❌ Failed to submit response: ${error}`);
    } finally {
      setIsResponseLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
        } transition-all duration-300 min-h-screen`}
      >
        <Navbar pageName="Approvals" />
        <Sidebar />
        <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <Loading />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div
        className={`${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
        } transition-all duration-300 min-h-screen`}
      >
        <Navbar pageName="Approvals" />
        <Sidebar />
        <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-red-500 text-lg">
              No workflow data available.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sort approvers by order
  const sortedApprovers = [...workflow.approvers].sort(
    (a, b) => a.approver_order - b.approver_order
  );

  const calculateCompletionPercentage = () => {
    const validApprovers = sortedApprovers.filter(
      (a) => a.approver_status !== "Replaced"
    );

    const totalSteps = validApprovers.length;
    if (totalSteps === 0) return 0;

    const completedSteps = validApprovers.filter(
      (approver) => approver.approver_status === "Completed"
    ).length;

    return (completedSteps / totalSteps) * 100;
  };

  return (
    <div
      className={`${
        collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
      } transition-all duration-300  min-h-screen`}
    >
      <Navbar pageName="Approvals" />

      <Sidebar />
      <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Header Card */}
        <div className="mb-4 mt-4 sm:mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-1  py-2 text-xs sm:text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center mb-4 sm:mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>

                  <span className="xs:hidden">Progress</span>
                </h2>

                {/* Progress Bar - Fixed width constraints to prevent layout shift */}
                <div className="mb-6 sm:mb-8 ml-6 sm:ml-10">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div className="min-w-0">
                        {workflow.status === "Failed" ? (
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200 whitespace-nowrap">
                            Failed
                          </span>
                        ) : (
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 whitespace-nowrap">
                            {Math.round(calculateCompletionPercentage())}%
                            <span className="hidden xs:inline"> Complete</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden h-1.5 sm:h-2 mb-3 sm:mb-4 text-xs flex rounded bg-gray-200 w-full">
                      <div
                        style={{
                          width:
                            workflow.status === "Failed"
                              ? "100%"
                              : `${calculateCompletionPercentage()}%`,
                        }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ease-out
        ${workflow.status === "Failed" ? "bg-red-500" : "bg-blue-500"}`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical line - Fixed positioning to prevent layout shifts */}
                  <div
                    className="absolute left-5 top-0 w-0.5 bg-gray-200 transition-all duration-300"
                    style={{
                      height:
                        sortedApprovers.filter(
                          (a) => a.approver_status !== "Replaced"
                        ).length > 0
                          ? "calc(100% - 2.5rem)"
                          : "0",
                    }}
                  ></div>

                  <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                    {/* Started */}
                    <div className="relative pl-6 sm:pl-8 lg:pl-10">
                      <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-green-500/80 backdrop-blur-sm border-2 sm:border-4 border-white/50 shadow-lg">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-600" />
                      </div>
                      <div className="min-h-[50px] sm:min-h-[60px] lg:min-h-[80px]">
                        <div className="bg-green-500/10 backdrop-blur-sm p-2 sm:p-3 lg:p-4 rounded-lg border border-green-400/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900">
                                Started
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(workflow?.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Approval Steps */}
                    {sortedApprovers.map((approver) => {
                      const isApproved = approver.response === "Approved";
                      const isRejected = approver.response === "Reject";

                      const isCurrent = approver.is_current;

                      const displayStatus = isCurrent
                        ? "Current"
                        : approver.approver_status;

                      const isPending = displayStatus === "Pending";

                      return (
                        <div
                          key={approver.approver_id}
                          className="relative pl-10"
                        >
                          {/* Step indicator */}
                          <div
                            className={`absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white transition-all duration-300 ${
                              isApproved
                                ? "bg-green-500"
                                : isCurrent
                                ? "bg-blue-500 animate-pulse"
                                : isPending
                                ? "bg-yellow-400"
                                : isRejected
                                ? "bg-red-500"
                                : ""
                            }`}
                          >
                            {isApproved ? (
                              <Check className="w-5 h-5 text-white" />
                            ) : isRejected ? (
                              <X className="w-5 h-5 text-white" />
                            ) : (
                              <span className="text-white font-medium">
                                {approver.approver_order}
                              </span>
                            )}
                          </div>

                          {/* Step content - Added consistent min-height and width constraints */}
                          <div className="min-h-[80px] transition-all duration-300 ease-in-out">
                            <div
                              className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 w-full ${
                                expandedApproverId === approver.approver_id
                                  ? isApproved
                                    ? "bg-green-50 border-green-100"
                                    : isCurrent
                                    ? "bg-blue-50 border-blue-100"
                                    : isPending
                                    ? "bg-yellow-50 border-yellow-100"
                                    : isRejected
                                    ? "bg-red-50 border-red-100"
                                    : "bg-gray-50 border-gray-100"
                                  : isApproved
                                  ? "bg-green-50 border-green-100"
                                  : isCurrent
                                  ? "bg-blue-50 border-blue-100"
                                  : isPending
                                  ? "bg-yellow-50 border-yellow-100"
                                  : isRejected
                                  ? "bg-red-50 border-red-100"
                                  : "bg-gray-50 border-gray-100"
                              }`}
                              onClick={() =>
                                toggleStepExpansion(approver.approver_id)
                              }
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1 min-w-0 mr-4">
                                  {/* Approver info - Added proper text truncation */}
                                  <div className="mb-2 flex items-start flex-wrap gap-2">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-medium text-gray-900 text-sm truncate">
                                        {approver.approver_name}
                                      </h3>
                                      <p className="text-xs text-gray-500 truncate">
                                        {approver.approver_email}
                                      </p>
                                    </div>
                                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                      {approver.approver_role || "Approver"}
                                    </span>
                                  </div>

                                  {/* Status chip */}
                                  <div className="flex items-center">
                                    <div
                                      className={`flex items-center px-2 py-0.5 rounded-full ${
                                        isApproved
                                          ? "bg-green-100"
                                          : isCurrent
                                          ? "bg-blue-100"
                                          : isPending
                                          ? "bg-yellow-100"
                                          : isRejected
                                          ? "bg-red-100"
                                          : "bg-gray-100"
                                      }`}
                                    >
                                      <span
                                        className={`text-sm font-medium whitespace-nowrap ${getStatusTextColor(
                                          displayStatus === "Completed" &&
                                            approver.response === "Reject"
                                            ? "Reject"
                                            : displayStatus
                                        )}`}
                                      >
                                        {displayStatus === "Completed" &&
                                        approver.response
                                          ? approver.response
                                          : displayStatus}
                                      </span>
                                    </div>
                                    <div className="text-[14px] ml-2">
                                      Due Date: {approver.approver_due_date}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center flex-shrink-0">
                                  <div className="px-2 py-1 rounded-lg mr-2">
                                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                      Step {approver.approver_order}
                                    </span>
                                  </div>
                                  {expandedApproverId ===
                                  approver.approver_id ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Return Feedback Section - Always present but conditionally visible */}
                            {(isRejected ||
                              approver.return_feedback.length > 0) && (
                              <div
                                className={`bg-red-50 p-4 rounded-lg border border-red-200 mt-2 transition-all duration-200 ${
                                  expandedApproverId === approver.approver_id ||
                                  approver.response === "Reject"
                                    ? "block"
                                    : "hidden"
                                }`}
                              >
                                <h4 className="text-sm font-medium text-red-800 mb-4 flex items-center">
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Return Feedback
                                </h4>

                                {approver.return_feedback.length === 0 &&
                                  isRejected && (
                                    <div className="text-sm text-red-700 italic">
                                      This step was rejected but no specific
                                      feedback was provided.
                                    </div>
                                  )}

                                {/* Return Feedback Items */}
                                {approver.return_feedback.map(
                                  (feedback: ReturnFeedback) => (
                                    <div
                                      key={feedback.return_id}
                                      className="mb-4 last:mb-0"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <p className="text-xs text-red-600 font-medium">
                                            Returned by{" "}
                                            {feedback.created_by_name} (
                                            {feedback.created_by_email}){" "}
                                            {feedback.requester_take_action ? (
                                              <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs ml-2">
                                                Resolved
                                              </span>
                                            ) : (
                                              <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs ml-2">
                                                Action Required
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                        <p className="text-xs text-red-600">
                                          {formatDate(feedback.created_at)}
                                        </p>
                                      </div>
                                      <p className="text-sm text-red-800 bg-red-50 p-3 rounded">
                                        {feedback.reason}
                                      </p>

                                      {/* Previous Responses */}
                                      {feedback.requester_responses &&
                                        feedback.requester_responses.length >
                                          0 && (
                                          <div className="mb-4">
                                            <p className="text-xs font-medium text-gray-600 mb-2">
                                              Previous Responses:
                                            </p>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                              {feedback.requester_responses.map(
                                                (
                                                  response: RequesterResponse
                                                ) => (
                                                  <div
                                                    key={
                                                      response.req_response_id
                                                    }
                                                    className="bg-gray-50 p-2 rounded text-sm"
                                                  >
                                                    <p className="text-gray-700">
                                                      {response.message}
                                                    </p>
                                                    {response.file_name && (
                                                      <p className="text-xs text-gray-500 mt-1">
                                                        📎 {response.file_name}
                                                      </p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                      {formatDate(
                                                        response.responded_at
                                                      )}
                                                    </p>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      {/* Response Form */}
                                      {feedback.requester_take_action ===
                                      false ? (
                                        <div className="space-y-3">
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Your Response
                                            </label>
                                            <textarea
                                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                              placeholder="Explain how you've addressed the concerns..."
                                              rows={3}
                                              value={returnedResponseComment}
                                              onChange={(e) =>
                                                setReturnedResponseComment(
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </div>

                                          {/* File Upload */}
                                          <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                              Supporting Document (Optional)
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center hover:border-red-400 transition-colors">
                                              <input
                                                type="file"
                                                id={`file-${feedback.return_id}`}
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file =
                                                    e.target.files?.[0];
                                                  if (file) {
                                                    setReturnedResponseFile(
                                                      file
                                                    );
                                                  }
                                                }}
                                              />
                                              <label
                                                htmlFor={`file-${feedback.return_id}`}
                                                className="cursor-pointer"
                                              >
                                                <div className="flex flex-col items-center">
                                                  <svg
                                                    className="w-6 h-6 text-gray-400 mb-1"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                    />
                                                  </svg>
                                                  <span className="text-xs text-gray-600">
                                                    {returnedResponseFile
                                                      ? returnedResponseFile.name
                                                      : "Click to upload"}
                                                  </span>
                                                </div>
                                              </label>
                                            </div>
                                            {returnedResponseFile && (
                                              <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                                                <span className="text-xs text-gray-700">
                                                  {returnedResponseFile.name}
                                                </span>
                                                <button
                                                  onClick={() =>
                                                    setReturnedResponseFile(
                                                      null
                                                    )
                                                  }
                                                  className="text-red-500 hover:text-red-700"
                                                >
                                                  <X size={14} />
                                                </button>
                                              </div>
                                            )}
                                          </div>

                                          <button
                                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                                            disabled={isResponseLoading}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReturendResponse(
                                                feedback.return_id,
                                                approver.response_id
                                              );
                                            }}
                                          >
                                            {!isResponseLoading ? (
                                              <>
                                                <svg
                                                  className="w-4 h-4 mr-2"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                  />
                                                </svg>
                                                Submit Response
                                              </>
                                            ) : (
                                              "Submitting..."
                                            )}
                                          </button>
                                        </div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            {expandedApproverId === approver.approver_id && (
                              <div className="mt-3 space-y-3 pl-4 animate-in slide-in-from-top-2 duration-300">
                                {/* Response details only */}
                                {approver.response !== "Pending" && (
                                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Approval Details
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {approver.response_time && (
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Responded
                                          </p>
                                          <p className="font-medium text-gray-700 text-sm">
                                            {formatDate(approver.response_time)}
                                          </p>
                                        </div>
                                      )}
                                      {approver.comment && (
                                        <div className="sm:col-span-2">
                                          <p className="text-xs text-gray-500">
                                            Comment
                                          </p>
                                          <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded break-words">
                                            {approver.comment}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Change approver button */}
                                {approver.approver_status !== "Completed" &&
                                  approver.response !== "Reject" &&
                                  approver.response !== "Returned" &&
                                  approver.approver_status !== "Canceled" && (
                                    <button
                                      className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center border border-red-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openModal(approver);
                                      }}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 mr-2"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Change Approver
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Ended - Consistent sizing with Started */}
                    <div className="relative pl-6 sm:pl-8 lg:pl-10">
                      <div
                        className={`absolute left-0 top-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2 sm:border-4 border-white/50 backdrop-blur-sm shadow-lg transition-all duration-300 ${
                          sortedApprovers
                            .filter((a) => a.approver_status !== "Replaced")
                            .every((a) => a.approver_status === "Completed")
                            ? "bg-green-500/80"
                            : "bg-gray-400/80"
                        }`}
                      >
                        <span className="text-white font-medium text-xs sm:text-sm lg:text-base">
                          E
                        </span>
                      </div>
                      <div className="min-h-[50px] sm:min-h-[60px] lg:min-h-[80px]">
                        <div
                          className={`p-2 sm:p-3 lg:p-4 rounded-lg border backdrop-blur-sm ${
                            sortedApprovers.every(
                              (a) => a.approver_status === "Completed"
                            )
                              ? "bg-green-500/10 border-green-400/30"
                              : "bg-gray-500/10 border-gray-400/30"
                          }`}
                        >
                          <h3 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900">
                            Ended
                          </h3>
                          {sortedApprovers.every(
                            (a) => a.approver_status === "Completed"
                          ) && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed on {formatDate(workflow?.updated_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-2 min-w-0">
            <div className="">
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-blue-500/10 backdrop-blur-sm px-6 py-4 border-b rounded-t-2xl border-white/30">
                  <h2 className="text-base font-semibold text-gray-800 flex items-center">
                    <Info className="w-5 h-5 text-blue-600 mr-3" />
                    Details
                  </h2>
                </div>

                {/* Request Title */}
                <div className="px-6 py-4 bg-blue-200/10 backdrop-blur-sm border-b border-white/30">
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Workflow Title
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {workflow?.request_title}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          workflow?.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : workflow?.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : workflow?.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : workflow?.status === "Failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {workflow?.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Requester
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 truncate">
                          {workflow?.requester_email}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Workflow ID
                      </p>
                      <p className="text-sm text-gray-900 truncate">
                        {workflow?.workflow_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2  divide-y md:divide-y-0 md:divide-x divide-white/30 bg-blue-200/10 border-t-4 border-white">
                  {/* Column 1 */}
                  <div className="p-6 space-y-4">
                    {/* Empty column - can be used for additional info if needed */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Due Date
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(workflow?.due_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase">
                        Request Type
                      </p>
                      <p className="text-sm text-gray-900">
                        {workflow?.approval_req_type}
                      </p>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase">
                        Semester
                      </p>
                      <p className="text-sm text-gray-900">
                        {workflow?.semester}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase">
                        School Year
                      </p>
                      <p className="text-sm text-gray-900">
                        {workflow?.school_year}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="px-6 py-4 bg-blue-200/10 backdrop-blur-sm border-t-3 border-white">
                  <p className="text-xs font-medium uppercase text-gray-500 mb-2">
                    Description
                  </p>
                  <p className="text-sm">{workflow?.rq_description}</p>
                </div>

                {/* Attachments */}
                <div className="px-6 py-4 border-t-3 bg-blue-200/10 border-white">
                  <p className="text-xs uppercase  font-medium text-gray-500 mb-3">
                    Attachments
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-900">
                        {workflow?.doc_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(workflow?.doc_size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition duration-200 border border-blue-500/30 shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-200/10 backdrop-blur-md  shadow-lg p-3 sm:p-4 rounded-xl">
              <p className="ml-1 uppercase text-xs mb-2 text-gray-500 font-medium">
                Activity
              </p>
              <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {workflow?.logs?.map((log: WorkflowLog) => (
                  <div
                    key={log.log_id}
                    className="flex items-start gap-2 sm:gap-3 border-b border-white/20 pb-2 sm:pb-3 last:border-0"
                  >
                    {/* Avatar Circle */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs sm:text-sm border border-purple-400/30 shadow-lg">
                      {log.actor_name.charAt(0)}
                    </div>

                    {/* Log Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm">
                        <span className="font-medium truncate">
                          {log.actor_name}
                        </span>{" "}
                        <span className="text-gray-600">
                          ({log.actor_type})
                        </span>{" "}
                      </p>

                      {/* Comments if available */}
                      {log.comments && (
                        <p className="text-xs sm:text-sm text-gray-500 italic break-words">
                          "{log.comments}"
                        </p>
                      )}

                      {/* Status Change */}
                      {log.old_status && log.new_status && (
                        <p className="text-xs text-gray-600">
                          Status:{" "}
                          <span className="line-through">{log.old_status}</span>{" "}
                          →{" "}
                          <span className="font-medium">{log.new_status}</span>
                        </p>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-gray-400">
                        {new Date(log.change_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Approver Modal */}
      {showModal && selectedApprover && (
        <>
          <ChangeApproverModal
            setShowModal={setShowModal}
            selectedApprover={selectedApprover}
            newApprover={newApprover}
            setNewApprover={setNewApprover}
            reason={reason}
            setReason={setReason}
            handleChangeApprover={handleChangeApprover}
          />
        </>
      )}
    </div>
  );
}

export default Approval;
