import axios from "axios";
import { useContext, useEffect, useState, useCallback } from "react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import {
  WorkflowApprovalList,
  ApproverDetailedView,
} from "../../Interface/IWorkflow";

import { AuthContext } from "../../context/AuthContext";
import ApproverTable from "../../components/approval/ApproverTable";

function Request() {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [requestList, setRequestList] = useState<WorkflowApprovalList[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    WorkflowApprovalList[]
  >([]);
  const [specificRequest, setSpecificRequest] =
    useState<ApproverDetailedView | null>(null);
  const [approverId, setApproverId] = useState<number>();

  const statuses = [
    { label: "All" },
    { label: "Pending", color: "yellow" },
    { label: "Missed", color: "red" },
    { label: "Replaced", color: "gray" },
    { label: "Completed", color: "green" },
  ];

  const [activeStatus, setActiveStatus] = useState("All");

  const handleRowClick = (approver_id: number) => {
    setApproverId(approver_id);
  };

  const updateApproverResponse = async (
    response: "Approved" | "Reject",
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
        approver_status: "Completed", // The backend sets this to Completed
      }));
      getRequestApproval();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const getRequestApproval = useCallback(async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-request/${userId}`
      );
      setRequestList(response.data);
      // Don't set filteredRequests here - let the useEffect handle filtering
    } catch (error) {
      console.log(error);
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
    if (!requestList) return;

    if (activeStatus === "All") {
      setFilteredRequests(requestList);
    } else if (activeStatus === "Pending") {
      // For pending, include workflows that have any non-completed approvers
      const filtered = requestList.filter((request) =>
        request.approvers.some((a) => a.approver_status !== "Completed")
      );
      setFilteredRequests(filtered);
    } else {
      // Filter workflows if ANY approver matches the activeStatus
      const filtered = requestList.filter((request) =>
        request.approvers.some((a) => a.approver_status === activeStatus)
      );
      setFilteredRequests(filtered);
    }
  }, [activeStatus, requestList]);

  useEffect(() => {
    getSpecificRequestApproval();
  }, [approverId, getSpecificRequestApproval]);

  useEffect(() => {
    getRequestApproval();
  }, [getRequestApproval]);

  // Initial filter setup when requestList is first loaded
  useEffect(() => {
    if (requestList.length > 0 && filteredRequests.length === 0) {
      setFilteredRequests(requestList);
    }
  }, [requestList, filteredRequests.length]);

  useEffect(() => {
    if (specificRequest?.approver_status === "Completed") {
      getRequestApproval();
    }
  }, [specificRequest, getRequestApproval]);

  // ✅ Flatten approvers for "your turn" etc.
  // ✅ Only include the current approver per workflow
  const flattenApprovers = (requests: WorkflowApprovalList[]) =>
    requests.flatMap((workflow) => {
      const currentApprover = workflow.approvers.find(
        (ap) => ap.is_current === true
      );
      return workflow.approvers.map((approver) => ({
        ...approver,
        workflow_id: workflow.workflow_id,
        workflow_title: workflow.workflow_title,
        workflow_status: workflow.workflow_status,
        approval_req_type: workflow.approval_req_type,
        created_by: workflow.created_by,
        current_approver_name: currentApprover
          ? currentApprover.approver_name
          : "—",
        current_approver_role: currentApprover
          ? currentApprover.approver_role
          : "—",
        // ✅ mark whether this row is the current approver
        is_current_display: approver.is_current === true,
      }));
    });

  // Calculate counts from the original requestList for stats overview
  const allApproversOriginal = flattenApprovers(requestList);
  const yourTurnOriginal = allApproversOriginal.filter(
    (a) =>
      a.is_current &&
      a.approver_status !== "Completed" &&
      a.approver_status !== "Replaced" &&
      a.approver_status !== "Missed" &&
      a.user_id === userId
  );
  const othersTurnOriginal = allApproversOriginal.filter(
    (a) =>
      !a.is_current &&
      a.approver_status !== "Completed" &&
      a.approver_status !== "Replaced" &&
      a.approver_status !== "Missed"
  );
  const completedTurnOriginal = allApproversOriginal.filter(
    (a) => a.approver_status === "Completed"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {approverId ? (
        <SpecificRequest
          approver_id={approverId}
          specificRequest={specificRequest}
          goBack={() => setApproverId(undefined)}
          getSpecificRequestApproval={getSpecificRequestApproval}
          updateApproverResponse={updateApproverResponse}
        />
      ) : (
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Section */}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Turn</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {yourTurnOriginal.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {othersTurnOriginal.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {completedTurnOriginal.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                </div>
              </div>
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 p-1 bg-white rounded-xl border border-gray-200 shadow-sm w-fit">
              {statuses.map((status) => {
                const isActive = activeStatus === status.label;
                const count =
                  status.label === "All"
                    ? yourTurnOriginal.length +
                      othersTurnOriginal.length +
                      completedTurnOriginal.length +
                      allApproversOriginal.filter(
                        (a) => a.approver_status === "Missed"
                      ).length +
                      allApproversOriginal.filter(
                        (a) => a.approver_status === "Replaced"
                      ).length
                    : status.label === "Pending"
                    ? yourTurnOriginal.length + othersTurnOriginal.length
                    : allApproversOriginal.filter(
                        (a) => a.approver_status === status.label
                      ).length;

                return (
                  <button
                    key={status.label}
                    onClick={() => setActiveStatus(status.label)}
                    className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {status.label}
                    {count > 0 && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          isActive
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Your Turn Section */}
            {(activeStatus === "All" || activeStatus === "Pending") && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Your Turn
                    </h2>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {yourTurnOriginal.length} items
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {(() => {
                    const displayApprovers = yourTurnOriginal;

                    return displayApprovers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          All caught up!
                        </h3>
                        <p className="text-gray-500">
                          No items require your action at the moment.
                        </p>
                      </div>
                    ) : (
                      <ApproverTable
                        approvers={displayApprovers}
                        onRowClick={handleRowClick}
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Upcoming Section */}
            {(activeStatus === "All" || activeStatus === "Pending") && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Upcoming
                    </h2>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      {othersTurnOriginal.length} items
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {(() => {
                    const displayApprovers = othersTurnOriginal;

                    return displayApprovers.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No upcoming items
                        </h3>
                        <p className="text-gray-500">
                          No items are currently awaiting others' approval.
                        </p>
                      </div>
                    ) : (
                      <ApproverTable
                        approvers={displayApprovers}
                        onRowClick={handleRowClick}
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Completed Section */}
            {(activeStatus === "All" || activeStatus === "Completed") && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
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
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Completed
                    </h2>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {completedTurnOriginal.length} items
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {completedTurnOriginal.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
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
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No completed approvals
                      </h3>
                      <p className="text-gray-500">
                        Completed approvals will appear here.
                      </p>
                    </div>
                  ) : (
                    <ApproverTable
                      approvers={completedTurnOriginal}
                      onRowClick={handleRowClick}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Missed Section */}
            {(activeStatus === "All" || activeStatus === "Missed") && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Missed
                    </h2>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      {
                        allApproversOriginal.filter(
                          (a) => a.approver_status === "Missed"
                        ).length
                      }{" "}
                      items
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {allApproversOriginal.filter(
                    (a) => a.approver_status === "Missed"
                  ).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No missed approvals
                      </h3>
                      <p className="text-gray-500">
                        Missed approvals will appear here.
                      </p>
                    </div>
                  ) : (
                    <ApproverTable
                      approvers={allApproversOriginal.filter(
                        (a) => a.approver_status === "Missed"
                      )}
                      onRowClick={handleRowClick}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Replaced Section */}
            {(activeStatus === "All" || activeStatus === "Replaced") && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Replaced
                    </h2>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      {
                        allApproversOriginal.filter(
                          (a) => a.approver_status === "Replaced"
                        ).length
                      }{" "}
                      items
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  {allApproversOriginal.filter(
                    (a) => a.approver_status === "Replaced"
                  ).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No replaced approvals
                      </h3>
                      <p className="text-gray-500">
                        Replaced approvals will appear here.
                      </p>
                    </div>
                  ) : (
                    <ApproverTable
                      approvers={allApproversOriginal.filter(
                        (a) => a.approver_status === "Replaced"
                      )}
                      onRowClick={handleRowClick}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Request;
