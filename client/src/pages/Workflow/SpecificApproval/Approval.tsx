import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Approver, DetailedWorkflow } from "../Workflow";
import {
  Download,
  FileText,
  X,
  Check,
  ArrowLeft,
  User,
  Info,
  Calendar,
  ChevronUp,
  ChevronDown,
  Mail,
} from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";
import { formatFileSize } from "../../../utils/SizeFileFormat";
import { AuthContext } from "../../../context/AuthContext";

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
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(
    null
  );
  const [newApprover, setNewApprover] = useState("");
  const [reason, setReason] = useState("");

  // Use approver_id for expanded state (instead of approver_order)
  const [expandedApproverId, setExpandedApproverId] = useState<number | null>(
    null
  );

  const workflow =
    Array.isArray(detailedWorkflow) && detailedWorkflow.length > 0
      ? detailedWorkflow[0]
      : detailedWorkflow;

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

  // Toggle expansion by approver_id
  const toggleStepExpansion = (approverId: number) => {
    if (expandedApproverId === approverId) {
      setExpandedApproverId(null);
    } else {
      setExpandedApproverId(approverId);
    }
  };

  const handleDownload = () => {
    if (!workflow?.doc_path) {
      console.error("No file to download");
      return;
    }

    const filePath = encodeURIComponent(workflow.doc_path);
    const link = document.createElement("a");
    link.href = `http://localhost:5000/api/workflow/download/${filePath}`;
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
  console.log(sortedApprovers);
  console.log(workflow);
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
    <div className="min-h-[88vh] bg-gray-50 pt-6 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {workflow?.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-2xl md:text-md font-bold text-gray-900">
                    {workflow?.request_title}
                    <span className="text-blue-600 ml-2">
                      #{workflow?.workflow_id}
                    </span>
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Request Type:{" "}
                    <span className="font-medium text-gray-800">
                      {workflow?.request_type}
                    </span>
                  </p>
                </div>

                <div className="mt-4 md:mt-0">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requester</p>
                      <p className="font-medium text-gray-800">
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
          {/* Left Column - Request Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Request Details Card */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <Info className="w-5 h-5 text-blue-600 mr-2" />
                  Request Details
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">
                        Due Date
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {formatDate(workflow?.due_date)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Year Level
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {workflow?.scholar_level}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Semester
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {workflow?.semester}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        School Year
                      </p>
                      <p className="text-base font-medium text-gray-900">
                        {workflow?.school_year}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Description
                    </p>
                    <p className="text-base text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
                      {workflow?.rq_description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachment Card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center flex-1 min-w-0">
                <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="font-medium text-gray-900 truncate max-w-full sm:max-w-xs">
                    {workflow?.doc_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(workflow?.doc_size)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center transition duration-200 w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>

          {/* Right Column - Approval Progress */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-blue-600 mr-2"
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

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          {Math.round(calculateCompletionPercentage())}%
                          Complete
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${calculateCompletionPercentage()}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200"></div>

                  {/* Timeline items */}
                  <div className="space-y-8">
                    {/* Started */}
                    <div className="relative pl-10">
                      <div className="absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-100 border-4 border-white">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-h-20">
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
                        const isCompleted =
                          approver.approver_status === "Completed";
                        const isCurrent = approver.is_current;
                        const isPending =
                          approver.approver_status === "Pending";
                        const isMissed = approver.approver_status === "Missed";

                        return (
                          <div
                            key={approver.approver_id}
                            className="relative pl-10"
                          >
                            {/* Step indicator */}
                            <div
                              className={`absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${
                                isCompleted
                                  ? "bg-green-500"
                                  : isCurrent
                                  ? "bg-blue-500 animate-pulse"
                                  : isPending
                                  ? "bg-yellow-400"
                                  : isMissed
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-5 h-5 text-white" />
                              ) : (
                                <span className="text-white font-medium">
                                  {approver.approver_order}
                                </span>
                              )}
                            </div>

                            {/* Step content */}
                            <div
                              className={`min-h-20 transition-all duration-200 ${
                                expandedApproverId === approver.approver_id
                                  ? "mb-4"
                                  : "mb-0"
                              }`}
                            >
                              <div
                                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                                  expandedApproverId === approver.approver_id
                                    ? "bg-blue-50 border-blue-200"
                                    : isCompleted
                                    ? "bg-green-50 border-green-100"
                                    : isCurrent
                                    ? "bg-blue-50 border-blue-100"
                                    : isPending
                                    ? "bg-yellow-50 border-yellow-100"
                                    : isMissed
                                    ? "bg-red-50 border-red-100"
                                    : "bg-gray-50 border-gray-100"
                                }`}
                                onClick={() =>
                                  toggleStepExpansion(approver.approver_id)
                                }
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center">
                                      <h3 className="font-medium text-gray-900 truncate">
                                        {approver.approver_email}
                                      </h3>
                                      <h3 className="font-medium text-gray-900 truncate">
                                        {approver.approver_title}
                                      </h3>

                                      {isCurrent && (
                                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-1 flex items-center"></div>
                                  </div>
                                  <div className="flex items-center ml-2 flex-shrink-0">
                                    <span className="text-sm text-gray-500 mr-2">
                                      Step {approver.approver_order}
                                    </span>
                                    {expandedApproverId ===
                                    approver.approver_id ? (
                                      <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded content */}
                              {expandedApproverId === approver.approver_id && (
                                <div className="mt-3 space-y-3 pl-4">
                                  {/* Approver details */}
                                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Approver Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-500">
                                          Email
                                        </p>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {approver.approver_email}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-500">
                                          Role/Title
                                        </p>
                                        <p className="text-sm font-medium text-gray-900">
                                          {approver.approver_title}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Response details */}
                                  {approver.response !== "Pending" && (
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Approval Details
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Response
                                          </p>
                                          <p
                                            className={`font-medium ${
                                              approver.response === "Approved"
                                                ? "text-green-600"
                                                : approver.response === "Reject"
                                                ? "text-red-600"
                                                : "text-yellow-600"
                                            }`}
                                          >
                                            {approver.response || "Pending"}
                                          </p>
                                        </div>
                                        {approver.response_time && (
                                          <div>
                                            <p className="text-xs text-gray-500">
                                              Responded
                                            </p>
                                            <p className="font-medium text-gray-700">
                                              {formatDate(
                                                approver.response_time
                                              )}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      {approver.comment && (
                                        <div className="mt-3">
                                          <p className="text-xs text-gray-500">
                                            Comment
                                          </p>
                                          <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                                            {approver.comment}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Timeline metadata */}
                                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                      Timeline
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="flex items-center">
                                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Assigned
                                          </p>
                                          <p className="text-sm font-medium text-gray-700">
                                            {formatDate(
                                              approver.approver_assigned_at
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                        <div>
                                          <p className="text-xs text-gray-500">
                                            Due Date
                                          </p>
                                          <p className="text-sm font-medium text-gray-700">
                                            {formatDate(
                                              approver.approver_due_date
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Change approver button */}
                                  {approver.approver_status === "Completed" ? (
                                    ""
                                  ) : (
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

                    {/* Ended */}
                    <div className="relative pl-10 pb-4">
                      <div
                        className={`absolute left-0 top-0 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${
                          sortedApprovers
                            .filter((a) => a.approver_status !== "Replaced")
                            .every((a) => a.approver_status === "Completed")
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      >
                        <span className="text-white font-medium">E</span>
                      </div>
                      <div className="min-h-20">
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
        </div>
      </div>

      {/* Change Approver Modal */}
      {showModal && selectedApprover && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)]  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Change Approver
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Approver
                  </label>
                  <div className="bg-gray-100 p-3 rounded-lg text-gray-900">
                    {selectedApprover.approver_email}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Approver Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    placeholder="Enter email address"
                    value={newApprover}
                    onChange={(e) => setNewApprover(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Change
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 transition-colors duration-200"
                    placeholder="Please provide a reason for changing the approver..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center"
                  onClick={handleChangeApprover}
                >
                  <Check className="w-4 h-4 mr-1" />
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
