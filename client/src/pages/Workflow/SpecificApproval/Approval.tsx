import Sidebar from "../../../components/Sidebar";
import { useState, useEffect } from "react";
import axios from "axios";
import { Approver, DetailedWorkflow } from "../Workflow";

interface ApprovalProps {
  detailedWorkflow?: DetailedWorkflow;
  setDetailedWorkflow: React.Dispatch<
    React.SetStateAction<DetailedWorkflow | undefined>
  >;
  fetchWorkflow: (requester_id: number, workflow_id: number) => void;
}

function Approval({
  detailedWorkflow,
  setDetailedWorkflow,
  fetchWorkflow,
}: ApprovalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState<Approver | null>(
    null
  );
  const [newApprover, setNewApprover] = useState("");
  const [reason, setReason] = useState("");
  const workflow = Array.isArray(detailedWorkflow)
    ? detailedWorkflow[0]
    : detailedWorkflow;

  useEffect(() => {
    if (detailedWorkflow) {
      setIsLoading(false);
    }
  }, [detailedWorkflow]);

  const handleBack = () => {
    localStorage.removeItem("detailedWorkflow");
    setDetailedWorkflow(undefined);
  };

  const openModal = (approver: Approver) => {
    setSelectedApprover(approver);
    setShowModal(true);
  };

  const handleChangeApprover = async () => {
    if (!selectedApprover || !newApprover || !reason || !workflow) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const API_BASE_URL = "http://localhost:5000";

      const response = await axios.put(
        `${API_BASE_URL}/admin/change-approval/3`,
        {
          workflow_id: workflow.workflow_id,
          old_approver_id: selectedApprover.approver_id,
          new_approver_id: newApprover,
          reason,
        }
      );
      fetchWorkflow(workflow.requester_id, workflow.workflow_id);
      // 3. Handle success
      alert(response.data.message || "Approver changed successfully.");
      window.location.reload();

      if (response.status === 200) {
        setShowModal(false);
      }
    } catch (error: any) {
      console.error("Error changing approver:", error);
      alert(error.response?.data?.message || "Failed to change approver.");
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500 p-5">Loading...</div>;
  }

  if (!workflow) {
    return (
      <div className="text-center text-red-500 p-5">No data available.</div>
    );
  }

  return (
    <div className="bg-[#ededed] min-h-[88vh] pt-3">
      <Sidebar />

      <div className="p-10 bg-white rounded-sm max-w-[900px] mx-auto">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          ← Back
        </button>
        <div className="flex justify-between">
          <div className="w-full">
            <div className="flex text-[26px] font-semibold text-[#024fa8] space-x-2">
              <div>{workflow?.rq_title}</div>
              <div># {workflow?.workflow_id}</div>
            </div>
            <div className="text-gray-500">{workflow?.status}</div>
          </div>
          <div className="max-w-[150px]">
            <div className="font-bold text-[18px]">Requester:</div>
            <div className="font-semibold text-[16px]">
              {workflow?.requester_email}
            </div>
          </div>
        </div>

        {/* Approvers Section */}
        <h2 className="mt-5 text-[20px] font-bold">Approvers:</h2>
        <div className="mt-4 flex flex-col space-y-4">
          {workflow?.approvers?.length ? (
            workflow.approvers
              .filter(
                (approver: { approver_status: string }) =>
                  approver.approver_status !== "replaced"
              )
              .sort(
                (a: { approver_order: any }, b: { approver_order: any }) =>
                  (a.approver_order || 0) - (b.approver_order || 0)
              )
              .map((approver: Approver) => (
                <div
                  key={approver.approver_id}
                  className="p-4 border border-gray-300 rounded-lg bg-gray-100"
                >
                  <div className="text-gray-700">
                    <span className="font-semibold">User:</span>{" "}
                    {approver.approver_email}
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className={`font-bold ${
                        approver.approver_status === "current"
                          ? "text-blue-500"
                          : approver.approver_status === "approved"
                          ? "text-green-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {approver.approver_status || "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold">Order:</span>{" "}
                    {approver.approver_order}
                  </div>
                  <button
                    onClick={() => openModal(approver)}
                    className="mt-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Change Approver
                  </button>
                </div>
              ))
          ) : (
            <div className="text-gray-500">No approvers found</div>
          )}
        </div>
      </div>

      {/* Change Approver Modal */}
      {showModal && selectedApprover && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold">Change Approver</h2>
            <p className="text-gray-700">Select a new approver:</p>
            <input
              type="email"
              className="mt-2 p-2 border rounded w-full"
              value={newApprover}
              onChange={(e) => setNewApprover(e.target.value)}
            />

            <p className="mt-3 text-gray-700">Reason for reassignment:</p>
            <textarea
              className="mt-2 p-2 border rounded w-full"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                onClick={handleChangeApprover}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Approval;
