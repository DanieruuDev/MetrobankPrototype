import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useEffect, useState } from "react";
//import CreateApproval from "../../components/CreateApproval";
import axios from "axios";
import Approval from "./SpecificApproval/Approval";
import Request from "./Request";
import { Trash2 } from "lucide-react";
import CreateApproval2 from "../../components/approval/CreateApproval2";
import { formatDate } from "../../utils/DateConvertionFormat";
import { workflowStatusBG } from "../../utils/StatusBadge";
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
  status: "Not Started" | "On Progress" | "Completed";
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
  const [isModal, setIsModal] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [noApproval, setNoApproval] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("my-approval");
  const statuses = [
    { label: "Not Started" },
    { label: "On Progress" },
    { label: "Completed" },
  ];

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
    <div className="pl-[250px]">
      <Navbar pageName="Workflow Approval" />

      <Sidebar />

      {detailedWorkflow ? (
        <Approval
          detailedWorkflow={detailedWorkflow}
          setDetailedWorkflow={setDetailedWorkflow}
          fetchWorkflow={fetchWorkflow}
        />
      ) : (
        <div className="px-5 pt-5">
          <div className="flex gap-4 mb-4">
            <button
              className={`text-[16px] cursor-pointer ${
                activeTab === "my-approval"
                  ? "text-[#024FA8] font-bold border-b-3 border-[#024FA8]"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("my-approval")}
            >
              My Approval
            </button>
            <button
              className={`text-[16px] cursor-pointer ${
                activeTab === "requests"
                  ? "text-[#024FA8] font-bold border-b-3 border-[#024FA8]"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("requests")}
            >
              Approval Requests
            </button>
          </div>

          {activeTab === "requests" ? (
            <Request />
          ) : (
            <>
              <p>Current Account: sample@gmail.com REQUESTER</p>
              <div className="flex justify-between">
                <button></button>
                <button
                  className="p-2 bg-[#0f61c0] rounded-md text-[14px] text-white cursor-pointer hover:opacity-90"
                  onClick={() => setIsModal(!isModal)}
                >
                  Create Approval
                </button>
              </div>
              <div className=" rounded-md  inline-block text-[14px] mt-2">
                <div className="flex flex-row items-center gap-6">
                  {statuses.map((status, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full ${workflowStatusBG(
                          status.label
                        )}`}
                      ></div>
                      <span>{status.label}</span>
                    </div>
                  ))}
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
              <div className="mt-2">
                <div
                  className="grid text-[#565656] text-[14px] font-bold rounded-md bg-[#EFEFEF] h-[58px] items-center"
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
                  {noApproval ? (
                    <div className="text-center text-gray-500 p-5">
                      No approval workflows found.
                    </div>
                  ) : workflowDisplay.length > 0 ? (
                    workflowDisplay.map((workflow, index) => (
                      <div
                        key={index}
                        className="grid py-2 items-center hover:bg-gray-50 transition cursor-pointer z-10 text-[14px] border-b border-b-[#c7c7c792]"
                        style={{
                          gridTemplateColumns:
                            "1.5fr 1fr min-content 1fr 2fr min-content",
                        }}
                        onClick={() => fetchWorkflow(3, workflow.workflow_id)}
                      >
                        <div className="truncate px-6 max-w-[255px]">
                          {workflow.rq_title}
                        </div>
                        <div className="truncate max-w-[160px] px-6">
                          {workflow.doc_name}
                        </div>
                        <div
                          className={`font-semibold py-1 rounded-md min-w-[56px] `}
                        >
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

                        {/* Delete Button - Shrinks to fit content */}
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteWorkflow(3, workflow.workflow_id);
                          }}
                          className="p-2 text-red-500 rounded-md transition cursor-pointer flex-shrink-0  max-w-[40px]"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 p-5">
                      Loading approvals...
                    </div>
                  )}
                </div>

                {hasMore && workflowDisplay.length > 0 && !noApproval && (
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    className="mt-5 p-2 bg-[#0f61c0] text-white rounded-md hover:opacity-90 w-full"
                  >
                    Show More
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Workflow;
