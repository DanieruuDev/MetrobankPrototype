import axios from "axios";
import { useContext, useEffect, useState } from "react";
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
    comment: string | null,
    approver_status: "Completed" | "Missed" | "Replaced"
  ) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/workflow/update-approver-response/${approverId}`,
        { response, comment, approver_status }
      );
      setSpecificRequest((prev) => ({
        ...prev!,
        approver_response: response,
        approver_comment: comment,
        approver_status,
      }));
      getRequestApproval();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const getRequestApproval = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-request/${userId}`
      );
      setRequestList(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getSpecificRequestApproval = async () => {
    if (!approverId) return;
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-specific-request/${approverId}`
      );
      setSpecificRequest(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!requestList) return;

    if (activeStatus === "All") {
      setFilteredRequests(requestList);
    } else {
      // ✅ filter workflows if ANY approver matches the activeStatus
      const filtered = requestList.filter((request) =>
        request.approvers.some((a) => a.approver_status === activeStatus)
      );
      setFilteredRequests(filtered);
    }
  }, [activeStatus, requestList]);

  useEffect(() => {
    getSpecificRequestApproval();
  }, [approverId]);

  useEffect(() => {
    getRequestApproval();
  }, []);

  useEffect(() => {
    if (specificRequest?.approver_status === "Completed") {
      getRequestApproval();
    }
  }, [specificRequest]);

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

  const allApprovers = flattenApprovers(filteredRequests);
  console.log(allApprovers);
  const yourTurn = allApprovers.filter(
    (a) =>
      a.is_current && a.approver_status !== "Completed" && a.user_id === userId
  );

  const othersTurn = allApprovers.filter(
    (a) => !a.is_current && a.approver_status !== "Completed"
  );

  const completedTurn = allApprovers.filter(
    (a) => a.approver_status === "Completed"
  );

  console.log(requestList);
  return (
    <div>
      {approverId ? (
        <SpecificRequest
          approver_id={approverId}
          specificRequest={specificRequest}
          goBack={() => setApproverId(undefined)}
          getSpecificRequestApproval={getSpecificRequestApproval}
          updateApproverResponse={updateApproverResponse}
        />
      ) : (
        <>
          {/* Filter Status Tabs */}
          <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
            {statuses.map((status) => {
              const isActive = activeStatus === status.label;
              return (
                <button
                  key={status.label}
                  onClick={() => setActiveStatus(status.label)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>

          {/* Your Turn Section */}

          {activeStatus === "All" || activeStatus === "Pending" ? (
            <>
              <h2 className="text-xl font-semibold mt-8 mb-2">Your Turn</h2>
              {yourTurn.length === 0 ? (
                <p className="text-gray-500 mb-6">No items for your action.</p>
              ) : (
                <ApproverTable
                  approvers={yourTurn}
                  onRowClick={handleRowClick}
                />
              )}
              <h2 className="text-xl font-semibold mt-8 mb-2">Upcoming</h2>
              {othersTurn.length === 0 ? (
                <p className="text-gray-500">No items awaiting others.</p>
              ) : (
                <ApproverTable
                  approvers={othersTurn}
                  onRowClick={handleRowClick}
                />
              )}
            </>
          ) : (
            ""
          )}

          {activeStatus === "All" || activeStatus === "Completed" ? (
            <>
              <h2 className="text-xl font-semibold mt-8 mb-2">Completed</h2>
              {completedTurn.length === 0 ? (
                <p className="text-gray-500">No completed approvals.</p>
              ) : (
                <ApproverTable
                  approvers={completedTurn}
                  onRowClick={handleRowClick}
                />
              )}
            </>
          ) : (
            ""
          )}
        </>
      )}
    </div>
  );
}

export default Request;
