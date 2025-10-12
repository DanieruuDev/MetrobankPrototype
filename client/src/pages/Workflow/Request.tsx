"use client";

import axios from "axios";
import { useContext, useEffect, useState, useCallback, useMemo } from "react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import type {
  WorkflowApprovalList,
  ApproverDetailedView,
} from "../../Interface/IWorkflow";

import { AuthContext } from "../../context/AuthContext";
import {
  CheckSquare,
  CircleCheck,
  ClipboardList,
  Clock,
  RotateCcw,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import Navbar from "../../components/shared/Navbar";
import { useSidebar } from "../../context/SidebarContext";
import Sidebar from "../../components/shared/Sidebar";
import RequestDataTable from "../../components/approval/RequestDataTable";

function Request() {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const { collapsed } = useSidebar();
  const [requestList, setRequestList] = useState<WorkflowApprovalList[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    WorkflowApprovalList[]
  >([]);
  const [specificRequest, setSpecificRequest] =
    useState<ApproverDetailedView | null>(null);
  const [approverId, setApproverId] = useState<number>();
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  const [activeStatus, setActiveStatus] = useState("All");
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const handleRowClick = (approver_id: number) => {
    setApproverId(approver_id);
  };

  // ✅ centralize status definitions
  const requestStatuses = [
    { label: "All", icon: null, text: "text-gray-600", bg: "bg-gray-600" },
    {
      label: "Requires Action",
      icon: <TriangleAlert />,
      text: "text-blue-600",
      bg: "bg-blue-600",
    },
    {
      label: "Completed",
      icon: <CircleCheck />,
      text: "text-green-600",
      bg: "bg-green-600",
    },
    {
      label: "Missed",
      icon: <Clock />,
      text: "text-yellow-600",
      bg: "bg-yellow-600",
    },
    {
      label: "Rejected",
      icon: <RotateCcw />,
      text: "text-orange-600",
      bg: "bg-orange-600",
    },
    {
      label: "Replaced",
      icon: <RefreshCw />,
      text: "text-purple-600",
      bg: "bg-purple-600",
    },
  ];

  // ✅ centralize filter rules
  const statusGroups: Record<string, (req: WorkflowApprovalList) => boolean> =
    useMemo(
      () => ({
        All: () => true,
        "Requires Action": (req: WorkflowApprovalList) =>
          req.approver.approver_status === "Pending" && req.approver.is_current,
        Upcoming: (req: WorkflowApprovalList) =>
          req.approver.approver_status === "Pending" &&
          !req.approver.is_current,
        Completed: (req: WorkflowApprovalList) =>
          req.approver.approver_status === "Completed",
        Missed: (req: WorkflowApprovalList) =>
          req.approver.approver_status === "Missed",
        Rejected: (req: WorkflowApprovalList) =>
          req.approver.approver_status === "Reject",
        Replaced: (req: WorkflowApprovalList) =>
          req.approver.approver_status === "Replaced",
      }),
      []
    );
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  // ✅ badge counts
  const counts = requestStatuses.reduce((acc, status) => {
    const filterFn = statusGroups[status.label];
    acc[status.label] = filterFn ? requestList.filter(filterFn).length : 0;
    return acc;
  }, {} as Record<string, number>);

  const updateApproverResponse = async (
    response: "Approved" | "Reject" | "Return",
    comment: string | null
  ) => {
    try {
      await axios.put(`${VITE_BACKEND_URL}api/workflow/approve-approval`, {
        approver_id: approverId,
        response,
        comment,
      });
      setSpecificRequest((prev) => ({
        ...prev!,
        approver_response: response,
        approver_comment: comment,
        approver_status: "Completed",
      }));
      getRequestApprovalList();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const getRequestApprovalList = useCallback(async () => {
    try {
      setIsRequestLoading(true);
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/workflow/get-request/${userId}`
      );
      setRequestList(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsRequestLoading(false);
    }
  }, [userId, VITE_BACKEND_URL]);

  const getSpecificRequestApproval = useCallback(async () => {
    if (!approverId) return;
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/workflow/get-specific-request/${approverId}`
      );
      console.log("Fetch detailed approvals", response.data);
      setSpecificRequest(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [approverId, VITE_BACKEND_URL]);

  useEffect(() => {
    getSpecificRequestApproval();
  }, [approverId, getSpecificRequestApproval]);

  useEffect(() => {
    getRequestApprovalList();
  }, [getRequestApprovalList]);

  // ✅ automatically filter
  useEffect(() => {
    const filterFn = statusGroups[activeStatus];
    setFilteredRequests(filterFn ? requestList.filter(filterFn) : []);
  }, [activeStatus, requestList, statusGroups]);

  return (
    <div className="min-h-screen relative">
      <Sidebar />
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"}
        `}
      >
        <Navbar pageName="Approvals" />

        {approverId ? (
          <SpecificRequest
            approver_id={approverId}
            specificRequest={specificRequest}
            goBack={() => setApproverId(undefined)}
            getSpecificRequestApproval={getSpecificRequestApproval}
            updateApproverResponse={updateApproverResponse}
            getRequestApprovalList={getRequestApprovalList}
          />
        ) : (
          <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
            {/* Tabs */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-100 rounded-full lg:w-fit w-fit overflow-x-auto">
                <NavLink
                  to={"/workflow-approval"}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all cursor-pointer whitespace-nowrap`}
                >
                  <ClipboardList
                    size={14}
                    className="sm:w-4 sm:h-4 text-gray-600"
                  />
                  <span className="hidden xs:inline">My Workflows</span>
                  <span className=" text-gray-600 xs:hidden">Workflows</span>
                </NavLink>
                <NavLink
                  to={"/workflow-approval/request"}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all cursor-pointer bg-[#024FA8] text-white shadow-md whitespace-nowrap`}
                >
                  <CheckSquare size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Approval Requests</span>
                  <span className="xs:hidden">Requests</span>
                </NavLink>
              </div>
            </div>

            {/* Status Filters */}
            <div className="bg-white rounded-xl border border-gray-200 lg:w-fit md:w-fit shadow-sm overflow-hidden">
              {/* Mobile Filter Header */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Filter by Status
                    </span>
                    <span className="text-xs text-gray-500">
                      ({requestList.length} total)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Show active filter */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activeStatus === "All"
                          ? "bg-gray-200 text-gray-700"
                          : `${
                              requestStatuses.find(
                                (s) => s.label === activeStatus
                              )?.bg
                            } text-white`
                      }`}
                    >
                      {activeStatus === "All"
                        ? "All"
                        : activeStatus === "Requires Action"
                        ? "Action"
                        : activeStatus === "Completed"
                        ? "Done"
                        : activeStatus === "Replaced"
                        ? "Replace"
                        : activeStatus}
                    </span>
                    {isFilterExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>
              </div>

              {/* Filter Content - Single Section for Both Mobile and Desktop */}
              <div
                className={`transition-all duration-300 ease-in-out ${
                  isFilterExpanded
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                } sm:max-h-none sm:opacity-100 overflow-hidden`}
              >
                <div className="p-1 sm:p-2">
                  <div className="flex gap-0 sm:gap-1 md:gap-2 w-full sm:w-fit overflow-x-auto">
                    {requestStatuses.map((status) => {
                      const isActive = activeStatus === status.label;
                      const count = counts[status.label] || 0;

                      return (
                        <button
                          key={status.label}
                          onClick={() => {
                            setActiveStatus(status.label);
                            // Auto-collapse on mobile after selection
                            if (window.innerWidth < 640) {
                              setIsFilterExpanded(false);
                            }
                          }}
                          className={`relative px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-1 sm:flex-none justify-center sm:justify-start rounded-lg sm:rounded-lg
                ${
                  isActive
                    ? `${status.bg} text-white shadow-md`
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }
                ${
                  status.label !== "All"
                    ? "border-l border-gray-200 sm:border-l-0"
                    : ""
                }
              `}
                        >
                          {status.icon && (
                            <div
                              className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0 ${
                                isActive ? "text-white" : status.text
                              }`}
                            >
                              {status.icon}
                            </div>
                          )}
                          <div className="hidden xs:block truncate">
                            {status.label}
                          </div>
                          <div className="xs:hidden truncate">
                            {status.label === "Requires Action"
                              ? "Action"
                              : status.label === "Completed"
                              ? "Done"
                              : status.label === "Replaced"
                              ? "Replace"
                              : status.label}
                          </div>

                          {count > 0 && (
                            <span
                              className={`ml-0.5 sm:ml-1 md:ml-1.5 px-1 sm:px-1.5 md:px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0
                    ${
                      status.label === "Requires Action"
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-gray-200 text-gray-700"
                    }
                  `}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Data Tables */}
            <div className="mt-5">
              {activeStatus === "Requires Action" ? (
                <>
                  <RequestDataTable
                    title="Requires Your Action"
                    requests={requestList.filter(
                      statusGroups["Requires Action"]
                    )}
                    loading={isRequestLoading}
                    onRowClick={handleRowClick}
                  />
                  <div className="mt-6"></div>
                  <RequestDataTable
                    title="Upcoming"
                    requests={requestList.filter(statusGroups["Upcoming"])}
                    loading={isRequestLoading}
                    onRowClick={handleRowClick}
                  />
                </>
              ) : (
                <RequestDataTable
                  title={`${activeStatus} Requests`}
                  requests={filteredRequests}
                  loading={isRequestLoading}
                  onRowClick={handleRowClick}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Request;
