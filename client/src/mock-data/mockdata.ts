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
