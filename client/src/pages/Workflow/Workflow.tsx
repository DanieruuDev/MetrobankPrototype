import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useEffect, useState } from "react";
//import CreateApproval from "../../components/CreateApproval";
import axios from "axios";
import Approval from "./SpecificApproval/Approval";
import Request from "./Request";
import {
  CheckSquare,
  ClipboardList,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import CreateApproval2 from "../../components/approval/CreateApproval2";
import { formatDate } from "../../utils/DateConvertionFormat";
import { workflowStatusBG } from "../../utils/StatusBadge";
import PaginationControl from "../../components/approval/PaginationControl";
import Loading from "../../components/shared/Loading";

export interface WorkflowDisplaySchema {
  workflow_id: number;
  rq_title: string;
  due_date: string;
  status: string;
  doc_name: string;
  school_details: string;
  current_approver: string;
}
export interface Approver {
  approver_id: number;
  approver_email: string;
  approver_status: "Pending" | "Completed" | "Missed" | "Replaced";
  approver_due_date: string; // ISO date format
  approver_assigned_at: string; // ISO timestamp format
  approver_order: number;
  response_id: number | null;
  response: "Pending" | "Approved" | "Reject" | null;
  comment: string | null;
  response_time: string | null;
  response_updated_at: string | null;
  is_current: boolean;
}
export interface DetailedWorkflow {
  workflow_id: number;
  requester_id: number;
  requester_email: string;
  rq_title: string;
  rq_description: string | null;
  school_year: string;
  semester: string;
  scholar_level: string;
  due_date: string; // ISO date format (e.g., "2024-09-30")
  status: "Not Started" | "In Progress" | "Completed";
  doc_id: number | null;
  doc_name: string | null;
  doc_type: string | null;
  doc_path: string | null;
  doc_size: number | null;
  doc_uploaded_at: string | null; // ISO timestamp format (e.g., "2024-04-04T10:30:00")
  approvers: Approver[];
}

function Workflow() {
  const [workflowDisplay, setWorkflowDisplay] = useState<
    WorkflowDisplaySchema[]
  >([]);
  const [detailedWorkflow, setDetailedWorkflow] = useState<
    DetailedWorkflow | undefined
  >();
  const [collapsed, setCollapsed] = useState(false);
  const requesterId = 3;
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1); // Default to page 2 as in your screenshot
  const [totalPage, setTotalPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-approval");
  const statuses = [
    { label: "All" },
    { label: "Not Started", color: "gray" },
    { label: "In Progress", color: "yellow" },
    { label: "Completed", color: "green" },
    { label: "Missed", color: "red" },
  ];

  const [activeStatus, setActiveStatus] = useState("Not Started");

  const getColorClass = (statusLabel: string, isActive: boolean) => {
    const colorMap: Record<string, string> = {
      Completed: isActive
        ? "bg-green-600 text-white"
        : "text-green-600 hover:bg-green-100",
      "In Progress": isActive
        ? "bg-yellow-400 text-white"
        : "text-yellow-600 hover:bg-yellow-100",
      "Not Started": isActive
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

  const fetchWorkflow = async (requester_id: number, workflow_id: number) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/admin/get-approval/${requester_id}/${workflow_id}`
      );
      setDetailedWorkflow(response.data);
    } catch (error) {
      console.error("Error fetching workflow:", error);
    }
  };
  const deleteWorkflow = async (requester_id: number, workflow_id: number) => {
    try {
      //check authorization for deletion
      //cahnge the requester_id with authorize id
      await axios.delete(
        `http://localhost:5000/admin/delete-approval/${requester_id}/${workflow_id}`
      );

      console.log("Success on deleting");
      setWorkflowDisplay((prevItems) =>
        prevItems.filter((workflow) => workflow.workflow_id !== workflow_id)
      );
    } catch (error) {
      console.log(error);
    }
  };
  const fetchWorkflows = async (page: number) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/admin/get-approvals/${requesterId}?page=${page}&limit=10`
      );

      const { data, totalPages, currentPage } = response.data;
      setTotalPage(totalPages);
      setPage(currentPage);
      console.log(totalPages, currentPage);
      setWorkflowDisplay(data); // Replace with new page data
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows(page); // Load first page when component loads
  }, [page]);
  // ✅ Only one useEffect watching `page`

  const filteredWorkflows = workflowDisplay.filter((workflow) => {
    const matchesStatus =
      activeStatus === "All" ? true : workflow.status === activeStatus;
    const matchesSearch =
      workflow.rq_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.doc_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.school_details.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleDelete = (requester_id: number, workflow_id: number) => {
    if (
      window.confirm("Are you sure you want to delete this approval workflow?")
    ) {
      deleteWorkflow(requester_id, workflow_id);
    }
  };

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300`}
    >
      <Navbar pageName="Workflow Approval" />

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {detailedWorkflow ? (
        <Approval
          detailedWorkflow={detailedWorkflow}
          setDetailedWorkflow={setDetailedWorkflow}
          fetchWorkflow={fetchWorkflow}
        />
      ) : (
        <div className="px-5 pt-5">
          <div className="mb-6">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-full w-fit">
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
                  activeTab === "my-approval"
                    ? "bg-[#024FA8] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("my-approval")}
              >
                <ClipboardList size={16} />
                <span>My Approval</span>
              </button>

              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer ${
                  activeTab === "requests"
                    ? "bg-[#024FA8] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("requests")}
              >
                <CheckSquare size={16} />
                <span>Approval Requests</span>
              </button>
            </div>
          </div>

          {activeTab === "requests" ? (
            <Request />
          ) : (
            <>
              <p>Current Account: </p>

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

                {/* Right Side Controls: Search, Filter, Create */}
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

                  {/* Create Approval Button */}
                  <button
                    onClick={() => setIsModal(!isModal)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-[#0f61c0] rounded-lg shadow-sm hover:bg-[#0d4ea3] transition-all duration-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create Approval
                  </button>
                </div>
              </div>

              {isModal && (
                <CreateApproval2
                  setIsModal={setIsModal}
                  fetchWorkflows={fetchWorkflows}
                  // setIsModalOpen={setIsModal}
                  // requester_id={3}
                  // setWorkflowDisplay={setWorkflowDisplay}
                  // fetchWorkflows={fetchWorkflows}
                />
              )}
              <div className="mt-4">
                <div
                  className="grid text-[#565656] text-[14px] font-bold rounded-md bg-[#EFEFEF] items-center"
                  style={{
                    gridTemplateColumns:
                      "1.5fr 1fr min-content 1fr 2fr min-content",
                  }}
                >
                  <div className="text-left px-6 max-w-[255px]">
                    Request Title
                  </div>
                  <div className="text-left px-6">Document</div>
                  <div className="text-left px-2">Status</div>
                  <div className="text-left px-6">Due Date</div>
                  <div className="text-left px-6">Details</div>
                  <div className="text-left p-5 max-w-[40px]"></div>{" "}
                  {/* Empty column for delete button */}
                </div>
                <div className="divide-y mt-2 divide-gray-200">
                  {loading ? (
                    <Loading />
                  ) : filteredWorkflows.length === 0 ? (
                    <div className="text-center text-gray-500 p-5">
                      No approval workflows found.
                    </div>
                  ) : (
                    filteredWorkflows.map((workflow) => (
                      <div
                        key={workflow.workflow_id}
                        className="grid py-1 items-center hover:bg-gray-50 transition cursor-pointer z-10 text-[13px] border-b border-b-[#c7c7c792]"
                        style={{
                          gridTemplateColumns:
                            "1.5fr 1fr min-content 1fr 2fr min-content",
                        }}
                        onClick={() =>
                          fetchWorkflow(requesterId, workflow.workflow_id)
                        }
                      >
                        <div className="truncate px-6 max-w-[255px]">
                          {workflow.rq_title}
                        </div>
                        <div className="truncate max-w-[160px] px-6">
                          {workflow.doc_name}
                        </div>
                        <div className="font-semibold py-1 rounded-md min-w-[56px]">
                          <div
                            className={`w-5 h-5 rounded-[20px] mx-auto ${workflowStatusBG(
                              workflow.status
                            )}`}
                          ></div>
                        </div>
                        <div className="truncate px-6">
                          {formatDate(workflow.due_date)}
                        </div>
                        <div className="truncate px-6">
                          {workflow.school_details}
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(requesterId, workflow.workflow_id);
                          }}
                          className="p-2 text-red-500 rounded-md transition cursor-pointer flex-shrink-0 max-w-[40px]"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mb-4">
                  <PaginationControl
                    currentPage={page}
                    totalPages={totalPage}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Workflow;
