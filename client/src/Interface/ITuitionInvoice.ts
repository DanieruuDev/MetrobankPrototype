export interface Student {
  renewal_id: number;
  student_id: number;
  scholar_name: string;
  campus: string;
  batch: string;
  renewal_date: string;
  is_initial: boolean;
  year_level: string;
  semester: string;
  school_year: string;
  initialized_by: number;
  scholarship_status: string;
  delisted_date: string | null;
  delisting_root_cause: string | null;
  validation_id: number;
  is_validated: boolean | null;
  role_id: number | null;
  hr_completed_at: string | null;
  disbursement_id: number | null;
  disb_detail_id: number | null;
  disbursement_type_id: number;
  disbursement_label: string;
  disbursement_status: string;
  disbursement_amount: number | null;
  disbursement_files:
    | {
        file_id: number;
        file_name: string;
        file_type: string;
        size: number;
        upload_at: string;
      }[]
    | null;
}

export interface UploadedFile {
  id: number;
  studentId: number;
  filename: string;
  uploadedAt: string;
}

export interface Document {
  fileName: string;
  extracted: {
    studentName: string;
    studentNumber: string;
    program: string;
    schoolYearTerm: string;
    totalBalance: string;
  };
}

export interface JobStatus {
  jobId: string;
  status: string;
  progress?: number;
  result?: {
    fileName: string;
    processedFiles: number;
    status: string;
    progress: number;
    totalFiles: number;
    documents: Document[];
  };
}
