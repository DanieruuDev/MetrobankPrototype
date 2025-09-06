import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useContext, useEffect, useState } from "react";
//import CreateApproval from "../../components/CreateApproval";
import { toast } from "react-toastify";
import axios from "axios";
import Approval from "./SpecificApproval/Approval";
import Request from "./Request";
import { CheckSquare, ClipboardList, Plus, Search, Trash2 } from "lucide-react";

import CreateApproval from "../../components/approval/CreateApproval";
import { formatDate } from "../../utils/DateConvertionFormat";
import { workflowStatusBG } from "../../utils/StatusBadge";
import PaginationControl from "../../components/shared/PaginationControl";
import Loading from "../../components/shared/Loading";
import { AuthContext } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import ConfirmDialog from "../../components/approval/ConfirmDialog";

export interface WorkflowDisplaySchema {
  workflow_id: number;
  request_title: string;
  approval_req_type: string;
  due_date: string;
  status: string;
  doc_name: string;
  school_details: string;
  current_approver: string;
}
export interface Approver {
  approver_id: number;
  approver_name: string;
  approver_role: string;
  approver_email: string;
  approver_status: "Pending" | "Completed" | "Missed" | "Replaced";
  approver_due_date: string;
  approver_assigned_at: string;
  approver_order: number;
  response_id: number | null;
  response: "Pending" | "Approved" | "Reject" | null;
  comment: string | null;
  response_time: string | null;
  response_updated_at: string | null;
  is_current: boolean;
}

export interface WorkflowLog {
  log_id: number;
  actor_id: number;
  actor_type: "Approver" | "Requester" | "System";
  actor_name: string; // ✅ newly added
  actor_email: string | null; // ✅ newly added (null for System)
  action: string;
  comments: string | null;
  old_status: string | null;
  new_status: string | null;
  change_at: string;
}

export interface DetailedWorkflow {
  workflow_id: number;
  requester_id: number;
  requester_email: string;
  request_title: string;
  approval_req_type: string;
  rq_description: string | null;
  school_year: string;
  semester: string;
  scholar_level: string;
  due_date: string;
  status: "Not Started" | "In Progress" | "Completed";
  doc_id: number | null;
  doc_name: string | null;
  doc_type: string | null;
  doc_path: string | null;
  doc_size: number | null;
  doc_uploaded_at: string | null;
  approvers: Approver[];
  logs: WorkflowLog[];
}

function Workflow() {
  const [workflowDisplay, setWorkflowDisplay] = useState<
    WorkflowDisplaySchema[]
  >([]);
  const [detailedWorkflow, setDetailedWorkflow] = useState<
    DetailedWorkflow | undefined
  >();
  const { collapsed } = useSidebar();
  const [workflowToDelete, setWorkflowToDelete] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModal, setIsModal] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-workflows");
  const statuses = [
    { label: "All" },
    { label: "Not Started", color: "gray" },
    { label: "In Progress", color: "yellow" },
    { label: "Completed", color: "green" },
    { label: "Missed", color: "red" },
    { label: "Failed", color: "red" },
  ];
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
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
      Failed: isActive
        ? "bg-red-700 text-white"
        : "text-red-600 hover:bg-red-100",
      Missed: isActive
        ? "bg-red-500 text-white"
        : "text-red-500 hover:bg-red-100",
      All: isActive
        ? "bg-gray-900 text-white"
        : "text-gray-700 hover:bg-gray-200",
    };

    return colorMap[statusLabel] || "text-gray-700 hover:bg-gray-200";
  };

  const fetchWorkflow = async (requester_id: number, workflow_id: number) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-workflow/${requester_id}/${workflow_id}`
      );
      setDetailedWorkflow(response.data);
    } catch (error) {
      console.error("Error fetching workflow:", error);
    }
  };
  const deleteWorkflow = async (requester_id: number, workflow_id: number) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/workflow/delete-workflow/${requester_id}/${workflow_id}`
      );

      toast.success("Approval workflow deleted successfully!");

      setWorkflowDisplay((prevItems) =>
        prevItems.filter((workflow) => workflow.workflow_id !== workflow_id)
      );
    } catch (error) {
      toast.error("Failed to delete approval workflow.");
      console.log(error);
    }
  };

  const fetchWorkflows = async (page: number) => {
    if (userId === undefined) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-workflows/${userId}/${activeStatus}?page=${page}&limit=10`
      );

      const { data, totalPages, currentPage } = response.data;
      setTotalPage(totalPages);
      setPage(currentPage);
      console.log(totalPages, currentPage);
      setWorkflowDisplay(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId !== undefined) {
      fetchWorkflows(page);
    }
  }, [page, userId, activeStatus]);

  const openDeleteConfirm = (workflowId: number) => {
    setWorkflowToDelete(workflowId);
    setIsConfirmOpen(true);
  };

  const cancelDelete = () => {
    setWorkflowToDelete(null);
    setIsConfirmOpen(false);
  };

  const confirmDelete = () => {
    if (userId !== undefined && workflowToDelete !== null) {
      deleteWorkflow(userId, workflowToDelete);
    }
    setWorkflowToDelete(null);
    setIsConfirmOpen(false);
  };

  const filteredWorkflows = workflowDisplay.filter((workflow) => {
    const matchesStatus =
      activeStatus === "All" ? true : workflow.status === activeStatus;
    const matchesSearch =
      workflow.request_title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      workflow.doc_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.school_details.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-all duration-300`}
    >
      <Navbar pageName="Approvals" />

      <Sidebar />

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
                  activeTab === "my-workflows"
                    ? "bg-[#024FA8] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setActiveTab("my-workflows")}
              >
                <ClipboardList size={16} />
                <span>My Workflows</span>
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
              <ConfirmDialog
                isOpen={isConfirmOpen}
                message="Are you sure you want to delete this approval workflow?"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
              />
              {isModal && (
                <CreateApproval
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
                      "1.5fr 1.5fr 1fr min-content 1fr 2fr min-content",
                  }}
                >
                  <div className="text-left px-6 max-w-[300px]">
                    Request Title
                  </div>
                  <div className="text-left px-6">Request Type</div>
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
                            "1.5fr 1.5fr 1fr min-content 1fr 2fr min-content",
                        }}
                        onClick={() => {
                          if (userId !== undefined) {
                            fetchWorkflow(userId, workflow.workflow_id);
                          }
                        }}
                      >
                        <div className="truncate px-6 ">
                          {workflow.request_title}
                        </div>
                        <div className="truncate max-w-[250px] px-6">
                          {workflow.approval_req_type ?? ""}
                        </div>

                        <div className="truncate max-w-[160px] px-6">
                          {workflow.doc_name}
                        </div>
                        <div className="font-semibold py-1 rounded-md min-w-[56px]">
                          <div
                            className={`w-3.5 h-3.5 rounded-[20px] mx-auto ${workflowStatusBG(
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
                            openDeleteConfirm(workflow.workflow_id);
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
                  {totalPage > 1 && (
                    <PaginationControl
                      currentPage={page}
                      totalPages={totalPage}
                      onPageChange={setPage}
                    />
                  )}
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
