import React from "react";
import { ApproverInfo } from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";
import { formatDate } from "../../utils/DateConvertionFormat";
export interface Approvers {
  workflow_id: number;
  workflow_title: string;
  workflow_status: string;
  approval_req_type: string;
  created_by: string;
  current_approver_name: string;
  current_approver_role: string;
  completed_at: string;
  approver_due_date: string;
}

function ApproverTable({
  approvers,
  onRowClick,
  section, // 👈 add this
}: {
  approvers: (ApproverInfo & Approvers)[];
  onRowClick: (approver_id: number) => void;
  section?: "Completed" | "Canceled" | "Other";
}) {
  return (
    <div>
      {/* Column Headers */}
      <div
        className="grid text-[#565656] text-[14px] font-medium h-[40px] items-center border-b border-b-[#c7f7f792] bg-[#f0f9f9] rounded-t-md mb-1"
        style={{
          gridTemplateColumns:
            section === "Canceled"
              ? "1.8fr 1.8fr 1.2fr 1.5fr 1.5fr"
              : "1.8fr 1.8fr 1.2fr 1.5fr 1.5fr 1.5fr",
        }}
      >
        <div className="text-left pl-6 pr-2">Workflow Title</div>
        <div className="text-center px-2">Status</div>
        <div className="text-left pl-4 pr-2">Requester</div>
        <div className="text-left pl-4 pr-2">Role</div>
        <div className="text-left pl-4 pr-2">Designated</div>
        {section !== "Canceled" && (
          <div className="text-left pl-4 pr-2">
            {section === "Completed" ? "Completed At" : "Due Date"}
          </div>
        )}
      </div>

      {/* Request Items */}
      {approvers.map((a) => {
        console.log(
          "completed_at:",
          a.completed_at,
          "due_date:",
          a.approver_due_date
        );

        return (
          <div
            key={a.workflow_id + "-" + a.approver_id}
            onClick={() => onRowClick(a.approver_id)}
            className="grid text-[#565656] text-[14px] h-[52px] items-center border-b border-b-[#c7f7f792] hover:bg-[#f7f7f7] rounded-md cursor-pointer mb-2"
            style={{
              gridTemplateColumns:
                section === "Canceled"
                  ? "1.8fr 1.8fr 1.2fr 1.5fr 1.5fr"
                  : "1.8fr 1.8fr 1.2fr 1.5fr 1.5fr 1.5fr",
            }}
          >
            <div className="pl-6 pr-2 max-w-[255px] truncate">
              {a.workflow_title}
            </div>

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

            {section !== "Canceled" && (
              <div className="pl-4 pr-2">
                {section === "Completed"
                  ? formatDate(a.completed_at)
                  : formatDate(a.approver_due_date)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ApproverTable;
