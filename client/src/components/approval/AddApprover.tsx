import React, { useCallback, useEffect, useState } from "react";
import { WorkflowFormData } from "../../Interface/IWorkflow";
import distributeDueDates from "../../utils/DistributeDueDate";
import { Plus, X, GripVertical } from "lucide-react";

interface ApproverValidationStatus {
  valid: boolean;
  errors: {
    hasInvalidEmail: boolean;
    hasDuplicate: boolean;
    hasEmptyFields: boolean;
  };
}

interface AddApproverProps {
  formData: WorkflowFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>;
  onValidateApprovers?: (status: ApproverValidationStatus) => void;
  showValidation: boolean; // Only keep what's needed
}

interface ApproverInput {
  id: string;
  title: string;
  email: string;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

function AddApprover({
  formData,
  setFormData,
  onValidateApprovers,
  showValidation,
}: AddApproverProps) {
  const [approvers, setApprovers] = useState<ApproverInput[]>([
    { id: "1", title: "", email: "" },
  ]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addApprover = () => {
    const newId = (approvers.length + 1).toString();
    setApprovers([...approvers, { id: newId, title: "", email: "" }]);
  };

  const removeApprover = (id: string) => {
    if (approvers.length > 1) {
      setApprovers(approvers.filter((approver) => approver.id !== id));
    }
  };

  const updateApprover = (
    id: string,
    field: "title" | "email",
    value: string
  ) => {
    setApprovers(
      approvers.map((approver) =>
        approver.id === id ? { ...approver, [field]: value } : approver
      )
    );
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newApprovers = [...approvers];
    const draggedApprover = newApprovers[draggedIndex];

    // Remove the dragged item
    newApprovers.splice(draggedIndex, 1);

    // Insert at the new position
    newApprovers.splice(dropIndex, 0, draggedApprover);

    setApprovers(newApprovers);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isApproverFilled = useCallback((): boolean => {
    return approvers.every(
      (approver) =>
        approver.title.trim() !== "" &&
        approver.email.trim() !== "" &&
        isValidEmail(approver.email.trim())
    );
  }, [approvers]);

  const hasDuplicates = useCallback((): boolean => {
    const emails = approvers
      .map((a) => a.email.trim())
      .filter((email) => email !== "");
    return new Set(emails).size !== emails.length;
  }, [approvers]);

  const hasInvalidEmails = useCallback((): boolean => {
    return approvers.some(
      (approver) =>
        approver.email.trim() !== "" && !isValidEmail(approver.email.trim())
    );
  }, [approvers]);

  const hasEmptyFields = useCallback((): boolean => {
    return approvers.some(
      (approver) => approver.title.trim() === "" || approver.email.trim() === ""
    );
  }, [approvers]);

  const formatApproversForBackend = useCallback(() => {
    if (!isApproverFilled()) {
      console.log("Not all approvers filled with valid emails");
      return [];
    }

    const validApprovers = approvers.filter(
      (approver) =>
        approver.title.trim() !== "" &&
        approver.email.trim() !== "" &&
        isValidEmail(approver.email.trim())
    );

    const approversWithIds = validApprovers.map((approver, index) => ({
      id: index + 1,
      email: approver.email.trim(),
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
  }, [approvers, formData.due_date, isApproverFilled]);

  const formatDateToYYYYMMDD = (mmddyyyy: string): string => {
    const [month, day, year] = mmddyyyy.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const getProgressCount = (): number => {
    return approvers.filter(
      (approver) =>
        approver.title.trim() !== "" &&
        approver.email.trim() !== "" &&
        isValidEmail(approver.email.trim())
    ).length;
  };

  useEffect(() => {
    if (isApproverFilled() && !hasDuplicates()) {
      const backendData = formatApproversForBackend();
      console.log("Data for backend:", backendData);
      setFormData((prev) => ({ ...prev, approvers: backendData }));
    }
  }, [
    approvers,
    formatApproversForBackend,
    isApproverFilled,
    hasDuplicates,
    setFormData,
  ]);

  useEffect(() => {
    if (onValidateApprovers) {
      onValidateApprovers({
        valid:
          isApproverFilled() &&
          !hasDuplicates() &&
          !hasInvalidEmails() &&
          !hasEmptyFields(),
        errors: {
          hasInvalidEmail: hasInvalidEmails(),
          hasDuplicate: hasDuplicates(),
          hasEmptyFields: hasEmptyFields(),
        },
      });
    }
  }, [
    approvers,
    isApproverFilled,
    hasDuplicates,
    hasInvalidEmails,
    hasEmptyFields,
    onValidateApprovers,
  ]);

  return (
    <div>
      <div className="mb-5 font-medium text-[20px]">Add Approver/s</div>
      <div className="bg-[#EFF6FF] p-4 rounded-md flex justify-between">
        <div>
          <div className="text-[#1E4296] text-[16px] flex gap-1">
            <h2 className="font-bold">Workflow Type: </h2>
            <p>{formData.req_type_id || "Custom Approval Request"}</p>
          </div>

          <div className="text-[14px] text-[#1E4296]">
            Progress: {getProgressCount()}/{approvers.length} approvers assigned
          </div>
        </div>

        <div className="text-[#1E4296] text-[16px] flex gap-1">
          <h2 className="font-bold">Deadline: </h2>
          <p>{formData.due_date}</p>
        </div>
      </div>

      <div>
        <form action="">
          {approvers.map((approver, index) => {
            const trimmedTitle = approver.title.trim();
            const trimmedEmail = approver.email.trim();
            const hasValidEmail = trimmedEmail && isValidEmail(trimmedEmail);
            const hasValidTitle = trimmedTitle !== "";
            const isDuplicate =
              trimmedEmail &&
              approvers.filter((a) => a.email.trim() === trimmedEmail).length >
                1;
            const isValid = hasValidTitle && hasValidEmail && !isDuplicate;

            // Determine ring color based on validation state
            let ringClass = "ring-1 ring-white";
            if (isValid) {
              ringClass = "ring-1 ring-green-200";
            } else if (showValidation && (!hasValidTitle || !hasValidEmail)) {
              ringClass = "ring-2 ring-red-300";
            }

            return (
              <div
                key={approver.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`p-4 rounded-lg mt-3 space-y-4 border border-white shadow-md bg-white cursor-move transition-all duration-200 ${
                  draggedIndex === index
                    ? "opacity-50 scale-95"
                    : "hover:shadow-lg"
                } ${ringClass}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <GripVertical
                      className="text-gray-400 cursor-move"
                      size={20}
                    />
                    <h2
                      className={`font-semibold ${
                        isValid
                          ? "text-[#166534]"
                          : showValidation && (!hasValidTitle || !hasValidEmail)
                          ? "text-red-600"
                          : "text-[#1E4296]"
                      }`}
                    >
                      Approver {index + 1} *
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <h2
                      className={`w-7 h-7 text-white rounded-[25px] justify-center flex items-center ${
                        isValid
                          ? "bg-[#22C55E]"
                          : showValidation && (!hasValidTitle || !hasValidEmail)
                          ? "bg-red-500"
                          : "bg-[#1E4296]"
                      }`}
                    >
                      {index + 1}
                    </h2>
                    {approvers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeApprover(approver.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approver Title/Role
                    </label>
                    <input
                      type="text"
                      value={approver.title}
                      onChange={(e) =>
                        updateApprover(approver.id, "title", e.target.value)
                      }
                      className={`border rounded-md text-[15px] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        hasValidTitle
                          ? "border-green-300 bg-green-50"
                          : showValidation && !hasValidTitle
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter approver title/role"
                    />
                    {showValidation && !hasValidTitle && (
                      <p className="text-[#991B1B] text-[12px] mt-1">
                        Please enter an approver title
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={approver.email}
                      onChange={(e) =>
                        updateApprover(approver.id, "email", e.target.value)
                      }
                      className={`border rounded-md text-[15px] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        hasValidEmail && !isDuplicate
                          ? "border-green-300 bg-green-50"
                          : showValidation && (!hasValidEmail || isDuplicate)
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter email address"
                    />
                    {showValidation &&
                      trimmedEmail &&
                      !isValidEmail(trimmedEmail) && (
                        <p className="text-[#991B1B] text-[12px] mt-1">
                          Please enter a valid email address
                        </p>
                      )}
                    {showValidation && isDuplicate && (
                      <p className="text-[#991B1B] text-[12px] mt-1">
                        This email is already assigned to another approver
                      </p>
                    )}
                    {showValidation && !trimmedEmail && (
                      <p className="text-[#991B1B] text-[12px] mt-1">
                        Please enter an email address
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </form>

        <button
          type="button"
          onClick={addApprover}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium p-2 rounded-md hover:bg-blue-50 transition-colors"
        >
          <Plus size={16} />
          Add Another Approver
        </button>
      </div>
    </div>
  );
}

export default AddApprover;
