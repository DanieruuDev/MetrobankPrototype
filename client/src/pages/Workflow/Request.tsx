import axios from "axios";
import { useContext, useEffect, useState } from "react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import {
  ApproverDetailedView,
  RequestApprovalList,
} from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";
import { AuthContext } from "../../context/AuthContext";

function Request() {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [requestList, setRequestList] = useState<RequestApprovalList[] | null>(
    []
  );
  const [filteredRequests, setFilteredRequests] = useState<
    RequestApprovalList[] | null
  >([]);
  const [specificRequest, setSpecificRequest] =
    useState<ApproverDetailedView | null>(null);
  const [approverId, setApproverId] = useState<number>();

  // Status filtering state
  const statuses = [
    { label: "All" },
    { label: "Completed", color: "green" },
    { label: "Pending", color: "yellow" },
    { label: "Missed", color: "red" },
    { label: "Replaced", color: "gray" },
  ];
  const [activeStatus, setActiveStatus] = useState("All");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRowClick = (approval_id: number) => {
    setApproverId(approval_id);
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

  const updateApproverResponse = async (
    response: "Approved" | "Rejected", // Fix typo in "Approved"
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

  const getColorClass = (statusLabel: string, isActive: boolean) => {
    const colorMap: Record<string, string> = {
      Completed: isActive
        ? "bg-green-600 text-white"
        : "text-green-600 hover:bg-green-100",
      Pending: isActive
        ? "bg-yellow-400 text-white"
        : "text-yellow-600 hover:bg-yellow-100",
      Replaced: isActive
        ? "bg-gray-700 text-white"
        : "text-gray-700 hover:bg-gray-200",
      Missed: isActive
        ? "bg-red-600 text-white"
        : "text-red-600 hover:bg-red-100",
      All: isActive
        ? "bg-gray-900 text-white"
        : "text-gray-700 hover:bg-gray-200",
    };
    return colorMap[statusLabel] || "text-gray-700 hover:bg-gray-200";
  };

  // Filter requests based on active status
  useEffect(() => {
    if (!requestList) return;

    if (activeStatus === "All") {
      setFilteredRequests(requestList);
    } else {
      const filtered = requestList.filter(
        (request) => request.approver_status === activeStatus
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
          <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
            {statuses.map((status) => {
              const isActive = activeStatus === status.label;
              return (
                <button
                  key={status.label}
                  onClick={() => setActiveStatus(status.label)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${getColorClass(
                    status.label,
                    isActive
                  )}`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
          <div
            className="grid text-[#565656] text-[14px] font-bold rounded-md bg-[#EFEFEF] h-[40px] items-center"
            style={{
              gridTemplateColumns:
                "1.4fr 0.4fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr min-content",
            }}
          >
            <div className="text-left px-6 max-w-[255px]">Request Title</div>
            <div className="text-left px-2 max-w-[100px] w-full">Status</div>
            <div className="text-left px-6">Requester</div>
            <div className="text-left px-4">Date Started</div>
            <div className="text-left px-4">Due Date</div>
            <div className="text-left px-4">School Year</div>
            <div className="text-left px-4">Year Level</div>
            <div className="text-left px-4">Semester</div>
            <div className="text-left p-5"></div>
          </div>
          {filteredRequests && filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <div
                key={request.approver_id}
                onClick={() => handleRowClick(request.approver_id)}
                className="grid text-[#565656] text-[14px] h-[52px] items-center border-b border-b-[#c7f7f792] hover:bg-[#f7f7f7] rounded-md cursor-pointer"
                style={{
                  gridTemplateColumns:
                    "1.4fr 0.4fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr min-content",
                }}
              >
                <div className="text-left px-6 max-w-[255px]">
                  {request.request_title}
                </div>
                <div
                  className={`text-left px-2 py-1 text-[12px] flex justify-center rounded-xl ${approverStatusBadge(
                    request.approver_status
                  )}`}
                >
                  {request.approver_status}
                </div>
                <div className="text-left px-6 max-w-[215px] truncate">
                  {request.requester}
                </div>
                <div className="text-left px-4">
                  {formatDate(request.date_started)}
                </div>
                <div className="text-left px-4">
                  {formatDate(request.approver_due_date)}
                </div>
                <div className="text-left px-4">{request.school_year}</div>
                <div className="text-left px-4">{request.year_level}</div>
                <div className="text-left px-4">{request.semester}</div>
                <div className="text-left p-5"></div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 p-5">
              No requests found{" "}
              {activeStatus !== "All" ? `with status ${activeStatus}` : ""}.
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Request;
