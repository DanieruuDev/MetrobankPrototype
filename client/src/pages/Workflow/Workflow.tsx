import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useCallback, useEffect, useMemo, useState } from "react";
//import CreateApproval from "../../components/CreateApproval";
import { toast } from "react-toastify";
import axios from "axios";
import { WorkflowDisplaySchema } from "../../Interface/IWorkflow";
import DataTable from "../../components/approval/my-approval/DataTable";
import {
  CheckSquare,
  ClipboardList,
  Clock,
  Disc,
  CheckCircle,
  CircleAlert,
  XCircle,
  RotateCcw,
} from "lucide-react";
import EditApproval from "../../components/approval/my-approval/EditApproval";
import CreateApproval from "../../components/approval/my-approval/CreateApproval";

import { useSidebar } from "../../context/SidebarContext";
import ConfirmDialog from "../../components/approval/ConfirmDialog";
import { NavLink } from "react-router-dom";
import WorkflowStatusBar from "../../components/approval/my-approval/WorkflowStatusBar";
import MyApprovalControl from "../../components/approval/my-approval/MyApprovalControls";
import { useAuth } from "../../context/AuthContext";

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
  const [archiving, setArchiving] = useState(false);

  const [editModalID, setEditModalID] = useState<number | null>(null);
  const [isModal, setIsModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const auth = useAuth();
  const userId = auth?.user?.user_id;
  const { token } = auth;

  const [activeStatus, setActiveStatus] = useState("All");

  const statusGroups: Record<string, string[]> = useMemo(
    () => ({
      All: [],
      Active: ["In Progress", "Not Started"],
      "Needs Attention": ["Returned", "Missed"],
      Completed: ["Completed", "Failed"],
    }),
    []
  );
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
  const getGroupedWorkflows = useMemo(() => {
    const groups: Record<string, WorkflowDisplaySchema[]> = {};
    const statuses = statusGroups[activeStatus] || [];

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
  }, [workflowDisplay, activeStatus, searchQuery, statusGroups]);

  const archivedWorkflow = useCallback(
    async (requester_id: number, workflow_id: number) => {
      console.log(requester_id, workflow_id);
      setArchiving(true);
      try {
        await axios.put(
          `${VITE_BACKEND_URL}api/workflow/archive-workflow/${requester_id}/${workflow_id}`
        );

        toast.success("Approval workflow archived successfully!");

        setWorkflowDisplay((prevItems) =>
          prevItems.filter((workflow) => workflow.workflow_id !== workflow_id)
        );
      } catch (error) {
        toast.error("Failed to delete approval workflow.");
        console.log(error);
      } finally {
        setArchiving(false);
      }
    },
    [VITE_BACKEND_URL]
  );

  const fetchWorkflows = useCallback(async () => {
    if (userId === undefined) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/workflow/get-workflows/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { data } = response.data;

      setWorkflowDisplay(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, VITE_BACKEND_URL, token]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const openArchivedConfirm = (workflowId: number) => {
    setWorkflowToArchived(workflowId);
    setIsConfirmOpen(true);
  };

  const cancelArchived = () => {
    setWorkflowToArchived(null);
    setIsConfirmOpen(false);
  };
  const confirmArchived = async () => {
    if (userId !== undefined && workflowToArchived !== null) {
      await archivedWorkflow(userId, workflowToArchived);

      // only close after the request finishes
      setWorkflowToArchived(null);
      setIsConfirmOpen(false);
    }
  };

  const counts = useMemo(() => {
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
  }, [workflowDisplay, statusGroups]);

  const editApproval = (workflow_id: number | null) => {
    if (workflow_id) {
      setEditModalID(workflow_id);
    } else {
      setEditModalID(null);
    }
  };
  if (!auth) return;

  return (
    <div className=" min-h-screen relative">
      <Sidebar />
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"}
        `}
      >
        <Navbar pageName="Approvals" />
        <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Navigation Tabs */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-100 rounded-full w-fit overflow-x-auto">
              <NavLink
                to={"/workflow-approval"}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all cursor-pointer bg-[#024FA8] text-white shadow-md whitespace-nowrap`}
              >
                <ClipboardList size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">My Workflows</span>
                <span className="xs:hidden">Workflows</span>
              </NavLink>

              <NavLink
                to={"/workflow-approval/request"}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all cursor-pointer text-gray-600 hover:bg-gray-200 whitespace-nowrap`}
              >
                <CheckSquare size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Approval Requests</span>
                <span className="xs:hidden">Requests</span>
              </NavLink>
            </div>
          </div>

          {/* Main Controls Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Status Bar */}
            <div className="flex-1 min-w-0">
              <WorkflowStatusBar
                activeStatus={activeStatus}
                setActiveStatus={setActiveStatus}
                counts={counts}
              />
            </div>

            {/* Right Side Controls: Search, Filter, Create */}
            <div className="flex-shrink-0">
              <MyApprovalControl
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isModal={isModal}
                setIsModal={setIsModal}
              />
            </div>
          </div>

          {/* Confirmation Dialog */}
          <ConfirmDialog
            isOpen={isConfirmOpen}
            message="Are you sure you want to archive this approval workflow?"
            onConfirm={confirmArchived}
            onCancel={cancelArchived}
            confirmLabel="Archive"
            loading={archiving}
          />

          {isModal && (
            <CreateApproval
              setIsModal={setIsModal}
              fetchWorkflows={fetchWorkflows}
            />
          )}
          {editModalID && (
            <EditApproval
              editApproval={editApproval}
              fetchWorkflows={fetchWorkflows}
              workflowId={editModalID}
            />
          )}
          <div className="mt-4 space-y-6">
            {Object.entries(getGroupedWorkflows).map(
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
                    editApproval={editApproval}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Workflow;
