import { useCallback, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  FileText,
  UserCircle,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Users,
  CheckCheck,
  User,
  Check,
  ChevronDown,
} from "lucide-react";
import { ApproverDetailedView } from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";

export interface SpecificRequestProps {
  approver_id: number;
  specificRequest: ApproverDetailedView | null;
  goBack: () => void;
  getSpecificRequestApproval: () => Promise<void>;
  updateApproverResponse: (
    response: "Approved" | "Rejected",
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
      alert(error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [approver_id, status, comment, getSpecificRequestApproval]);

  if (!specificRequest) {
    return (
      <div className="p-6 text-center text-gray-500">
        No request data available.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 space-y-6 mx-auto max-w-5xl">
      <button
        onClick={goBack}
        className="group flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back
      </button>

      {/* Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex gap-2 items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {specificRequest.request_title}
          </h1>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${approverStatusBadge(
              String(specificRequest.approver_status)
            )}`}
          >
            {specificRequest.approver_status}
          </span>
        </div>
        <div className="text-gray-500 text-sm">
          Request ID:{" "}
          <span className="font-semibold">{specificRequest.workflow_id}</span>
        </div>
      </div>

      {/* Circle Progress Stepper with Progress Bar */}
      {specificRequest.approval_progress &&
        specificRequest.approval_progress.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Users size={18} />
                <span className="font-medium">Approval Progress</span>
              </div>
              <span className="text-sm font-medium text-blue-700">
                {specificRequest.completed_approvers} of{" "}
                {specificRequest.total_approvers} completed
              </span>
            </div>

            <div className="relative flex justify-between items-center px-4">
              {/* Progress Line Behind Circles */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10 rounded">
                <div
                  className="h-full bg-green-500 transition-all duration-300 rounded"
                  style={{
                    width: `${
                      (specificRequest.completed_approvers /
                        Math.max(
                          1,
                          specificRequest.approval_progress.length - 1
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>

              {/* Circles */}
              {specificRequest.approval_progress.map((approver, index) => {
                const isCompleted = approver.approval_status === "Completed";
                const isActive =
                  specificRequest.is_current &&
                  specificRequest.approver_order === approver.approver_order &&
                  !isCompleted;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center relative z-10"
                    style={{
                      width: `${
                        100 / specificRequest.approval_progress.length
                      }%`,
                    }}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mb-2
                      ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={16} />
                      ) : (
                        approver.approver_order
                      )}
                      {isActive && (
                        <ChevronDown
                          className="absolute -bottom-6 text-gray-400"
                          size={16}
                        />
                      )}
                    </div>

                    <span
                      className={`text-xs ${
                        isActive ? "text-gray-700 font-medium" : "text-gray-500"
                      } truncate text-center w-full`}
                    >
                      {approver.approver_name.split(" ")[0]}
                    </span>

                    <span className="text-xs text-gray-400 truncate text-center w-full">
                      {approver.approver_role}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Detailed Approver List */}
            <div className="mt-8 space-y-2">
              {specificRequest.approval_progress.map((approval, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    approval.approval_status === "Completed"
                      ? "bg-green-50 border border-green-100"
                      : specificRequest.is_current &&
                        specificRequest.approver_order ===
                          approval.approver_order
                      ? "bg-blue-50 border border-blue-100"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    <span className="font-medium">
                      {approval.approver_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({approval.approver_role})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {approval.approval_status === "Completed" ? (
                      <CheckCheck size={16} className="text-green-500" />
                    ) : specificRequest.is_current &&
                      specificRequest.approver_order ===
                        approval.approver_order ? (
                      <Clock size={16} className="text-blue-500" />
                    ) : (
                      <Clock size={16} className="text-yellow-500" />
                    )}
                    <span className="text-sm">
                      {approval.approval_status === "Completed"
                        ? `Approved at ${new Date(
                            approval.approval_time || ""
                          ).toLocaleString()}`
                        : specificRequest.is_current &&
                          specificRequest.approver_order ===
                            approval.approver_order
                        ? "Your Approval Pending"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Approval action and comment */}
      <div className="bg-gray-50 border-none rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex gap-3 items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <UserCircle size={20} className="text-blue-600" />
              <span className="font-medium text-gray-800">
                {specificRequest.requester_name}
              </span>
              <span className="text-gray-500">
                ({specificRequest.requester_role_name})
              </span>
            </div>
          </div>

          {specificRequest.approver_status === "Completed" ? (
            <div
              className={`flex items-center gap-2 text-lg font-medium ${
                specificRequest.approver_response === "Approved"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {specificRequest.approver_response === "Approved" ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              {specificRequest.approver_response}
            </div>
          ) : specificRequest.is_current &&
            specificRequest.approver_response === "Pending" ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStatus("Rejected");
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                <XCircle size={18} /> Reject
              </button>
              <button
                onClick={() => {
                  setStatus("Approved");
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                <CheckCircle size={18} /> Approve
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-lg font-medium text-gray-500">
              <Clock size={20} />
              Not your turn yet.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Attachment</h2>
          <div className="flex items-center justify-between bordernone p-4 rounded-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText size={20} className="text-blue-600" />
              </div>
              <p className="font-medium text-gray-800">
                {specificRequest.doc_name}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              <Download size={16} className="mr-2" /> Download
            </button>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            Description
          </h3>
          <div className="bg-gray-100 p-4 rounded-lg border border-none shadow-sm">
            <p className="text-sm text-gray-600">
              {specificRequest.description}
            </p>
          </div>
          <div>
            {specificRequest.approver_comment === null ? (
              <div className="space-y-2">
                <label
                  htmlFor="comment"
                  className="text-sm font-medium text-gray-700"
                >
                  Comment (Optional)
                </label>
                <textarea
                  id="comment"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  maxLength={255}
                  placeholder="Add your comment here..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-800">Comment</p>
                <div className="border-none shadow-sm bg-white rounded-md p-3 text-gray-700 text-sm">
                  {specificRequest.approver_comment || "No comment"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[95%] max-w-sm text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to {status.toLowerCase()} this request?
            </h2>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleApproval}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                disabled={loading}
              >
                Yes
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                disabled={loading}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecificRequest;
