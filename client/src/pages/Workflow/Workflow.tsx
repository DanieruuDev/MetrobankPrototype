import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import CreateApproval from "../../components/CreateApproval";
import axios from "axios";
import Approval from "./SpecificApproval/Approval";

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
  approver_status: string;
  approver_due_date: string;
  approver_assigned_at: string;
  response_id: number;
  approver_order: number;
  response: string;
  comment: string | null;
  response_time: string;
  response_updated_at: string;
}
export interface DetailedWorkflow {
  workflow_id: number;
  requester_id: number;
  requester_email: string;
  rq_title: string;
  due_date: string;
  status: string;
  doc_name: string;
  doc_path: string;
  school_details: string;
  approvers: Approver[];
}

function Workflow() {
  const [workflowDisplay, setWorkflowDisplay] = useState<
    WorkflowDisplaySchema[]
  >([]);
  const [detailedWorkflow, setDetailedWorkflow] = useState<
    DetailedWorkflow | undefined
  >(() => {
    const savedWorkflow = localStorage.getItem("detailedWorkflow");
    return savedWorkflow ? JSON.parse(savedWorkflow) : undefined;
  });
  const [isModal, setIsModal] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [noApproval, setNoApproval] = useState<boolean>(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };
  const fetchWorkflow = async (requester_id: number, workflow_id: number) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/admin/get-approval/${requester_id}/${workflow_id}`
      );
      setDetailedWorkflow(response.data);
      localStorage.setItem("detailedWorkflow", JSON.stringify(response.data)); // Persist
    } catch (error) {
      console.error("Error fetching workflow:", error);
    }
  };
  const deleteWorkflow = async (requester_id: number, workflow_id: number) => {
    try {
      //check authorization for deletion
      //cahnge the requester_id with authorize id
      axios.delete(
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
  const fetchWorkflows = async () => {
    try {
      const response = await axios.get<WorkflowDisplaySchema[]>(
        `http://localhost:5000/admin/get-approvals/${3}?page=${page}&limit=10`
      );

      if (!Array.isArray(response.data)) {
        console.error("Unexpected API response format:", response.data);
        setHasMore(false);
        setNoApproval(true);
        return;
      }

      console.log("Fetched Data:", response.data); // Debugging

      if (response.data.length === 0) {
        setHasMore(false);
        setNoApproval(true);
        return;
      }

      setWorkflowDisplay((prev) => {
        if (page === 1) {
          return response.data; // Reset list on first page
        }
        const existingIds = new Set(prev.map((item) => item.workflow_id));
        const newData = response.data.filter(
          (item) => !existingIds.has(item.workflow_id)
        );
        return [...prev, ...newData];
      });

      setHasMore(response.data.length === 10); // Only enable "Show More" if exactly 10 items returned
    } catch (error) {
      console.error("Error fetching workflows:", error);
      setHasMore(false);
      setNoApproval(true);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [page]); // ✅ Only one useEffect watching `page`

  return (
    <div className="pl-[300px]">
      <nav className="h-[80px] border-b-1">
        <Navbar />
      </nav>
      <Sidebar />

      {detailedWorkflow ? (
        <Approval
          detailedWorkflow={detailedWorkflow}
          setDetailedWorkflow={setDetailedWorkflow}
          fetchWorkflow={fetchWorkflow}
        />
      ) : (
        <div className="px-5 pt-5">
          <div className="flex justify-between">
            <h2 className="font-bold text-[20px] text-[#024FA8]">
              Approvals Overview
            </h2>
            <button
              className="p-2 bg-[#0f61c0] rounded-md text-[14px] text-white cursor-pointer hover:opacity-90"
              onClick={() => setIsModal(!isModal)}
            >
              Create Approval
            </button>
          </div>
          {isModal && (
            <CreateApproval
              setIsModalOpen={setIsModal}
              requester_id={3}
              setWorkflowDisplay={setWorkflowDisplay}
              fetchWorkflows={fetchWorkflows}
            />
          )}
          <div className="mt-10">
            {/* Table Header */}
            <div className="grid grid-cols-7 bg-gray-100 text-gray-600 p-3 font-medium rounded-md">
              <div className="text-left">Request Title</div>
              <div className="text-left">Document</div>
              <div className="text-left">Status</div>
              <div className="text-left">Approver</div>
              <div className="text-left">Due Date</div>
              <div className="text-left">Details</div>
              <div className="text-center">Action</div>{" "}
              {/* New column for delete button */}
            </div>

            {/* Table Rows */}
            <div className="divide-y mt-2 divide-gray-200">
              {noApproval ? (
                <div className="text-center text-gray-500 p-5">
                  No approval workflows found.
                </div>
              ) : workflowDisplay.length > 0 ? (
                workflowDisplay.map((workflow, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-7 p-3 items-center hover:bg-gray-50 transition cursor-pointer z-10"
                    onClick={() => fetchWorkflow(3, workflow.workflow_id)}
                  >
                    <div className="truncate max-w-[160px]">
                      {workflow.rq_title}
                    </div>
                    <div className="truncate max-w-[160px]">
                      {workflow.doc_name}
                    </div>
                    <div
                      className={`font-semibold ${
                        workflow.status === "Pending"
                          ? "text-yellow-500"
                          : workflow.status === "Ongoing"
                          ? "text-blue-500"
                          : "text-green-500"
                      }`}
                    >
                      {workflow.status}
                    </div>
                    <div className="truncate">{workflow.current_approver}</div>
                    <div className="truncate">
                      {formatDate(workflow.due_date)}
                    </div>
                    <div className="truncate">
                      <span>{workflow.school_details}</span>
                    </div>

                    {/* Delete Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={(event) => {
                          event.stopPropagation(); // Prevent parent onClick from triggering
                          deleteWorkflow(3, workflow.workflow_id);
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition z-20 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 p-5">
                  Loading approvals...
                </div>
              )}
            </div>

            {/* Show More Button */}
            {hasMore && workflowDisplay.length > 0 && !noApproval && (
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="mt-5 p-2 bg-[#0f61c0] text-white rounded-md hover:opacity-90 w-full"
              >
                Show More
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Workflow;
