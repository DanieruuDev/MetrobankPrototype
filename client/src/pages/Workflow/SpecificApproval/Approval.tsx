import { useState, useEffect, useContext, useCallback } from "react";
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
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "../../../utils/DateConvertionFormat";
import { formatFileSize } from "../../../utils/SizeFileFormat";
import { AuthContext } from "../../../context/AuthContext";
import ChangeApproverModal from "../../../components/approval/my-approval/ChangeApproverModal";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import { useSidebar } from "../../../context/SidebarContext";
import Sidebar from "../../../components/shared/Sidebar";
import Loading from "../../../components/shared/Loading";

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
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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
  const fetchWorkflow = useCallback(
    async (requester_id: number, workflow_id: number) => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${VITE_BACKEND_URL}api/workflow/get-workflow/${requester_id}/${workflow_id}`
        );
        console.log(response.data);
        setDetailedWorkflow(response.data);
      } catch (error) {
        console.error("Error fetching workflow:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [VITE_BACKEND_URL]
  );

  useEffect(() => {
    fetchWorkflow(Number(userId), Number(workflow_id));
  }, [workflow_id, fetchWorkflow, userId]);

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
      toast.error("Please fill all fields.");
      return;
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}api/workflow/change-approval/${
          workflow.requester_id
        }`,
        {
          workflow_id: workflow.workflow_id,
          old_approver_id: selectedApprover.approver_id,
          new_approver_id: newApprover,
          reason,
        }
      );

      if (response.status === 200) {
        toast.success(
          response.data.message || "Approver changed successfully."
        );
        setShowModal(false);
        setNewApprover("");
        setReason("");
        // Refresh the workflow data
        await fetchWorkflow(Number(userId), workflow.workflow_id);
      }
    } catch (error: unknown) {
      console.error("Error changing approver:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error("Response data:", axiosError.response?.data);
      }
      toast.error("Failed to change approver. Please try again.");
    }
  };
  // Toggle expansion by approver_id
  const toggleStepExpansion = (approverId: number) => {
    const approver = detailedWorkflow?.approvers?.find(
      (a) => a.approver_id === approverId
    );
    const isRejected =
      approver?.approver_status === "Returned" ||
      approver?.response === "Returned";

    if (expandedApproverId === approverId) {
      if (!isRejected) {
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
    link.href = `${VITE_BACKEND_URL}api/workflow/download/${filePath}`;
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
      toast.error("⚠️ Please provide a comment for your response.");
      return;
    }

    try {
      await axios.post(
        `${VITE_BACKEND_URL}api/workflow/requester-response`,
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
      await fetchWorkflow(Number(userId), workflow.workflow_id);
    } catch (error) {
      console.log(error);
      toast.error(`❌ Failed to submit response: ${error}`);
    } finally {
      setIsResponseLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
        } transition-all duration-300 min-h-screen`}
      >
        <Navbar pageName="Approvals" />
        <Sidebar />
        <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <Loading />
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div
        className={`${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
        } transition-all duration-300 min-h-screen`}
      >
        <Navbar pageName="Approvals" />
        <Sidebar />
        <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-red-500 text-lg">
              No workflow data available.
            </div>
          </div>
        </div>
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
      <div
        className={`${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
        } transition-all duration-300  min-h-screen`}
      >
        <Navbar pageName="Approvals" />

        <Sidebar />
        <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          {/* Header Card */}
          <div className="mb-4 mt-4 sm:mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 pl-3  py-2 text-xs sm:text-sm font-medium"
            >
              <ArrowLeft
                size={20}
                className="text-gray-600 group-hover:-translate-x-1 transition-transform duration-200"
              />
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center mb-4 sm:mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>

                    <span className="xs:hidden">Progress</span>
                  </h2>

                  {/* Progress Bar - Fixed width constraints to prevent layout shift */}
                  <div className="mb-6 sm:mb-8 ml-6 sm:ml-10">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div className="min-w-0">
                          {workflow.status === "Failed" ? (
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200 whitespace-nowrap">
                              Failed
                            </span>
                          ) : (
                            <span
                              className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full whitespace-nowrap ${
                                calculateCompletionPercentage() === 100
                                  ? "text-emerald-600 bg-emerald-200"
                                  : "text-blue-600 bg-blue-200"
                              }`}
                            >
                              {Math.round(calculateCompletionPercentage())}%
                              <span className="hidden xs:inline">
                                {" "}
                                Complete
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="overflow-hidden h-1.5 sm:h-2 mb-3 sm:mb-4 text-xs flex rounded bg-gray-200 w-full">
                        <div
                          style={{
                            width:
                              workflow.status === "Failed"
                                ? "100%"
                                : `${calculateCompletionPercentage()}%`,
                          }}
                          className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ease-out
        ${
          workflow.status === "Failed"
            ? "bg-red-500"
            : calculateCompletionPercentage() === 100
            ? "bg-emerald-500"
            : "bg-blue-500"
        }`}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="relative">
                    {/* Vertical connection line */}
                    <div
                      className={`absolute left-5 top-[40px] w-[3px] rounded-full shadow-sm transition-all duration-300 ${
                        sortedApprovers.some(
                          (a) =>
                            a.approver_status !== "Replaced" &&
                            (a.response === "Reject" ||
                              a.response === "Returned")
                        )
                          ? "bg-gradient-to-b from-red-400 via-rose-300 to-red-300"
                          : workflow?.status === "Pending"
                          ? "bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200"
                          : workflow?.status === "In Progress"
                          ? "bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200"
                          : workflow?.status === "Completed"
                          ? "bg-gradient-to-b from-emerald-400 via-blue-300 to-gray-300"
                          : "bg-gradient-to-b from-gray-400 via-gray-300 to-gray-200"
                      }`}
                      style={{
                        height:
                          sortedApprovers.filter(
                            (a) => a.approver_status !== "Replaced"
                          ).length > 0
                            ? "calc(100% - 80px)"
                            : "0",
                      }}
                    ></div>

                    <div className="space-y-6">
                      {/* Started */}
                      <div className="relative pl-14">
                        {/* Icon with glow */}
                        <div className="absolute left-0 top-[18px] flex items-center justify-center">
                          <div
                            className={`absolute w-10 h-10 rounded-full blur-md ${
                              sortedApprovers.some(
                                (a) =>
                                  a.approver_status !== "Replaced" &&
                                  (a.response === "Reject" ||
                                    a.response === "Returned")
                              )
                                ? "bg-red-400/30"
                                : workflow?.status === "Pending"
                                ? "bg-blue-400/30"
                                : workflow?.status === "In Progress"
                                ? "bg-blue-400/30"
                                : workflow?.status === "Completed"
                                ? "bg-emerald-400/30"
                                : "bg-gray-400/30"
                            }`}
                          ></div>
                          <div
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white ${
                              sortedApprovers.some(
                                (a) =>
                                  a.approver_status !== "Replaced" &&
                                  (a.response === "Reject" ||
                                    a.response === "Returned")
                              )
                                ? "bg-gradient-to-br from-red-400 to-red-600"
                                : workflow?.status === "Pending"
                                ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                : workflow?.status === "In Progress"
                                ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                : workflow?.status === "Completed"
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                : "bg-gradient-to-br from-gray-300 to-gray-400"
                            }`}
                          >
                            <Check
                              className="w-5 h-5 text-white"
                              strokeWidth={2.5}
                            />
                          </div>
                        </div>

                        {/* Card */}
                        <div
                          className={`group relative rounded-2xl border shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
                            sortedApprovers.some(
                              (a) =>
                                a.approver_status !== "Replaced" &&
                                (a.response === "Reject" ||
                                  a.response === "Returned")
                            )
                              ? "border-red-200/50"
                              : workflow?.status === "Pending"
                              ? "border-blue-200/50"
                              : workflow?.status === "In Progress"
                              ? "border-blue-200/50"
                              : workflow?.status === "Completed"
                              ? "border-emerald-200/50"
                              : "border-gray-200/50"
                          }`}
                        >
                          <div
                            className={`absolute inset-0 backdrop-blur-lg ${
                              sortedApprovers.some(
                                (a) =>
                                  a.approver_status !== "Replaced" &&
                                  (a.response === "Reject" ||
                                    a.response === "Returned")
                              )
                                ? "bg-gradient-to-br from-red-50/90 via-rose-50/80 to-pink-50/90"
                                : workflow?.status === "Pending"
                                ? "bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-cyan-50/90"
                                : workflow?.status === "In Progress"
                                ? "bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-cyan-50/90"
                                : workflow?.status === "Completed"
                                ? "bg-gradient-to-br from-emerald-50/90 via-green-50/80 to-teal-50/90"
                                : "bg-gradient-to-br from-gray-50/90 via-slate-50/80 to-gray-50/90"
                            }`}
                          ></div>
                          <div className="relative px-6 py-5">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                  Started
                                </h3>
                                <div className="flex items-center gap-2">
                                  <svg
                                    className={`w-4 h-4 ${
                                      sortedApprovers.some(
                                        (a) =>
                                          a.approver_status !== "Replaced" &&
                                          (a.response === "Reject" ||
                                            a.response === "Returned")
                                      )
                                        ? "text-red-600"
                                        : workflow?.status === "Pending"
                                        ? "text-blue-600"
                                        : workflow?.status === "In Progress"
                                        ? "text-blue-600"
                                        : workflow?.status === "Completed"
                                        ? "text-emerald-600"
                                        : "text-gray-400"
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <p className="text-sm font-medium text-gray-700">
                                    {workflow?.logs && workflow.logs.length > 0
                                      ? formatDate(workflow.logs[0].change_at)
                                      : formatDate(
                                          workflow?.approvers?.[0]
                                            ?.approver_assigned_at
                                        ) || "—"}
                                  </p>
                                </div>
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
                          const isRejected =
                            approver.response === "Reject" ||
                            approver.response === "Returned";
                          const isCurrent = approver.is_current && !isRejected;

                          const displayStatus = isRejected
                            ? "Rejected"
                            : isCurrent
                            ? "Current"
                            : approver.approver_status;

                          const isPending = displayStatus === "Pending";

                          return (
                            <div
                              key={approver.approver_id}
                              className="relative pl-14"
                            >
                              {/* Step indicator icon with glow effect */}
                              <div className="absolute left-0 top-[18px] flex items-center justify-center">
                                {isApproved && (
                                  <div className="absolute w-10 h-10 rounded-full bg-emerald-400/30 blur-md"></div>
                                )}
                                {isCurrent && (
                                  <div className="absolute w-10 h-10 rounded-full bg-blue-400/30 blur-md animate-glow"></div>
                                )}
                                <div
                                  className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white transition-all duration-300 ${
                                    isApproved
                                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                      : isCurrent
                                      ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                      : isPending
                                      ? "bg-gradient-to-br from-gray-300 to-gray-400"
                                      : isRejected
                                      ? "bg-gradient-to-br from-red-400 to-red-600"
                                      : "bg-gradient-to-br from-gray-300 to-gray-500"
                                  }`}
                                >
                                  {isApproved ? (
                                    <Check
                                      className="w-5 h-5 text-white"
                                      strokeWidth={2.5}
                                    />
                                  ) : isRejected ? (
                                    <X
                                      className="w-5 h-5 text-white"
                                      strokeWidth={2.5}
                                    />
                                  ) : (
                                    <span className="text-white font-bold text-sm">
                                      {approver.approver_order}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Card content */}
                              <div className="transition-all duration-200">
                                <div
                                  className={`group relative rounded-2xl border shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                                    sortedApprovers.some(
                                      (a) =>
                                        a.approver_status !== "Replaced" &&
                                        (a.response === "Reject" ||
                                          a.response === "Returned")
                                    )
                                      ? "border-red-200/60"
                                      : isApproved
                                      ? "border-emerald-200/60"
                                      : isCurrent
                                      ? "border-blue-200/60"
                                      : isPending
                                      ? "border-gray-200/60"
                                      : "border-gray-200/60"
                                  }`}
                                  onClick={() =>
                                    toggleStepExpansion(approver.approver_id)
                                  }
                                >
                                  <div
                                    className={`absolute inset-0 backdrop-blur-lg ${
                                      sortedApprovers.some(
                                        (a) =>
                                          a.approver_status !== "Replaced" &&
                                          (a.response === "Reject" ||
                                            a.response === "Returned")
                                      )
                                        ? "bg-gradient-to-br from-red-50/90 via-rose-50/80 to-pink-50/90"
                                        : workflow?.status === "Pending"
                                        ? "bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-cyan-50/90"
                                        : workflow?.status === "In Progress"
                                        ? "bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-cyan-50/90"
                                        : workflow?.status === "Completed"
                                        ? "bg-gradient-to-br from-emerald-50/90 via-green-50/80 to-teal-50/90"
                                        : "bg-gradient-to-br from-gray-50/90 via-slate-50/80 to-gray-50/90"
                                    }`}
                                  ></div>
                                  <div className="relative px-6 py-5">
                                    <div className="flex items-start justify-between gap-4">
                                      {/* Left side - Approver info */}
                                      <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold truncate text-gray-900">
                                          {approver.approver_name}
                                        </h3>
                                        <p className="text-sm truncate mt-0.5 text-gray-600">
                                          {approver.approver_email}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2.5">
                                          <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                              isApproved
                                                ? "bg-emerald-50/80 text-emerald-700 border border-emerald-200/60"
                                                : isCurrent
                                                ? "bg-blue-50/80 text-blue-700 border border-blue-200/60"
                                                : isRejected
                                                ? "bg-red-50/80 text-red-700 border border-red-200/60"
                                                : "bg-gray-50/80 text-gray-700 border border-gray-200/60"
                                            }`}
                                          >
                                            {approver.approver_role ||
                                              "Approver"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Right side - Status and info */}
                                      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                                        <span
                                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${
                                            isApproved
                                              ? "bg-emerald-500 text-white"
                                              : isCurrent
                                              ? "bg-blue-500 text-white"
                                              : isPending
                                              ? "bg-gray-100 text-gray-700 border-2 border-gray-300"
                                              : isRejected
                                              ? "bg-red-500 text-white"
                                              : "bg-gray-100 text-gray-700 border-2 border-gray-300"
                                          }`}
                                        >
                                          {displayStatus === "Completed" &&
                                          approver.response
                                            ? approver.response
                                            : displayStatus}
                                        </span>

                                        <div className="text-xs text-right text-gray-600">
                                          <div className="font-medium">
                                            Due: {approver.approver_due_date}
                                          </div>
                                          <div className="mt-1 font-bold">
                                            Step {approver.approver_order}
                                          </div>
                                        </div>

                                        {expandedApproverId ===
                                        approver.approver_id ? (
                                          <ChevronUp className="w-5 h-5 mt-1 text-gray-500" />
                                        ) : (
                                          <ChevronDown className="w-5 h-5 mt-1 text-gray-500" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Return Feedback Section - Always present but conditionally visible */}
                                {(isRejected ||
                                  approver.return_feedback.length > 0) && (
                                  <div
                                    className={`bg-gradient-to-br from-red-50/90 via-rose-50/80 to-pink-50/90 backdrop-blur-sm p-4 rounded-lg border border-red-200 mt-2 transition-all duration-200 ${
                                      expandedApproverId ===
                                        approver.approver_id ||
                                      approver.approver_status === "Returned"
                                        ? "block"
                                        : "hidden"
                                    }`}
                                  >
                                    <h4 className="text-sm font-medium text-red-900 mb-4 flex items-center">
                                      <svg
                                        className="w-4 h-4 mr-2 text-red-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Rejection Feedback
                                    </h4>

                                    {approver.return_feedback.length === 0 &&
                                      isRejected && (
                                        <div className="text-sm text-red-800 italic bg-red-100/80 p-3 rounded-lg border border-red-300">
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
                                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                            <div className="flex-1">
                                              <p className="text-xs text-gray-600 font-medium">
                                                Returned by{" "}
                                                {feedback.created_by_name} (
                                                {feedback.created_by_email}){" "}
                                                {feedback.requester_take_action && (
                                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs ml-2">
                                                    Action Required
                                                  </span>
                                                )}
                                              </p>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                              {formatDate(feedback.created_at)}
                                            </p>
                                          </div>
                                          <p className="text-sm text-red-900 bg-red-100/80 p-3 rounded-lg border border-red-300">
                                            {feedback.reason}
                                          </p>

                                          {/* Previous Responses */}
                                          {feedback.requester_responses &&
                                            feedback.requester_responses
                                              .length > 0 && (
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
                                                <label className="block text-sm font-bold text-gray-800 mb-2">
                                                  Your Response
                                                </label>
                                                <textarea
                                                  className="w-full border-2 border-blue-200 bg-blue-50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                                                  placeholder="Explain how you've addressed the concerns..."
                                                  rows={4}
                                                  value={
                                                    returnedResponseComment
                                                  }
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
                                                <div className="border-2 border-dashed border-white/30 bg-white/5 backdrop-blur-sm rounded p-3 text-center hover:border-orange-400/50 transition-colors">
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
                                                      {
                                                        returnedResponseFile.name
                                                      }
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
                                                className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center border border-red-500/30 shadow-lg hover:shadow-xl"
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

                                {expandedApproverId ===
                                  approver.approver_id && (
                                  <div className="mt-3 bg-gray-50 rounded-lg border border-gray-200 p-4">
                                    {/* Response details only */}
                                    {approver.response !== "Pending" && (
                                      <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                          Approval Details
                                        </h4>
                                        <div className="space-y-3">
                                          {approver.response_time && (
                                            <div>
                                              <p className="text-xs text-gray-500 mb-1">
                                                Responded
                                              </p>
                                              <p className="text-sm text-gray-900 font-medium">
                                                {formatDate(
                                                  approver.response_time
                                                )}
                                              </p>
                                            </div>
                                          )}
                                          {approver.comment && (
                                            <div>
                                              <p className="text-xs text-gray-500 mb-1">
                                                Comment
                                              </p>
                                              <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
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
                                      approver.approver_status !==
                                        "Canceled" && (
                                        <button
                                          className="w-full px-4 py-2.5 bg-white hover:bg-gray-50 text-red-600 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center border border-red-200 hover:border-red-300"
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
                      <div className="relative pl-14">
                        {/* Icon with conditional glow */}
                        <div className="absolute left-0 top-[18px] flex items-center justify-center">
                          {(sortedApprovers
                            .filter((a) => a.approver_status !== "Replaced")
                            .every((a) => a.approver_status === "Completed") ||
                            sortedApprovers.some(
                              (a) =>
                                a.approver_status !== "Replaced" &&
                                (a.response === "Reject" ||
                                  a.response === "Returned")
                            )) && (
                            <div
                              className={`absolute w-10 h-10 rounded-full blur-md ${
                                sortedApprovers.some(
                                  (a) =>
                                    a.approver_status !== "Replaced" &&
                                    (a.response === "Reject" ||
                                      a.response === "Returned")
                                )
                                  ? "bg-red-400/30"
                                  : workflow?.status === "Pending"
                                  ? "bg-blue-400/30"
                                  : workflow?.status === "In Progress"
                                  ? "bg-blue-400/30"
                                  : workflow?.status === "Completed"
                                  ? "bg-emerald-400/30"
                                  : "bg-gray-400/30"
                              }`}
                            ></div>
                          )}
                          <div
                            className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white transition-all duration-300 ${
                              sortedApprovers.some(
                                (a) =>
                                  a.approver_status !== "Replaced" &&
                                  (a.response === "Reject" ||
                                    a.response === "Returned")
                              )
                                ? "bg-gradient-to-br from-red-400 to-red-600"
                                : workflow?.status === "Pending"
                                ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                : workflow?.status === "In Progress"
                                ? "bg-gradient-to-br from-blue-400 to-blue-600"
                                : workflow?.status === "Completed"
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                                : "bg-gradient-to-br from-gray-300 to-gray-400"
                            }`}
                          >
                            <span className="text-white font-bold text-sm">
                              E
                            </span>
                          </div>
                        </div>

                        {/* Card */}
                        <div
                          className={`group relative rounded-2xl border shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${
                            sortedApprovers.some(
                              (a) =>
                                a.approver_status !== "Replaced" &&
                                (a.response === "Reject" ||
                                  a.response === "Returned")
                            )
                              ? "border-red-200/50"
                              : workflow?.status === "Pending"
                              ? "border-blue-200/50"
                              : workflow?.status === "In Progress"
                              ? "border-blue-200/50"
                              : workflow?.status === "Completed"
                              ? "border-emerald-200/50"
                              : "border-gray-200/50"
                          }`}
                        >
                          <div
                            className={`absolute inset-0 backdrop-blur-lg ${
                              sortedApprovers.some(
                                (a) =>
                                  a.approver_status !== "Replaced" &&
                                  (a.response === "Reject" ||
                                    a.response === "Returned")
                              )
                                ? "bg-gradient-to-br from-red-50/90 via-rose-50/80 to-pink-50/90"
                                : workflow?.status === "Pending"
                                ? "bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-cyan-50/90"
                                : workflow?.status === "In Progress"
                                ? "bg-gradient-to-br from-blue-50/90 via-sky-50/80 to-cyan-50/90"
                                : workflow?.status === "Completed"
                                ? "bg-gradient-to-br from-emerald-50/90 via-green-50/80 to-teal-50/90"
                                : "bg-gradient-to-br from-gray-50/90 via-slate-50/80 to-gray-50/90"
                            }`}
                          ></div>
                          <div className="relative px-6 py-5">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                  Ended
                                </h3>
                                {(workflow?.status === "Completed" ||
                                  workflow?.status === "Failed" ||
                                  sortedApprovers.some(
                                    (a) =>
                                      a.approver_status !== "Replaced" &&
                                      (a.response === "Reject" ||
                                        a.response === "Returned")
                                  ) ||
                                  sortedApprovers
                                    .filter(
                                      (a) => a.approver_status !== "Replaced"
                                    )
                                    .every(
                                      (a) => a.approver_status === "Completed"
                                    )) && (
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className={`w-4 h-4 ${
                                        sortedApprovers.some(
                                          (a) =>
                                            a.approver_status !== "Replaced" &&
                                            (a.response === "Reject" ||
                                              a.response === "Returned")
                                        )
                                          ? "text-red-600"
                                          : workflow?.status === "Pending"
                                          ? "text-blue-600"
                                          : workflow?.status === "In Progress"
                                          ? "text-blue-600"
                                          : workflow?.status === "Completed"
                                          ? "text-emerald-600"
                                          : "text-gray-400"
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <p className="text-sm font-medium text-gray-700">
                                      {sortedApprovers.some(
                                        (a) =>
                                          a.approver_status !== "Replaced" &&
                                          (a.response === "Reject" ||
                                            a.response === "Returned")
                                      )
                                        ? "Rejected on"
                                        : "Completed on"}{" "}
                                      {(() => {
                                        // Find the last approver's response time
                                        const lastApprover = sortedApprovers
                                          .filter(
                                            (a) =>
                                              a.approver_status !== "Replaced"
                                          )
                                          .reverse()
                                          .find((a) => a.response_time);

                                        return formatDate(
                                          lastApprover?.response_time ||
                                            workflow?.updated_at
                                        );
                                      })()}
                                    </p>
                                  </div>
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

            <div className="lg:col-span-1 space-y-2 min-w-0">
              <div className="">
                <div className="overflow-hidden">
                  {/* Header */}
                  <div className="bg-blue-500/10 backdrop-blur-sm px-6 py-4 border-b rounded-t-2xl border-white/30">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center">
                      <Info className="w-5 h-5 text-blue-600 mr-3" />
                      Details
                    </h2>
                  </div>

                  {/* Request Title */}
                  <div className="px-6 py-4 bg-blue-200/10 backdrop-blur-sm border-b border-white/30">
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Workflow Title
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {workflow?.request_title}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Status
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
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
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Requester
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-900 truncate">
                            {workflow?.requester_email}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Workflow ID
                        </p>
                        <p className="text-sm text-gray-900 truncate">
                          {workflow?.workflow_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-2  divide-y md:divide-y-0 md:divide-x divide-white/30 bg-blue-200/10 border-t-4 border-white">
                    {/* Column 1 */}
                    <div className="p-6 space-y-4">
                      {/* Empty column - can be used for additional info if needed */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Due Date
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatDate(workflow?.due_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase">
                          Request Type
                        </p>
                        <p className="text-sm text-gray-900">
                          {workflow?.approval_req_type}
                        </p>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase">
                          Semester
                        </p>
                        <p className="text-sm text-gray-900">
                          {workflow?.semester}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase">
                          School Year
                        </p>
                        <p className="text-sm text-gray-900">
                          {workflow?.school_year}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-6 py-4 bg-blue-200/10 backdrop-blur-sm border-t-3 border-white">
                    <p className="text-xs font-medium uppercase text-gray-500 mb-2">
                      Description
                    </p>
                    <p className="text-sm">{workflow?.rq_description}</p>
                  </div>

                  {/* Attachments */}
                  <div className="px-6 py-4 border-t-3 bg-blue-200/10 backdrop-blur-sm border-white">
                    <p className="text-xs font-medium uppercase text-gray-500 mb-3">
                      Supporting Documents
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 break-words">
                          {workflow?.approval_req_type
                            ? `${workflow.approval_req_type}.xlsx`
                            : "Request Type.xlsx"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(workflow?.doc_size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="bg-blue-600/80 backdrop-blur-sm hover:bg-blue-700/80 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 transition duration-200 border border-blue-500/30 shadow-lg hover:shadow-xl"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-200/10 backdrop-blur-md shadow-lg p-4 sm:p-6 rounded-xl">
                <p className="text-xs font-medium uppercase text-gray-500 mb-4">
                  Activity
                </p>
                <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {workflow?.logs?.map((log: WorkflowLog) => (
                    <div
                      key={log.log_id}
                      className="flex items-start gap-3 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4 last:border-0"
                    >
                      {/* Avatar Circle */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/80 backdrop-blur-sm flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm sm:text-base border border-blue-400/30 shadow-lg">
                        {log.actor_name.charAt(0)}
                      </div>

                      {/* Log Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                          <p className="text-sm sm:text-base font-medium text-gray-900">
                            {log.actor_name}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDate(log.change_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {log.actor_type}
                        </p>

                        {/* Comments if available */}
                        {log.comments && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs sm:text-sm text-gray-700 italic break-words">
                              "{log.comments}"
                            </p>
                          </div>
                        )}

                        {/* Status Change */}
                        {log.old_status && log.new_status && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <span className="text-gray-600">Status:</span>
                            <span className="line-through text-gray-500">
                              {log.old_status}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-gray-900">
                              {log.new_status}
                            </span>
                          </div>
                        )}
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
    </>
  );
}

export default Approval;
