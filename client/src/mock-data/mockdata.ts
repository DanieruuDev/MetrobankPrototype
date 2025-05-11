interface Scholar {
  id: number;
  name: string;
  schoolId: string;
  campus: string;
  batch: string;

  // Current status information
  yearLevel: string;
  semester: string;
  schoolYear: string;
  scholarshipStatus: string;
  delistedDate?: string;
  delistingRootCause?: string;

  // Renewal information
  renewalDate?: string;
  renewalYearLevelBasis?: string;
  renewalSemesterBasis?: string;
  renewalSchoolYearBasis?: string;

  // Academic validation
  gpa?: string;
  gpaValidationStatus?: string;
  noFailingGradeValidationStatus?: string;
  noOtherScholarshipValidationStatus?: string;
  goodMoralValidation?: string;
  noPoliceRecordValidation?: string;
  fullLoadValidation?: string;
  withdrawalOrChangeCourseValidation?: string;
  enrollmentValidation?: string;

  // Financial information
  contractRenewal: string;
  scholarshipFee: string;
  scholarshipFeeDisbursementStatus: string;
  scholarshipFeeDisbursementDate: string;
  allowanceFeeAmount: string;
  allowanceFeeDisbursementStatus: string;
  allowanceFeeDisbursementDate: string;
  thesisFeeAmount: string;
  thesisFeeDisbursementStatus: string;
  thesisFeeDisbursementDate: string;

  // Internship information
  internshipRequiredHours: string;
  internshipAllowanceAmount: string;
}

interface ScholarshipData {
  branches: {
    id: string;
    name: string;
    courses: {
      id: string;
      name: string;
      code: string;
      years: {
        id: string;
        name: string;
        scholars: Scholar[];
      }[];
    }[];
  }[];
}

