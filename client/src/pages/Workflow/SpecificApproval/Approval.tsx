import Sidebar from "../../../components/shared/Sidebar";
import { useState, useEffect } from "react";
import axios from "axios";
import { Approver, DetailedWorkflow } from "../Workflow";
import { Clock, Download, FileText, X, Check } from "lucide-react";
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
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "Pending":
        return "bg-yellow-400";
      case "In Progress":
        return "bg-blue-500";
      case "Missed":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-600";
      case "Pending":
        return "text-yellow-600";
      case "In Progress":
        return "text-blue-600";
      case "Missed":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const toggleStepExpansion = (order: number) => {
    if (expandedStep === order) {
      setExpandedStep(null);
    } else {
      setExpandedStep(order);
    }
  };

  const handleDownload = () => {
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
    const totalSteps = sortedApprovers.length + 2; // +2 for Started and Ended
    let completedSteps = 1; // Started is always

    // Count completed approver steps
    sortedApprovers.forEach((approver) => {
      if (approver.approver_status === "Completed") {
        completedSteps++;
      }
    });

    // If all steps are completed, include Ended
    if (sortedApprovers.every((a) => a.approver_status === "Completed")) {
      completedSteps++; // Include Ended
      return 100;
    }

    return (completedSteps / totalSteps) * 100;
  };

  return (
    <div className="min-h-[88vh] bg-gray-50 pt-3 pb-8">
      <Sidebar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-2">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mx-auto">
          {/* Header Section */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex flex-col  md:items-start md:justify-between gap-4">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center w-fit px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back
              </button>

              {/* Title + Status + Requester Info */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-4 mt-5">
                {/* Title and Status */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {workflow.rq_title}{" "}
                    <span className="text-blue-600">
                      #{workflow.workflow_id}
                    </span>
                  </h1>
                  <div className="mt-1">
                    <span
                      className={`${workflowStatusText(
                        workflow.status
                      )} font-medium px-2 py-1 rounded-full text-sm inline-block`}
                    >
                      {workflow?.status}
                    </span>
                  </div>
                </div>

                {/* Requester Info */}
                <div className="bg-gray-100 p-3 rounded-lg text-sm ">
                  <div className="font-semibold text-gray-600">Requester:</div>
                  <div className="font-medium text-gray-800 truncate">
                    {workflow.requester_email}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                  clipRule="evenodd"
                />
              </svg>
              Request Description
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Year Level
                </label>
                <p className="font-medium text-gray-800">
                  {workflow.scholar_level}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Semester
                </label>
                <p className="font-medium text-gray-800">{workflow.semester}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  School Year
                </label>
                <p className="font-medium text-gray-800">
                  {workflow.school_year}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Description
              </label>
              <p className="font-medium text-gray-800">
                {workflow.rq_description}
              </p>
            </div>

            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <label className="text-sm font-medium text-gray-500 mr-2">
                Due Date:
              </label>
              <p className="font-medium text-gray-800">
                {formatDate(workflow.due_date)}
              </p>
            </div>
          </div>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              Attachment
            </h2>

            <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center flex-1 min-w-0">
                <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="font-medium text-gray-800 truncate">
                    {workflow.doc_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(workflow.doc_size)} • Uploaded{" "}
                    {formatDate(workflow.doc_uploaded_at)}
                  </p>
                </div>
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center transition-colors duration-200 whitespace-nowrap"
                onClick={handleDownload}
              >
                <Download size={16} className="mr-2" />
                Download File
              </button>
            </div>
          </div>

          {/* Progressive Bar */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 10-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Approval Progress
            </h2>

            <div className="relative">
              {/* Progress line container */}
              <div className="absolute left-4 top-0 h-full w-1.5 bg-gray-200 rounded-full">
                {/* Progress fill - only fill up to last completed step */}
                <div
                  className={`absolute top-0 left-0 w-full rounded-full bg-green-500 transition-all duration-500`}
                  style={{
                    height: `${calculateCompletionPercentage()}%`,
                  }}
                ></div>
              </div>

              {/* Steps */}
              <div className="space-y-8 pl-10">
                {/* Started Placeholder - always completed */}
                <div className="relative">
                  <div className="absolute -left-9 top-0 flex items-center justify-center w-8 h-8 rounded-full border-4 border-white bg-green-500">
                    <span className="text-white text-sm font-bold">S</span>
                  </div>
                  <div className="ml-2 pl-2 pb-12">
                    <h3 className="font-medium text-gray-800">Started</h3>
                  </div>
                </div>

                {sortedApprovers.map((approver, index) => {
                  const isCompleted = approver.approver_status === "Completed";
                  const isCurrent = approver.is_current;
                  const isPending = approver.approver_status === "Pending";
                  const isMissed = approver.approver_status === "Missed";

                  return (
                    <div key={index} className="relative">
                      {/* Step indicator */}
                      <div
                        className={`absolute -left-9 top-0 flex items-center justify-center w-8 h-8 rounded-full border-4 border-white ${
                          isCompleted
                            ? "bg-green-500"
                            : isCurrent
                            ? "bg-blue-500"
                            : isPending
                            ? "bg-yellow-400"
                            : isMissed
                            ? "bg-red-500"
                            : "bg-gray-400"
                        } ${isCurrent && !isCompleted ? "animate-pulse" : ""}`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-white text-sm font-bold">
                            {approver.approver_order}
                          </span>
                        )}
                      </div>

                      {/* Step content */}
                      <div
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                          expandedStep === approver.approver_order
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() =>
                          toggleStepExpansion(approver.approver_order)
                        }
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {approver.approver_email}
                            </h3>
                            <div className="flex items-center mt-1">
                              <span
                                className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(
                                  approver.approver_status
                                )}`}
                              ></span>
                              <span
                                className={`text-sm font-medium ${getStatusTextColor(
                                  approver.approver_status
                                )}`}
                              >
                                {approver.approver_status}
                                {isCurrent && (
                                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                    Current
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Step {approver.approver_order}
                          </div>
                        </div>
                      </div>

                      {/* Expanded content */}
                      {expandedStep === approver.approver_order && (
                        <div className="mt-3 space-y-3">
                          {approver.response !== "Pending" && (
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <div className="text-sm text-gray-700 flex gap-2">
                                <span className="font-medium">Response:</span>
                                <p
                                  className={`font-medium ${
                                    approver.response === "Approved"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {approver.response || "Pending"}
                                </p>
                              </div>
                              {approver.comment && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700">
                                    Comment:
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                                    {approver.comment}
                                  </p>
                                </div>
                              )}
                              {approver.response_time && (
                                <div className="flex items-center mt-2 text-sm text-gray-500">
                                  <Clock size={14} className="mr-1" />
                                  {formatDate(approver.response_time)}
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
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
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Change Approver
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Ended Placeholder */}
                <div className="relative">
                  <div
                    className={`absolute -left-9 top-0 flex items-center justify-center w-8 h-8 rounded-full border-4 border-white ${
                      sortedApprovers.every(
                        (a) => a.approver_status === "Completed"
                      )
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  >
                    <span className="text-white text-sm font-bold">E</span>
                  </div>
                  <div className="ml-2 pl-2">
                    <h3 className="font-medium text-gray-800">Ended</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Approver Modal */}
      {showModal && selectedApprover && (
        <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Change Approver
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Current Approver
                </label>
                <div className="bg-gray-100 p-3 rounded-lg text-gray-800">
                  {selectedApprover.approver_email}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  New Approver Email
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter email address"
                  value={newApprover}
                  onChange={(e) => setNewApprover(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Reason for Reassignment
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 transition-colors duration-200"
                  placeholder="Provide reason for changing approver"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center"
                  onClick={handleChangeApprover}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Confirm Change
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
