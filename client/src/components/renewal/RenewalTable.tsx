import { useEffect, useState } from "react";
import { RenewalDetails } from "../../Interface/IRenewal";
import axios from "axios";
//to be deleted
const tableHead = {
  student_id: "Student ID",
  scholar_name: "Scholar Name",
  campus: "Campus",
  batch_number: "Batch",
  renewal_date: "Renewal Date",
  renewal_year_level_basis: "Renewal Year Level Basis",
  renewal_semester_basis: "Renewal Semester Basis",
  renewal_school_year_basis: "Renewal School Year Basis",
  gpa: "GPA",
  gpa_validation_stat: "GPA Validation",
  no_failing_grd_validation: "No Failing Grades",
  no_other_scholar_validation: "No Other Scholarship",
  goodmoral_validation: "Good Moral",
  no_criminal_charges_validation: "No Criminal Charges",
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

const validation = {
  gpa_validation_stat: "GPA Validation",
  no_failing_grd_validation: "No Failing Grades",
  no_other_scholar_validation: "No Other Scholarship",
  goodmoral_validation: "Good Moral",
  no_criminal_charges_validation: "No Criminal Charges",
  full_load_validation: "No Full Load",
  withdrawal_change_course_validation: "Withdrawal/Change of Course",
  enrollment_validation: "Enrollment Validation",
  scholarship_status: "Scholarship Status",
};

interface RenewalTableProps {
  renewalData: RenewalDetails[];
  handleRowClick: (student_id: number, renewal_id: number) => void;
  isEdit: boolean;
  updateRenewalData: (
    student_id: number,
    key: keyof RenewalDetails,
    value: string
  ) => void;
  hasPendingChange: (hasChanges: boolean) => void;
}

function RenewalTable({
  renewalData,
  handleRowClick,
  isEdit,
  updateRenewalData,
}: RenewalTableProps) {
  const [tempRenewalData, setTempRenewalData] = useState<RenewalDetails[]>([]);
  useEffect(() => {
    const sortedData = [...renewalData].sort((a, b) =>
      a.scholar_name.localeCompare(b.scholar_name)
    );
    setTempRenewalData(sortedData);
  }, [renewalData]);

  console.log(tempRenewalData);

  const handleGpaChange = (student_id: number, value: string) => {
    let numericValue = parseFloat(value);
    if (numericValue < 0) numericValue = 0;
    if (numericValue > 4) numericValue = 4;

    let gpaValidationStatus: "Passed" | "Failed" | "Not Started" =
      "Not Started";

    if (numericValue > 0 && numericValue <= 2.5) {
      gpaValidationStatus = "Passed";
    } else if (numericValue > 2.5) {
      gpaValidationStatus = "Failed";
    }

    setTempRenewalData((prev) =>
      prev.map((student) =>
        student.student_id === student_id
          ? {
              ...student,
              gpa: numericValue,
              gpa_validation_stat: gpaValidationStatus,
            }
          : student
      )
    );

    updateDelistingInfo(student_id);
  };
  const updateDelistingInfo = (student_id: number) => {
    setTempRenewalData((prev) => {
      if (!prev) return [];

      return prev.map((student) => {
        if (student.student_id !== student_id) return student;

        const statuses = Object.keys(validation)
          .filter((key) => key !== "scholarship_status")
          .map((key) => student[key as keyof RenewalDetails]);

        const failedReasons = Object.keys(validation)
          .filter((key) => student[key as keyof RenewalDetails] === "Failed")
          .map((key) => tableHead[key as keyof typeof tableHead] || key);

        const hasFailed = failedReasons.length > 0;
        const hasNotStarted = statuses.includes("Not Started");
        const allPassed = statuses.every((status) => status === "Passed");

        let newStatus: "Passed" | "Not Started" | "Delisted" =
          student.scholarship_status;
        let newRootCause = student.delisting_root_cause;
        let newDelistedDate = student.delisted_date;

        if (hasFailed) {
          newStatus = "Delisted";
          newRootCause = `Failed in: ${failedReasons.join(", ")}`;
          newDelistedDate = new Date().toISOString().split("T")[0];
        } else if (allPassed) {
          newStatus = "Passed";
          newRootCause = "";
          newDelistedDate = "";
        } else if (hasNotStarted) {
          newStatus = "Not Started";
          newRootCause = "";
          newDelistedDate = "";
        }

        return {
          ...student,
          scholarship_status: newStatus,
          delisting_root_cause: newRootCause,
          delisted_date: newDelistedDate,
        };
      });
    });
  };
  const hasNotStartedValidation = (student_id: number) => {
    const student = tempRenewalData.find((r) => r.student_id === student_id);
    if (!student) return false;

    return Object.keys(validation)
      .filter((key) => key !== "scholarship_status")
      .some((key) => student[key as keyof RenewalDetails] === "Not Started");
  };

  const saveChange = async (student_id: number) => {
    const updatedStudent = tempRenewalData.find(
      (r) => r.student_id === student_id
    );
    if (!updatedStudent) return;

    if (hasNotStartedValidation(student_id)) {
      alert("Cannot save. All validation fields must be completed.");
      return;
    }

    console.log("Saved changes for student:", updatedStudent);

    try {
      const requestData = {
        validation_id: updatedStudent.validation_id,
        renewal_id: updatedStudent.renewal_id,
        gpa: updatedStudent.gpa,
        gpa_validation_stat: updatedStudent.gpa_validation_stat,
        no_failing_grd_validation: updatedStudent.no_failing_grd_validation,
        no_other_scholar_validation: updatedStudent.no_other_scholar_validation,
        goodmoral_validation: updatedStudent.goodmoral_validation,
        no_criminal_charges_validation:
          updatedStudent.no_criminal_charges_validation,
        full_load_validation: updatedStudent.full_load_validation,
        withdrawal_change_course_validation:
          updatedStudent.withdrawal_change_course_validation,
        enrollment_validation: updatedStudent.enrollment_validation,
        validation_scholarship_status: updatedStudent.scholarship_status,
        delisted_date: updatedStudent.delisted_date || null,
        delisting_root_cause: updatedStudent.delisting_root_cause || null,
      };

      const response = await axios.put(
        "http://localhost:5000/api/renewal/update-renewal",
        requestData
      );

      if (!response) {
        throw new Error("Failed to update renewal details.");
      }
      Object.keys(updatedStudent).forEach((key) => {
        const value = updatedStudent[key as keyof RenewalDetails] ?? "";
        updateRenewalData(
          student_id,
          key as keyof RenewalDetails,
          String(value)
        );
      });

      alert("Renewal statuses updated successfully!");
    } catch (error) {
      console.error("Error updating renewal details:", error);
      alert("Failed to update renewal details.");
    }
  };

  const hasValidationChanges = (student_id: number): boolean => {
    const originalStudent = renewalData.find(
      (s) => s.student_id === student_id
    );
    const updatedStudent = tempRenewalData.find(
      (s) => s.student_id === student_id
    );

    if (!originalStudent || !updatedStudent) return false;
    const result =
      Object.keys(validation).some(
        (key) =>
          originalStudent[key as keyof RenewalDetails] !==
          updatedStudent[key as keyof RenewalDetails]
      ) ||
      originalStudent.delisting_root_cause !==
        updatedStudent.delisting_root_cause;
    return result;
  };

  return (
    <div>
      <form>
        <table>
          <thead className="bg-[#EFEFEF] h-[58px]">
            <tr className="text-[#565656] text-[14px] font-regular text-left">
              {isEdit && <th className="sticky left-0 bg-[#EFEFEF]"></th>}
              {Object.entries(tableHead).map(([key, value]) => (
                <th
                  key={key}
                  className={`min-w-[170px] first:rounded-l-[10px] last:rounded-r-[10px] px-6 ${
                    isEdit
                      ? key === "scholar_name"
                        ? "sticky left-[92px] bg-[#EFEFEF]"
                        : ""
                      : key === "scholar_name"
                      ? "sticky left-0 bg-[#EFEFEF]"
                      : ""
                  }`}
                >
                  {value}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tempRenewalData.map((renewal, index) => (
              <tr
                key={index}
                className="border-b border-b-[#D9D9D9] text-[#676767] text-[14px] group hover:bg-[#f4f4f4] cursor-pointer"
                onClick={() =>
                  isEdit
                    ? undefined
                    : handleRowClick(renewal.student_id, renewal.renewal_id)
                }
              >
                {isEdit && (
                  <td className="px-6 py-2 sticky left-0 bg-white">
                    <button
                      type="button"
                      disabled={
                        !isEdit ||
                        !hasValidationChanges(renewal.student_id) ||
                        hasNotStartedValidation(renewal.student_id)
                      }
                      className={`p-2 rounded-sm text-white cursor-pointer ${
                        !isEdit ||
                        !hasValidationChanges(renewal.student_id) ||
                        hasNotStartedValidation(renewal.student_id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();

                        saveChange(renewal.student_id);
                      }}
                    >
                      Save
                    </button>
                  </td>
                )}
                {Object.keys(tableHead).map((key) => (
                  <td
                    key={key}
                    className={`px-6 py-3 truncate max-w-[170px] ${
                      key === "scholar_name"
                        ? isEdit
                          ? "sticky left-[92px] bg-white group-hover:bg-[#f4f4f4]"
                          : "sticky left-0 bg-white group-hover:bg-[#f4f4f4]"
                        : ""
                    } 
    ${
      key in validation
        ? renewal[key as keyof RenewalDetails] === "Failed" ||
          renewal[key as keyof RenewalDetails] === "Delisted"
          ? "text-red-500 font-semibold"
          : renewal[key as keyof RenewalDetails] === "Passed"
          ? "text-green-600 font-semibold"
          : "text-gray-500"
        : ""
    }`}
                  >
                    {isEdit ? (
                      key in validation &&
                      key !== "gpa_validation_stat" &&
                      key !== "scholarship_status" ? (
                        <select
                          value={
                            renewal[key as keyof RenewalDetails]?.toString() ||
                            ""
                          }
                          onChange={(e) => {
                            setTempRenewalData((prev) =>
                              prev.map((student) =>
                                student.student_id === renewal.student_id
                                  ? { ...student, [key]: e.target.value }
                                  : student
                              )
                            );
                            updateDelistingInfo(renewal.student_id);
                          }}
                          className="border rounded p-1"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      ) : key === "gpa" ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4.0"
                          pattern="^[0-4](\.\d{1,2})?$"
                          value={renewal.gpa?.toString() || ""}
                          onChange={(e) =>
                            handleGpaChange(renewal.student_id, e.target.value)
                          }
                          className="border rounded p-1 w-16 text-center"
                        />
                      ) : key === "delisting_root_cause" &&
                        renewal.scholarship_status === "Delisted" ? (
                        <textarea
                          value={
                            renewal[key as keyof RenewalDetails]?.toString() ||
                            ""
                          }
                          onChange={(e) =>
                            setTempRenewalData((prev) =>
                              prev
                                ? prev.map((student) =>
                                    student.student_id === renewal.student_id
                                      ? {
                                          ...student,
                                          delisting_root_cause: e.target.value,
                                        }
                                      : student
                                  )
                                : []
                            )
                          }
                          className="border border-gray-300 rounded-lg p-2 w-full text-gray-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                          rows={1}
                        />
                      ) : (
                        renewal[key as keyof RenewalDetails]?.toString() || "-"
                      )
                    ) : (
                      renewal[key as keyof RenewalDetails]?.toString() || "-"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </form>
    </div>
  );
}

export default RenewalTable;
