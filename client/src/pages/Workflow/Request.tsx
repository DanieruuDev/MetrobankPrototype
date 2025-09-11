import axios from "axios";
import { useContext, useEffect, useState, useCallback } from "react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import {
  WorkflowApprovalList,
  ApproverDetailedView,
} from "../../Interface/IWorkflow";

import { AuthContext } from "../../context/AuthContext";
import ApproverSection from "../../components/approval/ApproverSection";

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
  const [isRequestLoading, setIsRequestLoading] = useState(false);

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
      setIsRequestLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-request/${userId}`
      );
      setRequestList(response.data);
      // Don't set filteredRequests here - let the useEffect handle filtering
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

  const flattenApprovers = (requests: WorkflowApprovalList[]) =>
    requests.flatMap((workflow) => {
      const currentApprover = workflow.approvers.find(
        (ap) => ap.is_current && ap.approver_status !== "Replaced"
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
        is_current_display:
          approver.is_current && approver.approver_status !== "Replaced",
        completed_at: workflow.completed_at,
      }));
    });

  const dedupeByWorkflow = (arr: typeof allApproversOriginal) =>
    Array.from(new Map(arr.map((a) => [a.workflow_id, a])).values());

  const allApproversOriginal = flattenApprovers(requestList);

  const yourTurnOriginal = dedupeByWorkflow(
    allApproversOriginal.filter(
      (a) =>
        a.is_current &&
        a.approver_status !== "Completed" &&
        !(a.approver_status === "Replaced" && a.user_id === userId) &&
        a.approver_status !== "Missed" &&
        a.user_id === userId &&
        a.workflow_status !== "Failed"
    )
  );

  const othersTurnOriginal = dedupeByWorkflow(
    allApproversOriginal.filter(
      (a) =>
        !a.is_current &&
        a.approver_status !== "Completed" &&
        !(a.approver_status === "Replaced" && a.user_id === userId) &&
        a.approver_status !== "Missed" &&
        a.workflow_status !== "Failed" &&
        a.approver_status === "Pending" &&
        a.user_id === userId
    )
  );
  allApproversOriginal.filter((a) => {
    if (!(a.approver_status === "Replaced" && a.user_id === userId)) {
      console.log(a);
    }
  });

  const completedTurnOriginal = dedupeByWorkflow(
    allApproversOriginal.filter(
      (a) => a.approver_status === "Completed" && a.workflow_status !== "Failed"
    )
  );

  const canceledWorkflows = dedupeByWorkflow(
    allApproversOriginal.filter((a) => a.workflow_status === "Failed")
  );
  const missedOriginal = dedupeByWorkflow(
    allApproversOriginal.filter((a) => a.approver_status === "Missed")
  );

  const replacedOriginal = dedupeByWorkflow(
    allApproversOriginal.filter(
      (a) => a.approver_status === "Replaced" && a.user_id === userId
    )
  );

  const statuses = [
    { label: "All" },
    { label: "Pending", color: "yellow" },
    ...(missedOriginal.length > 0 ? [{ label: "Missed", color: "red" }] : []),
    ...(replacedOriginal.length > 0
      ? [{ label: "Replaced", color: "gray" }]
      : []),
    { label: "Completed", color: "green" },
    { label: "Canceled", color: "black" },
  ];

  console.log(requestList);

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
                      missedOriginal.length +
                      replacedOriginal.length +
                      canceledWorkflows.length
                    : status.label === "Pending"
                    ? yourTurnOriginal.length + othersTurnOriginal.length
                    : status.label === "Completed"
                    ? completedTurnOriginal.length
                    : status.label === "Missed"
                    ? missedOriginal.length
                    : status.label === "Replaced"
                    ? replacedOriginal.length
                    : status.label === "Canceled"
                    ? canceledWorkflows.length
                    : 0;

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
            {/* Missed Section 
            
            Add: Add later the way to remove the missed status of an approval
            */}

            {(activeStatus === "All" || activeStatus === "Missed") &&
              missedOriginal.length > 0 && (
                <ApproverSection
                  title="Missed"
                  iconColor="text-red-600"
                  bgColor="bg-red-100"
                  items={allApproversOriginal.filter(
                    (a) => a.approver_status === "Missed"
                  )}
                  onRowClick={(approver) =>
                    handleRowClick(approver.approver_id)
                  }
                  emptyMessage={{
                    heading: "No missed approvals",
                    description: "Missed approvals will appear here.",
                  }}
                  isRequestLoading={isRequestLoading}
                />
              )}

            {/* Your Turn Section */}
            {(activeStatus === "All" || activeStatus === "Pending") && (
              <ApproverSection
                title="Requires an action"
                iconColor="text-blue-600"
                bgColor="bg-blue-100"
                items={yourTurnOriginal}
                onRowClick={(approver) => handleRowClick(approver.approver_id)}
                emptyMessage={{
                  heading: "All caught up!",
                  description: "No items require your action at the moment.",
                }}
                isRequestLoading={isRequestLoading}
              />
            )}

            {/* Upcoming Section */}
            {(activeStatus === "All" || activeStatus === "Pending") && (
              <ApproverSection
                title="Upcoming"
                iconColor="text-orange-600"
                bgColor="bg-orange-100"
                items={othersTurnOriginal}
                onRowClick={(approver) => handleRowClick(approver.approver_id)}
                emptyMessage={{
                  heading: "No upcoming items",
                  description:
                    "No items are currently awaiting others' approval.",
                }}
                isRequestLoading={isRequestLoading}
              />
            )}

            {/* Completed Section */}
            {(activeStatus === "All" || activeStatus === "Completed") && (
              <ApproverSection
                title="Completed"
                iconColor="text-green-600"
                bgColor="bg-green-100"
                items={completedTurnOriginal}
                onRowClick={(approver) => handleRowClick(approver.approver_id)}
                emptyMessage={{
                  heading: "No completed approvals",
                  description: "Completed approvals will appear here.",
                }}
                isRequestLoading={isRequestLoading}
              />
            )}

            {/* Replaced Section */}
            {/* Replaced Section */}
            {(activeStatus === "All" || activeStatus === "Replaced") &&
              replacedOriginal.filter((a) => a.user_id === userId).length >
                0 && (
                <ApproverSection
                  title="Replaced"
                  iconColor="text-gray-600"
                  bgColor="bg-gray-100"
                  items={allApproversOriginal.filter(
                    (a) =>
                      a.approver_status === "Replaced" && a.user_id === userId
                  )}
                  onRowClick={(approver) =>
                    handleRowClick(approver.approver_id)
                  }
                  emptyMessage={{
                    heading: "No replaced approvals",
                    description: "Replaced approvals will appear here.",
                  }}
                  isRequestLoading={isRequestLoading}
                />
              )}

            {/* Cancel Section */}
            {(activeStatus === "All" || activeStatus === "Canceled") && (
              <ApproverSection
                title="Canceled"
                iconColor="text-black"
                bgColor="bg-gray-300"
                items={canceledWorkflows}
                onRowClick={(approver) => handleRowClick(approver.approver_id)}
                emptyMessage={{
                  heading: "No canceled approvals",
                  description: "Canceled approvals will appear here.",
                }}
                isRequestLoading={isRequestLoading}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Request;
