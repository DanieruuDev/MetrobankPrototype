import React from "react";
import { Eye } from "lucide-react";
import { toast } from "react-toastify";
import CheckAllDropdown from "./CheckAll";
import Loading from "../shared/Loading";
import PaginationControl from "../shared/PaginationControl";
import {
  type RenewalDetails,
  type RenewalDetailsClone,
  renewalTableHead,
  validation,
  InitialRenewalInfo,
} from "../../Interface/IRenewal";

interface RenewalTableProps {
  isEdit: boolean;
  role_id: number | undefined;
  isLoading: boolean;
  renewalData: RenewalDetailsClone[];
  tempRenewalData: RenewalDetailsClone[];
  page: number;
  totalPage: number;
  itemsPerPage: number;
  availableKeys: string[];
  editableFields: string[];
  initialRenewalInfo: InitialRenewalInfo | null;
  tableContainerRef: React.RefObject<HTMLDivElement | null>;
  handleRowClick: (student_id: number, renewal_id: number) => void;
  handlePageChange: (page: number) => void;
  handleGPAChange: (renewalId: number, newGPA: number | null) => void;
  handleValidationChange: (
    renewalId: number,
    field: keyof RenewalDetails,
    newValue: "Not Started" | "Passed" | "Failed" | boolean
  ) => void;
  handleIsValidatedChange: (
    renewal: RenewalDetailsClone,
    currentValue: boolean | null
  ) => void;
  handleCheckModal: (type: string) => void;
  setTempRenewalData: React.Dispatch<
    React.SetStateAction<RenewalDetailsClone[]>
  >;
  statusBadge: (status: string) => React.ReactNode;
  setSelectedGrades: React.Dispatch<
    React.SetStateAction<{
      name: string;
      gradeList: { course_code: string; final_grade: number }[];
      fileURL?: string;
    } | null>
  >;
}

