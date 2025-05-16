import { useState, useEffect } from "react";
import axios from "axios";
import { Approver, DetailedWorkflow } from "../Workflow";
import { Calendar, Clock, Download, FileText, User, X } from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";
import { formatFileSize } from "../../../utils/SizeFileFormat";
import { workflowStatusText } from "../../../utils/StatusBadge";

interface ApprovalProps {
  detailedWorkflow?: DetailedWorkflow;
  setDetailedWorkflow: React.Dispatch<
    React.SetStateAction<DetailedWorkflow | undefined>
  >;
  fetchWorkflow: (requester_id: number, workflow_id: number) => void;
}

function Approval({
  detailedWorkflow,
  setDetailedWorkflow,
  fetchWorkflow,
}: ApprovalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(
    null
  );
  const [newApprover, setNewApprover] = useState("");
  const [reason, setReason] = useState("");
  const workflow =
    Array.isArray(detailedWorkflow) && detailedWorkflow.length > 0
      ? detailedWorkflow[0]
      : undefined;

  useEffect(() => {
    if (Array.isArray(detailedWorkflow) && detailedWorkflow.length > 0) {
      setIsLoading(false);
    }
  }, [detailedWorkflow]);

  useEffect(() => {
    if (detailedWorkflow) {
      setIsLoading(false);
    }
  }, [detailedWorkflow]);

  const handleBack = () => {
    localStorage.removeItem("detailedWorkflow");
    setDetailedWorkflow(undefined);
  };

  const openModal = (approver: Approver) => {
    setSelectedApprover(approver);
    setShowModal(true);
  };
  console.log(detailedWorkflow);
  const handleChangeApprover = async () => {
    if (!selectedApprover || !newApprover || !reason || !workflow) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const API_BASE_URL = "http://localhost:5000";

      const response = await axios.put(
        `${API_BASE_URL}/admin/change-approval/3`,
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

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "Pending":
        return "bg-yellow-400";
      case "In Progress":
        return "bg-blue-400";
      default:
        return "bg-gray-500";
    }
  };

  const handleDownload = () => {
    console.log(workflow);
    if (!workflow.doc_path) {
      console.error("No file to download");
      return;
    }

    const filePath = encodeURIComponent(workflow.doc_path);
    const link = document.createElement("a");
    link.href = `http://localhost:5000/admin/download/${filePath}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  if (isLoading) {
    return <div className="text-center text-gray-500 p-5">Loading...</div>;
  }

  if (!workflow) {
    return (
      <div className="text-center text-red-500 p-5">No data available.</div>
    );
  }

  return (
    <div className="bg-[#ededed] min-h-[88vh] pt-3">
      <div className="p-10 bg-white rounded-sm max-w-[900px] mx-auto">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          ← Back
        </button>
        <div className="flex justify-between">
          <div className="w-full">
            <div className="flex text-[26px] font-semibold text-[#024fa8] space-x-2">
              <h1 className="text-2xl font-bold text-blue-700">
                {workflow.rq_title} # {workflow.workflow_id}
              </h1>
            </div>
            <div className="flex items-center mt-1">
              <span
                className={`${workflowStatusText(workflow.status)} font-medium`}
              >
                {workflow?.status}
              </span>
            </div>
          </div>
          <div className="max-w-[150px]">
            <div className="font-bold text-[18px]">Requester:</div>
            <div className="font-semibold text-[16px]">
              {workflow.requester_email}
            </div>
          </div>
        </div>

        {/* Request Information */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold mb-3">Request Description</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-500 text-sm">Year Level</label>
              <p className="font-medium">{workflow.scholar_level}</p>
            </div>
            <div>
              <label className="block text-gray-500 text-sm">Semester</label>
              <p className="font-medium">{workflow.semester}</p>
            </div>
            <div>
              <label className="block text-gray-500 text-sm">School Year</label>
              <p className="font-medium">{workflow.school_year}</p>
            </div>
          </div>
          <div>
            <label className="block text-gray-500 text-sm">Description</label>
            <p className="font-medium">{workflow.rq_description}</p>
          </div>
          <div className="mt-4 flex items-center">
            <Calendar size={16} className="text-red-500 mr-2" />
            <label className="text-gray-500 text-sm mr-2">Due Date:</label>
            <p className="font-medium">{formatDate(workflow.due_date)}</p>
          </div>
        </div>
        {/* File Attachment */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Attachment</h2>
          <div className="bg-gray-50 p-4 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-md">
                <FileText size={20} className="text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium">{workflow.doc_name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(workflow.doc_size)} • Uploaded{" "}
                  {formatDate(workflow.doc_uploaded_at)}
                </p>
              </div>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-2 text-sm flex items-center"
              onClick={handleDownload}
            >
              <Download size={16} className="mr-1" />
              Download
            </button>
          </div>
        </div>
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-2">Approver Status Legend:</h3>
          <div className="flex flex-row items-center gap-6">
            {["In Progress", "Pending", "Completed"].map((status, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusBgColor(status)}`}
                ></div>
                <span className="text-sm">{status}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Approvers Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Approvers</h2>
          <div className="space-y-4">
            {workflow.approvers
              .sort(
                (a: Approver, b: Approver) =>
                  a.approver_order - b.approver_order
              )
              .map((approver: Approver, index: number) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="bg-gray-200 p-2 rounded-full mr-3">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-medium">{approver.approver_email}</p>
                        <div className="flex items-center mt-1">
                          {approver.is_current === true ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                              <span className="text-blue-800 text-[14px]">
                                In Progress
                              </span>
                              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                Current
                              </span>
                            </>
                          ) : (
                            <>
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  approver.approver_status === "Pending"
                                    ? "bg-amber-300"
                                    : approver.approver_status === "Completed"
                                    ? "bg-green-400"
                                    : approver.approver_status === "Missed"
                                    ? "bg-red-500"
                                    : "bg-fuchsia-500"
                                } mr-2`}
                              ></div>
                              <span
                                className={`${
                                  approver.approver_status === "Pending"
                                    ? "text-amber-300"
                                    : approver.approver_status === "Completed"
                                    ? "text-green-400"
                                    : approver.approver_status === "Missed"
                                    ? "text-red-500"
                                    : "text-fuchsia-500"
                                } text-sm`}
                              >
                                {approver.approver_status}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500 text-sm">
                        Order: {approver.approver_order}
                      </span>
                      {approver.response_time &&
                        approver.response !== "Pending" && (
                          <div className="flex items-center mt-1 justify-end text-sm text-gray-500">
                            <Clock size={14} className="mr-1" />
                            {formatDate(approver.response_time)}
                          </div>
                        )}
                    </div>
                  </div>

                  {approver.response !== "Pending" && (
                    <div className="mt-3 bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-700 flex gap-2">
                        Response:{" "}
                        <p
                          className={`text-[14px] ${
                            approver.response === "Approved"
                              ? " text-green-500"
                              : " text-[#ed3535]"
                          }`}
                        >
                          {approver.response || "Pending"}
                        </p>
                      </div>
                      {approver.comment && (
                        <p className="text-[14px] text-gray-700 mt-2">
                          Comment: {approver.comment}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
                      onClick={() => openModal(approver)}
                    >
                      Change Approver
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Change Approver Modal */}

      {showModal && selectedApprover && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Change Approver</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Select a new approver:
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  value={newApprover}
                  onChange={(e) => setNewApprover(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-1">
                  Reason for reassignment:
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Provide reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                  onClick={handleChangeApprover}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Approval;
