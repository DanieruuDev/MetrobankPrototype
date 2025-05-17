import { useCallback, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  FileText,
  UserCircle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import { ApproverDetailedView } from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";

interface SpecificRequestProps {
  approver_id: number;
  specificRequest: ApproverDetailedView | null;
  goBack: () => void;
  getSpecificRequestApproval: () => void;
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
  }, [approver_id, status, comment]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 space-y-6 mx-auto">
      <button
        onClick={goBack}
        className="group flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex gap-2 items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {specificRequest?.request_title}
          </h1>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${approverStatusBadge(
              String(specificRequest?.approver_status)
            )}`}
          >
            {specificRequest?.approver_status}
          </span>
        </div>
        <div className="text-gray-500 text-sm">
          Request ID:{" "}
          <span className="font-semibold">{specificRequest?.workflow_id}</span>
        </div>
      </div>

      <div className="bg-gray-50 border-none rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 flex gap-3 items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <UserCircle size={20} className="text-blue-600" />
              <span className="font-medium text-gray-800">
                {specificRequest?.requester_name}
              </span>
              <span className="text-gray-500">
                ({specificRequest?.requester_role})
              </span>
              <span className="text-blue-600">
                {specificRequest?.requester_email}
              </span>
            </div>
          </div>

          {specificRequest?.approver_response === "Pending" ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStatus("Reject");
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
            <div
              className={`flex items-center gap-2 text-lg font-medium ${
                specificRequest?.approver_response === "Approved"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {specificRequest?.approver_response === "Approved" ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              {specificRequest?.approver_response}
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
                {specificRequest?.doc_name}
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
              {specificRequest?.description}
            </p>
          </div>
          <div>
            {specificRequest?.approver_comment === null ? (
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
                  {specificRequest?.approver_comment || "No comment"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[95%] max-w-sm text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to {status} this request?
            </h2>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleApproval}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Yes
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
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
