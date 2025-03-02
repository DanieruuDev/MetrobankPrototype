interface Workflow {
  workflow_id: number;
  document_id: number | null;
  requester_id: number;
  rq_type_id: string | null;
  school_year: string;
  semester: string;
  scholar_level: string;
  status: "Pending" | "Ongoing" | "Completed";
  due_date: Date;
  completed_at: Date | null;
  rq_date: Date;
}

interface WorkflowApprover {
  approver_id: number;
  user_email: string;
  workflow_id: number;
  approver_order: number;
  status: "pending" | "missed" | "current" | "reassigned" | "finish";
  due_date: Date;
  assigned_at: Date;
  is_reassigned: boolean;
}

interface ApproverResponse {
  response_id: number;
  approver_id: number;
  response: "pending" | "approved" | "reject";
  comment: string | null;
  response_time: Date;
  updated_at: Date;
}

// Full Approval Workflow Structure
export interface ApprovalWorkflow {
  workflow: Workflow;
  document: Document;
  approverQueries: {
    approvers: WorkflowApprover;
    approval_response: ApproverResponse;
  }[];
}
