import axios from "axios";
import { useEffect, useState } from "react";
import { Search, Filter } from "lucide-react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import {
  ApproverDetailedView,
  RequestApprovalList,
} from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";

function Request() {
  const user_id = 1;
  const [requestList, setRequestList] = useState<RequestApprovalList[] | null>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestApprovalList[] | null>([]);
  const [specificRequest, setSpecificRequest] = useState<ApproverDetailedView | null>(null);
  const [approverId, setApproverId] = useState<number>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");

  const statuses = [
    { label: "All" },
    { label: "Not Started", color: "gray" },
    { label: "In Progress", color: "yellow" },
    { label: "Completed", color: "green" },
    { label: "Missed", color: "red" },
  ];

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
        `http://localhost:5000/admin/get-request/${user_id}`
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
        `http://localhost:5000/admin/get-specific-request/${approverId}`
      );
      setSpecificRequest(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const updateApproverResponse = (
    response: string,
    comment: string | null,
    approver_status: string
  ) => {
    setSpecificRequest((prevState) => {
      if (!prevState) return null;

      return {
        ...prevState,
        approver_response: response,
        approver_comment: comment,
        approver_status: approver_status,
      };
    });
  };

  // Filter requests based on status and search query
  useEffect(() => {
    if (!requestList) return;

    const filtered = requestList.filter((request) => {
      const matchesStatus = 
        activeStatus === "All" || 
        request.approver_status === activeStatus;
      
      const matchesSearch = 
        request.request_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.request_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.school_year.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });

    setFilteredRequests(filtered);
  }, [requestList, activeStatus, searchQuery]);

  useEffect(() => {
    getSpecificRequestApproval();
  }, [approverId]);

  useEffect(() => {
    getRequestApproval();
  }, []);

  useEffect(() => {
    getRequestApproval();
  }, [specificRequest]);

  const getColorClass = (statusLabel: string, isActive: boolean) => {
    const colorMap: Record<string, string> = {
      "Completed": isActive
        ? "bg-green-600 text-white"
        : "text-green-600 hover:bg-green-100",
      "In Progress": isActive
        ? "bg-yellow-400 text-white"
        : "text-yellow-600 hover:bg-yellow-100",
      "Not Started": isActive
        ? "bg-gray-700 text-white"
        : "text-gray-700 hover:bg-gray-200",
      "Missed": isActive
        ? "bg-red-600 text-white"
        : "text-red-600 hover:bg-red-100",
      "All": isActive
        ? "bg-gray-900 text-white"
        : "text-gray-700 hover:bg-gray-200",
    };

    return colorMap[statusLabel] || "text-gray-700 hover:bg-gray-200";
  };

  return (
    <div>
      {approverId ? (
        <SpecificRequest
          approver_id={approverId}
          specificRequest={specificRequest}
          goBack={() => setApproverId(undefined)}
          getSpecificRequestApproval={getSpecificRequestApproval}
        />
      ) : (
        <>
          
          {/* Status Filter, Search, and Filter Controls */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
            {/* Status Bar */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
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

            {/* Right Side Controls: Search, Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0f61c0] focus:border-transparent transition-all"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => console.log("Open filter modal")}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Request List Table */}
          <div
            className="grid text-[#565656] text-[14px] font-bold rounded-md bg-[#EFEFEF] h-[58px] items-center mt-4"
            style={{
              gridTemplateColumns:
                "1.4fr 1.4fr 0.4fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr min-content",
            }}
          >
            <div className="text-left px-6 max-w-[255px]">Request Title</div>
            <div className="text-left px-6 max-w-[255px]">Disbursement Type</div>
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
                className="grid text-[#565656] text-[14px] h-[52px] items-center border-b border-b-[#c7c7c792] hover:bg-[#f7f7f7] rounded-md cursor-pointer"
                style={{
                  gridTemplateColumns:
                    "1.4fr 1.4fr 0.4fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr min-content",
                }}
              >
                <div className="text-left px-6 max-w-[255px]">
                  {request.request_title}
                </div>
                <div className="text-left px-6 max-w-[255px]">
                  {request.request_title}
                </div>
                <div
                  className={`text-left px-2 py-0 text-[12px] flex justify-center rounded-xl ${approverStatusBadge(
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
            <div className="text-center py-4 text-gray-500">
              No requests found matching your criteria
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Request;