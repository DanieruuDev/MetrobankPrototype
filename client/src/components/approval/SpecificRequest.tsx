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
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleDownload = () => {
    if (!specificRequest?.doc_name) {
      console.error("No file to download");
      return;
    }

    const filePath = encodeURIComponent(specificRequest?.doc_name);
    const link = document.createElement("a");
    link.href = `${VITE_BACKEND_URL}api/workflow/download/${filePath}`;
    link.setAttribute("download", specificRequest?.doc_name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproval = useCallback(async () => {
    if (!status) return alert("Please select a response.");
    if (status === "Reject" && comment.trim() === "") {
      return alert("Comment is required when rejecting.");
    }

    setLoading(true);
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
      alert(res.data.message);
      setIsModalOpen(false);
      setComment("");
      getSpecificRequestApproval();
      getRequestApprovalList();
    } catch (error) {
      console.log(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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

  if (!specificRequest) {
    return <Loading />;
  }

  const hasMultipleApprovers = specificRequest.total_approvers > 1;
  const completionPercentage = Math.round(
    (specificRequest.completed_approvers / specificRequest.total_approvers) *
      100
  );
  const isRejected = specificRequest.approval_progress.some(
    (approver) => approver.approval_status === "Canceled"
  );

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

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 mx-auto max-w-6xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium "
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        </button>

        {specificRequest.current_approver === specificRequest.approver_name &&
          (specificRequest.approver_response === "Pending" ||
            (specificRequest.approver_response === "Reject" &&
              specificRequest.return_conversation?.some(
                (conv) => Number(conv.created_by) === userId
              ))) && (
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full xs:w-auto">
              <button
                onClick={() => {
                  setStatus("Reject");
                  setIsModalOpen(true);
                }}
                disabled={loading}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-red-300/50 text-xs sm:text-sm font-medium rounded-md shadow-sm text-red-700 bg-white/80 backdrop-blur-sm hover:bg-red-50/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Reject</span>
                <span className="xs:hidden">Reject</span>
              </button>
              <button
                onClick={() => {
                  setStatus("Approved");
                  setIsModalOpen(true);
                }}
                disabled={loading}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 backdrop-blur-sm transition-all duration-200"
              >
                <CheckCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Approve</span>
                <span className="xs:hidden">Approve</span>
              </button>
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-5 border border-white/50 h-full shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
              <h3 className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700">
                <Users size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Approval Progress</span>
                <span className="xs:hidden">Progress</span>
              </h3>
              <span className="text-xs font-medium text-gray-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md border border-white/50 self-start sm:self-auto shadow-sm">
                {specificRequest.completed_approvers} of{" "}
                {specificRequest.total_approvers} completed
              </span>
            </div>

            {specificRequest.approval_progress &&
              specificRequest.approval_progress.length > 0 && (
                <div className="space-y-6">
                  {hasMultipleApprovers && (
                    <div className="relative mb-4 px-4">
                      <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-gray-200 rounded-full transform -translate-y-1/2">
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
                    </div>
                  )}

                  <div className="relative flex justify-between">
                    {specificRequest.approval_progress
                      .filter(
                        (approver) => approver.approval_status !== "Replaced"
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
                                  : approver.response === "Reject" ||
                                    approver.approval_status === "Canceled"
                                  ? "bg-red-500 text-white shadow-sm"
                                  : isCurrent && !isRejected
                                  ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {approver.response === "Approved" ? (
                                <Check size={14} />
                              ) : approver.response === "Reject" ||
                                approver.approval_status === "Canceled" ? (
                                <X size={14} />
                              ) : (
                                approver.approver_order
                              )}
                            </div>
                            {isWorkflowCompleted &&
                              index === specificRequest.total_approvers - 1 && (
                                <span className="text-xs text-green-600 mt-1">
                                  Completed at:{" "}
                                  {new Date(
                                    specificRequest.completed_at
                                  ).toLocaleString()}
                                </span>
                              )}
                          </div>
                        );
                      })}
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600">
                        <User size={10} className="sm:w-3 sm:h-3" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        <span className="hidden xs:inline">Requested by</span>
                        <span className="xs:hidden">Requester</span>
                      </span>
                    </div>
                    <div className="ml-6 sm:ml-8">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                        {specificRequest.requester_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {specificRequest.requester_role_name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar size={10} className="sm:w-3 sm:h-3" />
                        <span>
                          <span className="hidden xs:inline">Submitted: </span>
                          {formatDate(specificRequest.date_started)}
                        </span>
                      </div>
                    </div>
                  </div>

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
                            className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 border shadow-sm ${
                              approval.response === "Approved"
                                ? "border-green-300"
                                : approval.response === "Reject" ||
                                  approval.approval_status === "Canceled"
                                ? "border-red-300"
                                : isCurrent
                                ? "border-blue-300/50"
                                : "border-gray-300/50"
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
                                    : approval.response === "Reject" ||
                                      approval.approval_status === "Canceled"
                                    ? "text-red-600"
                                    : isCurrent
                                    ? "text-blue-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {approval.response === "Approved"
                                  ? "Approved"
                                  : approval.response === "Reject" ||
                                    approval.approval_status === "Canceled"
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
                                      : "Rejected"}{" "}
                                    on {formatDate(approval.approval_time)}
                                  </span>
                                </div>
                              )}
                            {isCurrent &&
                            approval.approval_status !== "Reject" ? (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Clock size={12} />
                                <span>Awaiting approval</span>
                              </div>
                            ) : approval.approval_status === "Reject" ? (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <Clock size={12} />
                                <span>Awaiting requester response</span>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {specificRequest.return_conversation &&
            specificRequest.return_conversation.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <MessageSquare size={16} />
                  Conversation
                </h3>
                <div className="space-y-4">
                  {specificRequest.return_conversation.map((returnItem) => (
                    <div
                      key={returnItem.return_id}
                      className="border border-white/50 rounded-lg overflow-hidden bg-white/60 backdrop-blur-sm shadow-sm"
                    >
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
                                      {response.message && (
                                        <p className="text-sm text-blue-700 mb-2">
                                          {response.message}
                                        </p>
                                      )}
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

                      {!returnItem.requester_take_action && (
                        <div className="bg-yellow-50 border-t border-yellow-200 p-3">
                          <div className="flex items-center gap-2 text-sm text-yellow-800">
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

          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
              <FileText size={16} />
              Request Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Request ID
                </label>
                <span className="text-sm font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded">
                  {specificRequest.workflow_id}
                </span>
              </div>
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
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Description
              </label>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-gray-50 p-2 sm:p-3 rounded-lg">
                {specificRequest.description}
              </p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-4 p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                Attachment
              </h3>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-1 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-md self-start xs:self-auto"
              >
                <Download size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Download</span>
                <span className="xs:hidden">Download</span>
              </button>
            </div>
            <div className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                <FileText size={16} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                  {specificRequest.doc_name}
                </p>
                <p className="text-xs text-gray-500">
                  Click download to view file
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-white rounded-xl border border-gray-200">
            {specificRequest.approver_comment ? (
              <>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                  Your comment
                </h3>
                <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700">
                  {specificRequest.approver_comment}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                  Add a comment (optional)
                </h3>
                <textarea
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/30">
            <div className="flex flex-col items-center text-center">
              {status === "Reject" ? (
                <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100 mb-3 sm:mb-4">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
              ) : (
                <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              )}
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Confirm {status} this request?
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                {status === "Reject"
                  ? "This action cannot be undone. Please provide a reason for rejection."
                  : "You're approving this request. Are you sure?"}
              </p>

              {status === "Reject" && (
                <div className="w-full mb-4">
                  <label
                    htmlFor="reject-reason"
                    className="block text-sm font-medium text-gray-700 text-left mb-1"
                  >
                    Reason for rejection <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reject-reason"
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                    placeholder="Enter your reason..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="w-full flex flex-col xs:flex-row xs:justify-end gap-2 xs:gap-3">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-2 border border-gray-300/50 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white backdrop-blur-sm transition-all duration-200 ${
                    status === "Reject"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  onClick={handleApproval}
                  disabled={loading || (status === "Reject" && !comment.trim())}
                >
                  {loading ? "Processing..." : `Confirm ${status}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecificRequest;
