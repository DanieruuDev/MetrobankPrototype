import axios from "axios";
import { useEffect, useState } from "react";
import { SpecificRenewalDetail } from "../Renewal";
import { ArrowLeft } from "lucide-react";
import { ScholarRenewalResponse } from "../../../../Interface/IRenewal";

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
  { key: "no_police_record_validation", label: "No Police Record Status" },
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

  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    [key: string]: string;
  }>({});

  const getRenewal = async (student_id: number, renewal_id: number) => {
    console.log("Fetching data for:", student_id, renewal_id);
    try {
      const response = await axios.get<ScholarRenewalResponse>(
        `http://localhost:5000/api/renewal/get-renewal/${student_id}/${renewal_id}`
      );
      setRenewalDetails(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student_id && renewal_id) {
      getRenewal(Number(student_id), Number(renewal_id));
    }
  }, [student_id, renewal_id]);

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
        no_police_record_validation:
          renewalDetails.no_police_record_validation || "Not Started",
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
    // Create a new object with updated validation statuses

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
      no_police_record_validation:
        selectedStatus["no_police_record_validation"] ||
        renewalDetails.no_police_record_validation,
      withdrawal_change_course_validation:
        selectedStatus["withdrawal_change_course_validation"] ||
        renewalDetails.withdrawal_change_course_validation,
      validation_scholarship_status: updatedValidationStatus,
    };

    console.log("Updated:", renewalDetails);
    try {
      const response = await axios.put(
        "http://localhost:5000/api/renewal/update-renewal",
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

  if (loading) return <p>Loading...</p>;
  if (!renewalDetails) return <p>No data found.</p>;

  console.log(selectedStatus, renewalDetails);
  return (
    <div className="mt-[15px]">
      {student_id === null || renewal_id === null ? (
        "None"
      ) : (
        <div className="mt-[10px] mx-[20px] ">
          <div className="flex gap-6 text-[#565656] px-2 items-center">
            <button
              onClick={() => setDetailedRenewal(null)}
              className="hover:text-[#145BE9] transition-colors duration-300 ease-in-out cursor-pointer"
            >
              <ArrowLeft className="w-7 h-7 transition-transform duration-300 hover:-translate-x-1" />
            </button>
            <div className="flex flex-col border-r-2 border-[#b9b9b9] pr-4 gap-2">
              <div className="text-[#565656] tex-[20px] font-medium">
                {renewalDetails.scholar_name}
              </div>
              <div className="text-[14px] font-medium">
                {renewalDetails.student_id}
              </div>
            </div>

            <div
              className={`px-3 py-1  text-white text-[10px] rounded-[20px] stretch font-bold ${
                renewalDetails.scholarship_status === "Active"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            >
              {renewalDetails.scholarship_status}
            </div>

            <div className="flex flex-col min-w-[170px] gap-2">
              <span className="text-[14px] text-[#909497] font-medium">
                Program/ Year Level
              </span>
              <div className="text-[14px] font-bold space-x-6">
                <span>{renewalDetails.course}</span>
                <span>{renewalDetails.yr_lvl}</span>
              </div>
            </div>
            <div className="flex flex-col  min-w-[130px] gap-2">
              <span className="text-[14px] text-[#909497] font-medium">
                Campus
              </span>
              <span className="text-[14px] font-bold">
                {renewalDetails.campus}
              </span>
            </div>
            <div className="flex flex-col min-w-[130px] gap-2">
              <span className="text-[14px] text-[#909497] font-medium">
                Semester
              </span>
              <span className="text-[14px] font-bold">
                {renewalDetails.semester}
              </span>
            </div>
            <div className="flex flex-col min-w-[130px] gap-2">
              <span className="text-[14px] text-[#909497] font-medium">
                School Year
              </span>
              <span className="text-[14px] font-bold">
                {renewalDetails.school_year}
              </span>
            </div>
            <div className="flex flex-col min-w-[130px] gap-2">
              <span className="text-[14px] text-[#909497] font-medium">
                Batch
              </span>
              <span className="text-[14px] font-bold min-w-[150px]">
                {renewalDetails.batch}
              </span>
            </div>
          </div>

          <div className="mt-[40px]">
            <h2 className="text-[#145BE9] font-medium text-[18px] text-medium mb-2">
              Validation Status
            </h2>

            <div className="bg-[#F4F4F4] p-5 rounded-sm">
              <form action="" onSubmit={submitHandler}>
                <div className="flex justify-between  text-[16px] text-[#565656]">
                  <div>
                    <span className="text-[14px]">GPA: </span>
                    <input
                      type="number"
                      className="outline-none border border-x-0 border-t-0 border-b-blue-500 focus:ring-0 focus:border-b-blue-500 p-2 max-w-[80px]"
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
                      className={`px-3 py-1 text-white text-[10px] rounded-[20px] ml-2 font-bold ${
                        computedGpaStatus === "Passed"
                          ? "bg-green-500"
                          : computedGpaStatus === "Failed"
                          ? "bg-red-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {computedGpaStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-[16px]">Scholarship Status: </span>
                    <span
                      className={`border border-b-[#b8b8b8] border-x-0 border-t-0 p-2 font-bold text-[15px] ${
                        updatedValidationStatus === "Passed"
                          ? "text-green-500"
                          : updatedValidationStatus === "Delisted"
                          ? "text-red-500"
                          : ""
                      }`}
                    >
                      {updatedValidationStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4  mt-7 gap-6">
                  {statuses.map((status, index) =>
                    status.label !== "GPA" &&
                    status.label !== "GPA Validation Status" ? (
                      <div key={index} className="space-y-3">
                        <div
                          className={`text-[14px] ${
                            selectedStatus[status.key] === "Passed"
                              ? "text-green-500"
                              : selectedStatus[status.key] === "Failed"
                              ? "text-red-500"
                              : "text-[#565656]"
                          }`}
                        >
                          {status.label}
                        </div>
                        <select
                          value={selectedStatus[status.key] || "Not Started"}
                          onChange={(e) =>
                            setSelectedStatus((prev) => ({
                              ...prev,
                              [status.key]: e.target.value,
                            }))
                          }
                          className={`outline-none border border-[#b8b8b8] focus:ring-0 px-4 py-2 rounded-md max-w-[250px] w-full transition-all duration-200 cursor-pointer 
  bg-transparent hover:bg-gray-100 text-[14px]
  ${
    selectedStatus[status.key] === "Passed"
      ? "border-green-500"
      : selectedStatus[status.key] === "Failed"
      ? "border-red-500"
      : "border-gray-500"
  }
`}
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
                <div className="flex justify-end mt-4">
                  <button
                    disabled={
                      isSubmitting ||
                      isAllNotStarted() ||
                      !hasAnyStatusChanged()
                    }
                    className={`${
                      isSubmitting ||
                      isAllNotStarted() ||
                      !hasAnyStatusChanged()
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    } bg-[#3B89FD] hover:bg-blue-600 transition-all duration-200 text-white text-[14px] font-medium px-4 py-2 rounded-sm `}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <h2 className="text-[#145BE9] font-medium text-[18px] text-medium mt-5">
            Validation History
          </h2>

          <div>
            <div className="bg-[#EFEFEF] text-[#565656] text-[14px] grid grid-cols-7 px-4 py-2 rounded-sm mt-2">
              <div>Renewal Date</div>
              <div>Year Level</div>
              <div>Semester</div>
              <div>School Year</div>
              <div>Status</div>
              <div>Validator</div>
              <div>Delisted Reason</div>
            </div>
            <div className="mb-5">
              {renewalDetails.renewal_history.length > 0 ? (
                renewalDetails.renewal_history.map((history, index) => (
                  <div
                    className="grid grid-cols-7 px-4 py-5 text-[14px] border border-b-1 border-[#D9D9D9] border-x-0 border-t-0 text-[#565656]"
                    key={index}
                  >
                    <div>{history.renewal_date_history}</div>
                    <div>{history.renewal_year_level}</div>
                    <div>{history.renewal_semester}</div>
                    <div>{history.renewal_school_year}</div>
                    <div>{history.renewal_status}</div>
                    <div>ID</div>
                    <div>{history.delisting_root_cause}</div>
                  </div>
                ))
              ) : (
                <p className="text-[15px] text-center text-[#9e9e9e] mt-4">
                  No Renewal History
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecificRenewal;
