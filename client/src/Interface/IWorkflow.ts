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
  approver_status: string; // Pending | Completed | Missed | Replaced
  workflow_status: string;
  completed_at: string;
  description: string;
  approver_due_date: string; // ISO string
  assigned_at: string; // ISO string
  is_reassigned: boolean;
  requester_id: number;
  requester_name: string;
  requester_role: string;
  requester_role_name: string;
  date_started: string; // ISO string
  due_date: string; // ISO string
  school_year: string;
  semester: string;
  request_title: string;
  doc_id: number;
  doc_name: string;
  doc_type: string;
  file_path: string;
  file_size: number;
  document_uploaded_at: string; // ISO string
  approver_response: string; // Approved | Reject | Pending
  approver_comment: string | null;
  response_time: string | null; // ISO string or null
  response_id: number;
  // Approval tracking
  total_approvers: number;
  completed_approvers: number;
  remaining_approvers: number;
  approval_progress: Array<{
    approver_name: string;
    approver_role: string;
    approval_status: string; // Completed | Pending | Missed | Replaced
    approval_time: string | null; // ISO string
    approver_order: number;
    response: string | null; // Approved | Reject | Returned | Pending
    comment: string | null;
    user_id: number;
  }>;

  // Current approver
  current_approver: string | null;

  // 🔥 NEW: return feedback and requester back-and-forth
  return_conversation: Array<{
    return_id: number;
    reason: string;
    created_by: string; // approver/admin name
    created_at: string; // ISO string
    requester_take_action: boolean;
    requester_responses: Array<{
      req_response_id: number;
      message: string | null;
      file_name: string | null;
      file_type: string | null;
      file_size: number | null;
      responded_at: string; // ISO string
      requester_name: string;
    }>;
  }>;
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

export interface ApproverInfo {
  approver_id: number;
  user_id: number;
  approver_name: string;
  approver_role: string;
  approver_order: number;
  is_current: boolean;
  approver_status: string;
  completed_at: string;
  approver_due_date: string;
}
export interface WorkflowApprovalList {
  workflow_id: number;
  approval_req_type: string;
  school_year: string;
  semester: string;
  workflow_title: string;
  workflow_status: string;
  created_by: string;
  approver: ApproverInfo;
  completed_at: string;
}

export interface WorkflowFormData {
  rq_title: string;
  requester_id: string;
  description: string;
  file: File | null;
  approvers: WFApprover[]; //edit later
  due_date: string;
  sy_code: string;
  semester_code: string;
  approval_req_type: string;
  request_type_ids: string[];
}
export interface WFApprover {
  email: string;
  role: string;
  order: number;
  date: string;
}
