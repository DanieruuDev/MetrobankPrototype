"use client";

import { useState, useEffect, useContext } from "react";
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
  User,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";
import { formatFileSize } from "../../../utils/SizeFileFormat";
import { AuthContext } from "../../../context/AuthContext";
import ChangeApproverModal from "../../../components/approval/my-approval/ChangeApproverModal";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import { useSidebar } from "../../../context/SidebarContext";
import Sidebar from "../../../components/shared/Sidebar";

function Approval() {
  const { workflow_id } = useParams();
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
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
        `http://localhost:5000/api/workflow/get-workflow/${requester_id}/${workflow_id}`
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
        return "text-orange-700";
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
    link.href = `http://localhost:5000/api/workflow/download/${filePath}`;
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
        "http://localhost:5000/api/workflow/requester-response",
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
      <div className="flex items-center justify-center min-h-[88vh]">
        <div className="animate-pulse text-lg text-gray-600">
          Loading workflow details...
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-[88vh]">
        <div className="text-red-500 text-lg">No workflow data available.</div>
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
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-all duration-300 bg-gray-50 min-h-screen`}
    >
      <Navbar pageName="Approvals" />

      <Sidebar />
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 md:p-8">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span className="font-medium">Back to workflows</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
              </div>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {workflow?.request_title}
                    <span className="text-blue-600 ml-2">
                      #{workflow?.workflow_id}
                    </span>
                  </h1>
                </div>

                <div className="mt-4 md:mt-0 flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requester</p>
                      <p className="font-medium text-gray-800 truncate max-w-48">
                        {workflow?.requester_email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Approval Progress
                </h2>

                {/* Progress Bar - Fixed width constraints to prevent layout shift */}
                <div className="mb-8 ml-10">
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
                            Complete
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 w-full">
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

                  <div className="space-y-8">
                    {/* Started */}
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-100 border-4 border-white">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-h-[80px]">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                Started
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {formatDate(workflow?.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Approval Steps */}
                    {sortedApprovers
                      .filter(
                        (approver) => approver.approver_status !== "Replaced"
                      )
                      .map((approver) => {
                        const isApproved = approver.response === "Approved";
                        const isRejected = approver.response === "Reject";
                        const isReturned = approver.response === "Returned";
                        const isCurrent = approver.is_current && !isReturned;

                        const displayStatus = isReturned
                          ? "Returned"
                          : isCurrent
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
                                  : isReturned
                                  ? "bg-orange-500"
                                  : "bg-gray-400"
                              }`}
                            >
                              {isApproved ? (
                                <Check className="w-5 h-5 text-white" />
                              ) : isRejected ? (
                                <X className="w-5 h-5 text-white" />
                              ) : isReturned ? (
                                <svg
                                  className="w-5 h-5 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
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
                                      : isReturned
                                      ? "bg-orange-50 border-orange-200"
                                      : "bg-gray-50 border-gray-100"
                                    : isApproved
                                    ? "bg-green-50 border-green-100"
                                    : isCurrent
                                    ? "bg-blue-50 border-blue-100"
                                    : isPending
                                    ? "bg-yellow-50 border-yellow-100"
                                    : isRejected
                                    ? "bg-red-50 border-red-100"
                                    : isReturned
                                    ? "bg-orange-50 border-orange-200"
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
                                            : isReturned
                                            ? "bg-orange-100"
                                            : "bg-gray-100"
                                        }`}
                                      >
                                        <span
                                          className={`text-sm font-medium whitespace-nowrap ${getStatusTextColor(
                                            displayStatus === "Completed" &&
                                              approver.response === "Reject"
                                              ? "Reject"
                                              : displayStatus === "Completed" &&
                                                approver.response === "Returned"
                                              ? "Returned"
                                              : displayStatus
                                          )}`}
                                        >
                                          {displayStatus === "Completed" &&
                                          approver.response
                                            ? approver.response
                                            : displayStatus}
                                        </span>
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
                              {(isReturned ||
                                approver.return_feedback.length > 0) && (
                                <div
                                  className={`bg-orange-50 p-4 rounded-lg border border-orange-200 mt-2 transition-all duration-200 ${
                                    expandedApproverId ===
                                      approver.approver_id ||
                                    approver.approver_status === "Returned"
                                      ? "block"
                                      : "hidden"
                                  }`}
                                >
                                  <h4 className="text-sm font-medium text-orange-800 mb-4 flex items-center">
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
                                    isReturned && (
                                      <div className="text-sm text-orange-700 italic">
                                        This step was returned but no specific
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
                                            <p className="text-xs text-orange-600 font-medium">
                                              Returned by{" "}
                                              {feedback.created_by_name} (
                                              {feedback.created_by_email}){" "}
                                              {feedback.requester_take_action && (
                                                <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded-full text-xs ml-2">
                                                  Action Required
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          <p className="text-xs text-orange-600">
                                            {formatDate(feedback.created_at)}
                                          </p>
                                        </div>
                                        <p className="text-sm text-orange-800 bg-orange-50 p-3 rounded">
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
                                                          📎{" "}
                                                          {response.file_name}
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
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                                              <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center hover:border-orange-400 transition-colors">
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
                                              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-colors duration-200 flex items-center justify-center"
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
                                              {formatDate(
                                                approver.response_time
                                              )}
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

                    {/* Ended - Added consistent min-height */}
                    <div className="relative pl-10">
                      <div
                        className={`absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white transition-all duration-300 ${
                          sortedApprovers
                            .filter((a) => a.approver_status !== "Replaced")
                            .every((a) => a.approver_status === "Completed")
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      >
                        <span className="text-white font-medium">E</span>
                      </div>
                      <div className="min-h-[80px]">
                        <div
                          className={`p-4 rounded-lg border ${
                            sortedApprovers.every(
                              (a) => a.approver_status === "Completed"
                            )
                              ? "bg-green-50 border-green-100"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <h3 className="font-medium text-gray-900">Ended</h3>
                          {sortedApprovers.every(
                            (a) => a.approver_status === "Completed"
                          ) && (
                            <p className="text-sm text-gray-500 mt-1">
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
            <div className="overflow-hidden bg-white">
              <div className="border border-gray-300 rounded-xl overflow-hidden">
                <h2 className="text-sm font-semibold text-gray-600 flex items-center mb-4 bg-gray-100 p-4">
                  <Info className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0" />
                  Request Details
                </h2>

                <div className="divide-y divide-gray-200">
                  {/* Due Date */}
                  <div className="flex justify-between p-4">
                    <p className="text-sm font-medium text-gray-500">
                      Due Date
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-right truncate max-w-32">
                      {formatDate(workflow?.due_date)}
                    </p>
                  </div>

                  {/* Semester */}
                  <div className="flex justify-between p-4">
                    <p className="text-sm font-medium text-gray-500">
                      Semester
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-right truncate max-w-32">
                      {workflow?.semester}
                    </p>
                  </div>

                  {/* School Year */}
                  <div className="flex justify-between p-4">
                    <p className="text-sm font-medium text-gray-500">
                      School Year
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-right truncate max-w-32">
                      {workflow?.school_year}
                    </p>
                  </div>

                  {/* Request Type */}
                  <div className="flex justify-between p-4">
                    <p className="text-sm font-medium text-gray-500">
                      Request Type
                    </p>
                    <p className="text-sm font-medium text-gray-900 text-right break-words max-w-32">
                      {workflow?.approval_req_type}
                    </p>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-500 p-4 space-y-2">
                      <div>
                        Description
                        <div className="bg-gray-100 rounded-md p-2 text-[14px] break-words">
                          {workflow?.rq_description}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 bg-gray-100 rounded-md p-4 overflow-hidden">
                        <div className="flex items-center min-w-0">
                          <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {workflow?.doc_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(workflow?.doc_size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleDownload}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center transition duration-200 w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 bg-white p-4 rounded-xl">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {workflow?.logs?.map((log: WorkflowLog) => (
                  <div
                    key={log.log_id}
                    className="flex items-start gap-3 border-b border-gray-200 pb-3 last:border-0"
                  >
                    {/* Avatar Circle */}
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {log.actor_name.charAt(0)}
                    </div>

                    {/* Log Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium truncate">
                          {log.actor_name}
                        </span>{" "}
                        <span className="text-gray-600">
                          ({log.actor_type})
                        </span>{" "}
                      </p>

                      {/* Comments if available */}
                      {log.comments && (
                        <p className="text-sm text-gray-500 italic break-words">
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
