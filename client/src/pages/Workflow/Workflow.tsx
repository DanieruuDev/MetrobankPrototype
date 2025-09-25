import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useContext, useEffect, useState } from "react";
//import CreateApproval from "../../components/CreateApproval";
import { toast } from "react-toastify";
import axios from "axios";

import DataTable from "../../components/approval/DataTable";
import {
  CheckSquare,
  CircleCheck,
  ClipboardList,
  Plus,
  RotateCwSquare,
  Search,
  TriangleAlert,
  Clock,
  Disc,
  CheckCircle,
  CircleAlert,
  XCircle,
  RotateCcw,
} from "lucide-react";

import CreateApproval from "../../components/approval/CreateApproval";

import { AuthContext } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import ConfirmDialog from "../../components/approval/ConfirmDialog";
import { NavLink } from "react-router-dom";

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
export interface DetailedWorkflow {
  workflow_id: number;
  requester_id: number;
  requester_email: string;
  request_title: string;
  approval_req_type: string;
  rq_description: string | null;
  school_year: string;
  semester: string;
  scholar_level: string; // ⚠️ double-check: this isn’t in the SQL yet
  due_date: string;
  status: "Not Started" | "In Progress" | "Completed" | "Missed" | "Failed"; // include all enum options from DB
  doc_id: number | null;
  doc_name: string | null;
  doc_type: string | null;
  doc_path: string | null;
  doc_size: number | null;
  doc_uploaded_at: string | null;
  approvers: Approver[];
  logs: WorkflowLog[];
}

export interface Approver {
  approver_id: number;
  approver_name: string;
  approver_role: string;
  approver_email: string;
  approver_status:
    | "Pending"
    | "Completed"
    | "Missed"
    | "Replaced"
    | "Canceled"
    | "Returned"; // full set from wf_approver
  approver_due_date: string;
  approver_assigned_at: string;
  approver_order: number;
  response_id: number | null;
  response: "Pending" | "Approved" | "Reject" | "Returned" | null; // full set from approver_response
  comment: string | null;
  response_time: string | null;
  response_updated_at: string | null;
  is_current: boolean;
  return_feedback: ReturnFeedback[]; // ✅ NEW
}

export interface ReturnFeedback {
  return_id: number;
  reason: string;
  requester_take_action: boolean;
  created_by: number;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
  requester_responses: RequesterResponse[]; // ✅ nested requester responses
}

export interface RequesterResponse {
  req_response_id: number;
  message: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  responded_at: string;
  requester_id: number;
  requester_name: string;
  requester_email: string;
}

export interface WorkflowLog {
  log_id: number;
  actor_id: number;
  actor_type: "Approver" | "Requester" | "System";
  actor_name: string;
  actor_email: string | null;
  action: string;
  comments: string | null;
  old_status: string | null;
  new_status: string | null;
  change_at: string;
}

