import { useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  FileDown,
  Pencil,
  Plus,
  Save,
  Upload,
  UserRoundPlus as UserRoundPen,
  SquareCheckBig,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import RenewalInfoSection from "../../../../components/renewal/RenewalInfoSection";
import UploadGradesModal from "../../../../components/renewal/UploadGradesModal";
import {
  type RenewalRow,
  InitialRenewalInfo,
  type RenewalDetailsClone,
  type RenewalDetails,
  validation,
  ScholarGradeDocument,
  ZipScholarGradeResult,
  ScholarGrade,
} from "../../../../Interface/IRenewal";
import { toast } from "react-toastify";
import axios from "axios";
import { socket } from "../../../../utils/socket";
import ScholarshipRenewalModal from "../../../../components/renewal/ScholarshipRenewalModal";
import GenerateReportModal from "../../../../components/renewal/GenerateReport";
import ProcessingModal from "../../../../components/renewal/ProcessingModal";
import UploadFileRenewalModal from "../../../../components/renewal/UploadFileRenewalModal";
import ConfirmationDialog from "../../../../components/shared/ConfirmationDialog";
import { AuthContext } from "../../../../context/AuthContext";

import AuditLog from "./AuditLog";
import RenewalFilterControls from "../../../../components/renewal/RenewalFilterControls";
import RenewalTable from "../../../../components/renewal/RenewalTable";
import GradeModal from "../../../../components/renewal/GradeModal";

interface RenewalListV2Props {
  handleRowClick: (student_id: number, renewal_id: number) => void;
}
interface ProcessInfo {
  process_id: number | null;
  current_stage: string;
}
interface ChangedFields {
  grades?: {
    fileURL?: string;
    fileName?: string;
    fileObject?: File;
    gradeList?: ScholarGrade[];
  };
  [key: string]: string | number | boolean | object | null | undefined;
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
  const [hasIncomingUpdate, setHasIncomingUpdate] = useState(false);

  const [gradeState, setGradeState] = useState<
    ScholarGradeDocument[] | ZipScholarGradeResult | null
  >(null);
  const [selectedGrades, setSelectedGrades] = useState<{
    name: string;
    gradeList: { course_code: string; final_grade: number }[];
    fileURL?: string;
  } | null>(null);

  const [countValidated, setCountValidated] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [openUploadGrades, setIsOpenUploadGrades] = useState(false);
  const [processInfo, setProcessInfo] = useState<ProcessInfo>({
    process_id: null,
    current_stage: "",
  });
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [tempRenewalData, setTempRenewalData] = useState<RenewalDetailsClone[]>(
    []
  );
  const [isValidateConfirmOpen, setIsValidateConfirmOpen] = useState(false);
  const [validateConfirmMessage, setValidateConfirmMessage] = useState("");
  const [pendingValidationChange, setPendingValidationChange] = useState<{
    renewal: RenewalDetailsClone;
    newValue: boolean;
  } | null>(null);
  // For Check-All confirmation modal
  const [isCheckConfirmOpen, setIsCheckConfirmOpen] = useState(false);
  const [checkConfirmMessage, setCheckConfirmMessage] = useState("");
  const [pendingCheckAction, setPendingCheckAction] = useState<string | null>(
    null
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
  const [initialRenewalInfo, setInitialRenewalInfo] =
    useState<InitialRenewalInfo | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [selectedStatus, setSelectedStatus] = useState<
    "All" | "Not Started" | "Passed" | "Delisted"
  >("All");
  const [selectedBranchFilter, setSelectedBranchFilter] =
    useState<string>("All");
  const [selectedYearLevelFilter, setSelectedYearLevelFilter] =
    useState<string>("All");
  const [isRenewalInfoVisible, setIsRenewalInfoVisible] = useState(true);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [sySemesterOptions, setSySemesterOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const itemsPerPage = 10;
  // Define which columns are editable when in Edit Mode
  const editableFields = [
    "gpa",
    "delisting_root_cause",
    "is_validated",
    ...Object.keys(validation).filter(
      (k) =>
        k !== "scholarship_status" &&
        k !== "gpa_validation_stat" &&
        k !== "is_validated"
    ),
  ];

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

  const getInitialRenewalInfo = useCallback(
    async (sySemester: string) => {
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
      console.log(school_year, semPart);
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
    },
    [VITE_BACKEND_URL]
  );

  const getRenewalData = useCallback(
    async (sySemester: string) => {
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
    },
    [VITE_BACKEND_URL, userId, role_id]
  );

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

  const handleShowSaveConfirmation = () => {
    if (!hasEdits) {
      toast.info("No changes to save.", {
        position: "top-center",
        autoClose: 3000,
      });
      console.log(
        "No edits detected. Edited rows:",
        tempRenewalData.filter((row) => row.isEdited)
      );
      return;
    }
    console.log(
      "Opening save confirmation. Edited rows:",
      tempRenewalData.filter((row) => row.isEdited).length
    );
    setShowSaveConfirmation(true);
  };

  const submitSaveChanges = async (tempRenewalData: RenewalDetailsClone[]) => {
    const editedRows = tempRenewalData.filter((row) => row.isEdited);

    const updateRows = editedRows.map((row) => {
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

      const changedFields: ChangedFields = Object.fromEntries(
        Object.entries(rest).filter(([key, value]) => {
          if (key === "isEdited") return false;

          const originalValue = original[key as keyof RenewalDetails];

          if (typeof value === "object" && value !== null) {
            return JSON.stringify(value) !== JSON.stringify(originalValue);
          }

          return value !== originalValue;
        })
      ) as ChangedFields;

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

    try {
      setIsSaving(true);

      // 🔹 Per-row upload tracking
      const uploadStatuses: Record<number, string> = {};
      const uploadProgresses: Record<number, number> = {};

      // 🔹 Upload any new grade files before updating DB
      // 🔹 Upload any new grade files before updating DB
      for (const row of updateRows) {
        const cf = row.changedFields as ChangedFields;
        if (!cf.grades) continue;

        // 🧩 Convert blob URLs to File objects if necessary
        if (
          !cf.grades.fileObject &&
          cf.grades.fileURL &&
          cf.grades.fileURL.startsWith("blob:")
        ) {
          try {
            const blob = await fetch(cf.grades.fileURL).then((r) => r.blob());
            const fileName =
              cf.grades.fileName || `grades_${row.renewal_id}.pdf`;
            cf.grades.fileObject = new File([blob], fileName, {
              type: blob.type || "application/pdf",
            });
            console.log(
              `✅ Reconstructed File from blob for renewal_id ${row.renewal_id}`
            );
          } catch (err) {
            console.error("❌ Failed to reconstruct file from blob URL:", err);
            toast.error(
              `Could not prepare file for upload (renewal ID ${row.renewal_id})`
            );
            continue;
          }
        }

        // 🔹 Upload file to Backblaze B2 via Redis job tracker
        if (cf.grades.fileObject instanceof File) {
          const formData = new FormData();
          formData.append("file", cf.grades.fileObject);
          formData.append("renewal_id", String(row.renewal_id));
          try {
            uploadStatuses[row.renewal_id] = "Starting upload...";
            setUploadStatus(`Starting upload for ID ${row.renewal_id}`);

            // Step 1️⃣: Start upload
            const startUploadRes = await axios.post(
              `${VITE_BACKEND_URL}api/document/upload-grade-file`,
              formData,
              { headers: { "Content-Type": "multipart/form-data" } }
            );

            const { jobId } = startUploadRes.data;
            console.log(jobId);
            if (!jobId) throw new Error("No jobId returned from upload start.");

            uploadStatuses[row.renewal_id] = "Uploading...";
            setUploadStatus(`Uploading grade file for ID ${row.renewal_id}...`);

            // Step 2️⃣: Poll Redis job status
            let jobStatus = null;
            let retries = 0;
            const maxRetries = 40; // ~80s total (40 × 2s)
            let lastError: Error | null = null;

            while (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 2000));

              try {
                const statusRes = await axios.get(
                  `${VITE_BACKEND_URL}api/jobs/${jobId}`,
                  { timeout: 5000 } // Add timeout for individual requests
                );
                jobStatus = statusRes.data;

                // 🧠 Handle empty or invalid job status
                if (!jobStatus || Object.keys(jobStatus).length === 0) {
                  console.warn(`⚠️ Job ${jobId} not found in Redis.`);
                  throw new Error(`Job ${jobId} not found in Redis.`);
                }

                // Update progress
                if (jobStatus.progress) {
                  const progress = Number(jobStatus.progress);
                  uploadProgresses[row.renewal_id] = progress;
                  setUploadProgress(progress);
                  setUploadStatus(
                    `Uploading (ID ${row.renewal_id}) — ${progress}%`
                  );
                }

                if (jobStatus.status === "completed") {
                  cf.grades.fileURL =
                    jobStatus.fileURL || jobStatus.result?.fileURL;
                  cf.grades.fileName =
                    jobStatus.fileName || jobStatus.result?.fileName;
                  delete cf.grades.fileObject;

                  uploadProgresses[row.renewal_id] = 100;
                  uploadStatuses[row.renewal_id] = "Completed";
                  setUploadStatus(`Upload complete for ID ${row.renewal_id}`);
                  setUploadProgress(100);

                  toast.success(`✅ Upload complete for ID ${row.renewal_id}`, {
                    position: "top-center",
                    autoClose: 2000,
                  });
                  break;
                }

                if (jobStatus.status === "failed") {
                  uploadStatuses[row.renewal_id] = "Failed";
                  throw new Error(jobStatus.message || "Upload failed");
                }

                retries++;
              } catch (err) {
                lastError = err as Error;
                console.warn(
                  `⚠️ Polling attempt ${retries + 1} failed for job ${jobId}:`,
                  err
                );
                retries++;
              }
            }

            // Handle timeout or persistent errors
            if (!jobStatus || jobStatus.status !== "completed") {
              uploadStatuses[row.renewal_id] = "Error";
              const errorMessage = lastError
                ? `Upload failed for ID ${row.renewal_id}: ${lastError.message}`
                : `Upload timeout for ID ${row.renewal_id}`;
              toast.error(errorMessage, {
                position: "top-center",
                autoClose: 3000,
              });
              throw new Error(errorMessage);
            }
          } catch (err) {
            uploadStatuses[row.renewal_id] = "Error";
            console.error("❌ Failed to upload grade file:", err);
            toast.error(
              `Failed to upload grade file for ID ${row.renewal_id}`,
              {
                position: "top-center",
                autoClose: 3000,
              }
            );
            throw err;
          }
        }
      }

      // 🔹 Update renewal data in PostgreSQL
      if (updateRows.length > 0) {
        const res = await axios.put(
          `${VITE_BACKEND_URL}api/renewal/update-renewalV2`,
          updateRows
        );

        getRenewalData(sySemester);

        if (res.status === 200) {
          toast.success("✅ Changes saved successfully", {
            position: "top-center",
            autoClose: 3000,
          });
        } else {
          toast.warn("⚠️ Update completed with unexpected response.", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      } else {
        toast.info("No changes to update.", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update changes.", {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
      setIsLoading(false);
      setUploadStatus("");
      setUploadProgress(0);
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
          // ⛔ Skip if row is validated
          if (r.is_validated === true) {
            toast.warning(
              "This record is already validated and cannot be edited."
            );
            return r;
          }

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
              : scholarship_status === "Passed"
              ? null
              : r.delisting_root_cause;

          const delisted_date =
            scholarship_status === "Delisted"
              ? new Date().toISOString()
              : scholarship_status === "Passed"
              ? null
              : r.delisted_date;

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
    const newValue = !currentValue;
    const role = Number(role_id);

    // Validation check
    const validationFields = Object.keys(validation).filter(
      (k) =>
        k !== "scholarship_status" &&
        k !== "gpa_validation_stat" &&
        k !== "is_validated"
    );

    const hasNotStarted = validationFields.some(
      (field) => renewal[field as keyof RenewalDetails] === "Not Started"
    );

    // Prevent validating if there are unfinished fields
    if (newValue === true && hasNotStarted) {
      toast.error(
        "All validation fields must be set to Passed or Failed before validating.",
        { toastId: "validation-fields-error" }
      );
      return;
    }

    // Define confirmation message
    let message = "";
    if (role === 7) {
      message = newValue
        ? "Once you validate this record, other validators (Registrar/DO) will no longer be able to edit their validation. Continue?"
        : "Unchecking this will allow other validators to edit their validation again. Continue?";
    } else if (role === 3 || role === 9) {
      message = newValue
        ? "Validating this record will forward it to HR and you won’t be able to change your input. Continue?"
        : "Unchecking this will pull the record back from HR. Continue?";
    }

    // Open confirmation modal
    setValidateConfirmMessage(message);
    setPendingValidationChange({ renewal, newValue });
    setIsValidateConfirmOpen(true);
  };
  const handleConfirmValidationChange = () => {
    if (!pendingValidationChange) return;

    const { renewal, newValue } = pendingValidationChange;

    setTempRenewalData((prev) => {
      const updatedRows = prev.map((r) => {
        if (r.renewal_id === renewal.renewal_id) {
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

    // Close modal after confirming
    setIsValidateConfirmOpen(false);
    setPendingValidationChange(null);
  };

  const handleGPAChange = (renewalId: number, newGPA: number | null) => {
    setTempRenewalData((prev) =>
      prev.map((r) => {
        if (r.renewal_id === renewalId) {
          // ⛔ Prevent edit if validated
          if (r.is_validated === true) {
            toast.warning(
              "This record is already validated and cannot be edited."
            );
            return r;
          }

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
          : scholarship_status === "Passed"
          ? null
          : row.delisting_root_cause;

      const delisted_date =
        scholarship_status === "Delisted"
          ? new Date().toISOString()
          : scholarship_status === "Passed"
          ? null
          : row.delisted_date;

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

  const filterData = useCallback(
    (search: string, status: string, branch: string, yearLevel: string) => {
      let filtered = renewalData;

      // ✅ Normalize the search term
      const normalizedSearch = search.trim().toLowerCase();

      // 1️⃣ Filter by status
      if (status !== "All") {
        filtered = filtered.filter(
          (item) => item.scholarship_status === status
        );
      }

      // 2️⃣ Auto-filter branch for certain roles
      if (role_id === 3 || role_id === 4 || role_id === 9) {
        const assignedBranch = auth?.info?.branch?.branch_name;
        if (assignedBranch) {
          filtered = filtered.filter(
            (item) =>
              item.campus?.toLowerCase() === assignedBranch.toLowerCase()
          );
        }
      } else if (branch !== "All") {
        filtered = filtered.filter(
          (item) => item.campus?.toLowerCase() === branch.toLowerCase()
        );
      }

      // 3️⃣ Filter by year level
      if (yearLevel !== "All") {
        filtered = filtered.filter(
          (item) => item.year_level?.toLowerCase() === yearLevel.toLowerCase()
        );
      }

      // 4️⃣ Case-insensitive search by multiple fields (name, id, campus)
      if (normalizedSearch !== "") {
        filtered = filtered.filter((item) => {
          const scholarName = item.scholar_name?.toLowerCase() || "";
          const studentId = String(item.student_id || "").toLowerCase();
          const campus = item.campus?.toLowerCase() || "";
          const year = String(item.year_level || "").toLowerCase();

          return (
            scholarName.includes(normalizedSearch) ||
            studentId.includes(normalizedSearch) ||
            campus.includes(normalizedSearch) ||
            year.includes(normalizedSearch)
          );
        });
      }

      setTempRenewalData(filtered);
    },
    [renewalData, role_id, auth?.info?.branch?.branch_name]
  );

  const handleFinalizeRenewal = async (action: string) => {
    console.log("finalize");
    if (!initialRenewalInfo) {
      toast.error("No renewal information found.");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        sy_code: initialRenewalInfo.school_year,
        semester_code: initialRenewalInfo.semester,
        stage_name: "Renewal",
        action: action,
        user_id: userId,
      };
      console.log("finalize inside");
      const res = await axios.put(
        `${VITE_BACKEND_URL}api/process/update-renewal`,
        payload
      );

      if (res.status === 200) {
        toast.success("Renewal has been finalized successfully.");
        getInitialRenewalInfo(sySemester);
        getProcessInfo();
      } else {
        toast.warn("Something went wrong while finalizing renewal.");
      }
    } catch (err) {
      console.error("❌ Error finalizing renewal:", err);
      toast.error("Failed to finalize renewal.");
    } finally {
      setIsLoading(false);
    }
  };

  const getProcessInfo = useCallback(async () => {
    // Optional: indicate loading state (if you have one)
    // setIsLoading(true);
    const [sy, semPart] = sySemester.split("_");
    const school_year = sy.replace("-", "");
    try {
      const result = await axios.get(
        `${VITE_BACKEND_URL}api/process/${school_year}/${semPart}`
      );

      if (!result || !result.data) {
        toast.warn("No process information found.");
        console.warn("⚠️ Empty response received:", result);
        return;
      }

      // 4️⃣ Update state
      setProcessInfo(result.data.data);
      console.log("Process info fetched:", result.data.data);
    } catch (error) {
      toast.error(`Error fetching process info ${error}`);
    }
  }, [VITE_BACKEND_URL, sySemester]);
  const handleCheckModal = (type: string) => {
    const validationFields = Object.keys(validation).filter(
      (k) =>
        k !== "scholarship_status" &&
        k !== "gpa_validation_stat" &&
        k !== "is_validated"
    );

    // Eligible = all required fields are not "Not Started"
    const eligibleRecords = tempRenewalData.filter((r) =>
      validationFields.every(
        (field) => r[field as keyof RenewalDetails] !== "Not Started"
      )
    );

    let affectedRecords: RenewalDetailsClone[] = [];
    let actionWord = "";

    switch (type) {
      case "Check All":
        affectedRecords = eligibleRecords.filter(
          (r) => r.is_validated !== true
        );
        actionWord = "validate";
        break;

      case "Check Remaining":
        affectedRecords = eligibleRecords.filter(
          (r) => r.is_validated !== true
        );
        actionWord = "validate (remaining)";
        break;

      case "Uncheck All":
        affectedRecords = eligibleRecords.filter(
          (r) => r.is_validated === true
        );
        actionWord = "unvalidate";
        break;

      case "Uncheck Remaining":
        affectedRecords = eligibleRecords.filter(
          (r) => r.is_validated === true
        );
        actionWord = "unvalidate (remaining)";
        break;

      default:
        break;
    }

    const totalEligible = eligibleRecords.length;
    const totalRecords = tempRenewalData.length;
    const totalAffected = affectedRecords.length;

    // 🧠 If no records are affected, don’t even show confirmation
    if (totalAffected === 0) {
      toast.info(`No eligible records to ${actionWord}.`, {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    // 🪄 Dynamic message
    const confirmMessage = `${totalAffected} out of ${totalRecords} records are eligible to ${actionWord}. ${
      totalAffected < totalEligible
        ? `(${totalAffected} of ${totalEligible} fully eligible records will be updated.)`
        : ""
    } Continue?`;

    // open confirmation modal
    setCheckConfirmMessage(confirmMessage);
    setPendingCheckAction(type);
    setIsCheckConfirmOpen(true);
  };

  const handleConfirmCheckAction = () => {
    if (!pendingCheckAction) return;

    const type = pendingCheckAction;
    const validationFields = Object.keys(validation).filter(
      (k) =>
        k !== "scholarship_status" &&
        k !== "gpa_validation_stat" &&
        k !== "is_validated"
    );

    setTempRenewalData((prev) =>
      prev.map((r) => {
        const isEligible = validationFields.every(
          (field) => r[field as keyof RenewalDetails] !== "Not Started"
        );

        let shouldUpdate = false;
        let newValidationValue: boolean | null = null;

        if (type === "Check All") {
          if (isEligible) {
            shouldUpdate = true;
            newValidationValue = true;
          }
        } else if (type === "Check Remaining") {
          if (isEligible && r.is_validated !== true) {
            shouldUpdate = true;
            newValidationValue = true;
          }
        } else if (type === "Uncheck All") {
          if (isEligible) {
            shouldUpdate = true;
            newValidationValue = false;
          }
        } else if (type === "Uncheck Remaining") {
          if (isEligible && r.is_validated !== false) {
            shouldUpdate = true;
            newValidationValue = false;
          }
        }

        if (shouldUpdate && newValidationValue !== null) {
          const updated = { ...r, is_validated: newValidationValue };
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
      })
    );

    setIsCheckConfirmOpen(false);
    setPendingCheckAction(null);
  };

  useEffect(() => {
    filterData(
      searchQuery,
      selectedStatus,
      selectedBranchFilter,
      selectedYearLevelFilter
    );
  }, [
    selectedStatus,
    selectedBranchFilter,
    selectedYearLevelFilter,
    searchQuery,
    filterData,
  ]);

  useEffect(() => {
    socket.on("renewal_updated", (payload) => {
      console.log("🔁 Real-time renewal update received:", payload);

      // 🚫 Restriction: Block reload only if editing AND has unsaved changes
      if (isEdit && hasEdits) {
        console.warn(
          "⏸️ Update ignored — user is editing with unsaved changes."
        );

        // Mark that new data exists, but do not auto-refresh
        setHasIncomingUpdate(true);

        toast.info(
          "New updates are available. Save or cancel your edits to refresh.",
          {
            position: "top-center",
            autoClose: 5000,
          }
        );

        return; // 🛑 Stop here — don't trigger any reload
      }

      // ✅ Safe to refresh automatically if NOT editing or no unsaved changes
      if (sySemester) {
        getRenewalData(sySemester);
        getInitialRenewalInfo(sySemester);
        getProcessInfo();
      }
    });

    return () => {
      socket.off("renewal_updated");
    };
  }, [
    sySemester,
    isEdit,
    hasEdits,
    getRenewalData,
    getInitialRenewalInfo,
    getProcessInfo,
  ]);

  useEffect(() => {
    if (sySemester) {
      getRenewalData(sySemester);
      getInitialRenewalInfo(sySemester);
      getProcessInfo();
    }
  }, [sySemester, getRenewalData, getInitialRenewalInfo]);

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
    const validated = renewalData.filter((r) => r.is_validated === true).length;

    setCountPassed(passed);
    setCountDelisted(delisted);
    setCountNotStarted(notStarted);
    setCountValidated(validated);
  }, [renewalData]);

  // Fetch SY Semester options
  useEffect(() => {
    const fetchSySemesterOptions = async () => {
      try {
        const response = await axios.get(
          `${VITE_BACKEND_URL}api/maintenance/valid_sy_semester`
        );

        const formatted = response.data.map(
          (item: {
            label: string;
            sy_code: number;
            semester_code: number;
            school_year: string;
            semester: string;
          }) => ({
            label: item.label, // e.g. "2025-2026 1st Semester"
            value: `${item.school_year}_${item.semester_code}`, // unique combo
          })
        );

        // Sort by school_year and semester_code to find latest
        const sorted = [...formatted].sort((a, b) =>
          b.value.localeCompare(a.value)
        );

        setSySemesterOptions(sorted);

        // Set default value if none is selected
        if (!sySemester && sorted.length > 0) {
          setSySemester(sorted[0].value);
        }
      } catch (error) {
        console.error("Error fetching valid SY-Semester:", error);
      }
    };

    fetchSySemesterOptions();
  }, [VITE_BACKEND_URL, sySemester]);

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

  console.log(gradeState);
  return (
    <>
      <div className="px-2 sm:px-4 mt-4 ">
        {/* Modern Renewal Information Section */}
        <RenewalInfoSection
          role_id={role_id}
          auth={auth}
          selectedBranchFilter={selectedBranchFilter}
          initialRenewalInfo={initialRenewalInfo}
          renewalData={renewalData}
          isRenewalInfoVisible={isRenewalInfoVisible}
          setIsRenewalInfoVisible={setIsRenewalInfoVisible}
        />

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
                  {countValidated} of {renewalData.length} students validated
                </p>
              </div>

              {hasIncomingUpdate && !isEdit && (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md px-4 py-2 mb-4 flex items-center justify-between">
                  <span>🔄 New updates are available.</span>
                  <button
                    onClick={() => {
                      getRenewalData(sySemester);
                      getInitialRenewalInfo(sySemester);
                      getProcessInfo();
                      setHasIncomingUpdate(false);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-all"
                  >
                    Refresh Now
                  </button>
                </div>
              )}
            </div>

            {/* Modern Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
              {!isEdit && role_id === 7 && (
                <>
                  {tempRenewalData.length === initialRenewalInfo?.count && (
                    <button
                      className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl cursor-pointer
    ${
      processInfo.current_stage === "Renewal"
        ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
    }`}
                      onClick={() =>
                        handleFinalizeRenewal(
                          processInfo.current_stage === "Renewal"
                            ? "complete"
                            : "rollback"
                        )
                      }
                    >
                      {processInfo.current_stage === "Renewal" ? (
                        <>
                          <SquareCheckBig className="w-4 h-4" />
                          <span className="hidden md:inline">
                            Finalize Renewal
                          </span>
                          <span className="md:hidden">Finalize</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />{" "}
                          {/* Use rollback icon */}
                          <span className="hidden md:inline">
                            Revert Renewal
                          </span>
                          <span className="md:hidden">Revert</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl cursor-pointer"
                    onClick={() => SetIsRenewalBtnOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">Initialize Renewal</span>
                    <span className="md:hidden">Initialize</span>
                  </button>
                </>
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

                  {/* <button
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
                  </button> */}
                </>
              )}

              {/* Edit Mode Button */}
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl cursor-pointer`}
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
                <>
                  {role_id === 3 && (
                    <button
                      onClick={() => setIsOpenUploadGrades(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Upload Grades
                    </button>
                  )}
                  {openUploadGrades && (
                    <UploadGradesModal
                      onClose={() => setIsOpenUploadGrades(false)}
                      onExtract={(grades) => {
                        console.log("📘 Extracted Grades:", grades);
                        setGradeState(grades);
                      }}
                      renewalData={tempRenewalData}
                      onSaveToTempRenewals={(saved) => {
                        console.log(
                          "✅ Saving grades to tempRenewalData:",
                          saved
                        );

                        setTempRenewalData((prev) =>
                          prev.map((row) => {
                            const normalizeId = (
                              id: string | number | null | undefined
                            ) =>
                              String(id ?? "")
                                .trim()
                                .replace(/^0+/, "")
                                .toLowerCase();

                            const matched = saved.find(
                              (s) =>
                                normalizeId(s.student_id) ===
                                normalizeId(row.student_id)
                            );

                            if (!matched) {
                              console.log(
                                `No match found for student_id: ${row.student_id}`
                              );
                              return row;
                            }

                            console.log(
                              `Matched student_id: ${row.student_id}, GWA: ${matched.gwa}`
                            );

                            const gwa =
                              matched.gradeList && matched.gradeList.length > 0
                                ? Number(
                                    (
                                      matched.gradeList.reduce(
                                        (sum, g) =>
                                          sum + Number(g.final_grade || 0),
                                        0
                                      ) / matched.gradeList.length
                                    ).toFixed(2)
                                  )
                                : matched.gwa ?? row.gpa;
                            console.log("GWA ONSCVE", matched.gradeList);
                            const noFailingGrades = (() => {
                              const studentGrades =
                                Array.isArray(gradeState) &&
                                gradeState.length > 0
                                  ? gradeState.find(
                                      (g) =>
                                        normalizeId(g.student_id) ===
                                        normalizeId(row.student_id)
                                    )
                                  : null;

                              const finalGradeList =
                                matched.gradeList &&
                                matched.gradeList.length > 0
                                  ? matched.gradeList
                                  : studentGrades?.grades ?? [];

                              if (finalGradeList.length === 0)
                                return "Not Started";

                              const hasFailing = finalGradeList.some(
                                (g) => Number(g.final_grade) > 2.0
                              );

                              return hasFailing ? "Failed" : "Passed";
                            })();

                            return {
                              ...row,
                              grades: {
                                fileURL: matched.fileURL,
                                gradeList: matched.gradeList,
                                fileName: matched.fileName,
                              },
                              gpa: gwa,
                              gpa_validation_stat: gwa
                                ? gwa <= 2.0
                                  ? "Passed"
                                  : "Failed"
                                : "Not Started",
                              no_failing_grd_validation: noFailingGrades,
                              isEdited: true,
                            };
                          })
                        );

                        toast.success(
                          "Extracted grades successfully applied to Renewal table."
                        );
                      }}
                    />
                  )}
                  <button
                    onClick={handleShowSaveConfirmation}
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
                </>
              )}
            </div>
          </div>

          {/* Modern Controls Section */}
          <div className="">
            <RenewalFilterControls
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearch={handleSearch}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              selectedBranchFilter={selectedBranchFilter}
              setSelectedBranchFilter={setSelectedBranchFilter}
              selectedYearLevelFilter={selectedYearLevelFilter}
              setSelectedYearLevelFilter={setSelectedYearLevelFilter}
              sySemester={sySemester}
              setSySemester={setSySemester}
              sySemesterOptions={sySemesterOptions}
              role_id={role_id}
              auth={auth}
              uniqueBranches={uniqueBranches}
              uniqueYearLevels={uniqueYearLevels}
              countPassed={countPassed}
              countDelisted={countDelisted}
              countNotStarted={countNotStarted}
              renewalDataLength={renewalData.length}
              onClearFilters={() => {
                setSelectedStatus("All");
                setSelectedBranchFilter("All");
                setSelectedYearLevelFilter("All");
                setSearchQuery("");
              }}
              onShowAuditLog={() => setShowAuditLog(true)}
            />
          </div>
        </div>

        {/* Modern Data Table Container */}
        <RenewalTable
          isEdit={isEdit}
          role_id={role_id}
          isLoading={isLoading}
          renewalData={renewalData}
          tempRenewalData={tempRenewalData}
          page={page}
          totalPage={totalPage}
          itemsPerPage={itemsPerPage}
          availableKeys={availableKeys}
          editableFields={editableFields}
          initialRenewalInfo={initialRenewalInfo}
          tableContainerRef={tableContainerRef}
          handleRowClick={handleRowClick}
          handlePageChange={handlePageChange}
          handleGPAChange={handleGPAChange}
          handleValidationChange={handleValidationChange}
          handleIsValidatedChange={handleIsValidatedChange}
          handleCheckModal={handleCheckModal}
          setTempRenewalData={setTempRenewalData}
          statusBadge={statusBadge}
          setSelectedGrades={setSelectedGrades}
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
      <ConfirmationDialog
        isOpen={isValidateConfirmOpen}
        message={validateConfirmMessage}
        onConfirm={handleConfirmValidationChange}
        onCancel={() => setIsValidateConfirmOpen(false)}
        confirmText="Confirm"
        cancelText="Cancel"
      />
      <ConfirmationDialog
        isOpen={isCheckConfirmOpen}
        message={checkConfirmMessage}
        onConfirm={handleConfirmCheckAction}
        onCancel={() => setIsCheckConfirmOpen(false)}
        confirmText="Yes, Continue"
        cancelText="Cancel"
      />
      <GradeModal
        selectedGrades={selectedGrades}
        onClose={() => setSelectedGrades(null)}
      />
      <ProcessingModal
        isOpen={isSaving}
        status={uploadStatus || "Saving changes..."}
        progress={uploadProgress}
      />
      {showAuditLog && <AuditLog onClose={() => setShowAuditLog(false)} />}

      {/* Save Confirmation Modal */}
      {showSaveConfirmation &&
        (() => {
          const editedRows = tempRenewalData.filter((row) => row.isEdited);
          const unvalidatedEditedRows = editedRows.filter(
            (row) => row.is_validated === false
          );
          const hasUnvalidated = unvalidatedEditedRows.length > 0;

          return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-scaleIn">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-12 h-12 ${
                      hasUnvalidated ? "bg-amber-100" : "bg-green-100"
                    } rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    <AlertCircle
                      className={`w-6 h-6 ${
                        hasUnvalidated ? "text-amber-600" : "text-green-600"
                      }`}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Save Changes
                  </h3>
                </div>

                <div className="mb-6 space-y-2">
                  {hasUnvalidated ? (
                    <>
                      <p className="text-gray-600 text-sm">
                        Some records you edited are not yet validated. All
                        changes will be saved, but only validated records will
                        be sent to HR.
                      </p>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Records Modified:
                          </span>
                          <span className="text-gray-900 font-semibold">
                            {editedRows.length} student(s)
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Unvalidated Records:
                          </span>
                          <span className="text-amber-700 font-semibold">
                            {unvalidatedEditedRows.length} student(s)
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 text-sm">
                        You are about to save changes to student records.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Records Modified:
                          </span>
                          <span className="text-gray-900 font-semibold">
                            {editedRows.length} student(s)
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  <p className="text-gray-600 text-sm mt-3">
                    Do you want to {hasUnvalidated ? "continue" : "proceed"}?
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowSaveConfirmation(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      submitSaveChanges(tempRenewalData);
                      setShowSaveConfirmation(false);
                    }}
                    className={`px-4 py-2 ${
                      hasUnvalidated
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                        : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    } text-white rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl`}
                  >
                    {hasUnvalidated ? "Proceed Anyway" : "Yes, Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </>
  );
}

export default RenewalListV2;
