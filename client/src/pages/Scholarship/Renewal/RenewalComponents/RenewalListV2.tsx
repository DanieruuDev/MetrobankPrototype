import React, { useEffect, useState } from "react";
import {
  FileDown,
  Pencil,
  Plus,
  Save,
  Search,
  Download,
  Upload,
  ChevronDown,
  Eye,
  UserRoundPen,
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
import ConfirmationDialog from "../../../../components/shared/ConfirmationDialog";
import BranchDropdown from "../../../../components/maintainables/BranchDropdown";
import Loading from "../../../../components/shared/Loading";
import PaginationControl from "../../../../components/shared/PaginationControl";

interface RenewalListV2Props {
  handleRowClick: (student_id: number, renewal_id: number) => void;
}
function RenewalListV2({ handleRowClick }: RenewalListV2Props) {
  const [sySemester, setSySemester] = useState<string>("");
  const [countPassed, setCountPassed] = useState<number>(0);
  const [countDelisted, setCountDelisted] = useState<number>(0);
  const [countNotStarted, setCountNotStarted] = useState<number>(0);
  const [renewalData, setRenewalData] = useState<RenewalDetailsClone[] | []>(
    []
  );
  const [tempRenewalData, setTempRenewalData] = useState<RenewalDetailsClone[]>(
    []
  );
  const [page, setPage] = useState<number>(1);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [, setPendingExitEdit] = useState(false);
  const [isRenewalBtnOpen, SetIsRenewalBtnOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGnrtRprtOpen, setIsGnrtRprtOpen] = useState(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFileActionOpen, setIsFileActionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<
    "All" | "Not Started" | "Passed" | "Delisted"
  >("All");
  const itemsPerPage = 10;

  const hasEdits = tempRenewalData.some((row) =>
    Object.keys(row).some(
      (key) =>
        key !== "original" &&
        key !== "isEdited" &&
        row[key as keyof RenewalDetails] !==
          row.original[key as keyof RenewalDetails]
    )
  );
  const toggleEditMode = () => {
    if (isEdit && hasEdits) {
      setPendingExitEdit(true);
      setIsConfirmOpen(true);
    } else {
      setIsEdit(!isEdit);
    }
  };
  const getRenewalData = async (sySemester: string, branch: string) => {
    const [sy, semPart] = sySemester.split("_");
    const semester = semPart === "1" ? "1st Semester" : "2nd Semester";
    if (!sy || !semester) return;
    console.log("get renewal", sySemester, branch);
    console.log("Triggered data here once generated");
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/renewal/fetch-renewals`,
        {
          params: {
            school_year: sy,
            semester,
            branch,
          },
        }
      );

      const { data } = response.data;

      const dataWithOriginal = data.map((row: RenewalDetails) => ({
        ...row,
        original: { ...row },
        isEdited: false,
      }));

      setRenewalData(dataWithOriginal);
      setTempRenewalData(dataWithOriginal);
      setTotalPage(Math.ceil(dataWithOriginal.length / 10)); // 10 items per page
      setPage(1); // start from first page
    } catch (error) {
      console.error("Error fetching renewal data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    // Align the look of Not Started with validation cells: small, muted, no bg
    if (status === "Not Started") {
      return (
        <span className="text-gray-800 text-xs font-bold py-2 inline-block">
          Not Started
        </span>
      );
    }

    let colorClass = "text-black";
    if (status === "Passed")
      colorClass = " text-green-600  font-medium text-[12px]";
    else if (status === "Failed")
      colorClass = "text-red-500 font-medium text-[12px]";
    else if (status === "Delisted")
      colorClass = " text-red-700 font-medium text-[12px]";

    return (
      <span className={`${colorClass} px-2 rounded-md py-1`}>{status}</span>
    );
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
    if (
      statuses.includes("Failed") &&
      statuses.every((s) => s !== "Not Started")
    )
      return "Delisted";
    return "Not Started";
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
        getRenewalData(sySemester, selectedBranch);
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
  const handleValidationChange = (
    renewalId: number,
    field: keyof RenewalDetails,
    newValue: "Not Started" | "Passed" | "Failed"
  ) => {
    setTempRenewalData((prev) => {
      const updatedRows = prev.map((r) => {
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
      });

      // Sort: "Not Started" first alphabetically, "Passed"/"Delisted" move down alphabetically
      updatedRows.sort((a, b) => {
        const aPriority = a.scholarship_status === "Not Started" ? 0 : 1;
        const bPriority = b.scholarship_status === "Not Started" ? 0 : 1;

        if (aPriority !== bPriority) return aPriority - bPriority;

        // If same priority, sort alphabetically by scholar name
        return a.scholar_name.localeCompare(b.scholar_name);
      });

      return updatedRows;
    });
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
  const handleConfirmSave = () => {
    submitSaveChanges(tempRenewalData); // save changes
    setIsEdit(false); // exit edit mode
    setIsConfirmOpen(false); // close modal
    setPendingExitEdit(false);
  };
  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
  };
  const handleCancelModal = () => {
    setIsConfirmOpen(false); // just close modal
    setPendingExitEdit(false); // stay in edit mode
    setIsEdit(false);
    setTempRenewalData(renewalData);
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
  const filterData = (search: string, status: string) => {
    let filtered = renewalData;

    // filter by status
    if (status !== "All") {
      filtered = filtered.filter((item) => item.scholarship_status === status);
    }

    // filter by search
    if (search.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.scholar_name.toLowerCase().includes(search)
      );
    }

    setTempRenewalData(filtered);
  };

  useEffect(() => {
    filterData(searchQuery, selectedStatus);
  }, [selectedStatus]);
  useEffect(() => {
    console.log(sySemester);

    getRenewalData(sySemester, selectedBranch);
  }, [sySemester, selectedBranch]);
  useEffect(() => {
    const passed = renewalData.filter(
      (r) => r.scholarship_status === "Passed"
    ).length;
    const delisted = renewalData.filter(
      (r) => r.scholarship_status === "Delisted"
    ).length;
    const notStarted = renewalData.filter(
      (r) => r.scholarship_status === "Not Started"
    ).length;

    setCountPassed(passed);
    setCountDelisted(delisted);
    setCountNotStarted(notStarted);
  }, [renewalData]);

  useEffect(() => {
    console.log("Parent sySemester updated:", sySemester);
  }, [sySemester]);
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasEdits) {
        // This shows the native browser popup on reload/close
        e.preventDefault();
        e.returnValue = ""; // Chrome requirement
      }
    };

    const handlePopState = () => {
      if (hasEdits) {
        window.history.pushState(null, "", window.location.pathname);
        setIsConfirmOpen(true);
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Push initial state so popstate works on first back
    window.history.pushState(null, "", window.location.pathname);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasEdits]);
  useEffect(() => {
    const newTotalPage = Math.ceil(tempRenewalData.length / itemsPerPage);
    setTotalPage(newTotalPage);

    if (page > newTotalPage) setPage(1);
  }, [page, tempRenewalData]);
  console.log("Outside temp; ", tempRenewalData);
  return (
    <div className="px-4 py-2">
      {/* Information of renewal */}
      <div className="bg-white border border-[#D1D1D1] rounded-sm p-4">
        <div className="flex justify-between mb-2">
          <h1 className="font-bold text-[15px]">RENEWAL INFORMATION</h1>
          <button
            className="text-blue-500 underline cursor-pointer"
            onClick={() => setShowCriteria(!showCriteria)}
          >
            {showCriteria ? "Hide Criteria" : "Change Criteria"}
          </button>
        </div>

        {/* Criteria selection */}

        <div
          className={`flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 ${
            showCriteria ? "block" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between gap-2 max-w-[380px] w-full">
            <SYSemesterDropdown
              value={sySemester}
              onChange={(value) => setSySemester(value)}
            />
            <BranchDropdown
              formData={selectedBranch}
              handleInputChange={handleBranchChange}
            />
          </div>
        </div>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border border-[#e7e7e7] rounded-sm text-[14px] ${
            showCriteria ? " hidden" : "block"
          }`}
        >
          <div className="border border-[#CDCDCD] py-4 px-5 space-y-2">
            <div className="font-medium text-[#828282]">BRANCH</div>
            <div className="font-bold">{selectedBranch || "All"}</div>
          </div>
          <div className="border border-[#CDCDCD] py-4 px-5 space-y-2">
            <div className="font-medium text-[#828282]">RENEWAL DATE</div>
            <div className="font-bold">Soon to add</div>
          </div>
          <div className="border border-[#CDCDCD] py-4 px-5 space-y-2">
            <div className="font-medium text-[#828282]">RENEWAL BASIS</div>
            <div className="font-bold">
              {renewalData[0]?.renewal_school_year_basis &&
              renewalData[0]?.renewal_semester_basis
                ? `${renewalData[0].renewal_school_year_basis} ${renewalData[0].renewal_semester_basis}`
                : "none"}
              &nbsp;
            </div>
          </div>
          <div className="border border-[#CDCDCD] py-4 px-5 space-y-2">
            <div className="font-medium text-[#828282]">RENEWAL FOR</div>
            <div className="font-bold">
              {renewalData[0]?.school_year && renewalData[0]?.semester
                ? `${renewalData[0].school_year} ${renewalData[0].semester}`
                : renewalData[0]?.school_year ||
                  renewalData[0]?.semester ||
                  sySemester}
            </div>
          </div>
          {/* <div className="border border-[#CDCDCD] py-4 px-5 space-y-2">
            <div className="font-medium text-[#828282]">IS ARCHIVED</div>
            <div className="font-bold">Soo to add</div>
          </div> */}
        </div>
      </div>

      <div className="bg-white border mt-5 border-[#D1D1D1] border-collapse rounded-md">
        <div className="p-4">
          <div className="flex justify-between mb-3">
            <div className="flex gap-2 items-center">
              <div className="w-[38px] h-[38px] bg-[#EFF6FF] rounded-md flex justify-center items-center">
                <UserRoundPen
                  strokeWidth={2}
                  className="text-[#155DFC]"
                  width={18}
                  height={18}
                />
              </div>
              <div>
                <div className="font-bold text-[14px]">STUDENT PROCESSED:</div>

                <div className="text-[#4E4E4E] text-[13px] flex">
                  <span>{countPassed + countDelisted}&nbsp;</span>
                  <span> of {renewalData.length} </span>
                  &nbsp;students
                </div>
              </div>
            </div>
            {!isEdit && (
              <div className="flex items-center">
                <button
                  className="flex items-center gap-2 px-2 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600 transition cursor-pointer text-sm"
                  onClick={() => SetIsRenewalBtnOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Initialize Renewal
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            {/* Left side: Tabs + Search */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:max-w-[800px]">
              {/* Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 rounded-sm border border-[#CDCDCD] divide-x divide-[#CDCDCD] text-sm h-8 flex-1">
                {/* All */}
                <div
                  className={`flex items-center justify-center cursor-pointer transition-colors
      ${
        selectedStatus === "All"
          ? "bg-gray-200 text-gray-700 font-medium"
          : "text-gray-500 hover:bg-gray-100"
      }
    `}
                  onClick={() => setSelectedStatus("All")}
                >
                  All
                </div>

                {/* Not Started */}
                <div
                  className={`flex items-center justify-center cursor-pointer transition-colors
      ${
        selectedStatus === "Not Started"
          ? "bg-gray-200 text-gray-700 font-medium"
          : "text-gray-500 hover:bg-gray-100"
      }
    `}
                  onClick={() => setSelectedStatus("Not Started")}
                >
                  Not Started {countNotStarted}
                </div>

                {/* Passed */}
                <div
                  className={`flex items-center justify-center cursor-pointer transition-colors
      ${
        selectedStatus === "Passed"
          ? "bg-green-100 text-green-600 font-semibold"
          : "text-gray-500 hover:bg-green-50"
      }
    `}
                  onClick={() => setSelectedStatus("Passed")}
                >
                  Passed {countPassed}
                </div>

                {/* Delisted */}
                <div
                  className={`flex items-center justify-center cursor-pointer transition-colors
      ${
        selectedStatus === "Delisted"
          ? "bg-red-100 text-red-600 font-semibold"
          : "text-gray-500 hover:bg-red-50"
      }
    `}
                  onClick={() => setSelectedStatus("Delisted")}
                >
                  Delisted {countDelisted}
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center pl-3 pr-2 border border-gray-300 rounded-md bg-gray-50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 flex-1 h-8">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search scholars..."
                  className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* Right side: File Action / Save+Submit + Edit */}
            <div
              className={`flex ${
                !isEdit
                  ? "border border-gray-300 divide-x divide-[#CDCDCD]"
                  : "rounded-sm overflow-hidden"
              } rounded-sm text-sm self-end md:self-auto`}
            >
              {/* Left side: File Action OR Save and Submit */}
              {isEdit ? (
                <button
                  onClick={() => submitSaveChanges(tempRenewalData)}
                  disabled={!hasEdits}
                  className={`flex items-center gap-2 px-3 h-8 transition cursor-pointer ${
                    hasEdits
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <Save className="w-4 h-4" strokeWidth={1.5} />
                  Save changes
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsFileActionOpen(!isFileActionOpen)}
                    className="flex items-center gap-2 px-3 h-8 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transform transition-transform duration-300 ease-in-out ${
                        isFileActionOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                    File Action
                  </button>

                  {isFileActionOpen && (
                    <div className="absolute left-0 mt-1 w-40 bg-white shadow-md rounded-md border border-gray-300 z-20">
                      <button
                        className="flex items-center gap-2 px-3 h-8 hover:bg-gray-50 transition cursor-pointer text-sm w-full text-left"
                        onClick={() => setIsUploadOpen(true)}
                      >
                        <Upload className="w-4 h-4" />
                        Upload File
                      </button>

                      <UploadFileRenewalModal
                        isOpen={isUploadOpen}
                        onClose={() => setIsUploadOpen(false)}
                        renewalData={tempRenewalData}
                        onFileChanges={handleFileChanges}
                      />

                      <button
                        className="flex items-center gap-2 px-3 h-8 hover:bg-gray-50 transition cursor-pointer text-sm w-full text-left"
                        onClick={() => setIsGnrtRprtOpen(true)}
                      >
                        <FileDown className="w-4 h-4" />
                        Generate Report
                      </button>

                      <button
                        className="flex items-center gap-2 px-3 h-8 hover:bg-gray-50 transition cursor-pointer text-sm w-full text-left"
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
              )}

              {/* Edit / Editing button */}
              <button
                className={`flex items-center gap-2 px-3 h-8 transition cursor-pointer ${
                  isEdit
                    ? "bg-blue-500 text-white hover:bg-blue-400"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={toggleEditMode}
              >
                <Pencil className="w-4 h-4" />
                {isEdit ? "Editing" : "Edit"}
              </button>
            </div>
          </div>
        </div>

        {!isLoading ? (
          <div className="overflow-x-auto scroll-smooth mt-4 ">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr className="text-gray-800 text-sm font-medium text-left border border-gray-300">
                  {!isEdit && <th className="border border-gray-300"></th>}
                  {Object.entries(renewalTableHead).map(([key, label]) => (
                    <th
                      key={key}
                      className={`px-5 py-3  text-left whitespace-nowrap text-[#757575] border border-gray-300 ${
                        key === "scholar_name"
                          ? "sticky left-[-1px] bg-gray-100 z-10 shadow-md max-w-[200px] min-w-[200px] "
                          : ""
                      }
                ${
                  key === "scholarship_status"
                    ? "sticky left-[198px] bg-gray-100 z-10 shadow-md "
                    : ""
                }
                ${key === "gpa" ? "max-w-[80px] min-w-[80px]" : ""}
                  `}
                    >
                      {label.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-[14px]">
                {tempRenewalData &&
                  tempRenewalData
                    .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                    .map((renewal) => (
                      <tr
                        key={renewal.renewal_id}
                        className="cursor-pointer group border border-gray-300 "
                      >
                        {!isEdit && (
                          <td
                            className="px-4 group-hover:bg-gray-100  "
                            onClick={() =>
                              handleRowClick(
                                renewal.student_id,
                                renewal.renewal_id
                              )
                            }
                          >
                            <Eye
                              strokeWidth={1}
                              className="hover:translate-y-[-1px] hover:text-blue-700 "
                            />
                          </td>
                        )}
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

                          // const validationOptions: RenewalDetails[keyof RenewalDetails][] =
                          //   ["Not Started", "Passed", "Failed"];

                          return (
                            <td
                              key={key}
                              className={`px-5 py-3 text-center border border-gray-300 group-hover:bg-gray-100 ${
                                key === "scholar_name"
                                  ? "sticky left-[-1px] z-10 shadow-md bg-white max-w-[300px] whitespace-nowrap overflow-hidden "
                                  : key === "scholarship_status"
                                  ? "sticky left-[198px] bg-white z-10 shadow-md max-w-[150px] whitespace-nowrap overflow-hidden "
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = (
                                      (value as string) || "Not Started"
                                    ).trim();
                                    const next =
                                      current === "Not Started"
                                        ? "Passed"
                                        : current === "Passed"
                                        ? "Failed"
                                        : "Not Started";
                                    handleValidationChange(
                                      renewal.renewal_id,
                                      key as keyof RenewalDetails,
                                      next
                                    );
                                  }}
                                  className={`w-full h-full flex items-center justify-center font-semibold select-none cursor-pointer hover:ring-1 hover:ring-gray-300 rounded ${
                                    (
                                      (value as string) || "Not Started"
                                    ).trim() === "Passed"
                                      ? "text-green-600 text-2xl"
                                      : (
                                          (value as string) || "Not Started"
                                        ).trim() === "Failed"
                                      ? "text-red-600 text-xl "
                                      : "text-gray-400 text-xs py-2"
                                  }`}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                  }}
                                  title={(
                                    (value as string) || "Not Started"
                                  ).trim()}
                                >
                                  {(
                                    (value as string) || "Not Started"
                                  ).trim() === "Passed"
                                    ? "\u2713"
                                    : (
                                        (value as string) || "Not Started"
                                      ).trim() === "Failed"
                                    ? "X"
                                    : "Not Started"}
                                </button>
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
        ) : (
          <Loading />
        )}
        <PaginationControl
          currentPage={page}
          totalPages={totalPage}
          onPageChange={(newPage) => setPage(newPage)} // keep as is
        />
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
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        message="You have unsaved changes. Do you want to save or discard them?"
        onConfirm={handleConfirmSave} // Save
        onCancel={handleCancelModal} // Cancel
        confirmText="Save"
        cancelText="Discard Changes"
      />
    </div>
  );
}

export default RenewalListV2;
