import React, { useCallback, useEffect, useState } from "react";
import { requiredApprovers } from "../data/requiredApprover";
import { WorkflowFormData } from "../../Interface/IWorkflow";
import distributeDueDates from "../../utils/DistributeDueDate";
import axios, { AxiosError } from "axios";

interface ApproverValidationStatus {
  valid: boolean;
  errors: {
    roleErrors: Record<number, string>;
    hasInvalidEmail: boolean;
    hasDuplicate: boolean;
  };
}

interface AddApproverProps {
  formData: WorkflowFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>;
  onValidateApprovers?: (status: ApproverValidationStatus) => void;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

function AddApprover({
  formData,
  setFormData,
  onValidateApprovers,
}: AddApproverProps) {
  const reqApprover = requiredApprovers[formData.req_type_id];

  const [approverEmails, setApproverEmails] = useState<string[]>(() => {
    if (formData.approvers.length > 0) {
      return formData.approvers.map((a) => a.email);
    }
    return reqApprover?.requiredApprovers.map(() => "") || [];
  });
  const [suggestedApprover, setSuggestedApprover] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [roleErrors, setRoleErrors] = useState<Record<number, string>>({});

  const handleEmailChange = (index: number, email: string) => {
    const newEmails = [...approverEmails];
    newEmails[index] = email;
    setApproverEmails(newEmails);
  };

  const isApproverFilled = useCallback((): boolean => {
    const trimmedEmails = approverEmails.map((email) => email.trim());
    const allValid = trimmedEmails.every(
      (email) => email !== "" && isValidEmail(email)
    );
    const noDuplicates = new Set(trimmedEmails).size === trimmedEmails.length;
    return allValid && noDuplicates;
  }, [approverEmails]);

  const formatApproversForBackend = useCallback(() => {
    if (!isApproverFilled()) {
      console.log("Not all approvers filled with valid emails");
      return [];
    }

    const approversWithIds = approverEmails.map((email, index) => ({
      id: index + 1,
      email: email.trim(),
    }));
    const approversWithDueDates = distributeDueDates(
      formData.due_date,
      approversWithIds
    );
    return approversWithDueDates.map((approver, index) => ({
      email: approver.email,
      order: index + 1,
      date: formatDateToYYYYMMDD(approver.dueDateForApproval),
    }));
  }, [approverEmails, formData.due_date, isApproverFilled]);
  const formatDateToYYYYMMDD = (mmddyyyy: string): string => {
    const [month, day, year] = mmddyyyy.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const getProgressCount = (): number => {
    const trimmedEmails = approverEmails.map((email) => email.trim());
    const validUniqueEmails = trimmedEmails.filter(
      (email, index, arr) =>
        email !== "" && isValidEmail(email) && arr.indexOf(email) === index
    );
    return validUniqueEmails.length;
  };

  const fetchEmailUsingRole = async (
    role: number,
    index: number,
    searchTerm = ""
  ) => {
    try {
      const res = await axios.get<{ data: string[]; message: string }>(
        `http://localhost:5000/api/workflow/fetch-email/${role}`,
        { params: { search: searchTerm } }
      );

      if (res.data.data.length > 0) {
        setRoleErrors((prev) => ({ ...prev, [role]: "" }));
        setSuggestedApprover(res.data.data);
      }
      setActiveIndex(index);
    } catch (err) {
      const error = err as AxiosError<{ errorType?: string }>;

      if (error.response?.data?.errorType === "wrongRole") {
        setRoleErrors((prev) => ({
          ...prev,
          [role]: "Email exists but is assigned to a different role.",
        }));
      } else if (error.response?.data?.errorType === "notFound") {
        setRoleErrors((prev) => ({
          ...prev,
          [role]: "No email exists for this role.",
        }));
      }
      setSuggestedApprover([]);
    }
  };

  useEffect(() => {
    if (isApproverFilled()) {
      const backendData = formatApproversForBackend();
      console.log("Data for backend:", backendData);

      setFormData((prev) => ({ ...prev, approvers: backendData }));
    }
  }, [
    approverEmails,
    formatApproversForBackend,
    isApproverFilled,
    setFormData,
  ]);
  useEffect(() => {
    const hasRoleError = Object.values(roleErrors).some(
      (err) => err && err.trim() !== ""
    );
    const hasInvalidEmail = approverEmails.some(
      (email) => email.trim() !== "" && !isValidEmail(email)
    );
    const hasDuplicate =
      new Set(approverEmails.map((e) => e.trim())).size !==
      approverEmails.length;

    const allFilled = isApproverFilled();

    if (onValidateApprovers) {
      onValidateApprovers({
        valid: allFilled && !hasRoleError && !hasInvalidEmail && !hasDuplicate,
        errors: {
          roleErrors,
          hasInvalidEmail,
          hasDuplicate,
        },
      });
    }
  }, [approverEmails, roleErrors, isApproverFilled, onValidateApprovers]);

  console.log(suggestedApprover);

  return (
    <div>
      <div className="mb-5 font-medium text-[20px]">Add Approver/s</div>
      <div className="bg-[#EFF6FF] p-4 rounded-md flex justify-between">
        <div>
          <div className="text-[#1E4296] text-[16px] flex gap-1">
            <h2 className="font-bold">Workflow Type: </h2>
            <p>{reqApprover?.description}</p>
          </div>

          <div className="text-[14px] text-[#1E4296]">
            Progress: {getProgressCount()}/
            {reqApprover?.requiredApprovers.length} required positions assigned
          </div>
        </div>

        <div className="text-[#1E4296] text-[16px] flex gap-1">
          <h2 className="font-bold">Deadline: </h2>
          <p>{formData.due_date}</p>
        </div>
      </div>

      <div>
        <form action="">
          {reqApprover?.requiredApprovers.map((appr, index) => {
            const trimmedEmail = approverEmails[index]?.trim();
            const hasValidEmail = trimmedEmail && isValidEmail(trimmedEmail);
            const isDuplicate =
              trimmedEmail &&
              approverEmails.filter((email) => email.trim() === trimmedEmail)
                .length > 1;

            return (
              <div
                key={index}
                className={`p-3 rounded-md mt-3 space-y-4 border ${
                  hasValidEmail && !isDuplicate && !roleErrors[appr.id]
                    ? "bg-[#F0FDF4] border-[#22C55E]"
                    : "bg-[#FEF2F2] border-[#FF0000]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h2
                    className={`font-semibold ${
                      hasValidEmail && !isDuplicate && !roleErrors[appr.id]
                        ? "text-[#166534]"
                        : "text-[#991B1B]"
                    }`}
                  >
                    {appr.name} *
                  </h2>
                  <h2
                    className={`w-7 h-7 text-white rounded-[25px] justify-center flex items-center ${
                      hasValidEmail && !isDuplicate && !roleErrors[appr.id]
                        ? "bg-[#22C55E]"
                        : "bg-[#EF4444]"
                    }`}
                  >
                    {index + 1}
                  </h2>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    value={approverEmails[index]}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleEmailChange(index, value);
                      fetchEmailUsingRole(appr.id, index, value); // search while typing
                    }}
                    onFocus={() => fetchEmailUsingRole(appr.id, index)} // load all initially
                    onBlur={() => {
                      setTimeout(() => {
                        setSuggestedApprover([]);
                        setActiveIndex(null);
                      }, 200);
                    }}
                    className={`border rounded-sm text-[15px] px-2 py-1 w-full  ${
                      hasValidEmail && !isDuplicate && !roleErrors[appr.id]
                        ? "border-[#22C55E]"
                        : "border-[#C0C0C0]"
                    }`}
                    placeholder="Enter Email"
                  />

                  {/* Email Suggestion */}
                  {activeIndex === index && suggestedApprover.length > 0 && (
                    <div className="bg-white shadow-md absolute top-8 left-0 right-0 rounded-b-sm z-10">
                      {suggestedApprover.map((apr, i) => (
                        <div
                          key={i}
                          className="cursor-pointer p-2 hover:bg-[#e1e1e1]"
                          onClick={() => {
                            handleEmailChange(index, apr);
                            setSuggestedApprover([]);
                            setActiveIndex(null);
                          }}
                        >
                          {apr}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {roleErrors[appr.id] && (
                  <p className="text-[#991B1B] text-[12px] mt-1">
                    {roleErrors[appr.id]}
                  </p>
                )}
                {trimmedEmail && !isValidEmail(trimmedEmail) && (
                  <p className="text-[#991B1B] text-[12px]">
                    Please enter a valid email address
                  </p>
                )}

                {isDuplicate && (
                  <p className="text-[#991B1B] text-[12px]">
                    This email is already assigned to another approver.
                  </p>
                )}
              </div>
            );
          })}
        </form>
      </div>
    </div>
  );
}

export default AddApprover;
