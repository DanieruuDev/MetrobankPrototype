export interface AuditLogEntry {
  audit_id: number;
  validation_id: number;
  renewal_id: number;
  student_id: number;
  scholar_name: string;
  campus: string;
  school_year: string;
  semester: string;
  field_name: string;
  new_value: string | null;
  changed_at: string;
  admin_id: number;
  changed_by: string;
  changed_by_email: string;
  changed_by_job: string;
  role_id: number;
  changed_by_role: string;
  branch_id: number | null;
  branch_name: string | null;
  change_category: string;
  scholarship_status: string;
  current_gpa: number | null;
  change_date: string;
  change_hour: number;
}

export interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLogEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface AuditLogFilters {
  student_id?: number;
  renewal_id?: number;
  validation_id?: number;
  admin_id?: number;
  role_id?: number;
  branch_id?: number;
  change_category?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}
