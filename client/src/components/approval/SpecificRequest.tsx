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
  const [comment, setComment] = useState(""); // File Download

  const handleDownload = () => {
    if (!specificRequest?.file_path) {
      console.error("No file to download");
      return;
    }

    const filePath = encodeURIComponent(specificRequest.file_path);
    const link = document.createElement("a");
    link.href = `http://localhost:5000/api/workflow/download/${filePath}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }; // Handle Approval

  const handleApproval = useCallback(async () => {
    if (!status) return alert("Please select a response.");

    setLoading(true);
    try {
      // Note: The backend must also check is_current for security!
      const res = await axios.put(
        "http://localhost:5000/api/workflow/approve-approval",
        {
          approver_id,
          response: status,
          comment,
        }
      );

      // If the backend sends a specific message for failure (e.g., 403),
      // you might want to check res.status here and show a different alert.
      // For now, showing the message from res.data is fine.
      alert(res.data.message);

      // Only refresh if the action was likely successful (status 2xx)
      // If the backend returned a 403, you might not want to close the modal and refresh
      if (res.status >= 200 && res.status < 300) {
        setIsModalOpen(false);
        setComment("");
        getSpecificRequestApproval(); // Refresh data after successful action
      } else {
        // If backend returned an error status, maybe just close modal and keep comment
        setIsModalOpen(false);
        // Don't clear comment or refresh on non-successful response
      }
    } catch (error) {
      // axios errors (e.g., 403 from backend check, network issues)
      if (axios.isAxiosError(error) && error.response) {
        // Handle specific backend error messages (like the 403 check)
        alert(error.response.data.message || "Error processing request.");
      } else {
        // Handle other errors
        alert("Something went wrong");
      }
    } finally {
      setLoading(false);
      // If the modal is still open after an error, close it
      // setIsModalOpen(false); // Or handle modal closing based on success/failure
    }
  }, [approver_id, status, comment, getSpecificRequestApproval]); // Added getSpecificRequestApproval to deps

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Back Button */}{" "}
      <button
        onClick={goBack}
        className="group cursor-pointer flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all mb-6"
      >
        {" "}
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform duration-200"
        />
        <span className="text-base font-medium">Back</span>{" "}
      </button>
      {/* Request Header */}{" "}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        {" "}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3 md:mb-0">
          {" "}
          <h1 className="text-2xl font-semibold">
            {specificRequest?.request_title}{" "}
          </h1>{" "}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium max-w-[100px] text-center ${approverStatusBadge(
              String(specificRequest?.approver_status)
            )}`}
          >
            {specificRequest?.approver_status}{" "}
          </span>{" "}
        </div>{" "}
        <div className="text-gray-600 text-sm">
          Request ID:{" "}
          <span className="font-medium">{specificRequest?.workflow_id}</span>{" "}
        </div>{" "}
      </div>
      {/* Request Details Card */}{" "}
      <div className="bg-gray-50 rounded-lg p-5 mb-6">
        {/* Requester Info */}{" "}
        <div className="flex gap-6 justify-between items-center">
          {" "}
          <div className="flex items-start gap-3 mb-4 ">
            {" "}
            <div>
              <p className="text-sm text-gray-500">Requester: </p>{" "}
              <div className="flex flex-wrap items-center gap-2">
                {" "}
                <UserCircle size={20} className="text-blue-600" />{" "}
                <span className="font-medium">
                  {specificRequest?.requester_name}{" "}
                </span>{" "}
                <span className="text-gray-500">
                  ({specificRequest?.requester_role}){" "}
                </span>{" "}
                <span className="text-blue-600">
                  {specificRequest?.requester_email}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>
          {/* Approval Actions */}{" "}
          <div className="flex justify-end gap-3 mt-8">
            {" "}
            {/* THIS IS THE CORRECT CONDITIONAL BLOCK - ENSURE IT'S ONLY HERE */}{" "}
            {specificRequest &&
            specificRequest.approver_status === "Pending" ? (
              <>
                {" "}
                {/* Check if this approver is the CURRENT approver in the sequence */}{" "}
                {specificRequest.is_current === true ? (
                  // --- Render Approve/Reject buttons if CURRENT and PENDING ---
                  <div className="flex gap-1">
                    {" "}
                    <button
                      onClick={() => {
                        setStatus("Reject");
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors cursor-pointer"
                      disabled={loading}
                    >
                      <XCircle size={18} />
                      Reject{" "}
                    </button>{" "}
                    <button
                      onClick={() => {
                        setStatus("Approved");
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors cursor-pointer"
                      disabled={loading}
                    >
                      <CheckCircle size={18} />
                      Approve{" "}
                    </button>{" "}
                  </div>
                ) : (
                  // --- Render message if PENDING but NOT CURRENT ---
                  <div className="text-center text-amber-700 font-medium p-3 border border-amber-300 rounded-md bg-amber-100 text-sm">
                    This request is pending, but it's not your turn yet. You are
                    approver #{specificRequest.approver_order} in the sequence.{" "}
                  </div>
                )}{" "}
              </>
            ) : specificRequest?.approver_response === "Approved" ? (
              // --- Show Approved status if not pending ---
              <div className="text-green-600 gap-2 text-[16px] flex items-center font-medium">
                <CheckCircle size={20} /> Approved{" "}
                {specificRequest?.approver_comment &&
                  specificRequest.approver_comment !== "" && (
                    <span className="text-gray-600 text-sm ml-2">
                      (Comment: {specificRequest.approver_comment}){" "}
                    </span>
                  )}{" "}
              </div>
            ) : specificRequest?.approver_response === "Reject" ? (
              // --- Show Rejected status if not pending ---
              <div className="text-red-600 gap-1 text-[16px] flex items-center font-medium">
                <XCircle size={20} /> Rejected{" "}
                {specificRequest?.approver_comment &&
                  specificRequest.approver_comment !== "" && (
                    <span className="text-gray-600 text-sm ml-2">
                      (Comment: {specificRequest.approver_comment}){" "}
                    </span>
                  )}{" "}
              </div>
            ) : (
              // --- Handle other statuses (like Completed after someone else finished, Missed, Replaced) ---
              <div className="text-gray-600 gap-1 text-[16px] flex items-center font-medium">
                Status: {specificRequest?.approver_status}{" "}
              </div>
            )}{" "}
          </div>
          {/* It was likely just above this comment */}{" "}
        </div>
        {/* Approver Info */} {/* Document */}{" "}
        <div className="border-t border-gray-200 pt-4 mt-2">
          {" "}
          <div className="mb-6 max-w-[450px]">
            {" "}
            <h2 className="text-lg font-semibold mb-3">Attachment</h2>{" "}
            <div className="bg-gray-100 p-4 rounded-md flex items-center gap-4">
              {" "}
              <div className="flex items-center">
                {" "}
                <div className="bg-blue-100 p-2 rounded-md">
                  {" "}
                  <FileText size={20} className="text-blue-600" />{" "}
                </div>{" "}
                <div className="ml-3">
                  {" "}
                  <p className="font-medium">
                    {specificRequest?.doc_name}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-2 text-sm flex items-center"
                onClick={handleDownload}
              >
                <Download size={16} className="mr-1" />
                Download{" "}
              </button>{" "}
            </div>{" "}
          </div>
          {/* Description */}{" "}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            {" "}
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Description{" "}
            </h3>{" "}
            <p className="text-gray-600 text-sm">
              {specificRequest?.description}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="mb-6">
        {" "}
        {specificRequest?.approver_comment === null ? (
          <>
            {" "}
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Comment (Optional){" "}
            </label>{" "}
            <textarea
              id="comment"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
              rows={3}
              maxLength={255}
              placeholder="Add your comment here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>{" "}
          </>
        ) : (
          <>
            {" "}
            <p className="block text-sm font-medium text-gray-700 mb-2">
              Comment{" "}
            </p>{" "}
            <div className="border border-gray-200 rounded-md p-2 text-gray-700 text-[14px]">
              {specificRequest?.approver_comment || "No comment"}{" "}
            </div>{" "}
          </>
        )}{" "}
      </div>
      {/* Comment Modal */}{" "}
      {isModalOpen === true && (
        <div className="fixed inset-0 flex justify-center items-center bg-[rgba(0,0,0,0.5)]">
          {" "}
          <div className="bg-white shadow-md rounded-lg p-6 w-96">
            {" "}
            <h2 className="text-lg font-medium text-center mb-4">
              Are you sure you want to {status} this request?{" "}
            </h2>{" "}
            <div className="flex justify-center gap-2">
              {" "}
              <button
                onClick={handleApproval}
                className="px-6 py-2 bg-green-500 text-white rounded-lg"
              >
                Yes{" "}
              </button>{" "}
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg"
              >
                No{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}

export default SpecificRequest;
