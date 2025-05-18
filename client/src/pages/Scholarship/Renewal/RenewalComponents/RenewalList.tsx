import React, { useEffect, useRef, useState } from "react";
import ScholarshipFilterModal from "../../../../components/renewal/ScholarshipFilterModal";
import ScholarshipRenewalModal from "../../../../components/renewal/ScholarshipRenewalModal";
import { RenewalDetails } from "../../../../Interface/IRenewal";
import axios from "axios";
import GenerateReportModal from "../../../../components/renewal/GenerateReport";
import { validation, tableHead } from "../../../../Interface/IRenewal";
import {
  Search,
  Edit,
  Save,
  CheckCircle,
  XCircle,
  PlusCircle,
  FileText,
  Sliders,
} from "lucide-react";
import SYSemesterDropdown from "../../../../components/shared/SYSemesterDropdown";

interface RenewalListProps {
  handleRowClick: (student_id: number, renewal_id: number) => void;
}

const RenewalList: React.FC<RenewalListProps> = ({ handleRowClick }) => {
  const [isRenewalBtnOpen, SetIsRenewalBtnOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterBtnOpen, SetIsFilterBtnOpen] = useState(false);
  const [renewalData, setRenewalData] = useState<RenewalDetails[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [isGnrtRprtOpen, setIsGnrtRprtOpen] = useState(false);
  const [tempRenewalData, setTempRenewalData] = useState<RenewalDetails[]>([]);
  const [countPassed, setCountPassed] = useState<number>(0);
  const [countDelisted, setCountDelisted] = useState<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const getRenewalData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/renewal/fetch-renewals"
      );
      if (response.status === 200) {
        const sortedData = response.data.data.sort(
          (a: RenewalDetails, b: RenewalDetails) => {
            const aHasNotStarted = Object.keys(validation).some(
              (key) => a[key as keyof RenewalDetails] === "Not Started"
            );
            const bHasNotStarted = Object.keys(validation).some(
              (key) => b[key as keyof RenewalDetails] === "Not Started"
            );

            if (aHasNotStarted && !bHasNotStarted) return -1;
            if (!aHasNotStarted && bHasNotStarted) return 1;
            return a.scholar_name.localeCompare(b.scholar_name);
          }
        );

        setRenewalData(sortedData);
      } else {
        console.error("Unexpected response status:", response.data);
      }
    } catch (error) {
      console.error("Error fetching renewal data:", error);
    }
  };

  const filterRenewalData = async (
    school_year: string,
    year_level: string,
    semester: string,
    campus: string,
    scholar_name: string
  ) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/renewal/get-filter-renewal`,
        {
          params: {
            year_level: year_level || "",
            school_year: school_year || "",
            semester: semester || "",
            campus: campus || "",
            scholar_name: scholar_name || "",
          },
        }
      );
      const filteredData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      if (response.data) {
        setRenewalData(filteredData);
      }
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      setRenewalData([]);
    }
  };

  const updateRenewalData = (
    student_id: number,
    key: keyof RenewalDetails,
    value: string
  ) => {
    setRenewalData((prevData) =>
      prevData.map((renewal) =>
        renewal.student_id === student_id
          ? { ...renewal, [key]: value }
          : renewal
      )
    );
    getRenewalData();
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

    try {
      const requestData = {
        validation_id: updatedStudent.validation_id,
        renewal_id: updatedStudent.renewal_id,
        gpa: updatedStudent.gpa,
        gpa_validation_stat: updatedStudent.gpa_validation_stat,
        no_failing_grd_validation: updatedStudent.no_failing_grd_validation,
        no_other_scholar_validation: updatedStudent.no_other_scholar_validation,
        goodmoral_validation: updatedStudent.goodmoral_validation,
        no_police_record_validation: updatedStudent.no_police_record_validation,
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
      handleCountValidated();
      alert("Renewal statuses updated successfully!");
    } catch (error) {
      console.error("Error updating renewal details:", error);
      alert("Failed to update renewal details.");
    }
  };

  const handleWheelScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current && event.deltaY !== 0 && event.shiftKey === false) {
      scrollRef.current.scrollLeft += event.deltaY;
      event.preventDefault();
    }
  };

  const handleGpaChange = (student_id: number, value: string) => {
    let numericValue = parseFloat(value);
    if (numericValue < 0) numericValue = 0;
    if (numericValue > 5) numericValue = 5;

    let gpaValidationStatus: "Passed" | "Failed" | "Not Started" =
      "Not Started";

    if (numericValue > 0 && numericValue <= 2.0) {
      gpaValidationStatus = "Passed";
    } else if (numericValue > 2.0) {
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
          newRootCause = "-";
          newDelistedDate = "";
        } else if (hasNotStarted) {
          newStatus = "Not Started";
          newRootCause = "-";
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

  const handleCountValidated = () => {
    const countPassed = renewalData.filter(
      (renewal) => renewal.scholarship_status == "Passed"
    ).length;
    const countDelisted = renewalData.filter(
      (renewal) => renewal.scholarship_status == "Delisted"
    ).length;
    setCountDelisted(countDelisted);
    setCountPassed(countPassed);
  };

  const toggleEdit = () => {
    if (isEdit) {
      const hasChanges = tempRenewalData.some((student) =>
        hasValidationChanges(student.student_id)
      );

      if (hasChanges) {
        const confirmExit = window.confirm(
          "You have unsaved changes. Are you sure you want to exit edit mode? All changes will be undone."
        );
        if (!confirmExit) return;

        setTempRenewalData([...renewalData]);
      }
    }

    setIsEdit(!isEdit);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === "") {
      setTempRenewalData(renewalData);
    } else {
      setTempRenewalData(
        renewalData.filter((item) =>
          item.scholar_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  };

  useEffect(() => {
    const sortedData = [...renewalData].sort(
      (a: RenewalDetails, b: RenewalDetails) => {
        const aHasNotStarted = Object.keys(validation).some(
          (key) => a[key as keyof RenewalDetails] === "Not Started"
        );
        const bHasNotStarted = Object.keys(validation).some(
          (key) => b[key as keyof RenewalDetails] === "Not Started"
        );

        if (aHasNotStarted && !bHasNotStarted) return -1;
        if (!aHasNotStarted && bHasNotStarted) return 1;
        return a.scholar_name.localeCompare(b.scholar_name);
      }
    );
    handleCountValidated();
    if (JSON.stringify(sortedData) !== JSON.stringify(tempRenewalData)) {
      setTempRenewalData(sortedData);
    }
  }, [renewalData]);

  useEffect(() => {
    getRenewalData();
  }, []);

  return (
    <div className="mt-6 mx-4 px-2">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
              size={18}
            />
            <input
              type="text"
              placeholder="Search scholars..."
              className="pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 w-full md:w-64 hover:bg-gray-50 hover:shadow-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <button
            className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            onClick={() => SetIsFilterBtnOpen(true)}
          >
            <Sliders
              size={18}
              className="transition-transform duration-200 group-hover:scale-110"
            />
            Filters
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            onClick={() => SetIsRenewalBtnOpen(true)}
          >
            <PlusCircle
              size={18}
              className="transition-transform duration-200 group-hover:scale-110"
            />
            Add Renewal
          </button>

          <button
            disabled={countDelisted + countPassed < renewalData.length}
            className={`flex items-center gap-2 text-sm text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
              countDelisted + countPassed < renewalData.length
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
            }`}
            onClick={() => setIsGnrtRprtOpen(true)}
          >
            <FileText
              size={18}
              className="transition-transform duration-200 group-hover:scale-110"
            />
            Generate Report
          </button>

          <button
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
              isEdit
                ? "bg-green-600 text-white hover:bg-green-700 hover:-translate-y-0.5"
                : tempRenewalData.length === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5"
            }`}
            onClick={toggleEdit}
            disabled={tempRenewalData.length === 0}
          >
            {isEdit ? (
              <>
                <Save
                  size={18}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                Save Mode
              </>
            ) : (
              <>
                <Edit
                  size={18}
                  className="transition-transform duration-200 group-hover:scale-110"
                />
                Edit
              </>
            )}
          </button>
        </div>
      </div>

      <ScholarshipFilterModal
        isOpen={isFilterBtnOpen}
        onClose={() => SetIsFilterBtnOpen(false)}
        filterRenewalData={filterRenewalData}
      />
      <ScholarshipRenewalModal
        isOpen={isRenewalBtnOpen}
        onClose={() => SetIsRenewalBtnOpen(false)}
        getRenewalData={getRenewalData}
      />
      <GenerateReportModal
        isOpen={isGnrtRprtOpen}
        onClose={() => setIsGnrtRprtOpen(false)}
      />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-blue-50 rounded-full px-4 py-2">
            <span className="font-medium text-blue-700">
              {countPassed + countDelisted}
            </span>
            <span className="text-sm text-blue-600 ml-1">
              / {renewalData.length} processed
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-700">
                {countPassed} Passed
              </span>
            </div>

            {countDelisted > 0 && (
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm text-gray-700">
                  {countDelisted} Delisted
                </span>
              </div>
            )}
          </div>
        </div>
        <SYSemesterDropdown onChange={(val) => console.log("Selected:", val)} />
      </div>

      <div
        className="overflow-x-auto rounded-lg border border-gray-200"
        ref={scrollRef}
        onWheel={handleWheelScroll}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-gray-700 text-sm font-medium text-left">
              {isEdit && (
                <th className="sticky left-0 bg-gray-50 px-6 py-3"></th>
              )}
              {Object.entries(tableHead).map(([key, value]) => (
                <th
                  key={key}
                  className={`px-6 py-3 whitespace-nowrap ${
                    isEdit
                      ? key === "scholar_name"
                        ? "sticky left-[72px] bg-gray-50"
                        : ""
                      : key === "scholar_name"
                      ? "sticky left-0 bg-gray-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center">{value}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tempRenewalData.length > 0 ? (
              tempRenewalData.map((renewal, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 transition-colors ${
                    isEdit ? "" : "cursor-pointer"
                  }`}
                  onClick={() =>
                    isEdit
                      ? undefined
                      : handleRowClick(renewal.student_id, renewal.renewal_id)
                  }
                >
                  {isEdit && (
                    <td className="px-6 py-4 sticky left-0 bg-white">
                      <button
                        type="button"
                        disabled={
                          !isEdit ||
                          !hasValidationChanges(renewal.student_id) ||
                          hasNotStartedValidation(renewal.student_id)
                        }
                        className={`flex items-center justify-center p-2 rounded-md ${
                          !isEdit ||
                          !hasValidationChanges(renewal.student_id) ||
                          hasNotStartedValidation(renewal.student_id)
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          saveChange(renewal.student_id);
                        }}
                      >
                        <Save size={16} className="mr-1" />
                        <span className="text-xs">Save</span>
                      </button>
                    </td>
                  )}
                  {Object.keys(tableHead).map((key) => (
                    <td
                      key={key}
                      className={`px-6 py-4 max-w-xs truncate ${
                        key === "scholar_name"
                          ? isEdit
                            ? "sticky left-[72px] bg-white"
                            : "sticky left-0 bg-white"
                          : ""
                      } ${
                        key in validation
                          ? renewal[key as keyof RenewalDetails] === "Failed" ||
                            renewal[key as keyof RenewalDetails] === "Delisted"
                            ? "text-red-600 font-medium"
                            : renewal[key as keyof RenewalDetails] === "Passed"
                            ? "text-green-600 font-medium"
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
                              renewal[
                                key as keyof RenewalDetails
                              ]?.toString() || ""
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
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="Passed">Passed</option>
                            <option value="Failed">Failed</option>
                          </select>
                        ) : key === "gpa" ? (
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="4.0"
                              pattern="^[0-4](\.\d{1,2})?$"
                              value={renewal.gpa?.toString() || ""}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                if (inputValue === "") {
                                  handleGpaChange(renewal.student_id, "");
                                  return;
                                }

                                if (/^\d*(\.\d{0,2})?$/.test(inputValue)) {
                                  let numericValue = parseFloat(inputValue);

                                  if (numericValue < 0) numericValue = 0;
                                  if (numericValue > 4) numericValue = 4;

                                  handleGpaChange(
                                    renewal.student_id,
                                    numericValue.toFixed(2)
                                  );
                                }
                              }}
                              className="border border-gray-300 rounded-md px-3 py-1 w-16 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            {renewal.gpa_validation_stat === "Passed" && (
                              <CheckCircle
                                className="absolute -right-5 top-1/2 transform -translate-y-1/2 text-green-500"
                                size={16}
                              />
                            )}
                            {renewal.gpa_validation_stat === "Failed" && (
                              <XCircle
                                className="absolute -right-5 top-1/2 transform -translate-y-1/2 text-red-500"
                                size={16}
                              />
                            )}
                          </div>
                        ) : key === "delisting_root_cause" &&
                          renewal.scholarship_status === "Delisted" ? (
                          <textarea
                            maxLength={160}
                            value={
                              renewal[
                                key as keyof RenewalDetails
                              ]?.toString() || ""
                            }
                            onChange={(e) =>
                              setTempRenewalData((prev) =>
                                prev
                                  ? prev.map((student) =>
                                      student.student_id === renewal.student_id
                                        ? {
                                            ...student,
                                            delisting_root_cause:
                                              e.target.value,
                                          }
                                        : student
                                    )
                                  : []
                              )
                            }
                            className="border border-gray-300 rounded-lg p-2 w-full text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                            rows={1}
                            placeholder="Enter reason for delisting..."
                          />
                        ) : (
                          <span className="text-gray-700">
                            {renewal[key as keyof RenewalDetails]?.toString() ||
                              "-"}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-700">
                          {renewal[key as keyof RenewalDetails]?.toString() ||
                            "-"}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={Object.keys(tableHead).length + (isEdit ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No renewal data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RenewalList;
