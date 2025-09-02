import React, { useEffect, useState } from "react";
import {
  FileDown,
  Pencil,
  Plus,
  Save,
  Search,
  File,
  Download,
  Upload,
  ChevronDown,
} from "lucide-react";
import SYSemesterDropdown from "../../../../components/maintainables/SYSemesterDropdown";
import { RenewalRow, renewalTableHead } from "../../../../Interface/IRenewal";
import {
  RenewalDetailsClone,
  RenewalDetails,
  validation,
} from "../../../../Interface/IRenewal";
import { toast } from "react-toastify";
import axios from "axios";
import ScholarshipRenewalModal from "../../../../components/renewal/ScholarshipRenewalModal";
import GenerateReportModal from "../../../../components/renewal/GenerateReport";
import { downloadExcel } from "../../../../utils/DownloadExcel";
import UploadFileRenewalModal from "../../../../components/renewal/UploadFileRenewalModal";

function RenewalListV2() {
  const [sySemester, setSySemester] = useState<string>("2024-2025_2nd");
  const [countPassed, setCountPassed] = useState<number>(0);
  const [countDelisted, setCountDelisted] = useState<number>(0);
  const [renewalData, setRenewalData] = useState<RenewalDetailsClone[] | []>(
    []
  );
  const [tempRenewalData, setTempRenewalData] = useState<RenewalDetailsClone[]>(
    []
  );
  const [isRenewalBtnOpen, SetIsRenewalBtnOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGnrtRprtOpen, setIsGnrtRprtOpen] = useState(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFileActionOpen, setIsFileActionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasEdits = tempRenewalData.some((row) =>
    Object.keys(row).some(
      (key) =>
        key !== "original" &&
        key !== "isEdited" &&
        row[key as keyof RenewalDetails] !==
          row.original[key as keyof RenewalDetails]
    )
  );

  const getRenewalData = async () => {
    const [sy, semPart] = sySemester.split("_");
    const semester = semPart === "1st" ? "1st Semester" : "2nd Semester";
    try {
      const response = await axios.get(
        `http://localhost:5000/api/renewal/fetch-renewals/${sy}/${semester}`
      );
      const dataWithOriginal = response.data.data.map(
        (row: RenewalDetails) => ({
          ...row,
          original: { ...row },
          isEdited: false,
        })
      );
      setRenewalData(dataWithOriginal);
      setTempRenewalData(dataWithOriginal);
    } catch (error) {
      console.error("Error fetching renewal data:", error);
    }
  };
  const statusBadge = (status: string) => {
    let colorClass = "text-black";

    if (status === "Passed") colorClass = "text-green-500 font-medium";
    else if (status === "Failed") colorClass = "text-red-500 font-medium";
    else if (status === "Delisted") colorClass = "text-red-600 font-medium";
    else if (status === "Not Started") colorClass = "text-gray-600 font-medium"; //
    return <span className={`${colorClass} `}>{status}</span>;
  };
  const computeScholarshipStatus = (
    renewal: RenewalDetails
  ): "Not Started" | "Passed" | "Delisted" => {
    const validationFields = Object.keys(validation).filter(
      (k) => k !== "scholarship_status"
    );

    const statuses = validationFields.map(
      (field) => renewal[field as keyof RenewalDetails]
    );

    if (statuses.every((s) => s === "Passed")) return "Passed";
    if (statuses.includes("Failed")) return "Delisted";
    return "Not Started";
  };
  const handleValidationChange = (
    renewalId: number,
    field: keyof RenewalDetails,
    newValue: "Not Started" | "Passed" | "Failed"
  ) => {
    setTempRenewalData((prev) =>
      prev.map((r) => {
        if (r.renewal_id === renewalId) {
          const updated = { ...r, [field]: newValue };

          const scholarship_status = computeScholarshipStatus(updated);

          const isEdited = Object.keys(updated).some(
            (key) =>
              key !== "original" &&
              key !== "isEdited" &&
              updated[key as keyof RenewalDetails] !==
                r.original[key as keyof RenewalDetails]
          );

          const delisting_root_cause =
            scholarship_status === "Delisted"
              ? Object.keys(validation)
                  .filter((k) => k !== "scholarship_status")
                  .filter(
                    (k) => updated[k as keyof RenewalDetails] === "Failed"
                  )
                  .join(", ")
              : "Not Started";

          const delisted_date =
            scholarship_status === "Delisted" ? new Date().toISOString() : null;
          const allPassed = Object.keys(validation)
            .filter((k) => k !== "scholarship_status")
            .every((k) => updated[k as keyof RenewalDetails] === "Passed");

          const renewal_date = allPassed ? new Date().toISOString() : null;
          return {
            ...updated,
            scholarship_status,
            isEdited,
            delisting_root_cause,
            delisted_date,
            renewal_date,
          };
        }
        return r;
      })
    );
  };

  const handleGPAChange = (renewalId: number, newGPA: number | null) => {
    setTempRenewalData((prev) =>
      prev.map((r) => {
        if (r.renewal_id === renewalId) {
          const gpaStatus: "Not Started" | "Passed" | "Failed" =
            newGPA === null
              ? "Not Started"
              : newGPA >= 1.0 && newGPA <= 2.0
              ? "Passed"
              : "Failed";

          const updated = {
            ...r,
            gpa: newGPA,
            gpa_validation_stat: gpaStatus,
          };
          const isEdited =
            updated.gpa !== r.original.gpa ||
            updated.gpa_validation_stat !== r.original.gpa_validation_stat;
          return {
            ...updated,
            scholarship_status: computeScholarshipStatus(updated),
            isEdited,
          };
        }
        return r;
      })
    );
  };
  const submitSaveChanges = async (tempRenewalData: RenewalDetailsClone[]) => {
    const editedRows = tempRenewalData.filter((row) => row.isEdited);

    const updateRows = editedRows.map((row: RenewalDetailsClone) => {
      const { renewal_id, original, ...rest } = row;

      const changedFields = Object.fromEntries(
        Object.entries(rest).filter(
          ([key, value]) =>
            key !== "isEdited" &&
            value !== original[key as keyof RenewalDetails]
        )
      );
      return { renewal_id, changedFields };
    });

    try {
      setIsLoading(true);
      if (updateRows.length > 0) {
        const res = await axios.put(
          "http://localhost:5000/api/renewal/update-renewalV2",
          updateRows
        );
        console.log(res);
        getRenewalData();
        toast.success(`${res.data.totalUpdated} row(s) ${res.data.message}`);
        console.log("Res Data:", res.data);
      } else {
        toast.info("No changes to update.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Update failed:", error.response?.data || error.message);
      } else {
        console.error("Unexpected error:", error);
      }
      alert(error);
    } finally {
      setIsLoading(false);
    }

    console.log(updateRows);
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
  const handleFileChanges = (updatedRows: RenewalRow[]) => {
    const newData = tempRenewalData.map((row) => {
      const excelRow = updatedRows.find((r) => r.student_id === row.student_id);
      if (!excelRow) return row;

      const updated: RenewalDetails = { ...row, ...excelRow };

      const scholarship_status = computeScholarshipStatus(updated);

      const delisting_root_cause =
        scholarship_status === "Delisted"
          ? Object.keys(validation)
              .filter((k) => k !== "scholarship_status")
              .filter((k) => updated[k as keyof RenewalDetails] === "Failed")
              .join(", ")
          : "Not Started";

      const delisted_date =
        scholarship_status === "Delisted" ? new Date().toISOString() : null;

      const allPassed = Object.keys(validation)
        .filter((k) => k !== "scholarship_status")
        .every((k) => updated[k as keyof RenewalDetails] === "Passed");

      const renewal_date = allPassed ? new Date().toISOString() : null;

      const isEdited = Object.keys(updated).some(
        (key) =>
          key !== "original" &&
          key !== "isEdited" &&
          updated[key as keyof RenewalDetails] !==
            row.original[key as keyof RenewalDetails]
      );

      return {
        ...updated,
        scholarship_status,
        delisting_root_cause,
        delisted_date,
        renewal_date,
        isEdited,
        original: row.original,
      };
    });

    setTempRenewalData(newData);

    // Pass newData directly
    submitSaveChanges(newData);
  };

  useEffect(() => {
    getRenewalData();
  }, [sySemester]);
  useEffect(() => {
    const passed = tempRenewalData.filter(
      (r) => r.scholarship_status === "Passed"
    ).length;
    const delisted = tempRenewalData.filter(
      (r) => r.scholarship_status === "Delisted"
    ).length;

    setCountPassed(passed);
    setCountDelisted(delisted);
  }, [tempRenewalData]);

  console.log(sySemester);
  return (
    <div className="px-4 py-2">
      <div className="flex justify-between mt-4">
        <div className="flex flex-1 gap-2">
          <div className="flex items-center max-w-[400px] w-full pl-3 pr-2 border border-gray-300 rounded-md bg-gray-50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search scholars..."
              className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 py-2 text-sm"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          {/* <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md gap-1 text-sm cursor-pointer hover:bg-[#f3f4f6]">
            <Filter size={15} color="#4f4f4f" strokeWidth={2.25} />
            Filter
          </button> */}
        </div>
        {isLoading && <p>Loading///</p>}
        <div className="flex gap-2">
          {!isEdit ? (
            <>
              <button
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition cursor-pointer text-sm"
                onClick={() => SetIsRenewalBtnOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add Renewal
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsFileActionOpen(!isFileActionOpen)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer text-sm"
                >
                  <File className="w-4 h-4" />
                  File Actions
                  <ChevronDown
                    className={`w-4 h-4 transform transition-transform duration-300 ease-in-out ${
                      isFileActionOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {isFileActionOpen && (
                  <div
                    className={`bg-white shadow-md rounded-md flex flex-col justify-center border border-gray-300 mt-2 absolute left-0 right-0 z-[20]`}
                  >
                    <button
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition cursor-pointer text-sm"
                      onClick={() => setIsUploadOpen(true)}
                    >
                      <Upload className="w-4 h-4" />
                      Upload File
                    </button>
                    <UploadFileRenewalModal
                      isOpen={isUploadOpen}
                      onClose={() => setIsUploadOpen(false)}
                      renewalData={tempRenewalData} // pass current data
                      onFileChanges={handleFileChanges}
                    />

                    <button
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition cursor-pointer text-sm"
                      onClick={() => setIsGnrtRprtOpen(true)}
                    >
                      <FileDown className="w-4 h-4" />
                      Generate Report
                    </button>
                    <button
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition cursor-pointer text-sm"
                      onClick={() => {
                        const headers = Object.keys(renewalTableHead);
                        const data = renewalData.map((r) =>
                          Object.keys(renewalTableHead).map(
                            (key) => r[key as keyof RenewalDetails] ?? null
                          )
                        );

                        downloadExcel(
                          `RenewalReport-${sySemester}.xlsx`,
                          headers,
                          data
                        );
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            ""
          )}

          <button
            className={`flex items-center gap-2 px-2 py-2 text-gray-600 rounded-lg  transition cursor-pointer text-sm ${
              isEdit
                ? "text-white bg-blue-500 hover:bg-blue-400"
                : "hover:bg-gray-200"
            }`}
            onClick={() => setIsEdit(!isEdit)}
          >
            <Pencil className="w-4 h-4" />
            {isEdit ? "Editing" : "Edit"}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 ">
        <div className="flex items-center space-x-4 ">
          <div className="flex items-center gap-1">
            <span className="font-bold ">{countPassed + countDelisted}</span>
            <span className="font-bold">/ {tempRenewalData.length} </span>
            <span>processed</span>
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
        {!isEdit ? (
          <SYSemesterDropdown
            value={sySemester}
            onChange={(value) => setSySemester(value)}
          />
        ) : (
          <div>
            <button
              onClick={() => submitSaveChanges(tempRenewalData)}
              disabled={!hasEdits}
              className={`flex gap-2 p-2 rounded-md text-[14px] items-center transition
    ${
      hasEdits
        ? "bg-green-500 text-white hover:bg-green-600 cursor-pointer"
        : "bg-gray-300 text-gray-600 cursor-not-allowed"
    }`}
            >
              <Save strokeWidth={1.5} size={20} />
              Save and Submit
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto scroll-smooth mt-4 rounded-md border border-gray-300">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr className="text-gray-800 text-sm font-medium text-left">
              {Object.entries(renewalTableHead).map(([key, label]) => (
                <th
                  key={key}
                  className={`px-5 py-3 text-left whitespace-nowrap ${
                    key === "scholar_name"
                      ? "sticky left-0 bg-gray-100 z-10 shadow-md max-w-[200px] min-w-[200px]"
                      : ""
                  }
                ${
                  key === "scholarship_status"
                    ? "sticky left-[200px] bg-gray-100 z-10 shadow-md"
                    : ""
                }
                ${key === "gpa" ? "max-w-[80px] min-w-[80px]" : ""}
                  `}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-[14px]">
            {tempRenewalData &&
              tempRenewalData.map((renewal) => (
                <tr
                  key={renewal.renewal_id}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {Object.keys(renewalTableHead).map((key) => {
                    const value = renewal[key as keyof RenewalDetails];
                    const isValidationField = Object.keys(validation)
                      .filter(
                        (k) =>
                          k !== "scholarship_status" &&
                          k !== "gpa_validation_stat"
                      )
                      .includes(key);

                    const isGPAField = key === "gpa";
                    const isTextField = key === "delisting_root_cause";

                    const validationOptions: RenewalDetails[keyof RenewalDetails][] =
                      ["Not Started", "Passed", "Failed"];

                    return (
                      <td
                        key={key}
                        className={`px-5 py-3 ${
                          key === "scholar_name"
                            ? "sticky left-0 z-10 shadow-md bg-white max-w-[300px] whitespace-nowrap overflow-hidden"
                            : key === "scholarship_status"
                            ? "sticky left-[200px] bg-white z-10 shadow-md max-w-[150px] whitespace-nowrap overflow-hidden"
                            : "max-w-[400px] whitespace-nowrap overflow-hidden"
                        }`}
                      >
                        {isEdit && isGPAField ? (
                          <input
                            type="number"
                            value={value ?? ""}
                            step="0.01"
                            min={0}
                            max={5}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                handleGPAChange(renewal.renewal_id, null);
                                return;
                              }
                              let numVal = Number(val);
                              if (numVal > 5) numVal = 5;
                              numVal = Math.floor(numVal * 100) / 100;

                              handleGPAChange(renewal.renewal_id, numVal);
                            }}
                            className="border border-gray-300 px-2 py-1 rounded-sm w-full"
                          />
                        ) : isEdit &&
                          isTextField &&
                          renewal.scholarship_status === "Delisted" ? (
                          <textarea
                            value={value as string}
                            rows={1}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setTempRenewalData((prev) =>
                                prev.map((r) =>
                                  r.renewal_id === renewal.renewal_id
                                    ? { ...r, [key]: newValue }
                                    : r
                                )
                              );
                            }}
                            className="border border-gray-300 px-2 py-1 rounded-sm w-full resize-none"
                          />
                        ) : isEdit && isValidationField ? (
                          <select
                            name={key}
                            id={key}
                            value={value as "Not Started" | "Passed" | "Failed"}
                            className={`border border-gray-300 px-2 py-1 rounded-sm ${
                              value === "Passed"
                                ? "text-green-500"
                                : value === "Failed"
                                ? "text-red-500"
                                : "text-gray-500"
                            }`}
                            onChange={(e) =>
                              handleValidationChange(
                                renewal.renewal_id,
                                key as keyof RenewalDetails,
                                e.target.value as
                                  | "Not Started"
                                  | "Passed"
                                  | "Failed"
                              )
                            }
                          >
                            {validationOptions.map((opt) => (
                              <option key={opt} value={opt as string}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : key === "scholarship_status" ? (
                          statusBadge(value as string)
                        ) : (
                          <span>{statusBadge(value as string)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* {Modals} */}
      <ScholarshipRenewalModal
        isOpen={isRenewalBtnOpen}
        onClose={() => SetIsRenewalBtnOpen(false)}
        getRenewalData={getRenewalData}
        sySemester={sySemester}
        onChangeSySemester={(newValue) => {
          setSySemester(newValue);
        }}
      />
      <GenerateReportModal
        isOpen={isGnrtRprtOpen}
        onClose={() => setIsGnrtRprtOpen(false)}
      />
    </div>
  );
}

export default RenewalListV2;