const RenewalTable: React.FC<RenewalTableProps> = ({
  isEdit,
  role_id,
  isLoading,
  renewalData,
  tempRenewalData,
  page,
  totalPage,
  itemsPerPage,
  availableKeys,
  editableFields,
  initialRenewalInfo,
  tableContainerRef,
  handleRowClick,
  handlePageChange,
  handleGPAChange,
  handleValidationChange,
  handleIsValidatedChange,
  handleCheckModal,
  setTempRenewalData,
  statusBadge,
  setSelectedGrades,
}) => {
  return (
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
                      <th className="border border-gray-300" key="blank"></th>
                    )}

                    {Object.entries(renewalTableHead)
                      .filter(([key]) => availableKeys.includes(key))
                      .map(([key, label]) => (
                        <>
                          {key !== "is_validated" &&
                          key !== "is_hr_validated" &&
                          key !== "hr_completed_at" ? (
                            <th
                              key={key}
                              className={`px-2 sm:px-3 lg:px-5 py-2 sm:py-3 text-center border border-gray-300
                   ${
                     isEdit &&
                     editableFields.includes(key) &&
                     key !== "gpa" &&
                     key !== "no_failing_grd_validation"
                       ? "bg-blue-50 text-blue-700 font-semibold"
                       : ""
                   }
                   ${
                     key === "scholar_name" &&
                     "sticky left-[-1px] bg-gray-100 z-30 shadow-md max-w-[150px] sm:max-w-[200px] min-w-[150px] sm:min-w-[200px]"
                   }
                   ${
                     key === "scholarship_status" &&
                     "sticky left-[149px] sm:left-[198px] bg-gray-100 z-30 shadow-md"
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
                          ) : key === "is_validated" ? (
                            <th
                              className={`px-5 py-3 min-w-[200px] relative z-10 ${
                                isEdit
                                  ? "bg-blue-50 text-blue-700 font-semibold"
                                  : ""
                              }`}
                              key={key}
                            >
                              {isEdit ? (
                                <CheckAllDropdown
                                  label={label.toUpperCase()}
                                  handleCheck={handleCheckModal}
                                  isEditMode={true}
                                />
                              ) : (
                                <span className="flex justify-center">
                                  {label.toUpperCase()}
                                </span>
                              )}
                            </th>
                          ) : (
                            ""
                          )}
                        </>
                      ))}

                    {Number(role_id) === 3 || Number(role_id) === 9 ? (
                      <>
                        <th className="px-3 py-2 text-center border border-gray-300 font-semibold">
                          HR VALIDATED
                        </th>
                        <th className="px-3 py-2 text-center border border-gray-300 font-semibold">
                          HR COMPLETED
                        </th>
                      </>
                    ) : null}
                  </tr>
                </thead>

                <tbody className="bg-white/50 divide-y divide-slate-200 text-[12px] sm:text-[14px]">
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
                            .filter(
                              (key) =>
                                availableKeys.includes(key) &&
                                key !== "is_hr_validated" &&
                                key !== "hr_completed_at"
                            )
                            .map((key) => {
                              const value =
                                renewal[key as keyof RenewalDetails];
                              const isValidationField = Object.keys(validation)
                                .filter(
                                  (k) =>
                                    k !== "scholarship_status" &&
                                    k !== "gpa_validation_stat" &&
                                    k !== "no_failing_grd_validation" &&
                                    k !== "is_validated"
                                )
                                .includes(key);
                              const isTextField =
                                key === "delisting_root_cause";
                              const isValidatedField = key === "is_validated";
                              const isNoFailingGradesField =
                                key === "no_failing_grd_validation";

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
                                  {/* Editable fields (buttons, input, textareas, etc.) */}
                                  {isNoFailingGradesField ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        let parsedGrades = renewal.grades;
                                        if (typeof parsedGrades === "string") {
                                          try {
                                            parsedGrades =
                                              JSON.parse(parsedGrades);
                                          } catch {
                                            parsedGrades = null;
                                          }
                                        }

                                        const gradeList =
                                          parsedGrades?.gradeList || [];
                                        const fileURL = parsedGrades?.fileURL;

                                        if (
                                          Array.isArray(gradeList) &&
                                          gradeList.length > 0
                                        ) {
                                          setSelectedGrades({
                                            name: renewal.scholar_name,
                                            gradeList,
                                            fileURL,
                                          });
                                        } else {
                                          toast.info(
                                            "No uploaded grades found for this scholar."
                                          );
                                        }
                                      }}
                                      className={`
      w-full h-full flex items-center justify-center gap-2 px-3 py-2 
      font-semibold select-none rounded-md transition-all duration-200
      shadow-sm hover:shadow-md border border-transparent
      hover:ring-2 hover:ring-blue-300 hover:border-blue-200
      ${
        renewal.no_failing_grd_validation === "Passed"
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : renewal.no_failing_grd_validation === "Failed"
          ? "bg-red-50 text-red-700 hover:bg-red-100"
          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
      }
      cursor-pointer
    `}
                                      title="Click to view uploaded grades"
                                    >
                                      {/* Left Label */}
                                      <span className="flex items-center gap-1">
                                        {renewal.no_failing_grd_validation ||
                                          "Not Started"}
                                      </span>

                                      {/* 👁️ Eye icon to imply clickability */}
                                      <Eye className="w-4 h-4 text-blue-500 opacity-80 group-hover:opacity-100" />

                                      {/* 🟡 Badge if incomplete */}
                                      {(() => {
                                        let parsedGrades = renewal.grades;
                                        if (typeof parsedGrades === "string") {
                                          try {
                                            parsedGrades =
                                              JSON.parse(parsedGrades);
                                          } catch {
                                            parsedGrades = null;
                                          }
                                        }

                                        const gradeList =
                                          parsedGrades?.gradeList || [];
                                        const isIncomplete =
                                          gradeList.length > 0 &&
                                          gradeList.length < 7;

                                        return (
                                          <>
                                            {gradeList.length === 0 ? (
                                              <span
                                                className="ml-2 bg-red-100 text-red-600 text-[10px] font-medium px-2 py-[2px] rounded-full"
                                                title="No grades uploaded"
                                              >
                                                Missing
                                              </span>
                                            ) : isIncomplete ? (
                                              <span
                                                className="ml-2 bg-yellow-100 text-yellow-700 text-[10px] font-medium px-2 py-[2px] rounded-full"
                                                title={`Only ${gradeList.length} grades uploaded`}
                                              >
                                                {gradeList.length} / 7
                                              </span>
                                            ) : (
                                              <span
                                                className="ml-2 bg-green-100 text-green-700 text-[10px] font-medium px-2 py-[2px] rounded-full"
                                                title={`${gradeList.length} grades uploaded`}
                                              >
                                                {gradeList.length}
                                              </span>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </button>
                                  ) : isEdit && isValidatedField ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (renewal.is_hr_validated === true) {
                                          toast.warning(
                                            "This record cannot be changed because HR has already validated it."
                                          );
                                          return;
                                        }
                                        handleIsValidatedChange(
                                          renewal,
                                          value as boolean | null
                                        );
                                      }}
                                      className={`w-full h-full flex items-center justify-center font-semibold select-none cursor-pointer hover:ring-1 hover:ring-gray-300 rounded border 
                                            ${
                                              renewal.is_hr_validated
                                                ? "cursor-not-allowed opacity-50 bg-gray-100"
                                                : "cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                                            } ${
                                        value === true
                                          ? "text-green-600 bg-green-100 text-2xl"
                                          : value === false
                                          ? "text-red-600 bg-red-100 text-2xl"
                                          : "text-gray-400 text-xs"
                                      }`}
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
                                  ) : isEdit &&
                                    isTextField &&
                                    renewal.scholarship_status ===
                                      "Delisted" ? (
                                    <textarea
                                      value={value as string}
                                      disabled={renewal.is_validated === true}
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
                                      className="border border-gray-300 px-1 sm:px-2 py-1 rounded-sm w-full resize-none text-xs sm:text-sm"
                                    />
                                  ) : isEdit && isValidationField ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (renewal.is_validated === true) {
                                          toast.warning(
                                            "This record is already validated and cannot be edited."
                                          );
                                          return;
                                        }
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
                                      className={`w-full h-full flex items-center justify-center font-semibold select-none rounded
                          ${
                            renewal.is_validated
                              ? "cursor-not-allowed opacity-50 bg-gray-100"
                              : "cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                          }
                          ${
                            ((value as string) || "Not Started").trim() ===
                            "Passed"
                              ? "text-green-600 bg-green-100 text-2xl"
                              : ((value as string) || "Not Started").trim() ===
                                "Failed"
                              ? "text-red-600 bg-red-100 text-lg"
                              : "text-gray-400 text-xs py-2 bg-gray-50"
                          }`}
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

                          {/* ✅ HR Validation Data */}
                          {(role_id === 3 || role_id === 9) && (
                            <>
                              <td
                                className={`px-3 py-2 text-center border border-gray-300 font-semibold ${
                                  renewal.is_hr_validated
                                    ? "text-green-600 "
                                    : "text-red-600 "
                                }`}
                              >
                                {renewal.is_hr_validated ? "✓" : "X"}
                              </td>

                              <td className="px-3 py-2 text-center border border-gray-300 text-xs text-gray-600">
                                {renewal.hr_completed_at
                                  ? new Date(
                                      renewal.hr_completed_at
                                    ).toLocaleString("en-PH", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </td>
                            </>
                          )}
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
                        <p className="font-medium">{renewal.gpa || "N/A"}</p>
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
  );
};

export default RenewalTable;
