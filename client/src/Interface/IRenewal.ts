export interface RenewalDetails {
  // Renewal Information
  validation_id: number;
  renewal_id: number;
  student_id: number;
  scholar_name: string;
  campus: string;
  batch: string;
  renewal_date: string; // ISO Date String (e.g., '2025-03-10')

  // Renewal Basis
  renewal_year_level_basis: string;
  renewal_semester_basis: string;
  renewal_school_year_basis: string;

  // GPA and Renewal Validation Status
  gpa: number | null;
  gpa_validation_stat: "Not Started" | "Passed" | "Failed";
  no_failing_grd_validation: "Not Started" | "Passed" | "Failed";
  no_other_scholar_validation: "Not Started" | "Passed" | "Failed";
  goodmoral_validation: "Not Started" | "Passed" | "Failed";
  no_police_record_validation: "Not Started" | "Passed" | "Failed";
  full_load_validation: "Not Started" | "Passed" | "Failed";
  withdrawal_change_course_validation: "Not Started" | "Passed" | "Failed";
  enrollment_validation: "Not Started" | "Passed" | "Failed";

  // Scholarship Status
  scholarship_status: "Not Started" | "Passed" | "Delisted";
  year_level: string;
  semester: string;
  school_year: string;

  // Delisting Information
  delisted_date?: string | null;
  delisting_root_cause?: string | null;
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
  no_police_record_validation: "No Police Record",
  full_load_validation: "No Full Load",
  withdrawal_change_course_validation: "Withdrawal/Change of Course",
  enrollment_validation: "Enrollment Validation",
  scholarship_status: "Scholarship Status",
  year_level: "Year Level",
  semester: "Semester",
  school_year: "School Year",
  delisted_date: "Delisted Date",
  delisting_root_cause: "Delisting Root Cause",
};

export const validation = {
  gpa_validation_stat: "GPA Validation",
  no_failing_grd_validation: "No Failing Grades",
  no_other_scholar_validation: "No Other Scholarship",
  goodmoral_validation: "Good Moral",
  no_police_record_validation: "No Police Record",
  full_load_validation: "No Full Load",
  withdrawal_change_course_validation: "Withdrawal/Change of Course",
  enrollment_validation: "Enrollment Validation",
  scholarship_status: "Scholarship Status",
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
  no_police_record_validation: string | null;
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
    | "no_police_record_validation"
    | "withdrawal_change_course_validation"
    | "validation_scholarship_status"
  >[];
}
