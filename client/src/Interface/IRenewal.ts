export interface RenewalDetails {
  validation_id: number;
  renewal_id: number;
  student_id: number;
  scholar_name: string;
  campus: string;
  batch: string;
  renewal_date: string | null; // ISO Date String (e.g., '2025-03-10')

  renewal_year_level_basis: string;
  renewal_semester_basis: string;
  renewal_school_year_basis: string;

  gpa: number | null;
  gpa_validation_stat: "Not Started" | "Passed" | "Failed";
  no_failing_grd_validation: "Not Started" | "Passed" | "Failed";
  no_other_scholar_validation: "Not Started" | "Passed" | "Failed";
  goodmoral_validation: "Not Started" | "Passed" | "Failed";
  no_derogatory_record: "Not Started" | "Passed" | "Failed";
  full_load_validation: "Not Started" | "Passed" | "Failed";
  withdrawal_change_course_validation: "Not Started" | "Passed" | "Failed";
  enrollment_validation: "Not Started" | "Passed" | "Failed";

  scholarship_status: "Not Started" | "Passed" | "Delisted";
  year_level: string;
  semester: string;
  school_year: string;
  is_validated: boolean | null; // Updated to support null values
  delisted_date?: string | null;
  delisting_root_cause?: string | null;

  initialized_by: number;
  validator_id: number;
  user_id: number;
  role_id: number;

  completed_at: string;
  is_hr_validated: boolean;
  hr_completed_at: string;

  grades?: RenewalGradesPayload | null;
}
export interface RenewalGradesPayload {
  fileURL?: string; // where B2 stored the file
  gradeList?: ScholarGrade[]; // actual grades list
  fileName?: string; // original file name
}
export interface RenewalDetailsClone extends RenewalDetails {
  isEdited: boolean;
  original: RenewalDetails;
}
export interface RenewalRow {
  student_id: number;
  scholar_name: string;
  scholarship_status: "Not Started" | "Passed" | "Delisted";
  campus: string;
  batch: string;
  renewal_date: string | null; // ISO Date string
  renewal_year_level_basis: string;
  renewal_semester_basis: string;
  renewal_school_year_basis: string;
  gpa: number | null;
  gpa_validation_stat: "Not Started" | "Passed" | "Failed";
  no_failing_grd_validation: "Not Started" | "Passed" | "Failed";
  no_other_scholar_validation: "Not Started" | "Passed" | "Failed";
  goodmoral_validation: "Not Started" | "Passed" | "Failed";
  no_derogatory_record: "Not Started" | "Passed" | "Failed";
  full_load_validation: "Not Started" | "Passed" | "Failed";
  withdrawal_change_course_validation: "Not Started" | "Passed" | "Failed";
  enrollment_validation: "Not Started" | "Passed" | "Failed";
  is_validated: boolean | null; // Updated to support null values
  year_level: string;
  semester: string;
  school_year: string;
  delisted_date?: string | null;
  delisting_root_cause?: string | null;
  is_hr_validated: boolean;
  hr_completed_at: string;
}

export const tableHead = {
  student_id: "Student ID",
  scholar_name: "Scholar Name",
  campus: "Campus",
  batch: "Batch",
  renewal_date: "Renewal Date",
  renewal_year_level_basis: "Renewal Year Level Basis",
  renewal_semester_basis: "Renewal Semester Basis",
  renewal_school_year_basis: "Renewal School Year Basis",
  gpa: "GPA",
  gpa_validation_stat: "GPA Validation",
  no_failing_grd_validation: "No Failing Grades",
  no_other_scholar_validation: "No Other Scholarship",
  goodmoral_validation: "Good Moral",
  no_derogatory_record: "No Derogatory Record",
  full_load_validation: "With Full Load",
  withdrawal_change_course_validation: "Withdrawal/Change of Program",
  enrollment_validation: "Enrollment Validation",
  is_validated: "Is Validated",
  year_level: "Renewal Year Level",
  semester: "Renewal Semester",
  school_year: "Renewal School Year",
  delisted_date: "Delisted Date",
  delisting_root_cause: "Delisting Root Cause",
  is_hr_validated: "HR Validate",
  hr_completed_at: "HR Completed",
};

