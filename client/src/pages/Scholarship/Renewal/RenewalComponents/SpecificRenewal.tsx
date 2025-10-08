import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { SpecificRenewalDetail } from "../Renewal";
import { ArrowLeft } from "lucide-react";
import { ScholarRenewalResponse } from "../../../../Interface/IRenewal";
import Loading from "../../../../components/shared/Loading";
interface SpecificRenewalProps {
  student_id: number;
  renewal_id: number;
  setDetailedRenewal: React.Dispatch<
    React.SetStateAction<SpecificRenewalDetail | null>
  >;
}
const statuses = [
  { key: "gpa", label: "GPA" },
  { key: "gpa_validation_stat", label: "GPA Validation Status" },
  { key: "no_failing_grd_validation", label: "No Failing Grade Status" },
  { key: "goodmoral_validation", label: "Good Moral Status" },
  { key: "full_load_validation", label: "Full Load Status" },
  { key: "enrollment_validation", label: "Enrollment Validation Status" },
  { key: "no_other_scholar_validation", label: "No Other Scholarship Status" },
  {
    key: "no_criminal_charges_validation",
    label: "No Criminal Charges Status",
  },
  {
    key: "withdrawal_change_course_validation",
    label: "Withdrawal/Change of Course",
  },
];

function SpecificRenewal({
  student_id,
  renewal_id,
  setDetailedRenewal,
}: SpecificRenewalProps) {
  const [renewalDetails, setRenewalDetails] =
    useState<ScholarRenewalResponse | null>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    [key: string]: string;
  }>({});

  const getRenewal = useCallback(
    async (student_id: number, renewal_id: number) => {
      try {
        const response = await axios.get<ScholarRenewalResponse>(
          `${VITE_BACKEND_URL}api/renewal/get-renewal/${student_id}/${renewal_id}`
        );
        setRenewalDetails(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    },
    [VITE_BACKEND_URL]
  );

  useEffect(() => {
    if (student_id && renewal_id) {
      getRenewal(Number(student_id), Number(renewal_id));
    }
  }, [student_id, renewal_id, getRenewal]);

  useEffect(() => {
    if (renewalDetails) {
      setSelectedStatus({
        gpa: String(renewalDetails.gpa ?? "0.0"),
        gpa_validation_stat:
          renewalDetails.gpa_validation_stat || "Not Started",
        no_failing_grd_validation:
          renewalDetails.no_failing_grd_validation || "Not Started",
        goodmoral_validation:
          renewalDetails.goodmoral_validation || "Not Started",
        full_load_validation:
          renewalDetails.full_load_validation || "Not Started",
        enrollment_validation:
          renewalDetails.enrollment_validation || "Not Started",
        no_other_scholar_validation:
          renewalDetails.no_other_scholar_validation || "Not Started",
        no_criminal_charges_validation:
          renewalDetails.no_criminal_charges_validation || "Not Started",
        withdrawal_change_course_validation:
          renewalDetails.withdrawal_change_course_validation || "Not Started",
      });
    }
  }, [renewalDetails]);

  const updatedValidationStatus = statuses
    .filter((status) => status.label !== "GPA")
    .every((status) => selectedStatus[status.key] === "Passed")
    ? "Passed"
    : statuses.some((status) => selectedStatus[status.key] === "Failed")
    ? "Delisted"
    : "Not Started";

  const gpaValue = parseFloat(selectedStatus["gpa"] ?? "0.0");
  const computedGpaStatus =
    gpaValue >= 1.0 && gpaValue <= 2.0
      ? "Passed"
      : gpaValue > 2.0
      ? "Failed"
      : "Not Started";
  const isAllNotStarted = () => {
    return statuses
      .filter((status) => status.label !== "GPA")
      .some((status) => selectedStatus[status.key] === "Not Started");
  };
  const hasAnyStatusChanged = () => {
    if (!renewalDetails) return false;

    return Object.keys(selectedStatus).some((key) => {
      if (key === "gpa") return false;

      const typedKey = key as keyof ScholarRenewalResponse;
      return selectedStatus[typedKey] !== renewalDetails[typedKey];
    });
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!renewalDetails) {
      console.error("No renewal details found.");
      return;
    }
    setIsSubmitting(true);

    const updatedRenewalDetails = {
      ...renewalDetails,
      gpa: parseFloat(selectedStatus["gpa"]) || renewalDetails.gpa,
      gpa_validation_stat:
        computedGpaStatus || renewalDetails.gpa_validation_stat,
      no_failing_grd_validation:
        selectedStatus["no_failing_grd_validation"] ||
        renewalDetails.no_failing_grd_validation,
      goodmoral_validation:
        selectedStatus["goodmoral_validation"] ||
        renewalDetails.goodmoral_validation,
      full_load_validation:
        selectedStatus["full_load_validation"] ||
        renewalDetails.full_load_validation,
      enrollment_validation:
        selectedStatus["enrollment_validation"] ||
        renewalDetails.enrollment_validation,
      no_other_scholar_validation:
        selectedStatus["no_other_scholar_validation"] ||
        renewalDetails.no_other_scholar_validation,
      no_criminal_charges_validation:
        selectedStatus["no_criminal_charges_validation"] ||
        renewalDetails.no_criminal_charges_validation,
      withdrawal_change_course_validation:
        selectedStatus["withdrawal_change_course_validation"] ||
        renewalDetails.withdrawal_change_course_validation,
      validation_scholarship_status: updatedValidationStatus,
    };

    try {
      const response = await axios.put(
        `${VITE_BACKEND_URL}api/renewal/update-renewal`,
        updatedRenewalDetails
      );

      if (!response) {
        throw new Error("Failed to update renewal details.");
      }

      console.log("Updated:", response.data);
      setRenewalDetails((prev) => ({
        ...prev,
        ...updatedRenewalDetails,
      }));
      console.log("Updated:", updatedRenewalDetails);

      alert("Renewal statuses updated successfully!");
      getRenewal(student_id, renewal_id);
    } catch (error) {
      console.error("Error updating renewal details:", error);
      alert("Failed to update renewal details.");
      console.log(updatedRenewalDetails);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!renewalDetails) return <p>No data found.</p>;
  return (
    <div className=" sm:p-4">
      {student_id === null || renewal_id === null ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm p-8 text-center">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-slate-600 text-sm">No student selected</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Modern Header Section */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-2xl p-4 sm:p-6 border border-slate-200">
            {/* Modern Header with Glass-morphism */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailedRenewal(null)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 self-start border-none shadow-sm hover:shadow-md"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                  <span className="text-sm font-medium">Back</span>
                </button>
              </div>
            </div>

            <div className="ml-auto flex items-center justify-between mb-4 px-2">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                  {renewalDetails.scholar_name}
                </h1>
                <p className="text-sm text-slate-600">
                  Student ID: {renewalDetails.student_id}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                  renewalDetails.scholarship_status === "Active"
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {renewalDetails.scholarship_status}
              </span>
            </div>

            {/* Modern Student Details Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Program
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {renewalDetails.course}
                </p>
                <p className="text-xs text-slate-500">
                  {renewalDetails.yr_lvl}
                </p>
              </div>

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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Campus
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {renewalDetails.campus}
                </p>
              </div>

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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Semester
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {renewalDetails.semester}
                </p>
              </div>

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
                    School Year
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {renewalDetails.school_year}
                </p>
              </div>

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
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Batch
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {renewalDetails.batch}
                </p>
              </div>
            </div>
          </div>

          {/* Modern Validation Status Section */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-2xl p-4 sm:p-6 border border-slate-200">
            {/* Modern Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Validation Status
                </h2>
                <p className="text-sm text-slate-600">
                  Manage scholarship renewal validation criteria
                </p>
              </div>
            </div>

            <form onSubmit={submitHandler}>
              {/* Modern GPA and Scholarship Status Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">
                <div>
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
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      GPA
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="number"
                      className="border border-gray-300 rounded-lg px-3 py-2 w-20 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                      placeholder="0.0"
                      value={selectedStatus["gpa"] || ""}
                      min="0"
                      max="5"
                      step="0.01"
                      onChange={(e) => {
                        let inputValue = e.target.value;
                        if (inputValue.includes(".")) {
                          const [integerPart, decimalPart] =
                            inputValue.split(".");
                          if (decimalPart?.length > 2) {
                            inputValue = `${integerPart}.${decimalPart.slice(
                              0,
                              2
                            )}`;
                          }
                        }

                        const gpaValue = parseFloat(inputValue);
                        if (
                          !isNaN(gpaValue) &&
                          gpaValue >= 0 &&
                          gpaValue <= 5
                        ) {
                          const newGpaStatus =
                            gpaValue >= 1.0 && gpaValue <= 2.25
                              ? "Passed"
                              : gpaValue > 2.25
                              ? "Failed"
                              : "Not Started";

                          setSelectedStatus((prev) => ({
                            ...prev,
                            gpa: inputValue,
                            gpa_validation_stat: newGpaStatus,
                          }));
                        } else if (inputValue === "") {
                          setSelectedStatus((prev) => ({
                            ...prev,
                            gpa: "",
                            gpa_validation_stat: "Not Started",
                          }));
                        }
                      }}
                    />
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                        computedGpaStatus === "Passed"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : computedGpaStatus === "Failed"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      {computedGpaStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      Scholarship Status
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                      updatedValidationStatus === "Passed"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : updatedValidationStatus === "Delisted"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    {updatedValidationStatus}
                  </span>
                </div>
              </div>

              {/* Modern Validation Criteria Section */}
              <div className=" mb-6">
                <div className="flex items-center gap-3 mb-4">
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
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Validation Criteria
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {statuses.map((status, index) =>
                    status.label !== "GPA" &&
                    status.label !== "GPA Validation Status" ? (
                      <div key={index} className="">
                        <label className="block text-xs font-medium text-slate-700 mb-2">
                          {status.label}
                        </label>
                        <select
                          value={selectedStatus[status.key] || "Not Started"}
                          onChange={(e) =>
                            setSelectedStatus((prev) => ({
                              ...prev,
                              [status.key]: e.target.value,
                            }))
                          }
                          className={`w-full border shadow-sm border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 ${
                            selectedStatus[status.key] === "Passed"
                              ? "border-green-500 bg-green-50"
                              : selectedStatus[status.key] === "Failed"
                              ? "border-red-500 bg-red-50"
                              : ""
                          }`}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    ) : (
                      ""
                    )
                  )}
                </div>
              </div>

              {/* Modern Save Button */}
              <div className="flex justify-end">
                <button
                  disabled={
                    isSubmitting || isAllNotStarted() || !hasAnyStatusChanged()
                  }
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isSubmitting || isAllNotStarted() || !hasAnyStatusChanged()
                      ? "opacity-50 cursor-not-allowed bg-gray-300 text-gray-500"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

          {/* Modern Validation History Section */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg rounded-2xl p-4 sm:p-6 border border-slate-200">
            {/* Modern Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Validation History
                </h2>
                <p className="text-sm text-slate-600">
                  Track previous renewal attempts and outcomes
                </p>
              </div>
            </div>

            {renewalDetails.renewal_history.length > 0 ? (
              <div className="space-y-4">
                {renewalDetails.renewal_history.map((history, index) => (
                  <div
                    key={index}
                    className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
                      <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-white/50">
                        <div className="text-slate-500 font-medium text-xs mb-1">
                          Date
                        </div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {history.renewal_date_history}
                        </div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-white/50">
                        <div className="text-slate-500 font-medium text-xs mb-1">
                          Status
                        </div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {history.renewal_status}
                        </div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-white/50">
                        <div className="text-slate-500 font-medium text-xs mb-1">
                          Year Level
                        </div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {history.renewal_year_level}
                        </div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-white/50">
                        <div className="text-slate-500 font-medium text-xs mb-1">
                          Semester
                        </div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {history.renewal_semester}
                        </div>
                      </div>
                    </div>
                    {history.delisting_root_cause && (
                      <div className="mt-4 pt-4 border-t border-white/50">
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-white/50">
                          <div className="text-slate-500 font-medium text-xs mb-2">
                            Delisted Reason
                          </div>
                          <div className="text-xs text-slate-700">
                            {history.delisting_root_cause}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm p-8 text-center">
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
                  No renewal history available
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecificRenewal;
