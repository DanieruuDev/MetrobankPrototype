import React, { useCallback, useEffect, useRef, useState } from "react";
import { WorkflowFormData } from "../../../Interface/IWorkflow";
import { Plus, X, GripVertical } from "lucide-react";

interface ApproverValidationStatus {
  valid: boolean;
  errors: {
    hasInvalidEmail: boolean;
    hasDuplicate: boolean;
    hasEmptyFields: boolean;
    hasInvalidDueDate?: boolean;
  };
}

interface AddApproverProps {
  formData: WorkflowFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>;
  onValidateApprovers?: (status: ApproverValidationStatus) => void;
  showValidation: boolean;
}

interface ApproverInput {
  id: string;
  email: string;
  role: string;
  due_date?: string; // yyyy-mm-dd per-approver due date
}

interface EmailSuggestion {
  email: string;
  role: string;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const isValidFutureOrToday = (isoDate: string | undefined): boolean => {
  if (!isoDate) return false;
  const input = new Date(isoDate + "T00:00:00");
  if (isNaN(input.getTime())) return false;
  const today = new Date();
  // normalize to start of day
  today.setHours(0, 0, 0, 0);
  return input.getTime() >= today.getTime();
};

const isWithinRange = (
  isoDate: string | undefined,
  minIso: string | undefined,
  maxIso?: string | undefined
): boolean => {
  if (!isoDate || !minIso) return false;
  const value = new Date(isoDate + "T00:00:00").getTime();
  const min = new Date(minIso + "T00:00:00").getTime();
  if (isNaN(value) || isNaN(min)) return false;
  if (maxIso) {
    const max = new Date(maxIso + "T00:00:00").getTime();
    if (isNaN(max)) return false;
    return value >= min && value <= max;
  }
  return value >= min;
};

const maxIsoDate = (a?: string, b?: string): string | undefined => {
  if (a && b) {
    return new Date(a + "T00:00:00").getTime() >=
      new Date(b + "T00:00:00").getTime()
      ? a
      : b;
  }
  return a || b;
};

function AddApprover({
  formData,
  setFormData,
  onValidateApprovers,
  showValidation,
}: AddApproverProps) {
  const isInteractiveElement = (target: EventTarget | null): boolean => {
    const el = target as HTMLElement | null;
    if (!el) return false;
    return !!el.closest(
      'input, textarea, select, button, [contenteditable="true"], .no-drag'
    );
  };
  const mouseDownOnInteractiveRef = useRef(false);

  const [approvers, setApprovers] = useState<ApproverInput[]>(() => {
    if (formData.approvers && formData.approvers.length > 0) {
      return formData.approvers.map((a, index) => ({
        id: (index + 1).toString(),
        email: a.email,
        role: a.role,
        due_date: a.date,
      }));
    }
    return [{ id: "1", email: "", role: "", due_date: undefined }];
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<{
    [key: string]: number;
  }>({});
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<{
    [key: string]: boolean;
  }>({});
  const debounceTimeoutRef = useRef<{ [key: string]: number }>({});

  const addApprover = () => {
    const newId = (approvers.length + 1).toString();
    setApprovers([
      ...approvers,
      { id: newId, email: "", role: "", due_date: undefined },
    ]);
  };

  const removeApprover = (id: string) => {
    if (approvers.length > 1) {
      setApprovers(approvers.filter((approver) => approver.id !== id));
    }
  };

  const updateApprover = (
    id: string,
    field: "role" | "email" | "due_date",
    value: string
  ) => {
    setApprovers(
      approvers.map((approver) =>
        approver.id === id
          ? ({ ...approver, [field]: value } as ApproverInput)
          : approver
      )
    );
  };

  const fetchEmailSuggestions = async (query: string, approverId: string) => {
    // Only show suggestions if user has typed at least one character
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions((prev) => ({ ...prev, [approverId]: false }));
      return;
    }

    setIsLoadingSuggestions((prev) => ({ ...prev, [approverId]: true }));

    try {
      const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const url =
        query.trim() === ""
          ? `${VITE_BACKEND_URL}api/workflow/search-email-role`
          : `${VITE_BACKEND_URL}api/workflow/search-email-role/${encodeURIComponent(
              query
            )}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions((prev) => ({ ...prev, [approverId]: true }));
      setSelectedSuggestionIndex((prev) => ({ ...prev, [approverId]: -1 }));
    } catch (error) {
      console.error("Error fetching email suggestions:", error);
      setSuggestions([]);
      setShowSuggestions((prev) => ({ ...prev, [approverId]: false }));
    } finally {
      setIsLoadingSuggestions((prev) => ({ ...prev, [approverId]: false }));
    }
  };

  const selectSuggestion = (
    suggestion: EmailSuggestion,
    approverId: string
  ) => {
    setApprovers(
      approvers.map((approver) =>
        approver.id === approverId
          ? ({
              ...approver,
              email: suggestion.email,
              role: suggestion.role,
            } as ApproverInput)
          : approver
      )
    );
    setShowSuggestions((prev) => ({ ...prev, [approverId]: false }));
    setSelectedSuggestionIndex((prev) => ({ ...prev, [approverId]: -1 }));
  };

  const handleEmailChange = (approverId: string, value: string) => {
    updateApprover(approverId, "email", value);

    // Clear existing timeout
    if (debounceTimeoutRef.current[approverId]) {
      clearTimeout(debounceTimeoutRef.current[approverId]);
    }

    // Set new timeout for debounced search - reduced from 300ms to 150ms
    debounceTimeoutRef.current[approverId] = window.setTimeout(() => {
      fetchEmailSuggestions(value, approverId);
    }, 150);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent, approverId: string) => {
    if (!showSuggestions[approverId] || suggestions.length === 0) return;

    const currentIndex = selectedSuggestionIndex[approverId] || -1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => ({
          ...prev,
          [approverId]: Math.min(currentIndex + 1, suggestions.length - 1),
        }));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => ({
          ...prev,
          [approverId]: Math.max(currentIndex - 1, -1),
        }));
        break;
      case "Enter":
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < suggestions.length) {
          selectSuggestion(suggestions[currentIndex], approverId);
        }
        break;
      case "Escape":
        setShowSuggestions((prev) => ({ ...prev, [approverId]: false }));
        setSelectedSuggestionIndex((prev) => ({ ...prev, [approverId]: -1 }));
        break;
    }
  };

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
        approver.role.trim() !== "" &&
        approver.email.trim() !== "" &&
        isValidEmail(approver.email.trim()) &&
        isValidFutureOrToday(approver.due_date)
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
      (approver) =>
        approver.role.trim() === "" ||
        approver.email.trim() === "" ||
        !approver.due_date
    );
  }, [approvers]);

  const hasInvalidDueDates = useCallback((): boolean => {
    // Validate each approver date is within its allowed window
    const workflowDueIso = formData.due_date || undefined;
    const todayIso = new Date(Date.now()).toISOString().slice(0, 10);

    return approvers.some((_, idx) => {
      const current = approvers[idx];
      const prevChosenMax = approvers
        .slice(0, idx)
        .map((a) => a.due_date)
        .filter(Boolean)
        .reduce<string | undefined>(
          (acc, cur) => maxIsoDate(acc, cur as string),
          undefined
        );

      const minIso = maxIsoDate(todayIso, prevChosenMax);
      return !isWithinRange(current.due_date, minIso, workflowDueIso);
    });
  }, [approvers, formData.due_date]);

  const formatApproversForBackend = useCallback(() => {
    if (!isApproverFilled()) {
      console.log("Not all approvers filled with valid emails");
      return [];
    }

    const validApprovers = approvers.filter(
      (approver) =>
        approver.role.trim() !== "" &&
        approver.email.trim() !== "" &&
        isValidEmail(approver.email.trim())
    );

    return validApprovers.map((approver, index) => ({
      email: approver.email.trim(),
      order: index + 1,
      role: approver.role.trim(),
      // Only keep manual per-approver due date; no auto distribution
      date: approver.due_date ? approver.due_date : "",
    }));
  }, [approvers, isApproverFilled]);

  // no-op: manual date is already yyyy-mm-dd from the <input type="date"/>

  const getProgressCount = (): number => {
    return approvers.filter(
      (approver) =>
        approver.role.trim() !== "" &&
        approver.email.trim() !== "" &&
        isValidEmail(approver.email.trim())
    ).length;
  };

  useEffect(() => {
    if (isApproverFilled() && !hasDuplicates()) {
      const backendData = formatApproversForBackend();
      setFormData((prev) => {
        const prevApproversJSON = JSON.stringify(prev.approvers);
        const backendDataJSON = JSON.stringify(backendData);
        if (prevApproversJSON !== backendDataJSON) {
          return { ...prev, approvers: backendData };
        }
        return prev; // no change, prevents re-render
      });
    }
  }, [
    approvers,
    formData.due_date,
    setFormData,
    isApproverFilled,
    hasDuplicates,
    formatApproversForBackend,
  ]);

  useEffect(() => {
    if (formData.approvers && formData.approvers.length > 0) {
      setApprovers(
        formData.approvers.map((a, index) => ({
          id: (index + 1).toString(),
          email: a.email,
          role: a.role,
          due_date: a.date,
        }))
      );
    }
  }, [formData.approvers]);

  useEffect(() => {
    if (onValidateApprovers) {
      onValidateApprovers({
        valid:
          isApproverFilled() &&
          !hasDuplicates() &&
          !hasInvalidEmails() &&
          !hasEmptyFields() &&
          !hasInvalidDueDates(),
        errors: {
          hasInvalidEmail: hasInvalidEmails(),
          hasDuplicate: hasDuplicates(),
          hasEmptyFields: hasEmptyFields(),
          hasInvalidDueDate: hasInvalidDueDates(),
        },
      });
    }
  }, [
    approvers,
    isApproverFilled,
    hasDuplicates,
    hasInvalidEmails,
    hasEmptyFields,
    hasInvalidDueDates,
    onValidateApprovers,
  ]);

  // Cleanup debounce timeouts on unmount
  useEffect(() => {
    const timeouts = debounceTimeoutRef.current;
    return () => {
      Object.values(timeouts).forEach((timeout) => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <div>
      <div className="mb-5 font-medium text-[20px]">Add Approver/s</div>
      <div className="bg-[#EFF6FF] p-4 rounded-md flex justify-between">
        <div>
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
            const trimmedRole = approver.role.trim();
            const trimmedEmail = approver.email.trim();
            const hasValidEmail = trimmedEmail && isValidEmail(trimmedEmail);
            const hasValidRole = trimmedRole !== "";
            // Compute dynamic min/max window
            const workflowDueIso = formData.due_date || "";
            const todayIso = new Date(Date.now()).toISOString().slice(0, 10);
            const prevChosenMax = approvers
              .slice(0, index)
              .map((a) => a.due_date)
              .filter(Boolean)
              .reduce<string | undefined>(
                (acc, cur) => maxIsoDate(acc, cur as string),
                undefined
              );
            const minIso = maxIsoDate(todayIso, prevChosenMax) || todayIso;
            const maxIso = workflowDueIso || undefined;
            const hasValidDueDate = isWithinRange(
              approver.due_date,
              minIso,
              maxIso
            );
            const isDuplicate =
              trimmedEmail &&
              approvers.filter((a) => a.email.trim() === trimmedEmail).length >
                1;
            const isValid =
              hasValidRole && hasValidEmail && hasValidDueDate && !isDuplicate;

            // Determine ring color based on validation state
            let ringClass = "ring-1 ring-white";
            if (isValid) {
              ringClass = "ring-1 ring-green-200";
            } else if (showValidation && (!hasValidRole || !hasValidEmail)) {
              ringClass = "ring-2 ring-red-300";
            }

            return (
              <div
                key={approver.id}
                draggable
                onDragStart={(e) => {
                  if (mouseDownOnInteractiveRef.current) {
                    e.preventDefault();
                    return;
                  }
                  handleDragStart(e, index);
                }}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onMouseDown={(e) => {
                  mouseDownOnInteractiveRef.current = isInteractiveElement(
                    e.target
                  );
                }}
                onMouseUp={() => {
                  mouseDownOnInteractiveRef.current = false;
                }}
                className={`p-4 rounded-lg mt-3 space-y-4 border border-white shadow-md bg-white transition-all duration-200 ${
                  draggedIndex === index
                    ? "opacity-50 scale-95"
                    : "hover:shadow-lg"
                } ${ringClass}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className="text-gray-400 cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnd={handleDragEnd}
                      role="button"
                      aria-label="Drag approver"
                      tabIndex={0}
                    >
                      <GripVertical size={20} />
                    </div>
                    <h2
                      className={`font-semibold ${
                        isValid
                          ? "text-[#166534]"
                          : showValidation && (!hasValidRole || !hasValidEmail)
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
                          : showValidation && (!hasValidRole || !hasValidEmail)
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
                      Approver Role
                    </label>
                    <input
                      type="text"
                      value={approver.role}
                      onChange={(e) =>
                        updateApprover(approver.id, "role", e.target.value)
                      }
                      className={`border rounded-md text-[15px] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        hasValidRole
                          ? "border-green-300 bg-green-50"
                          : showValidation && !hasValidRole
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter approver role"
                    />
                    {showValidation && !hasValidRole && (
                      <p className="text-[#991B1B] text-[12px] mt-1">
                        Please enter an approver role
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={approver.email}
                        onChange={(e) =>
                          handleEmailChange(approver.id, e.target.value)
                        }
                        onKeyDown={(e) => handleEmailKeyDown(e, approver.id)}
                        onFocus={() => {
                          // Only show suggestions if user has already typed something
                          if (approver.email.length >= 1) {
                            fetchEmailSuggestions(approver.email, approver.id);
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding suggestions to allow for click selection
                          setTimeout(() => {
                            setShowSuggestions((prev) => ({
                              ...prev,
                              [approver.id]: false,
                            }));
                          }, 200);
                        }}
                        className={`border rounded-md text-[15px] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          hasValidEmail && !isDuplicate
                            ? "border-green-300 bg-green-50"
                            : showValidation && (!hasValidEmail || isDuplicate)
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300"
                        }`}
                        placeholder="Type to search emails..."
                        autoComplete="off"
                      />
                      {isLoadingSuggestions[approver.id] && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>

                    {/* Suggestions Dropdown - positioned absolutely */}
                    {showSuggestions[approver.id] && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto z-50">
                        {suggestions.length > 0 ? (
                          suggestions.map((suggestion, index) => (
                            <div
                              key={`${suggestion.email}-${index}`}
                              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                                selectedSuggestionIndex[approver.id] === index
                                  ? "bg-blue-100"
                                  : ""
                              }`}
                              onClick={() =>
                                selectSuggestion(suggestion, approver.id)
                              }
                              onMouseEnter={() =>
                                setSelectedSuggestionIndex((prev) => ({
                                  ...prev,
                                  [approver.id]: index,
                                }))
                              }
                            >
                              <div className="font-medium text-gray-900">
                                {suggestion.email}
                              </div>
                              <div className="text-sm text-gray-600">
                                {suggestion.role}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">
                            No matching accounts found
                          </div>
                        )}
                      </div>
                    )}

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approver Due Date
                    </label>
                    <input
                      type="date"
                      value={approver.due_date || ""}
                      onChange={(e) =>
                        updateApprover(approver.id, "due_date", e.target.value)
                      }
                      min={minIso}
                      max={maxIso}
                      className={`border rounded-md text-[15px] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        hasValidDueDate
                          ? "border-green-300 bg-green-50"
                          : showValidation && !hasValidDueDate
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                    {showValidation && !approver.due_date && (
                      <p className="text-[#991B1B] text-[12px] mt-1">
                        Please select a due date
                      </p>
                    )}
                    {showValidation &&
                      approver.due_date &&
                      !hasValidDueDate && (
                        <p className="text-[#991B1B] text-[12px] mt-1">
                          Due date must be between {minIso} and {maxIso}
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