export const renewalTableHead = {
  student_id: "Student ID",
  scholar_name: "Scholar Name",
  scholarship_status: "Scholarship Status",
  campus: "Campus",
  batch: "Batch",
  renewal_date: "Renewal Date",
  renewal_year_level_basis: "Renewal Year Level Basis",
  gpa: "GPA",
  gpa_validation_stat: "GPA Validation",
  no_failing_grd_validation: "No Failing Grades",
  no_other_scholar_validation: "No Other Scholarship",
  goodmoral_validation: "Good Moral",
  no_derogatory_record: "No Derogatory Record",
  full_load_validation: "Full Load",
  withdrawal_change_course_validation: "Withdrawal/Change of Program",
  enrollment_validation: "Enrollment Validation",
  is_validated: "Is Validated",
  year_level: "Renewal Year Level ",
  delisted_date: "Delisted Date",
  delisting_root_cause: "Delisting Root Cause",
  is_hr_validated: "HR Validate",
  hr_completed_at: "HR Completed",
};

export const validation = {
  gpa_validation_stat: "GPA Validation",
  no_failing_grd_validation: "No Failing Grades",
  no_other_scholar_validation: "No Other Scholarship",
  goodmoral_validation: "Good Moral",
  no_derogatory_record: "No Derogatory Record",
  full_load_validation: "Full Load",
  withdrawal_change_course_validation: "Withdrawal/Change of Program",
  enrollment_validation: "Enrollment Validation",
  scholarship_status: "Scholarship Status",
};

export const validationInput = {
  gpa: "GPA",
  delisting_root_cause: "Delisting Root Cause",
  is_validated: "Is Validated",
};

export interface ScholarshipSummary {
  student_id: number;
  scholar_name: string;
  scholarship_status: string;
  course: string;
  yr_lvl: string;
  campus: string;
  semester: string;
  school_year: string;
  batch: string;

  validation_id: number | null;
  gpa: number | null;
  gpa_validation_stat: string | null;
  renewal_date: string | null;
  no_failing_grd_validation: string | null;
  goodmoral_validation: string | null;
  full_load_validation: string | null;
  enrollment_validation: string | null;
  no_other_scholar_validation: string | null;
  no_derogatory_record: string | null;
  withdrawal_change_course_validation: string | null;
  validation_scholarship_status: string | null;

  renewal_id: number | null;
  renewal_date_history: string | null;
  renewal_year_level: string | null;
  renewal_semester: string | null;
  renewal_school_year: string | null;
  renewal_status: string | null;
  delisting_root_cause: string | null;
}

export interface ScholarRenewalResponse extends ScholarshipSummary {
  renewal_history: Omit<
    ScholarshipSummary,
    | "validation_id"
    | "renewal_date"
    | "no_failing_grd_validation"
    | "goodmoral_validation"
    | "full_load_validation"
    | "enrollment_validation"
    | "no_other_scholar_validation"
    | "no_derogatory_record"
    | "withdrawal_change_course_validation"
    | "validation_scholarship_status"
  >[];
}

export interface InitialRenewalInfo {
  count: number;
  renewal_school_year_basis: number;
  renewal_school_year_basis_text: string;
  renewal_sem_basis: number;
  renewal_sem_basis_text: string;
  school_year: number;
  school_year_text: string;
  semester: number;
  semester_text: string;
}

//grades

/** Represents one course grade */
/** Represents one course grade */
export interface ScholarGrade {
  course_code: string;
  final_grade: number;
}

/** Represents one student's full extracted record */
export interface ScholarGradeDocument {
  /** The name of the file (e.g. "Neo Grade.pdf") */
  fileName?: string;

  /** The actual PDF file object extracted from JSZip */
  fileObject?: File;

  /** Identifiers */
  student_id: string;

  /** Names may differ depending on extraction source */
  student_name?: string; // From PDF backend
  scholar_name?: string; // From Excel extraction

  /** School info */
  campus: string;
  program: string;

  /** Academic info */
  sy: string | null; // e.g. "2024-2025"
  semester: string | null; // e.g. "2nd Term"
  gwa: number | null;
  pageCount?: number; // From PDF backend

  /** Year/level naming differences */
  level?: string; // From PDF backend
  year_level?: string; // From Excel extraction

  /** The actual subject-grade breakdown */
  grades: ScholarGrade[];
}

/** Response for single PDF extraction */
export interface SingleScholarGradeResult extends ScholarGradeDocument {
  fileName: string;
}

/** Response for ZIP extraction (multiple PDFs) */
export interface ZipScholarGradeResult {
  totalFiles: number;
  results: ScholarGradeDocument[];
}
