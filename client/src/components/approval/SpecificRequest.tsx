import { useCallback, useContext, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Users,
  Check,
  AlertCircle,
  User,
  Clock,
  Calendar,
  X,
  MessageSquare,
  Reply,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { ApproverDetailedView } from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";
import Loading from "../shared/Loading";
import { AuthContext } from "../../context/AuthContext";

export interface SpecificRequestProps {
  approver_id: number;
  specificRequest: ApproverDetailedView | null;
  goBack: () => void;
  getSpecificRequestApproval: () => Promise<void>;
  updateApproverResponse: (
    response: "Approved" | "Reject",
    comment: string | null,
    approver_status: "Completed" | "Missed" | "Replaced"
  ) => Promise<void>;
  getRequestApprovalList: () => Promise<void>;
}

function SpecificRequest({
  approver_id,
  specificRequest,
  goBack,
  getSpecificRequestApproval,
  getRequestApprovalList,
}: SpecificRequestProps) {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState("");

  // Loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalProgress, setApprovalProgress] = useState(0);
  const [approvalStatus, setApprovalStatus] = useState("");
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  console.log("approver status", specificRequest);
  const handleDownload = () => {
    if (!specificRequest?.doc_name) {
      console.error("No file to download");
      return;
    }

    const filePath = encodeURIComponent(specificRequest?.doc_name); // encode special chars
    const link = document.createElement("a");
    link.href = `${VITE_BACKEND_URL}api/workflow/download/${filePath}`;
    link.setAttribute("download", specificRequest?.doc_name); // filename for browser
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproval = useCallback(async () => {
    setIsModalOpen(false);
    setIsProcessing(true);
    setApprovalProgress(0);
    setApprovalStatus("");

    // Progress animation - same as save changes
    const progressInterval = setInterval(() => {
      setApprovalProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    // Status messages - same as save changes
    const statusMessages = [
      "Sending data to server...",
      "Processing approval...",
      "Updating workflow status...",
    ];

    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      setApprovalStatus(statusMessages[statusIndex]);
      statusIndex++;
      if (statusIndex >= statusMessages.length) {
        clearInterval(statusInterval);
      }
    }, 1000);

    try {
      const res = await axios.put(
        `${VITE_BACKEND_URL}api/workflow/approve-approval`,
        {
          approver_id,
          response: status,
          comment,
          response_id: specificRequest?.response_id,
          workflow_id: specificRequest?.workflow_id,
          approver_order: specificRequest?.approver_order,
          requester_id: specificRequest?.requester_id,
          user_id: specificRequest?.user_id,
        }
      );

      // Complete the progress
      setApprovalProgress(100);
      setApprovalStatus("Approval complete!");

      toast.success(res.data.message);
      setIsModalOpen(false);
      setComment("");
      setStatus("");

      // Close modal after delay
      setTimeout(() => {
        setIsProcessing(false);
        setApprovalProgress(0);
        setApprovalStatus("");
        clearInterval(progressInterval);
        clearInterval(statusInterval);
      }, 1500);

      await getSpecificRequestApproval();
      await getRequestApprovalList();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.");
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  }, [
    status,
    comment,
    VITE_BACKEND_URL,
    approver_id,
    specificRequest?.response_id,
    specificRequest?.workflow_id,
    specificRequest?.approver_order,
    specificRequest?.requester_id,
    specificRequest?.user_id,
    getSpecificRequestApproval,
    getRequestApprovalList,
  ]);

  console.log(specificRequest);
  if (!specificRequest) {
    return <Loading />;
  }

  const hasMultipleApprovers = specificRequest.total_approvers > 1;
  const completionPercentage = Math.round(
    (specificRequest.completed_approvers / specificRequest.total_approvers) *
      100
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Pending";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatConversationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isRejected = specificRequest.approval_progress.some(
    (approver) => approver.approval_status === "Canceled"
  );

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 mx-auto ">
        {/* Header with back button and approval buttons */}
        <div className="flex items-center justify-between pb-4 ">
          <button
            onClick={goBack}
            className="flex items-center gap-2  py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Approval buttons at the top */}
          {specificRequest.current_approver === specificRequest.approver_name &&
            specificRequest.approver_response === "Pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStatus("Reject");
                    setIsModalOpen(true);
                  }}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setStatus("Approved");
                    setIsModalOpen(true);
                  }}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </button>
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Approval progress */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Users size={16} />
                  Approval Progress
                </h3>
                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border">
                  {specificRequest.completed_approvers} of{" "}
                  {specificRequest.total_approvers} completed
                </span>
              </div>

              {/* Progress visualization */}
              {specificRequest.approval_progress &&
                specificRequest.approval_progress.length > 0 && (
                  <div className="space-y-6">
                    {/* Progress bar - only show line if multiple approvers */}
                    <div className="relative mb-4 px-4">
                      {/* Progress line container - only show if multiple approvers */}
                      {hasMultipleApprovers && (
                        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-gray-200 rounded-full transform -translate-y-1/2">
                          {/* Progress indicator */}
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isRejected ? "bg-red-500" : "bg-green-500"
                            }`}
                            style={{
                              width: `${
                                isRejected ? 100 : completionPercentage
                              }%`,
                            }}
                          />
                        </div>
                      )}

                      {/* Approver circles */}
                      <div className="relative flex justify-between">
                        {specificRequest.approval_progress
                          .filter(
                            (approver) =>
                              approver.approval_status !== "Replaced"
                          )
                          .map((approver, index) => {
                            const isCurrent =
                              approver.approver_name ===
                              specificRequest.current_approver;
                            const isWorkflowCompleted =
                              specificRequest.workflow_status === "Completed";

                            return (
                              <div
                                key={index}
                                className="flex flex-col items-center"
                                style={{
                                  width: `${
                                    100 / specificRequest.total_approvers
                                  }%`,
                                }}
                              >
                                <div
                                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium mb-2 border-2 border-white ${
                                    approver.response === "Approved"
                                      ? "bg-green-500 text-white shadow-sm"
                                      : approver.response === "Reject"
                                      ? "bg-red-500 text-white shadow-sm"
                                      : approver.approval_status === "Canceled"
                                      ? "bg-red-500 text-white shadow-sm"
                                      : isCurrent && !isRejected
                                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200"
                                      : "bg-gray-200 text-gray-500"
                                  }`}
                                >
                                  {approver.response === "Approved" ? (
                                    <Check size={14} />
                                  ) : approver.response === "Reject" ? (
                                    <X size={14} />
                                  ) : approver.approval_status ===
                                    "Canceled" ? (
                                    <X size={14} />
                                  ) : (
                                    <span className="text-xs">
                                      {approver.approver_order}
                                    </span>
                                  )}
                                </div>
                                {/* Show completed_at if workflow is completed */}
                                {isWorkflowCompleted &&
                                  index ===
                                    specificRequest.total_approvers - 1 && (
                                    <span className="text-xs text-green-600 mt-1 text-center">
                                      Completed at:{" "}
                                      {new Date(
                                        specificRequest.completed_at
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Submission info */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                          <User size={12} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          Requested by
                        </span>
                      </div>
                      <div className="ml-8">
                        <p className="text-sm font-medium text-gray-800">
                          {specificRequest.requester_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {specificRequest.requester_role_name}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Calendar size={12} />
                          <span>
                            Submitted:{" "}
                            {formatDate(specificRequest.date_started)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Approver steps */}
                    <div className="space-y-4">
                      {specificRequest.approval_progress
                        .filter(
                          (approval) => approval.approval_status !== "Replaced"
                        )
                        .map((approval, index) => {
                          const isCurrent =
                            approval.approver_name ===
                            specificRequest.current_approver;
                          const displayName =
                            approval.user_id === userId
                              ? "You"
                              : approval.approver_name;
                          return (
                            <div
                              key={index}
                              className={`bg-white rounded-lg p-4 border ${
                                approval.response === "Approved"
                                  ? "border-green-300"
                                  : approval.response === "Reject"
                                  ? "border-red-300"
                                  : isCurrent
                                  ? "border-blue-300"
                                  : "border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">
                                  Step {approval.approver_order}
                                </span>
                                <span
                                  className={`text-xs font-medium ${
                                    approval.response === "Approved"
                                      ? "text-green-600"
                                      : approval.response === "Reject"
                                      ? "text-red-600"
                                      : isCurrent
                                      ? "text-blue-600"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {approval.response === "Approved"
                                    ? "Approved"
                                    : approval.response === "Reject"
                                    ? "Rejected"
                                    : isCurrent
                                    ? "Current"
                                    : approval.approval_status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                    approval.response === "Approved"
                                      ? "bg-green-100 text-green-600"
                                      : approval.response === "Reject" ||
                                        approval.approval_status === "Canceled"
                                      ? "bg-red-100 text-red-600"
                                      : isCurrent
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  <User size={14} />
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {displayName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {approval.approver_role}
                                  </p>
                                </div>
                              </div>
                              {approval.response !== "Pending" &&
                                approval.approval_time && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar size={12} />
                                    <span>
                                      {approval.response === "Approved"
                                        ? "Approved"
                                        : approval.response === "Reject"
                                        ? "Rejected"
                                        : "Completed"}{" "}
                                      on {formatDate(approval.approval_time)}
                                    </span>
                                  </div>
                                )}

                              {isCurrent && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <Clock size={12} />
                                  <span>Awaiting approval</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Right column - Request content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rejected Conversation */}
            {specificRequest.return_conversation &&
              specificRequest.return_conversation.length > 0 && (
                <div className="bg-white rounded-xl p-5 border border-gray-200">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                    <MessageSquare size={16} />
                    Rejection Conversation
                  </h3>

                  <div className="space-y-4">
                    {specificRequest.return_conversation.map((returnItem) => (
                      <div
                        key={returnItem.return_id}
                        className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                      >
                        {/* Rejection reason from approver */}
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                                <XCircle size={12} />
                              </div>
                              <span className="text-sm font-medium text-red-800">
                                Rejected by {returnItem.created_by}
                              </span>
                            </div>
                            <span className="text-xs text-red-600">
                              {formatConversationDate(returnItem.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-red-700 ml-8">
                            {returnItem.reason}
                          </p>
                        </div>

                        {/* Requester responses */}
                        {returnItem.requester_responses &&
                          returnItem.requester_responses.length > 0 && (
                            <div className="bg-blue-50 p-4">
                              <div className="space-y-3">
                                {returnItem.requester_responses.map(
                                  (response) => (
                                    <div
                                      key={response.req_response_id}
                                      className="flex items-start gap-3"
                                    >
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 mt-0.5">
                                        <Reply size={12} />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-sm font-medium text-blue-800">
                                            {response.requester_name} responded
                                          </span>
                                          <span className="text-xs text-blue-600">
                                            {formatConversationDate(
                                              response.responded_at
                                            )}
                                          </span>
                                        </div>

                                        {/* Response message */}
                                        {response.message && (
                                          <p className="text-sm text-blue-700 mb-2">
                                            {response.message}
                                          </p>
                                        )}

                                        {/* Response file attachment */}
                                        {response.file_name && (
                                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                                            <FileText
                                              size={16}
                                              className="text-blue-600"
                                            />
                                            <div className="flex-1">
                                              <p className="text-sm font-medium text-blue-800">
                                                {response.file_name}
                                              </p>
                                              <p className="text-xs text-blue-600">
                                                {response.file_type} •{" "}
                                                {response.file_size
                                                  ? `${Math.round(
                                                      response.file_size / 1024
                                                    )} KB`
                                                  : "Unknown size"}
                                              </p>
                                            </div>
                                            <button className="text-blue-600 hover:text-blue-700">
                                              <Download size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Show if requester needs to take action */}
                        {!returnItem.requester_take_action && (
                          <div className="bg-red-50 border-t border-red-200 p-3">
                            <div className="flex items-center gap-2 text-sm text-red-800">
                              <Clock size={14} />
                              <span className="font-medium">
                                Awaiting requester response
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Request Details */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                <FileText size={16} />
                Request Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${approverStatusBadge(
                      String(specificRequest.approver_status)
                    )}`}
                  >
                    {specificRequest.approver_status}
                  </span>
                </div>

                {/* Request ID */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Request ID
                  </label>
                  <span className="text-sm font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded">
                    {specificRequest.workflow_id}
                  </span>
                </div>

                {/* Submitted Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Submitted
                  </label>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Calendar size={14} />
                    <span>{formatDate(specificRequest.date_started)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Requester
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                      <User size={12} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {specificRequest.requester_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {specificRequest.requester_role_name}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Due Date
                  </label>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <Calendar size={14} />
                    <span>{formatDate(specificRequest.due_date)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Description
                </label>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {specificRequest.description}
                </p>
              </div>
            </div>

            {/* Attachment */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                  Attachment
                </h3>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
              <div className="p-4 flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {specificRequest.doc_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Click download to view file
                  </p>
                </div>
              </div>
            </div>

            {/* Comment section */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200">
              {specificRequest.approver_comment ? (
                <>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Your comment
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
                    {specificRequest.approver_comment}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Add a comment (optional)
                  </h3>
                  <textarea
                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add any additional notes..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Max 255 characters</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    status === "Approved" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <AlertCircle
                    className={`w-6 h-6 ${
                      status === "Approved" ? "text-green-600" : "text-red-600"
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm {status === "Approved" ? "Approval" : "Rejection"}
                </h3>
              </div>

              <div className="mb-6 space-y-2">
                <p className="text-gray-600 text-sm">
                  You are about to{" "}
                  {status === "Approved" ? "approve" : "reject"} this request:
                </p>
                <div
                  className={`border rounded-lg p-4 space-y-2 ${
                    status === "Approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Request:</span>
                    <span className="text-gray-900 font-semibold truncate ml-2">
                      {specificRequest.request_title}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      Requester:
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {specificRequest.requester_name}
                    </span>
                  </div>
                  {status === "Reject" && (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        Comment:
                      </span>
                      <span className="text-gray-900 font-semibold truncate ml-2">
                        {comment || "No comment provided"}
                      </span>
                    </div>
                  )}
                </div>

                {status === "Reject" && (
                  <div className="mt-4">
                    <label
                      htmlFor="reject-comment"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Reason for rejection{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="reject-comment"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Enter your reason for rejection..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max 255 characters
                    </p>
                  </div>
                )}

                <p className="text-gray-600 text-sm mt-3">
                  {status === "Approved"
                    ? "This will approve the request and move it to the next approver. Do you want to proceed?"
                    : "This will reject the request and notify the requester. Do you want to proceed?"}
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproval}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl ${
                    status === "Approved"
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                  }`}
                >
                  Yes, {status === "Approved" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full-Screen Loading Overlay with Circular Progress */}
        {isProcessing && (
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
                        2 * Math.PI * 50 * (1 - approvalProgress / 100)
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
                        <stop
                          offset="0%"
                          stopColor={
                            status === "Approved" ? "#10b981" : "#ef4444"
                          }
                        />
                        <stop
                          offset="100%"
                          stopColor={
                            status === "Approved" ? "#059669" : "#dc2626"
                          }
                        />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Percentage Text Inside Circle with Animation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center animate-bounce">
                      <div
                        className={`text-3xl font-bold animate-pulse ${
                          status === "Approved"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {Math.round(approvalProgress)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1 animate-pulse">
                        {approvalProgress >= 100 ? "Complete" : "Progress"}
                      </div>
                    </div>
                  </div>

                  {/* Rotating Ring Animation */}
                  <div
                    className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin opacity-30 ${
                      status === "Approved"
                        ? "border-t-green-300"
                        : "border-t-red-300"
                    }`}
                  ></div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {status === "Approved"
                    ? "Approving Request"
                    : "Rejecting Request"}
                </h3>
                <p className="text-gray-600 text-sm text-center mb-4">
                  {approvalStatus ||
                    (status === "Approved"
                      ? "Processing approval and notifying next approver..."
                      : "Processing rejection and notifying requester...")}
                </p>

                <p className="text-xs text-gray-500 text-center">
                  Please do not close this window
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SpecificRequest;