function Workflow() {
  const [workflowDisplay, setWorkflowDisplay] = useState<
    WorkflowDisplaySchema[]
  >([]);

  const { collapsed } = useSidebar();
  const [workflowToArchived, setWorkflowToArchived] = useState<number | null>(
    null
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isModal, setIsModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const [activeStatus, setActiveStatus] = useState("All");

  const statuses = [
    { label: "All", color: "gray" },
    { label: "Active", icon: <RotateCwSquare />, color: "blue" },
    { label: "Needs Attention", icon: <TriangleAlert />, color: "red" },
    { label: "Completed", icon: <CircleCheck />, color: "green" },
  ];
  const statusGroups: Record<string, string[]> = {
    All: [],
    Active: ["In Progress", "Not Started"],
    "Needs Attention": ["Returned", "Missed"],
    Completed: ["Completed", "Failed"],
  };
  const groupStyles: Record<string, { color: string; icon: React.ReactNode }> =
    {
      "All Requests": {
        color: "gray",
        icon: <ClipboardList className="text-gray-500" size={16} />,
      },
      "Not Started": {
        color: "gray",
        icon: <Clock className="text-gray-400" size={16} />,
      },
      "In Progress": {
        color: "blue",
        icon: <Disc className="text-blue-500" size={16} />,
      },
      Missed: {
        color: "yellow",
        icon: <CircleAlert className="text-yellow-500" size={16} />,
      },
      Returned: {
        color: "orange",
        icon: <RotateCcw className="text-orange-500" size={16} />,
      },
      Completed: {
        color: "green",
        icon: <CheckCircle className="text-green-500" size={16} />,
      },
      Failed: {
        color: "red",
        icon: <XCircle className="text-red-500" size={16} />,
      },
    };

  // return { groupName: workflows[] }
  const getGroupedWorkflows = () => {
    const groups: Record<string, WorkflowDisplaySchema[]> = {};
    const statuses = statusGroups[activeStatus] || [];

    // All shows everything in one table
    if (activeStatus === "All") {
      groups["All Requests"] = workflowDisplay.filter(
        (workflow) =>
          workflow.request_title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          workflow.doc_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          workflow.school_details
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      return groups;
    }

    // For Active / Needs Attention / Completed → multiple tables
    statuses.forEach((status) => {
      groups[status] = workflowDisplay.filter(
        (workflow) =>
          workflow.status === status &&
          (workflow.request_title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
            workflow.doc_name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            workflow.school_details
              .toLowerCase()
              .includes(searchQuery.toLowerCase()))
      );
    });

    return groups;
  };

  const archivedWorkflow = async (
    requester_id: number,
    workflow_id: number
  ) => {
    console.log(requester_id, workflow_id);

    try {
      await axios.put(
        `http://localhost:5000/api/workflow/archive-workflow/${requester_id}/${workflow_id}`
      );

      toast.success("Approval workflow archived successfully!");

      setWorkflowDisplay((prevItems) =>
        prevItems.filter((workflow) => workflow.workflow_id !== workflow_id)
      );
    } catch (error) {
      toast.error("Failed to delete approval workflow.");
      console.log(error);
    }
  };

  const fetchWorkflows = async () => {
    if (userId === undefined) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-workflows/${userId}`
      );

      const { data } = response.data;

      setWorkflowDisplay(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const openArchivedConfirm = (workflowId: number) => {
    setWorkflowToArchived(workflowId);
    setIsConfirmOpen(true);
  };

  const cancelArchived = () => {
    setWorkflowToArchived(null);
    setIsConfirmOpen(false);
  };

  const confirmArchived = () => {
    if (userId !== undefined && workflowToArchived !== null) {
      archivedWorkflow(userId, workflowToArchived);
    }
    setWorkflowToArchived(null);
    setIsConfirmOpen(false);
  };

  const getCounts = () => {
    const counts: Record<string, number> = {};

    Object.keys(statusGroups).forEach((group) => {
      if (group === "All") {
        counts[group] = workflowDisplay.length;
      } else {
        counts[group] = workflowDisplay.filter((wf) =>
          statusGroups[group].includes(wf.status)
        ).length;
      }
    });

    return counts;
  };

  const counts = getCounts();

  // const filteredWorkflows = workflowDisplay.filter((workflow) => {
  //   const groupStatuses = statusGroups[activeStatus] || [];

  //   const matchesStatus =
  //     activeStatus === "All" ? true : groupStatuses.includes(workflow.status);

  //   const matchesSearch =
  //     workflow.request_title
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase()) ||
  //     workflow.doc_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     workflow.school_details.toLowerCase().includes(searchQuery.toLowerCase());

  //   return matchesStatus && matchesSearch;
  // });

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-all duration-300`}
    >
      <Navbar pageName="Approvals" />

      <Sidebar />

      <div className="px-5 pt-5">
        <div className="mb-6">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-full w-fit">
            <NavLink
              to={"/workflow-approval"}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer bg-[#024FA8] text-white shadow-md`}
            >
              <ClipboardList size={16} />
              <span>My Workflows</span>
            </NavLink>

            <NavLink
              to={"/workflow-approval/request"}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer text-gray-600 hover:bg-gray-200`}
            >
              <CheckSquare size={16} />
              <span>Approval Requests</span>
            </NavLink>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
          {/* Status Bar */}

          <div className="flex flex-wrap gap-2 p-1 bg-white rounded-xl border border-gray-200 shadow-sm w-fit">
            {statuses.map((status) => {
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

                  {/* 🔹 Badge */}
                  {count > 0 && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full
                ${
                  status.label === "Needs Attention"
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
          message="Are you sure you want to archived this approval workflow?"
          onConfirm={confirmArchived}
          onCancel={cancelArchived}
          confirmLabel="Archive"
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
        <div className="mt-4 space-y-6">
          {Object.entries(getGroupedWorkflows()).map(
            ([groupName, workflows]) => {
              const { icon, color } = groupStyles[groupName] || {
                icon: <ClipboardList className="text-gray-500" size={16} />,
                color: "gray",
              };

              return (
                <DataTable
                  key={groupName}
                  title={groupName}
                  workflows={workflows}
                  loading={loading}
                  onArchived={openArchivedConfirm}
                  titleIcon={icon}
                  titleColor={color}
                />
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

export default Workflow;
