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

export interface WFApprover {
  email: string;
  order: number;
  date: string;
}
export interface CreateWorkflowSchema {
  requester_id: number;
  req_type_id: string;
  description: string;
  file: File | null;
  approvers: WFApprover[];
  scholar_level: string;
  semester: string;
  due_date: string;
  school_year: string;
}

export interface ApproverDetailedView {
  approver_id: number;
  user_id: number;
  user_email: string;
  approver_name: string;
  approver_role_id: number;
  approver_role_name: string;
  workflow_id: number;
  approver_order: number;
  approver_status: string;
  workflow_status: string;
  description: string;
  approver_due_date: string; // ISO string
  assigned_at: string; // ISO string
  is_reassigned: boolean;
  is_current: boolean;
  requester_id: number;
  requester_name: string;
  requester_role: string;
  requester_role_name: string;
  date_started: string; // ISO string
  due_date: string; // ISO string
  school_year: string;
  year_level: string;
  semester: string;
  request_title: string;
  doc_id: number;
  doc_name: string;
  doc_type: string;
  file_path: string;
  file_size: number;
  document_uploaded_at: string; // ISO string
  approver_response: string;
  approver_comment: string | null;
  response_time: string | null; // ISO string or null

  // New fields for approval tracking
  total_approvers: number;
  completed_approvers: number;
  remaining_approvers: number;
  approval_progress: Array<{
    approver_name: string;
    approver_role: string;
    approval_status: string;
    approval_time: string | null;
    response: string;
    approver_order: number;
    comment: string | null;
  }>;
  current_approver: string | null;
}

// For cases where you might want just the approval progress items:
export interface ApprovalProgressItem {
  approver_name: string;
  approver_role: string;
  approval_status: string;
  response: string;
  approval_time: string | null;
  approver_order: number;
  comment: string | null;
}
export interface RequestApprovalList {
  user_id: number;
  approver_id: number;
  request_title: string;
  approver_status: string;
  is_current: boolean;
  requester: string;
  date_started: string;
  approver_due_date: string;
  school_year: string;
  year_level: string;
  semester: string;
}

export interface WorkflowFormData {
  request_title: string;
  requester_id: string;
  req_type_id: string;
  description: string;
  file: File | null;
  approvers: WFApprover[]; //edit later
  scholar_level: string;
  semester: string;
  due_date: string;
  school_year: string;
}
