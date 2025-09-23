"use client";

import axios from "axios";
import { useContext, useEffect, useState, useCallback } from "react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import type {
  WorkflowApprovalList,
  ApproverDetailedView,
} from "../../Interface/IWorkflow";

import { AuthContext } from "../../context/AuthContext";
import {
  ArrowRightLeft,
  CheckSquare,
  CircleCheck,
  ClipboardList,
  Clock,
  RotateCcw,
  TriangleAlert,
  XCircle,
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

  const handleRowClick = (approver_id: number) => {
    setApproverId(approver_id);
  };

  // ✅ centralize status definitions
  const requestStatuses = [
    { label: "All", color: "gray" },
    { label: "Requires Action", icon: <TriangleAlert />, color: "blue" },
    { label: "Completed", icon: <CircleCheck />, color: "green" },
    { label: "Missed", icon: <Clock />, color: "yellow" },
    { label: "Canceled", icon: <XCircle />, color: "gray" },
    { label: "Returned", icon: <RotateCcw />, color: "orange" },
    { label: "Replaced", icon: <ArrowRightLeft />, color: "gray" },
  ];

  // ✅ centralize filter rules
  const statusGroups: Record<string, (req: WorkflowApprovalList) => boolean> = {
    All: () => true,
    "Requires Action": (req) =>
      req.approver.approver_status === "Pending" && req.approver.is_current,
    Upcoming: (req) =>
      req.approver.approver_status === "Pending" && !req.approver.is_current,
    Completed: (req) => req.approver.approver_status === "Completed",
    Missed: (req) => req.approver.approver_status === "Missed",
    Canceled: (req) => req.approver.approver_status === "Canceled",
    Returned: (req) => req.approver.approver_status === "Returned",
    Replaced: (req) => req.approver.approver_status === "Replaced",
  };

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
      await axios.put(`http://localhost:5000/api/workflow/approve-approval`, {
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
        `http://localhost:5000/api/workflow/get-request/${userId}`
      );
      setRequestList(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsRequestLoading(false);
    }
  }, [userId]);

  const getSpecificRequestApproval = useCallback(async () => {
    if (!approverId) return;
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-specific-request/${approverId}`
      );
      setSpecificRequest(response.data);
    } catch (error) {
      console.log(error);
    }
  }, [approverId]);

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
  }, [activeStatus, requestList]);

  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-all duration-300`}
    >
      <Navbar pageName="Approvals" />
      <Sidebar />

      {approverId ? (
        <SpecificRequest
          approver_id={approverId}
          specificRequest={specificRequest}
          goBack={() => setApproverId(undefined)}
          getSpecificRequestApproval={getSpecificRequestApproval}
          updateApproverResponse={updateApproverResponse}
        />
      ) : (
        <div className="mx-auto p-6">
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-full w-fit">
              <NavLink
                to={"/workflow-approval"}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer`}
              >
                <ClipboardList size={16} />
                <span>My Workflows</span>
              </NavLink>
              <NavLink
                to={"workflow-request"}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer bg-[#024FA8] text-white shadow-md`}
              >
                <CheckSquare size={16} />
                <span>Approval Requests</span>
              </NavLink>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 p-1 bg-white rounded-xl border border-gray-200 shadow-sm w-fit">
            {requestStatuses.map((status) => {
              const isActive = activeStatus === status.label;
              const count = counts[status.label] || 0;

              return (
                <button
                  key={status.label}
                  onClick={() => setActiveStatus(status.label)}
                  className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2
                    ${
                      isActive
                        ? `bg-${status.color}-600 text-white shadow-md`
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  {status.icon && (
                    <div
                      className={`flex items-center justify-center w-5 h-5 ${
                        isActive ? "text-white" : `text-${status.color}-600`
                      }`}
                    >
                      {status.icon}
                    </div>
                  )}
                  <div>{status.label}</div>
                  {count > 0 && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full
                        ${
                          status.label === "Requires Action"
                            ? "bg-red-500 text-white animate-pulse"
                            : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Data Tables */}
          <div className="mt-5">
            {activeStatus === "Requires Action" ? (
              <>
                <RequestDataTable
                  title="Requires Your Action"
                  requests={requestList.filter(statusGroups["Requires Action"])}
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
  );
}

export default Request;
