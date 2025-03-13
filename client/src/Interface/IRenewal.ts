export interface RenewalDetails {
  // Renewal Information
  renewal_id: number;
  student_id: number;
  scholar_name: string;
  campus: string;
  batch_number: string;
  renewal_date: string; // ISO Date String (e.g., '2025-03-10')

  // Renewal Basis
  renewal_year_level_basis: string;
  renewal_semester_basis: string;
  renewal_school_year_basis: string;

  // GPA and Renewal Validation Status
  gpa: number | null;
  gpa_validation_stat: "NOT STARTED" | "PASSED" | "FAILED";
  no_failing_grd_validation: "NOT STARTED" | "PASSED" | "FAILED";
  no_other_scholar_validation: "NOT STARTED" | "PASSED" | "FAILED";
  goodmoral_validation: "NOT STARTED" | "PASSED" | "FAILED";
  no_police_record_validation: "NOT STARTED" | "PASSED" | "FAILED";
  full_load_validation: "NOT STARTED" | "PASSED" | "FAILED";
  withdrawal_change_course_validation: "NOT STARTED" | "PASSED" | "FAILED";
  enrollment_validation: "NOT STARTED" | "PASSED" | "FAILED";

  // Scholarship Status
  scholarship_status: "NOT STARTED" | "PASSED" | "DELISTED";
  year_level: string;
  semester: string;
  school_year: string;

  // Delisting Information
  delisted_date?: string | null;
  delisting_root_cause?: string | null;
}
