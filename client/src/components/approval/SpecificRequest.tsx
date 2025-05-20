import { useCallback, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  FileText,
  UserCircle,
  CheckCircle,
  XCircle,
  Download,
  Users,
  Check,
  AlertCircle,
  User,
  Clock,
  X,
} from "lucide-react";
import { ApproverDetailedView } from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";

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
}

function SpecificRequest({
  approver_id,
  specificRequest,
  goBack,
  getSpecificRequestApproval,
}: SpecificRequestProps) {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState("");

  const handleDownload = () => {
    if (!specificRequest?.file_path) return;
    const filePath = encodeURIComponent(specificRequest.file_path);
    const link = document.createElement("a");
    link.href = `http://localhost:5000/api/workflow/download/${filePath}`;
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
        "http://localhost:5000/api/workflow/approve-approval",
        {
          approver_id,
          response: status,
          comment,
        }
      );
      alert(res.data.message);
      setIsModalOpen(false);
      setComment("");
      getSpecificRequestApproval();
    } catch (error) {
      console.log(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [approver_id, status, comment, getSpecificRequestApproval]);

  console.log(specificRequest);
  if (!specificRequest) {
    return (
      <div className="p-6 text-center text-gray-500">
        No request data available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-8 mx-auto max-w-4xl">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to requests
        </button>
        <div className="text-sm text-gray-500">
          Request ID:{" "}
          <span className="font-mono">{specificRequest.workflow_id}</span>
        </div>
      </div>

      {/* Title and status */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {specificRequest.request_title}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${approverStatusBadge(
              String(specificRequest.approver_status)
            )}`}
          >
            {specificRequest.approver_status}
          </span>
        </div>
        <p className="text-gray-600">{specificRequest.description}</p>
      </div>

      {/* Approval progress */}
      {specificRequest.approval_progress &&
        specificRequest.approval_progress.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Users size={16} />
                Approval Progress
              </h3>
              <span className="text-xs font-medium text-gray-500">
                {specificRequest.completed_approvers} of{" "}
                {specificRequest.total_approvers} completed
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative mb-8 px-4">
              {/* Progress line container with padding */}
              <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 transform -translate-y-1/2">
                {/* Progress indicator - fixed calculation */}
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{
                    width: `${
                      (specificRequest.completed_approvers /
                        specificRequest.total_approvers) *
                      100
                    }%`,
                  }}
                />
              </div>

              {/* Approver circles */}
              <div className="relative flex justify-between">
                {specificRequest.approval_progress
                  .filter((approver) => approver.approval_status !== "Replaced")
                  .map((approver, index) => {
                    const isCompleted =
                      approver.approval_status === "Completed";
                    const isCurrent =
                      specificRequest.is_current &&
                      specificRequest.approver_order ===
                        approver.approver_order;

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center"
                        style={{
                          width: `${100 / specificRequest.total_approvers}%`,
                        }}
                      >
                        <div
                          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium mb-2 ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : isCurrent
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {isCompleted ? (
                            <Check size={14} />
                          ) : (
                            approver.approver_order
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-700 truncate w-full">
                            {approver.approver_order ===
                              specificRequest.approver_order &&
                            specificRequest.approver_id === approver_id
                              ? "You"
                              : approver.approver_name.split(" ")[0]}
                          </p>

                          <p className="text-xs text-gray-400 truncate w-full">
                            {approver.approver_role}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Add the approver details section here */}
            <div className="space-y-3">
              {specificRequest.approval_progress
                .filter((approval) => approval.approval_status !== "Replaced")
                .map((approval, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-md text-sm ${
                      approval.response === "Approved"
                        ? "bg-green-50 border border-green-100"
                        : approval.response === "Reject"
                        ? "bg-red-50 border border-red-100"
                        : specificRequest.is_current &&
                          specificRequest.approver_order ===
                            approval.approver_order
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200">
                        <User size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {approval.approver_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {approval.approver_role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {approval.response === "Approved" ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle size={14} className="mr-1" />
                          Approved
                        </span>
                      ) : approval.response === "Reject" ? (
                        <span className="flex items-center text-red-600">
                          <XCircle size={14} className="mr-1" />
                          Rejected
                        </span>
                      ) : approval.approval_status === "Replaced" ? (
                        <span className="flex items-center text-gray-400 italic">
                          <X size={14} className="mr-1" />
                          Replaced
                        </span>
                      ) : specificRequest.is_current &&
                        specificRequest.approver_order ===
                          approval.approver_order ? (
                        <span className="flex items-center text-blue-600">
                          <Clock size={14} className="mr-1" />
                          Your turn
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500">
                          <Clock size={14} className="mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

      {/* Request details */}
      <div className="space-y-6">
        {/* Requester info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
            <UserCircle size={20} />
          </div>
          <div>
            <p className="font-medium text-gray-800">
              {specificRequest.requester_name}
            </p>
            <p className="text-sm text-gray-500">
              {specificRequest.requester_role_name}
            </p>
          </div>
        </div>

        {/* Attachment */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Attachment</h3>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Download size={16} />
              Download
            </button>
          </div>
          <div className="p-4 flex items-center gap-3">
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
        <div className="space-y-3">
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

      {/* Action buttons */}
      {specificRequest.is_current &&
        specificRequest.approver_response === "Pending" && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              {status === "Reject" ? (
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              ) : (
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              )}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm {status} this request?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your reason..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="w-full flex justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
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
