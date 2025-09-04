import axios from "axios";
import { useContext, useEffect, useState } from "react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import {
  ApproverInfo,
  WorkflowApprovalList,
  ApproverDetailedView,
} from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";
import { AuthContext } from "../../context/AuthContext";

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
  const flattenApprovers = (requests: WorkflowApprovalList[]) =>
    requests.flatMap((workflow) => {
      const currentApprover = workflow.approvers.find((ap) => ap.is_current);
      return workflow.approvers.map((approver) => ({
        ...approver,
        workflow_id: workflow.workflow_id,
        workflow_title: workflow.workflow_title,
        workflow_status: workflow.workflow_status,
        created_by: workflow.created_by,
        current_approver_name: currentApprover
          ? currentApprover.approver_name
          : "—",
        current_approver_role: currentApprover
          ? currentApprover.approver_role
          : "—",
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
          <h2 className="text-xl font-semibold mt-8 mb-2">Your Turn</h2>
          {yourTurn.length === 0 ? (
            <p className="text-gray-500 mb-6">No items for your action.</p>
          ) : (
            <ApproverTable approvers={yourTurn} onRowClick={handleRowClick} />
          )}

          {/* Others' Turn Section */}
          <h2 className="text-xl font-semibold mt-8 mb-2">Upcoming</h2>
          {othersTurn.length === 0 ? (
            <p className="text-gray-500">No items awaiting others.</p>
          ) : (
            <ApproverTable approvers={othersTurn} onRowClick={handleRowClick} />
          )}

          {activeStatus === "All" && (
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
          )}
        </>
      )}
    </div>
  );
}

function ApproverTable({
  approvers,
  onRowClick,
}: {
  approvers: (ApproverInfo & {
    workflow_id: number;
    workflow_title: string;
    workflow_status: string;
    created_by: string;
    current_approver_name: string;
    current_approver_role: string; // ✅ added
  })[];
  onRowClick: (approver_id: number) => void;
}) {
  return (
    <div>
      {/* Column Headers */}
      <div
        className="grid text-[#565656] text-[14px] font-medium h-[40px] items-center border-b border-b-[#c7f7f792] bg-[#f0f9f9] rounded-t-md mb-1"
        style={{
          gridTemplateColumns:
            "1.8fr 1.8fr 1.2fr 1.5fr 1.5fr 1.2fr min-content",
        }}
      >
        <div className="text-left pl-6 pr-2">Workflow Title</div>
        <div className="text-left pl-6 pr-2">Workflow Type</div>
        <div className="text-center px-2">Status</div>
        <div className="text-left pl-4 pr-2">Requester</div>
        <div className="text-left pl-4 pr-2">Role</div>
        <div className="text-left pl-4 pr-2">Designated</div>
        <div className="w-10"></div>
      </div>

      {/* Request Items */}
      {approvers.map((a) => (
        <div
          key={a.workflow_id + "-" + a.approver_id}
          onClick={() => onRowClick(a.approver_id)}
          className="grid text-[#565656] text-[14px] h-[52px] items-center border-b border-b-[#c7f7f792] hover:bg-[#f7f7f7] rounded-md cursor-pointer mb-2"
          style={{
            gridTemplateColumns:
              "1.8fr 1.8fr 1.2fr 1.5fr 1.5fr 1.2fr min-content",
          }}
        >
          <div className="pl-6 pr-2 max-w-[255px] truncate">
            {a.workflow_title}
          </div>
          <div className="pl-6 pr-2"></div>{" "}
          {/* Added missing Workflow Type column */}
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 text-[12px] rounded-xl ${approverStatusBadge(
                a.approver_status
              )}`}
            >
              {a.approver_status}
            </span>
          </div>
          <div className="pl-4 pr-2">{a.created_by}</div>
          <div className="pl-4 pr-2">{a.current_approver_role}</div>
          <div className="pl-4 pr-2">{a.current_approver_name}</div>
          <div className="w-10"></div>
        </div>
      ))}
    </div>
  );
}

export default Request;
