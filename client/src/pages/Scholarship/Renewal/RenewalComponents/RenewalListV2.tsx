import { useContext, useEffect, useState, useRef } from "react";
import {
  FileDown,
  Pencil,
  Plus,
  Save,
  Search,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Eye,
  UserRoundPlus as UserRoundPen,
} from "lucide-react";
import SYSemesterDropdown from "../../../../components/maintainables/SYSemesterDropdown";
import {
  type RenewalRow,
  renewalTableHead,
  InitialRenewalInfo,
  type RenewalDetailsClone,
  type RenewalDetails,
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
import { AuthContext } from "../../../../context/AuthContext";
import CheckAllDropdown from "../../../../components/renewal/CheckAll";

interface RenewalListV2Props {
  handleRowClick: (student_id: number, renewal_id: number) => void;
}

function RenewalListV2({ handleRowClick }: RenewalListV2Props) {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;
  const role_id = auth?.user?.role_id;
  const [sySemester, setSySemester] = useState<string>("");
  const [countPassed, setCountPassed] = useState<number>(0);
  const [countDelisted, setCountDelisted] = useState<number>(0);
  const [countNotStarted, setCountNotStarted] = useState<number>(0);
  const [renewalData, setRenewalData] = useState<RenewalDetailsClone[] | []>(
    []
  );
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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
  const [isLoading, setIsLoading] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [initialRenewalInfo, setInitialRenewalInfo] =
    useState<InitialRenewalInfo | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    "All" | "Not Started" | "Passed" | "Delisted"
  >("All");
  const [selectedBranchFilter, setSelectedBranchFilter] =
    useState<string>("All");
  const [selectedYearLevelFilter, setSelectedYearLevelFilter] =
    useState<string>("All");
  const [isRenewalInfoVisible, setIsRenewalInfoVisible] = useState(true);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  // Custom page change handler to maintain scroll position
  const handlePageChange = (newPage: number) => {
    // Prevent default scroll behavior
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Store the current scroll position
    const currentScrollPosition = window.scrollY;

    // Add temporary event listeners to prevent scroll
    window.addEventListener("scroll", preventScroll, { passive: false });
    document.addEventListener("scroll", preventScroll, { passive: false });

    // Update page
    setPage(newPage);

    // Restore scroll position and remove listeners
    requestAnimationFrame(() => {
      window.scrollTo({
        top: currentScrollPosition,
        behavior: "instant",
      });

      // Remove event listeners
      window.removeEventListener("scroll", preventScroll);
      document.removeEventListener("scroll", preventScroll);

      // Final check after a brief delay
      setTimeout(() => {
        if (Math.abs(window.scrollY - currentScrollPosition) > 10) {
          window.scrollTo({
            top: currentScrollPosition,
            behavior: "instant",
          });
        }
      }, 100);
    });
  };

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

  const getInitialRenewalInfo = async (sySemester: string) => {
    const [sy, semPart] = sySemester.split("_");
    const semester = semPart === "1" ? "1st Semester" : "2nd Semester";
    const school_year = sy.replace("-", "");
    if (!school_year || !semester) {
      console.error("Missing school_year or semester:", {
        school_year,
        semester,
      });
      return;
    }

    try {
      console.log("Before count");
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/renewal/count-renewal`,
        {
          params: {
            school_year,
            semester: semPart,
          },
          timeout: 5000,
        }
      );
      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      console.log("Renewal count response:", response.data.data);
      setInitialRenewalInfo(response.data.data);
      console.log("After count");
    } catch (error) {
      console.error("Error fetching renewal count:", error);
      toast.error("Failed to fetch renewal count");
    }
  };

  const getRenewalData = async (sySemester: string) => {
    const [sy, semPart] = sySemester.split("_");
    const semester = semPart === "1" ? "1st Semester" : "2nd Semester";
    if (!sy || !semester) {
      console.error("Invalid sySemester format:", sySemester);
      return;
    }
    console.log("get renewal", sySemester, userId, role_id);
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/renewal/fetch-renewals`,
        {
          params: {
            school_year: sy,
            semester,
            user_id: userId,
            role_id,
          },
          timeout: 5000,
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
      setTotalPage(Math.ceil(dataWithOriginal.length / 10));
      setPage(1);
    } catch (error) {
      console.error("Error fetching renewal data:", error);
      toast.error("Failed to fetch renewal data");
    } finally {
      setIsLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "Not Started") {
      return (
        <span className="text-gray-800 text-xs font-bold py-2 inline-block">
          Not Started
        </span>
      );
    }

    let colorClass = "text-black";
    if (status === "Passed")
      colorClass = "text-green-600 font-medium text-[12px]";
    else if (status === "Failed")
      colorClass = "text-red-500 font-medium text-[12px]";
    else if (status === "Delisted")
      colorClass = "text-red-700 font-medium text-[12px]";

    return (
      <span className={`${colorClass} px-2 rounded-md py-1`}>{status}</span>
    );
  };

  const computeScholarshipStatus = (
    renewal: RenewalDetails
  ): "Not Started" | "Passed" | "Delisted" => {
    console.log("compute", renewal);
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
      const {
        renewal_id,
        validator_id,
        role_id,
        initialized_by,
        user_id,
        original,
        ...rest
      } = row;

      const changedFields = Object.fromEntries(
        Object.entries(rest).filter(
          ([key, value]) =>
            key !== "isEdited" &&
            value !== original[key as keyof RenewalDetails]
        )
      );

      return {
        renewal_id,
        validator_id,
        role_id,
        initialized_by,
        user_id,
        changedFields,
      };
    });
    console.log("change", updateRows);

    try {
      setIsLoading(true);
      if (updateRows.length > 0) {
        const res = await axios.put(
          `${VITE_BACKEND_URL}api/renewal/update-renewalV2`,
          updateRows
        );
        console.log(res);
        getRenewalData(sySemester);
        toast.success(`${res.data.totalUpdated} row(s) ${res.data.message}`);
        console.log("Res Data:", res.data);
      } else {
        toast.info("No changes to update.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Update failed:", error.response?.data || error.message);
        toast.error(
          error.response?.data?.message || "Failed to update changes"
        );
      } else {
        console.error("Unexpected error:", error);
        toast.error("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationChange = (
    renewalId: number,
    field: keyof RenewalDetails,
    newValue: "Not Started" | "Passed" | "Failed" | boolean
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

          const renewal_date =
            allPassed && updated.is_validated ? new Date().toISOString() : null;

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

      return updatedRows;
    });
  };

  const handleIsValidatedChange = (
    renewal: RenewalDetailsClone,
    currentValue: boolean | null
  ) => {
    const validationFields = Object.keys(validation).filter(
      (k) =>
        k !== "scholarship_status" &&
        k !== "gpa_validation_stat" &&
        k !== "is_validated"
    );

    const hasNotStarted = validationFields.some(
      (field) => renewal[field as keyof RenewalDetails] === "Not Started"
    );

    if (hasNotStarted) {
      toast.error(
        "All validation fields must be set to Passed or Failed before validating."
      );
      return;
    }

    setTempRenewalData((prev) => {
      const updatedRows = prev.map((r) => {
        if (r.renewal_id === renewal.renewal_id) {
          const newValue =
            currentValue === null ? true : currentValue === true ? false : null;

          const updated = { ...r, is_validated: newValue };

          const scholarship_status = computeScholarshipStatus(updated);

          const isEdited = Object.keys(updated).some(
            (key) =>
              key !== "original" &&
              key !== "isEdited" &&
              updated[key as keyof RenewalDetails] !==
                r.original[key as keyof RenewalDetails]
          );

          return {
            ...updated,
            scholarship_status,
            isEdited,
          };
        }
        return r;
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
    submitSaveChanges(newData);
  };

  const handleConfirmSave = () => {
    submitSaveChanges(tempRenewalData);
    setIsEdit(false);
    setIsConfirmOpen(false);
    setPendingExitEdit(false);
  };

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    const filterByBranch = renewalData.filter((r) => r.campus === branch);
    setTempRenewalData(filterByBranch);
  };

  const handleCancelModal = () => {
    setIsConfirmOpen(false);
    setPendingExitEdit(false);
    setIsEdit(false);
    setTempRenewalData(renewalData);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    filterData(
      value,
      selectedStatus,
      selectedBranchFilter,
      selectedYearLevelFilter
    );
  };

  const filterData = (
    search: string,
    status: string,
    branch: string,
    yearLevel: string
  ) => {
    let filtered = renewalData;

    if (status !== "All") {
      filtered = filtered.filter((item) => item.scholarship_status === status);
    }

    if (branch !== "All") {
      filtered = filtered.filter((item) => item.campus === branch);
    }

    if (yearLevel !== "All") {
      filtered = filtered.filter((item) => item.year_level === yearLevel);
    }

    if (search.trim() !== "") {
      filtered = filtered.filter((item) =>
        item.scholar_name.toLowerCase().includes(search)
      );
    }

    setTempRenewalData(filtered);
  };

  const handleCheckModal = (type: string) => {
    setTempRenewalData((prev) => {
      return prev.map((r) => {
        let shouldUpdate = false;

        if (type === "Check All") {
          shouldUpdate = true;
        } else if (type === "Check Remaining") {
          shouldUpdate = r.is_validated === null;
        }

        if (shouldUpdate) {
          const updated = { ...r, is_validated: true };
          const scholarship_status = computeScholarshipStatus(updated);

          const isEdited = Object.keys(updated).some(
            (key) =>
              key !== "original" &&
              key !== "isEdited" &&
              updated[key as keyof RenewalDetails] !==
                r.original[key as keyof RenewalDetails]
          );

          return {
            ...updated,
            scholarship_status,
            isEdited,
          };
        }

        return r;
      });
    });
  };

  useEffect(() => {
    filterData(
      searchQuery,
      selectedStatus,
      selectedBranchFilter,
      selectedYearLevelFilter
    );
  }, [selectedStatus, selectedBranchFilter, selectedYearLevelFilter]);

  useEffect(() => {
    if (sySemester) {
      getRenewalData(sySemester);
      getInitialRenewalInfo(sySemester);
    }
  }, [sySemester]);

  useEffect(() => {
    if (auth?.info?.branch?.branch_name) {
      setSelectedBranch(auth.info.branch.branch_name);
    }
  }, [auth?.info?.branch]);

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
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handlePopState = () => {
      if (hasEdits) {
        window.history.pushState(null, "", window.location.pathname);
        setIsConfirmOpen(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
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

  const availableKeys =
    renewalData.length > 0 ? Object.keys(renewalData[0]) : [];

  // Get unique branches and year levels for filter options
  const uniqueBranches = Array.from(
    new Set(renewalData.map((item) => item.campus))
  ).filter(Boolean);
  const uniqueYearLevels = Array.from(
    new Set(renewalData.map((item) => item.year_level))
  ).filter(Boolean);

  return (
    <>
      <div className="px-2 sm:px-4 py-2">
        {/* Modern Renewal Information Section */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-slate-200">
          {/* Header with Modern Styling */}
          <div className="flex justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                  Renewal Information
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm"
                onClick={() => setIsRenewalInfoVisible(!isRenewalInfoVisible)}
              >
                {isRenewalInfoVisible ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                <span className="hidden xs:inline">
                  {isRenewalInfoVisible ? "Hide Details" : "Show Details"}
                </span>
              </button>
              {role_id === 7 && isRenewalInfoVisible && (
                <button
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 rounded-lg transition-all duration-200 text-sm font-medium backdrop-blur-sm"
                  onClick={() => setShowCriteria(!showCriteria)}
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden xs:inline">
                    {showCriteria ? "Hide Criteria" : "Edit Criteria"}
                  </span>
                  <span className="xs:hidden">
                    {showCriteria ? "Hide" : "Edit"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Content */}
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              isRenewalInfoVisible
                ? "max-h-[2000px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {/* Modern Criteria Selection */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                showCriteria ? "max-h-96 opacity-100 mb-6" : "max-h-0 opacity-0"
              }`}
            >
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Pencil className="w-3 h-3 text-blue-600" />
                  </div>
                  Filter & Selection Criteria
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      School Year & Semester
                    </label>
                    <SYSemesterDropdown
                      value={sySemester}
                      onChange={(value) => setSySemester(value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Branch Selection
                    </label>
                    <BranchDropdown
                      formData={selectedBranch}
                      handleInputChange={handleBranchChange}
                      disabled={!!auth?.info?.branch}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Information Grid */}
            <div
              className={`grid grid-cols-1 xs:grid-cols-2 ${
                role_id === 7
                  ? "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              } gap-4 ${showCriteria ? "mt-4" : ""}`}
            >
              {/* Branch Card */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Branch
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {selectedBranch || "All Branches"}
                </p>
                {auth?.info?.branch && (
                  <p className="text-xs text-slate-500">
                    Your branch: {auth.info.branch.branch_name}
                  </p>
                )}
              </div>

              {/* Pending Validation Card (Admin Only) */}
              {role_id === 7 && (
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Pending
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">
                    {tempRenewalData.length} of {initialRenewalInfo?.count}
                  </p>
                  <p className="text-xs text-slate-500">
                    Awaiting Registrar & D.O. validation
                  </p>
                </div>
              )}

              {/* Renewal Date Card */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Renewal Date
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">Not Set</p>
                <p className="text-xs text-slate-500">
                  Will be set upon completion
                </p>
              </div>

              {/* Renewal Basis Card */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Basis
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {initialRenewalInfo?.renewal_school_year_basis_text ||
                    "Not Started"}
                </p>
                <p className="text-xs text-slate-500">
                  {initialRenewalInfo?.renewal_sem_basis_text ||
                    "Semester not set"}
                </p>
              </div>

              {/* Renewal For Card */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Renewal For
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {initialRenewalInfo?.school_year_text || "None"}
                </p>
                <p className="text-xs text-slate-500">
                  {initialRenewalInfo?.semester_text || "Semester not set"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Student Records Section */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-t-2xl p-4 sm:p-6 border border-slate-200">
          {/* Modern Header Section */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserRoundPen
                  strokeWidth={2}
                  className="text-white"
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Student Records
                </h2>
                <p className="text-sm text-slate-600">
                  {countPassed + countDelisted} of {renewalData.length} students
                  processed
                </p>
              </div>
            </div>

            {/* Modern Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
              {!isEdit && role_id === 7 && (
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
                  onClick={() => SetIsRenewalBtnOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden xs:inline">Initialize Renewal</span>
                  <span className="xs:hidden">Initialize</span>
                </button>
              )}

              {/* Individual File Action Buttons */}
              {!isEdit && (
                <>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 text-sm font-medium border border-white/50"
                    onClick={() => setIsUploadOpen(true)}
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden xs:inline">Upload</span>
                  </button>
                  <UploadFileRenewalModal
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    renewalData={tempRenewalData}
                    onFileChanges={handleFileChanges}
                  />

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 text-sm font-medium border border-white/50"
                    onClick={() => setIsGnrtRprtOpen(true)}
                  >
                    <FileDown className="w-4 h-4" />
                    <span className="hidden xs:inline">Report</span>
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-slate-700 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 text-sm font-medium border border-white/50"
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
                    <span className="hidden xs:inline">Download</span>
                  </button>
                </>
              )}

              {/* Edit Mode Button */}
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isEdit
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl"
                    : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md border border-white/50"
                }`}
                onClick={toggleEditMode}
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden xs:inline">
                  {isEdit ? "Stop Editing" : "Edit Mode"}
                </span>
                <span className="xs:hidden">{isEdit ? "Stop" : "Edit"}</span>
              </button>

              {/* Save Changes Button (Edit Mode) */}
              {isEdit && (
                <button
                  onClick={() => submitSaveChanges(tempRenewalData)}
                  disabled={!hasEdits}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    hasEdits
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden xs:inline">Save Changes</span>
                  <span className="xs:hidden">Save</span>
                </button>
              )}
            </div>
          </div>

          {/* Modern Controls Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
            <div className="flex flex-col gap-4">
              {/* Status Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Mobile-friendly status filter */}
                <div className="flex flex-col sm:hidden gap-2">
                  <div className="text-xs text-slate-600 font-medium">
                    Filter by Status:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedStatus("All")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedStatus === "All"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                          : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md border border-white/50"
                      }`}
                    >
                      All ({renewalData.length})
                    </button>
                    <button
                      onClick={() => setSelectedStatus("Not Started")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedStatus === "Not Started"
                          ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                          : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md border border-white/50"
                      }`}
                    >
                      Not Started ({countNotStarted})
                    </button>
                    <button
                      onClick={() => setSelectedStatus("Passed")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedStatus === "Passed"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                          : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md border border-white/50"
                      }`}
                    >
                      Passed ({countPassed})
                    </button>
                    <button
                      onClick={() => setSelectedStatus("Delisted")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedStatus === "Delisted"
                          ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                          : "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-md border border-white/50"
                      }`}
                    >
                      Delisted ({countDelisted})
                    </button>
                  </div>
                </div>

                {/* Desktop status filter */}
                <div className="hidden sm:flex items-center bg-white/50 backdrop-blur-sm rounded-lg border border-white/50 overflow-hidden">
                  <button
                    className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                      selectedStatus === "All"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/80 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedStatus("All")}
                  >
                    All ({renewalData.length})
                  </button>
                  <div className="w-px h-6 bg-white/50"></div>
                  <button
                    className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                      selectedStatus === "Not Started"
                        ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/80 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedStatus("Not Started")}
                  >
                    Not Started ({countNotStarted})
                  </button>
                  <div className="w-px h-6 bg-white/50"></div>
                  <button
                    className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                      selectedStatus === "Passed"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/80 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedStatus("Passed")}
                  >
                    Passed ({countPassed})
                  </button>
                  <div className="w-px h-6 bg-white/50"></div>
                  <button
                    className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                      selectedStatus === "Delisted"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white/80 hover:shadow-md"
                    }`}
                    onClick={() => setSelectedStatus("Delisted")}
                  >
                    Delisted ({countDelisted})
                  </button>
                </div>

                {/* Search Input */}
                <div className="flex items-center pl-3 pr-3 bg-white/100 backdrop-blur-sm rounded-lg border border-white/50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 flex-1 h-10">
                  <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search scholars..."
                    className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm min-w-0"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              {/* Additional Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Branch Filter */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <label className="text-xs text-slate-600 font-medium sm:whitespace-nowrap">
                    Branch:
                  </label>
                  <select
                    value={selectedBranchFilter}
                    onChange={(e) => setSelectedBranchFilter(e.target.value)}
                    className="px-3 py-2 bg-white/100 backdrop-blur-sm border border-white/50 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-w-[120px] text-slate-700"
                  >
                    <option value="All">All Branches</option>
                    {uniqueBranches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Level Filter */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <label className="text-xs text-slate-600 font-medium sm:whitespace-nowrap">
                    Year Level:
                  </label>
                  <select
                    value={selectedYearLevelFilter}
                    onChange={(e) => setSelectedYearLevelFilter(e.target.value)}
                    className="px-3 py-2 bg-white/100 backdrop-blur-sm border border-white/50 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-w-[120px] text-slate-700"
                  >
                    <option value="All">All Year Levels</option>
                    {uniqueYearLevels.map((yearLevel) => (
                      <option key={yearLevel} value={yearLevel}>
                        {yearLevel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={() => {
                    setSelectedStatus("All");
                    setSelectedBranchFilter("All");
                    setSelectedYearLevelFilter("All");
                    setSearchQuery("");
                  }}
                  className="px-3 py-2 text-xs font-medium bg-white/100  text-slate-600 hover:text-slate-800 hover:bg-white/80 rounded-lg transition-all duration-200 border border-white/50 backdrop-blur-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Data Table Container */}
        <div
          ref={tableContainerRef}
          className="bg-white/80 backdrop-blur-sm rounded-b-xl border border-white/50 shadow-sm"
        >
          {!isLoading ? (
            tempRenewalData && tempRenewalData.length > 0 ? (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto scroll-smooth">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/80 backdrop-blur-sm">
                      <tr
                        className="text-slate-700 text-xs sm:text-sm font-medium text-left"
                        key={renewalData[0].renewal_id}
                      >
                        {!isEdit && (
                          <th
                            className="border border-gray-300"
                            key="blank"
                          ></th>
                        )}
                        {Object.entries(renewalTableHead)
                          .filter(([key]) => availableKeys.includes(key))
                          .map(([key, label]) => (
                            <>
                              {key !== "is_validated" ? (
                                <th
                                  key={key}
                                  className={`px-2 sm:px-3 lg:px-5 py-2 sm:py-3 text-center border border-gray-300
    ${
      key === "scholar_name" &&
      "sticky left-[-1px] bg-gray-100 z-10 shadow-md max-w-[150px] sm:max-w-[200px] min-w-[150px] sm:min-w-[200px]"
    }
    ${
      key === "scholarship_status" &&
      "sticky left-[149px] sm:left-[198px] bg-gray-100 z-10 shadow-md"
    }
    ${
      key === "gpa" &&
      "max-w-[60px] sm:max-w-[80px] min-w-[60px] sm:min-w-[80px]"
    }
    ${
      key === "renewal_year_level_basis" &&
      "min-w-[200px] sm:min-w-[250px] whitespace-normal break-words align-top"
    }
    ${
      key === "year_level" &&
      "min-w-[200px] sm:min-w-[250px] whitespace-normal break-words align-top"
    }
  `}
                                >
                                  {key === "renewal_year_level_basis" ? (
                                    <>
                                      {label.toUpperCase()} <br />
                                      {renewalData[0]
                                        ?.renewal_school_year_basis &&
                                      renewalData[0]?.renewal_semester_basis ? (
                                        <>
                                          SY{" "}
                                          {
                                            renewalData[0]
                                              .renewal_school_year_basis
                                          }
                                          &nbsp;
                                          {
                                            renewalData[0]
                                              .renewal_semester_basis
                                          }
                                        </>
                                      ) : (
                                        <>NONE</>
                                      )}
                                    </>
                                  ) : key === "year_level" ? (
                                    <>
                                      {label.toUpperCase()} <br />
                                      {renewalData[0]?.school_year &&
                                      renewalData[0]?.semester ? (
                                        <>
                                          SY {renewalData[0].school_year}&nbsp;
                                          {renewalData[0].semester}
                                        </>
                                      ) : (
                                        <>NONE</>
                                      )}
                                    </>
                                  ) : (
                                    label.toUpperCase()
                                  )}
                                </th>
                              ) : (
                                <th
                                  className="px-5 py-3 min-w-[200px] relative"
                                  key={key}
                                >
                                  <CheckAllDropdown
                                    label={label.toUpperCase()}
                                    handleCheck={handleCheckModal}
                                  />
                                </th>
                              )}
                            </>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200 text-[12px] sm:text-[14px]">
                      {tempRenewalData &&
                        tempRenewalData
                          .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                          .map((renewal) => (
                            <tr
                              key={renewal.renewal_id}
                              className="cursor-pointer group border border-gray-300"
                            >
                              {!isEdit && (
                                <td
                                  className="px-4 group-hover:bg-gray-100"
                                  onClick={() =>
                                    handleRowClick(
                                      renewal.student_id,
                                      renewal.renewal_id
                                    )
                                  }
                                >
                                  <Eye
                                    strokeWidth={1}
                                    className="hover:translate-y-[-1px] hover:text-blue-700"
                                  />
                                </td>
                              )}
                              {Object.keys(renewalTableHead)
                                .filter((key) => availableKeys.includes(key))
                                .map((key) => {
                                  const value =
                                    renewal[key as keyof RenewalDetails];
                                  const isValidationField = Object.keys(
                                    validation
                                  )
                                    .filter(
                                      (k) =>
                                        k !== "scholarship_status" &&
                                        k !== "gpa_validation_stat" &&
                                        k !== "is_validated"
                                    )
                                    .includes(key);
                                  const isGPAField = key === "gpa";
                                  const isTextField =
                                    key === "delisting_root_cause";
                                  const isValidatedField =
                                    key === "is_validated";
                                  return (
                                    <td
                                      key={key}
                                      className={`px-2 sm:px-3 lg:px-5 py-2 sm:py-3 border border-gray-300 group-hover:bg-gray-100 ${
                                        key === "scholar_name"
                                          ? "sticky left-[-1px] z-10 shadow-md bg-white max-w-[150px] sm:max-w-[200px] lg:max-w-[300px] overflow-hidden"
                                          : key === "scholarship_status"
                                          ? "sticky left-[149px] sm:left-[198px] bg-white z-10 shadow-md max-w-[120px] sm:max-w-[150px] whitespace-nowrap overflow-hidden text-center"
                                          : "min-w-[120px] sm:min-w-[150px] max-w-[300px] sm:max-w-[400px] whitespace-nowrap overflow-hidden text-center"
                                      }`}
                                    >
                                      {isEdit && isValidatedField ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleIsValidatedChange(
                                              renewal,
                                              value as boolean | null
                                            );
                                          }}
                                          className={`w-full h-full flex items-center justify-center font-semibold select-none cursor-pointer hover:ring-1 hover:ring-gray-300 rounded ${
                                            value === true
                                              ? "text-green-600 text-2xl"
                                              : value === false
                                              ? "text-red-600 text-2xl"
                                              : "text-gray-400 text-xs"
                                          }`}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                          }}
                                          title={
                                            value === true
                                              ? "Validated"
                                              : value === false
                                              ? "Not Validated"
                                              : ""
                                          }
                                        >
                                          {value === true
                                            ? "\u2713"
                                            : value === false
                                            ? "X"
                                            : "Not Started"}
                                        </button>
                                      ) : isEdit && isGPAField ? (
                                        <input
                                          type="number"
                                          value={
                                            typeof value === "number" ||
                                            typeof value === "string"
                                              ? value
                                              : ""
                                          }
                                          step="0.01"
                                          min={0}
                                          max={5}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") {
                                              handleGPAChange(
                                                renewal.renewal_id,
                                                null
                                              );
                                              return;
                                            }
                                            let numVal = Number(val);
                                            if (numVal > 5) numVal = 5;
                                            numVal =
                                              Math.floor(numVal * 100) / 100;
                                            handleGPAChange(
                                              renewal.renewal_id,
                                              numVal
                                            );
                                          }}
                                          className="border border-gray-300 px-1 sm:px-2 py-1 rounded-sm w-full text-xs sm:text-sm"
                                        />
                                      ) : isEdit &&
                                        isTextField &&
                                        renewal.scholarship_status ===
                                          "Delisted" ? (
                                        <textarea
                                          value={value as string}
                                          rows={1}
                                          onChange={(e) => {
                                            const newValue = e.target.value;
                                            setTempRenewalData((prev) =>
                                              prev.map((r) =>
                                                r.renewal_id ===
                                                renewal.renewal_id
                                                  ? { ...r, [key]: newValue }
                                                  : r
                                              )
                                            );
                                          }}
                                          className="border border-gray-300 px-1 sm:px-2 py-1 rounded-sm w-full resize-none text-xs sm:text-sm"
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
                                                  (value as string) ||
                                                  "Not Started"
                                                ).trim() === "Failed"
                                              ? "text-red-600 text-lg"
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
                                                (value as string) ||
                                                "Not Started"
                                              ).trim() === "Failed"
                                            ? "X"
                                            : "Not Started"}
                                        </button>
                                      ) : key === "scholarship_status" ? (
                                        statusBadge(value as string)
                                      ) : key === "is_validated" ? (
                                        <span
                                          className={`font-semibold ${
                                            value === true
                                              ? "text-green-600 text-lg"
                                              : value === false
                                              ? "text-red-600 text-lg"
                                              : "text-gray-400 text-sm"
                                          }`}
                                        >
                                          {value === true
                                            ? "\u2713"
                                            : value === false
                                            ? "X"
                                            : "Pending"}
                                        </span>
                                      ) : (
                                        <span>
                                          {statusBadge(value as string)}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3 p-4">
                  {tempRenewalData
                    .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                    .map((renewal) => (
                      <div
                        key={renewal.renewal_id}
                        className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {renewal.scholar_name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                              ID: {renewal.student_id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isEdit && (
                              <button
                                onClick={() =>
                                  handleRowClick(
                                    renewal.student_id,
                                    renewal.renewal_id
                                  )
                                }
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <div className="text-right">
                              {statusBadge(renewal.scholarship_status)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">Campus:</span>
                            <p className="font-medium">{renewal.campus}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Batch:</span>
                            <p className="font-medium">{renewal.batch}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">GPA:</span>
                            <p className="font-medium">
                              {renewal.gpa || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Year Level:</span>
                            <p className="font-medium">{renewal.year_level}</p>
                          </div>
                        </div>

                        {isEdit && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="space-y-3">
                              {/* GPA Input */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">
                                  GPA
                                </label>
                                <input
                                  type="number"
                                  value={
                                    typeof renewal.gpa === "number" ||
                                    typeof renewal.gpa === "string"
                                      ? renewal.gpa
                                      : ""
                                  }
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
                                  className="border border-gray-300 px-2 py-1 rounded-sm w-full text-xs"
                                />
                              </div>

                              {/* Validation Status */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-2">
                                  Validation Status
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleIsValidatedChange(
                                      renewal,
                                      renewal.is_validated as boolean | null
                                    );
                                  }}
                                  className={`w-full px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                                    renewal.is_validated === true
                                      ? "bg-green-100 text-green-700 border border-green-300"
                                      : renewal.is_validated === false
                                      ? "bg-red-100 text-red-700 border border-red-300"
                                      : "bg-gray-100 text-gray-600 border border-gray-300"
                                  }`}
                                >
                                  {renewal.is_validated === true
                                    ? "✓ Validated"
                                    : renewal.is_validated === false
                                    ? "✗ Not Validated"
                                    : "Pending"}
                                </button>
                              </div>

                              {/* Individual Validation Fields */}
                              <div>
                                <label className="text-xs text-gray-500 block mb-2">
                                  Individual Validations
                                </label>
                                <div className="space-y-2">
                                  {Object.keys(validation)
                                    .filter(
                                      (k) =>
                                        k !== "scholarship_status" &&
                                        k !== "gpa_validation_stat" &&
                                        k !== "is_validated"
                                    )
                                    .map((key) => {
                                      const value =
                                        renewal[key as keyof RenewalDetails];
                                      const current = (
                                        (value as string) || "Not Started"
                                      ).trim();
                                      return (
                                        <div
                                          key={key}
                                          className="flex items-center justify-between"
                                        >
                                          <span className="text-xs text-gray-600 capitalize">
                                            {key.replace(/_/g, " ")}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
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
                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                              current === "Passed"
                                                ? "bg-green-100 text-green-700"
                                                : current === "Failed"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {current === "Passed"
                                              ? "✓"
                                              : current === "Failed"
                                              ? "✗"
                                              : "○"}
                                          </button>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>

                              {/* Delisting Root Cause */}
                              {renewal.scholarship_status === "Delisted" && (
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">
                                    Delisting Reason
                                  </label>
                                  <textarea
                                    value={renewal.delisting_root_cause || ""}
                                    rows={2}
                                    onChange={(e) => {
                                      const newValue = e.target.value;
                                      setTempRenewalData((prev) =>
                                        prev.map((r) =>
                                          r.renewal_id === renewal.renewal_id
                                            ? {
                                                ...r,
                                                delisting_root_cause: newValue,
                                              }
                                            : r
                                        )
                                      );
                                    }}
                                    className="border border-gray-300 px-2 py-1 rounded-sm w-full resize-none text-xs"
                                    placeholder="Enter reason for delisting..."
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-slate-600 text-sm">
                  {initialRenewalInfo?.count === 0 ||
                  initialRenewalInfo?.count === undefined
                    ? "Renewal for this SY and Semester is not initialize yet"
                    : role_id === 7
                    ? `Here will show list of validated scholars for renewal by D.O and Registrar  ${renewalData.length}/${initialRenewalInfo?.count}`
                    : ""}
                </p>
              </div>
            )
          ) : (
            <Loading />
          )}
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-slate-50/80 backdrop-blur-sm border-t border-slate-200">
            {/* Mobile pagination info */}

            <PaginationControl
              currentPage={page}
              totalPages={totalPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <ScholarshipRenewalModal
        isOpen={isRenewalBtnOpen}
        onClose={() => SetIsRenewalBtnOpen(false)}
        getRenewalData={getRenewalData}
        sySemester={sySemester}
        onChangeSySemester={(newValue) => {
          setSySemester(newValue);
        }}
        user_id={userId || 0}
      />
      <GenerateReportModal
        isOpen={isGnrtRprtOpen}
        onClose={() => setIsGnrtRprtOpen(false)}
      />
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        message="You have unsaved changes. Do you want to save or discard them?"
        onConfirm={handleConfirmSave}
        onCancel={handleCancelModal}
        confirmText="Save"
        cancelText="Discard Changes"
      />
    </>
  );
}

export default RenewalListV2;
