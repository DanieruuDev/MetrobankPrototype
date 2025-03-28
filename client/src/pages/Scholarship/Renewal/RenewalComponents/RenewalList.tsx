import React, { useEffect, useRef, useState } from "react";
import ScholarshipFilterModal from "../../../../components/ScholarshipFilterModal";
import ScholarshipRenewalModal from "../../../../components/ScholarshipRenewalModal";
import { RenewalDetails } from "../../../../Interface/IRenewal";
import axios from "axios";
import GenerateReportModal from "../../../../components/GenerateReport";
import { validation, tableHead } from "../../../../Interface/IRenewal";
import { ListFilterPlus } from "lucide-react";

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
        "http://localhost:5000/admin/fetch-renewals"
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
        console.error("Unexpected response status:", response.status);
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
        `http://localhost:5000/admin/get-filter-renewal`,
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
        console.log("Filtered Data:", response.data);
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
        "http://localhost:5000/admin/update-renewal",
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
    <div className="mt-10 mx-[20px]">
      <div className="flex justify-between">
        <div className="flex gap-2">
          <button
            className="text-[14px] text-[#535353] bg-[#EFEFEF] px-4 py-2 rounded-sm cursor-pointer hover:bg-[#cdcdcd]"
            onClick={() => SetIsFilterBtnOpen(true)}
          >
            <ListFilterPlus />
          </button>
          <input
            type="text"
            placeholder="Search by scholar name..."
            className="text-[14px] text-[#535353] bg-[#EFEFEF] px-4 py-2 rounded-sm outline-none focus:bg-[#cdcdcd]"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2">
          <button
            className="text-white bg-[#3B89FD] text-[14px] font-medium px-4 py-2 rounded-sm cursor-pointer"
            onClick={() => SetIsRenewalBtnOpen(true)}
          >
            Add Renewal
          </button>
          <button
            disabled={countDelisted + countPassed < renewalData.length}
            className={`text-white text-[14px] font-medium px-4 py-2 bg-[#3B89FD] rounded-sm ${
              countDelisted + countPassed < renewalData.length
                ? "cursor-not-allowed bg-[#a0c6ff]"
                : "cursor-pointer "
            }`}
            onClick={() => {
              setIsGnrtRprtOpen(true);
            }}
          >
            Generate Report
          </button>
          <button
            className={`text-white text-[14px] font-medium px-4 py-2 bg-green-500 rounded-sm cursor-pointer ${
              tempRenewalData.length === 0 && "opacity-80"
            }`}
            onClick={toggleEdit}
            disabled={tempRenewalData.length === 0}
          >
            {isEdit === true ? "Editing..." : "Edit"}
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
      <div className="flex mt-10 justify-between items-center">
        {/* <div className="font-medium text-[14px] flex gap-4">
          <div>
            School Year:{" "}
            <span className="font-light">
              {renewalData[0]?.school_year || "-"}
            </span>
          </div>
          <div>
            Year Level:{" "}
            <span className="font-light">
              {renewalData[0]?.year_level || "-"}
            </span>
          </div>
          <div>
            Semester:{" "}
            <span className="font-light">
              {renewalData[0]?.semester || "-"}
            </span>
          </div>
        </div> */}
        <div className="flex items-center space-x-4 py-2 px-1">
          <div className="flex items-center bg-gray-100 rounded px-3 py-1">
            <span className="font-medium text-gray-800">
              {countPassed + countDelisted}
            </span>
            <span className="text-sm text-gray-600 ml-1">
              of {renewalData.length}
            </span>
          </div>

          <div className="flex items-center">
            <div className="flex items-center mr-3">
              <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
              <span className="text-sm text-gray-700">
                {countPassed} Passed
              </span>
            </div>

            {countDelisted > 0 && (
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-red-500 mr-1"></div>
                <span className="text-sm text-gray-700">
                  {countDelisted} Delisted
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="overflow-x-auto mt-2"
        ref={scrollRef}
        onWheel={handleWheelScroll}
      >
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
                          className="border rounded p-1 w-16 text-center"
                        />
                      ) : key === "delisting_root_cause" &&
                        renewal.scholarship_status === "Delisted" ? (
                        <textarea
                          maxLength={160}
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
      </div>
      {tempRenewalData.length === 0 && <p>No renewal data</p>}
    </div>
  );
};

export default RenewalList;
