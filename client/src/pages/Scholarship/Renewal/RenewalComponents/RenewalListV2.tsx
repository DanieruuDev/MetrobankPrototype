import { useContext, useEffect, useState } from "react";
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
  const [isFileActionOpen, setIsFileActionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [initialRenewalInfo, setInitialRenewalInfo] =
    useState<InitialRenewalInfo | null>(null);
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
        validation_id,
        role_id,
        initialized_by,
        user_id,
        original,
        ...rest
      } = row;
      console.log("valid id", validation_id);
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
        validation_id,
        role_id,
        initialized_by,
        user_id,
        changedFields,
      };
    });
    console.log("change", updateRows);

    try {
      setIsLoading(true);
      console.log("update rows", updateRows);
      if (updateRows.length > 0) {
        const res = await axios.put(
          `${VITE_BACKEND_URL}api/renewal/update-renewalV2`,
          updateRows
        );

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

    if (status !== "All") {
      filtered = filtered.filter((item) => item.scholarship_status === status);
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
  const getFilteredHeaders = (
    role_id: number | undefined,
    tableHead: { [key: string]: string },
    availableKeys: string[],
    initialRenewalInfo: InitialRenewalInfo | null
  ) => {
    // Base headers common to all roles
    const baseHeaders = [
      "scholar_name",
      "student_id",
      "renewal_year_level_basis",
      "renewal_semester_basis",
      "renewal_school_year_basis",
      "batch",
      "campus",
      "course",
      "semester",
      "school_year",
      "year_level",
      "scholarship_status",

      "is_validated",
    ];

    // Role-based validation fields
    const roleValidationFields: { [key: number]: string[] } = {
      3: [
        "gpa",
        "gpa_validation_stat",
        "no_failing_grd_validation",
        "no_other_scholar_validation",
        "full_load_validation",
        "withdrawal_change_course_validation",
        "enrollment_validation",
      ],
      9: ["goodmoral_validation", "no_criminal_charges_validation"],
      7: ["All"],
    };

    const allowedHeaders = [...baseHeaders];

    if (role_id && role_id in roleValidationFields) {
      const validationFields = roleValidationFields[role_id];
      if (validationFields[0] === "All") {
        allowedHeaders.push(
          ...Object.keys(tableHead).filter(
            (key) =>
              !baseHeaders.includes(key) &&
              key !== "delisting_root_cause" &&
              availableKeys.includes(key)
          )
        );

        if (availableKeys.includes("delisting_root_cause")) {
          allowedHeaders.push("delisting_root_cause");
        }
      } else {
        allowedHeaders.push(
          ...validationFields.filter((key) => availableKeys.includes(key))
        );
      }
    }

    const customHeaders = allowedHeaders
      .filter((key) => key in tableHead && availableKeys.includes(key))
      .map((key) => {
        if (initialRenewalInfo) {
          const renewalSy =
            initialRenewalInfo.renewal_school_year_basis_text || "Not Set";
          const renewalSemester =
            initialRenewalInfo.renewal_sem_basis_text || "Not Set";
          const sy = initialRenewalInfo.school_year_text || "Not Set";
          const semester = initialRenewalInfo.semester_text || "Not Set";
          if (key === "renewal_year_level_basis") {
            return {
              key,
              label: `Renewal Year Level Basis (SY ${renewalSy} ${renewalSemester})`,
            };
          } else if (key === "year_level") {
            return {
              key,
              label: `Year Level (SY ${sy} ${semester})`,
            };
          }
        }
        return {
          key,
          label: tableHead[key],
        };
      });

    return customHeaders;
  };
  useEffect(() => {
    filterData(searchQuery, selectedStatus);
  }, [selectedStatus]);

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

  return (
    <div className="px-4 py-2">
      {/* Updated Renewal Information Section */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold text-gray-800">
            Renewal Information
          </h1>
          {role_id === 7 && (
            <button
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              onClick={() => setShowCriteria(!showCriteria)}
            >
              <Pencil className="w-4 h-4" />
              {showCriteria ? "Hide Criteria" : "Edit Criteria"}
            </button>
          )}
        </div>

        {/* Criteria Selection (Collapsible) */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            showCriteria ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 max-w-[250px]">
              <SYSemesterDropdown
                value={sySemester}
                onChange={(value) => setSySemester(value)}
              />
            </div>
            <div className="flex-1 max-w-[250px]">
              <BranchDropdown
                formData={selectedBranch}
                handleInputChange={handleBranchChange}
                disabled={!!auth?.info?.branch}
              />
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            role_id === 7 ? "lg:grid-cols-5" : "lg:grid-cols-4"
          } gap-4 ${showCriteria ? "mt-4" : ""}`}
        >
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <span className="block text-sm font-medium text-gray-500">
              Branch
            </span>
            <span className="text-base font-semibold text-gray-800">
              {selectedBranch || "All"}
            </span>
            {auth?.info?.branch && (
              <span className="block text-xs text-gray-500 mt-1">
                Viewing scholars from your branch:{" "}
                {auth.info.branch.branch_name}
              </span>
            )}
          </div>
          {role_id === 7 && (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <span className="block text-sm font-medium text-gray-500">
                Pending Registrar/D.O. Validation
              </span>
              <span className="text-base font-semibold text-gray-800">
                {tempRenewalData.length} of {initialRenewalInfo?.count}
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                Students awaiting validation by Registrar and Discipline Officer
              </span>
            </div>
          )}
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <span className="block text-sm font-medium text-gray-500">
              Renewal Date
            </span>
            <span className="text-base font-semibold text-gray-800">None</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <span className="block text-sm font-medium text-gray-500">
              Renewal Basis
            </span>
            <span className="text-base font-semibold text-gray-800">
              {initialRenewalInfo?.renewal_school_year_basis_text ||
                "Not Started"}{" "}
              {initialRenewalInfo?.renewal_sem_basis_text || ""}
            </span>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <span className="block text-sm font-medium text-gray-500">
              Renewal For
            </span>
            <span className="text-base font-semibold text-gray-800">
              {initialRenewalInfo?.school_year_text || "None"}{" "}
              {initialRenewalInfo?.semester_text || "None"}
            </span>
          </div>
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
            {!isEdit && role_id === 7 && (
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
            <div className="flex flex-col sm:flex-row gap-2 w-full md:max-w-[800px]">
              <div className="grid grid-cols-2 sm:grid-cols-4 rounded-sm border border-[#CDCDCD] divide-x divide-[#CDCDCD] text-sm h-8 flex-1">
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
            <div
              className={`flex ${
                !isEdit
                  ? "border border-gray-300 divide-x divide-[#CDCDCD]"
                  : "rounded-sm overflow-hidden"
              } rounded-sm text-sm self-end md:self-auto`}
            >
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
                          const filteredHeaders = getFilteredHeaders(
                            role_id,
                            renewalTableHead,
                            availableKeys,
                            initialRenewalInfo
                          ).filter((h) => h.key !== "gpa_validation_stat");
                          const headers = filteredHeaders.map((h) => h.label); // Use labels for Excel headers
                          const data = renewalData.map((r) =>
                            filteredHeaders.map(
                              (h) => r[h.key as keyof RenewalDetails] ?? null
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
          tempRenewalData && tempRenewalData.length > 0 ? (
            <div className="overflow-x-auto scroll-smooth mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr
                    className="text-gray-800 text-sm font-medium text-left border border-gray-300"
                    key={renewalData[0].renewal_id}
                  >
                    {!isEdit && (
                      <th className="border border-gray-300" key="blank"></th>
                    )}
                    {Object.entries(renewalTableHead)
                      .filter(([key]) => availableKeys.includes(key))
                      .map(([key, label]) => (
                        <>
                          {key !== "is_validated" ? (
                            <th
                              key={key}
                              className={`px-5 py-3 text-center border border-gray-300
    ${
      key === "scholar_name" &&
      "sticky left-[-1px] bg-gray-100 z-10 shadow-md max-w-[200px] min-w-[200px]"
    }
    ${
      key === "scholarship_status" &&
      "sticky left-[198px] bg-gray-100 z-10 shadow-md"
    }
    ${key === "gpa" && "max-w-[80px] min-w-[80px]"}
    ${
      key === "renewal_year_level_basis" &&
      "min-w-[250px] whitespace-normal break-words align-top"
    }
    ${
      key === "year_level" &&
      "min-w-[250px] whitespace-normal break-words align-top"
    }
  `}
                            >
                              {key === "renewal_year_level_basis" ? (
                                <>
                                  {label.toUpperCase()} <br />
                                  {renewalData[0]?.renewal_school_year_basis &&
                                  renewalData[0]?.renewal_semester_basis ? (
                                    <>
                                      SY{" "}
                                      {renewalData[0].renewal_school_year_basis}
                                      &nbsp;
                                      {renewalData[0].renewal_semester_basis}
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
                <tbody className="bg-white divide-y divide-gray-200 text-[14px]">
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
                              const isValidationField = Object.keys(validation)
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
                              const isValidatedField = key === "is_validated";
                              return (
                                <td
                                  key={key}
                                  className={`px-5 py-3 border border-gray-300 group-hover:bg-gray-100 ${
                                    key === "scholar_name"
                                      ? "sticky left-[-1px] z-10 shadow-md bg-white max-w-[300px] overflow-hidden"
                                      : key === "scholarship_status"
                                      ? "sticky left-[198px] bg-white z-10 shadow-md max-w-[150px] whitespace-nowrap overflow-hidden text-center"
                                      : "min-w-[150px] max-w-[400px] whitespace-nowrap overflow-hidden text-center"
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
                                        numVal = Math.floor(numVal * 100) / 100;
                                        handleGPAChange(
                                          renewal.renewal_id,
                                          numVal
                                        );
                                      }}
                                      className="border border-gray-300 px-2 py-1 rounded-sm w-full"
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
                                            (value as string) || "Not Started"
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
            <div className="mt-6 text-center text-gray-500 italic">
              {initialRenewalInfo?.count === 0 ||
              initialRenewalInfo?.count === undefined
                ? "Renewal for this SY and Semester is not initialize yet"
                : role_id === 7
                ? `Here will show list of validated scholars for renewal by D.O and Registrar  ${renewalData.length}/${initialRenewalInfo?.count}`
                : ""}
            </div>
          )
        ) : (
          <Loading />
        )}
        <PaginationControl
          currentPage={page}
          totalPages={totalPage}
          onPageChange={(newPage) => setPage(newPage)}
        />
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
    </div>
  );
}

export default RenewalListV2;