export const scholarshipData: ScholarshipData = {
  branches: [
    {
      id: "sti-ortigas",
      name: "STI Ortigas",
      courses: [
        {
          id: "it",
          name: "Information Technology",
          code: "SY2425-2T",
          years: [
            {
              id: "year-1",
              name: "Year 1",
              scholars: [
                {
                  id: 1,
                  name: "John Doe",
                  schoolId: "STI-2024-0001",
                  campus: "STI Ortigas",
                  batch: "2024",
                  yearLevel: "1st Year",
                  semester: "2nd Semester",
                  schoolYear: "2024-2025",
                  scholarshipStatus: "Active",

                  // Renewal information
                  renewalDate: "2024-11-15",
                  renewalYearLevelBasis: "1st Year",
                  renewalSemesterBasis: "1st Semester",
                  renewalSchoolYearBasis: "2024-2025",

                  // Academic validation
                  gpa: "3.5",
                  gpaValidationStatus: "Passed",
                  noFailingGradeValidationStatus: "Passed",
                  noOtherScholarshipValidationStatus: "Passed",
                  goodMoralValidation: "Passed",
                  noPoliceRecordValidation: "Passed",
                  fullLoadValidation: "Passed",
                  withdrawalOrChangeCourseValidation: "Passed",
                  enrollmentValidation: "Passed",

                  // Financial information
                  contractRenewal: "Pending",
                  scholarshipFee: "50000",
                  scholarshipFeeDisbursementStatus: "Pending",
                  scholarshipFeeDisbursementDate: "",
                  allowanceFeeAmount: "5000",
                  allowanceFeeDisbursementStatus: "Pending",
                  allowanceFeeDisbursementDate: "",
                  thesisFeeAmount: "",
                  thesisFeeDisbursementStatus: "",
                  thesisFeeDisbursementDate: "",

                  // Internship information
                  internshipRequiredHours: "",
                  internshipAllowanceAmount: "",
                },
                {
                  id: 2,
                  name: "Jane Smith",
                  schoolId: "STI-2024-0002",
                  campus: "STI Ortigas",
                  batch: "2024",
                  yearLevel: "1st Year",
                  semester: "2nd Semester",
                  schoolYear: "2024-2025",
                  scholarshipStatus: "Active",

                  // Renewal information
                  renewalDate: "2024-11-15",
                  renewalYearLevelBasis: "1st Year",
                  renewalSemesterBasis: "1st Semester",
                  renewalSchoolYearBasis: "2024-2025",

                  // Academic validation
                  gpa: "3.7",
                  gpaValidationStatus: "Passed",
                  noFailingGradeValidationStatus: "Passed",
                  noOtherScholarshipValidationStatus: "Passed",
                  goodMoralValidation: "Passed",
                  noPoliceRecordValidation: "Passed",
                  fullLoadValidation: "Passed",
                  withdrawalOrChangeCourseValidation: "Passed",
                  enrollmentValidation: "Passed",

                  contractRenewal: "Pending",
                  scholarshipFee: "50000",
                  scholarshipFeeDisbursementStatus: "Pending",
                  scholarshipFeeDisbursementDate: "",
                  allowanceFeeAmount: "5000",
                  allowanceFeeDisbursementStatus: "Pending",
                  allowanceFeeDisbursementDate: "",
                  thesisFeeAmount: "",
                  thesisFeeDisbursementStatus: "",
                  thesisFeeDisbursementDate: "",
                  internshipRequiredHours: "",
                  internshipAllowanceAmount: "",
                },
              ],
            },
          ],
        },
        {
          id: "computer-science",
          name: "Computer Science",
          code: "SY2425-2T",
          years: [
            {
              id: "year-2",
              name: "Year 2",
              scholars: [
                {
                  id: 3,
                  name: "Mark Johnson",
                  schoolId: "STI-2023-0003",
                  campus: "STI Ortigas",
                  batch: "2023",
                  yearLevel: "2nd Year",
                  semester: "2nd Semester",
                  schoolYear: "2024-2025",
                  scholarshipStatus: "Active",

                  // Renewal information
                  renewalDate: "2024-11-01",
                  renewalYearLevelBasis: "2nd Year",
                  renewalSemesterBasis: "1st Semester",
                  renewalSchoolYearBasis: "2024-2025",

                  // Academic validation
                  gpa: "3.8",
                  gpaValidationStatus: "Passed",
                  noFailingGradeValidationStatus: "Passed",
                  noOtherScholarshipValidationStatus: "Passed",
                  goodMoralValidation: "Passed",
                  noPoliceRecordValidation: "Passed",
                  fullLoadValidation: "Passed",
                  withdrawalOrChangeCourseValidation: "Passed",
                  enrollmentValidation: "Passed",

                  contractRenewal: "Approved",
                  scholarshipFee: "55000",
                  scholarshipFeeDisbursementStatus: "Disbursed",
                  scholarshipFeeDisbursementDate: "2024-12-15",
                  allowanceFeeAmount: "5500",
                  allowanceFeeDisbursementStatus: "Disbursed",
                  allowanceFeeDisbursementDate: "2024-12-15",
                  thesisFeeAmount: "",
                  thesisFeeDisbursementStatus: "",
                  thesisFeeDisbursementDate: "",
                  internshipRequiredHours: "",
                  internshipAllowanceAmount: "",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "sti-makati",
      name: "STI Makati",
      courses: [
        {
          id: "comp-sci",
          name: "Computer Science",
          code: "SY2425-2T",
          years: [
            {
              id: "year-2",
              name: "Year 2",
              scholars: [
                {
                  id: 6,
                  name: "David Lee",
                  schoolId: "STI-2023-0006",
                  campus: "STI Makati",
                  batch: "2023",
                  yearLevel: "2nd Year",
                  semester: "2nd Semester",
                  schoolYear: "2024-2025",
                  scholarshipStatus: "Active",

                  // Renewal information
                  renewalDate: "2024-11-05",
                  renewalYearLevelBasis: "2nd Year",
                  renewalSemesterBasis: "1st Semester",
                  renewalSchoolYearBasis: "2024-2025",

                  // Academic validation
                  gpa: "3.2",
                  gpaValidationStatus: "Passed",
                  noFailingGradeValidationStatus: "Passed",
                  noOtherScholarshipValidationStatus: "Passed",
                  goodMoralValidation: "Passed",
                  noPoliceRecordValidation: "Passed",
                  fullLoadValidation: "Passed",
                  withdrawalOrChangeCourseValidation: "Passed",
                  enrollmentValidation: "Passed",

                  contractRenewal: "Pending",
                  scholarshipFee: "52000",
                  scholarshipFeeDisbursementStatus: "Pending",
                  scholarshipFeeDisbursementDate: "",
                  allowanceFeeAmount: "5200",
                  allowanceFeeDisbursementStatus: "Pending",
                  allowanceFeeDisbursementDate: "",
                  thesisFeeAmount: "",
                  thesisFeeDisbursementStatus: "",
                  thesisFeeDisbursementDate: "",
                  internshipRequiredHours: "",
                  internshipAllowanceAmount: "",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export interface Student {
  name: string;
  id: string;
  year: string;
  semester: string;
  schoolYear: string;
  branch: string;
  received: string;
}

export const Students: Student[] = [
  {
    name: "Panturas, Daniel A.",
    id: "02000721123",
    year: "3rd Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Ortigas - Cainta",
    received: "₽ 000,000.00",
  },
  {
    name: "Asuncion, Jaime Martin P.",
    id: "02000722123",
    year: "3rd Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Cubao",
    received: "₽ 000,000.00",
  },
  {
    name: "Kjellberg, Felix Arvid U.",
    id: "02000723323",
    year: "1st Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Fairview",
    received: "₽ 000,000.00",
  },
  {
    name: "Panturas, Daniel A.",
    id: "02000723423",
    year: "2nd Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Global City",
    received: "₽ 000,000.00",
  },
  {
    name: "Kjellberg, Felix Arvid U.",
    id: "02000725123",
    year: "1st Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Passy - EDSA",
    received: "₽ 000,000.00",
  },
  {
    name: "Panturas, Daniel A.",
    id: "02000723623",
    year: "2nd Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Sha, Mexa",
    received: "₽ 000,000.00",
  },
  {
    name: "Asuncion, Jaime Martin P.",
    id: "02000723723",
    year: "3rd Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Novaliches",
    received: "₽ 000,000.00",
  },
  {
    name: "Panturas, Daniel A.",
    id: "02000728123",
    year: "2nd Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Sha, Mexa",
    received: "₽ 000,000.00",
  },
  {
    name: "Asuncion, Jaime Martin P.",
    id: "02000723923",
    year: "3rd Year",
    semester: "2nd Semester",
    schoolYear: "2024 - 2025",
    branch: "Novaliches",
    received: "₽ 000,000.00",
  },
];

export interface ComboData {
  semester_label: string;
  total_scholars: number;
  total_disbursement: number;
}

export const ComboChartData: ComboData[] = [
  {
    semester_label: "2023-2024 1st Semester",
    total_scholars: 80,
    total_disbursement: 4000000.0,
  },
  {
    semester_label: "2023-2024 2nd Semester",
    total_scholars: 85,
    total_disbursement: 4500000.0,
  },
  {
    semester_label: "2024-2025 1st Semester",
    total_scholars: 95,
    total_disbursement: 5500000.0,
  },
  {
    semester_label: "2024-2025 2nd Semester",
    total_scholars: 110,
    total_disbursement: 6000000.0,
  },
  {
    semester_label: "2025-2026 1st Semester",
    total_scholars: 130,
    total_disbursement: 7000000.0,
  },
  {
    semester_label: "2025-2026 2nd Semester",
    total_scholars: 125,
    total_disbursement: 6800000.0,
  },
];
