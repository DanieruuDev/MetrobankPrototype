import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { WorkflowFormData } from "../../../Interface/IWorkflow";
import { Calendar, File, User, Clock, BookOpen, School } from "lucide-react";
import axios from "axios";

interface WorkflowSummaryProps {
  formData: WorkflowFormData;
}

interface ApproverInfo {
  asmin_id: number;
  admin_name: string;
  admin_email: string;
  admin_job: string;
  role_id: number;
}

function WorkflowSummary({ formData }: WorkflowSummaryProps) {
  const [approverInfo, setApproverInfo] = useState<ApproverInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchApproverInfo = async () => {
      try {
        setIsLoading(true);
        const res = await Promise.all(
          formData.approvers.map((approver) =>
            axios.get(
              `${VITE_BACKEND_URL}api/workflow/find-email/${approver.email}`
            )
          )
        );
        const approverInfos = res.map((r) => r.data.data);
        setApproverInfo(approverInfos);
      } catch (error) {
        console.error("Error fetching approver:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (formData.approvers.length > 0) {
      fetchApproverInfo();
    } else {
      setIsLoading(false);
    }
  }, [formData.approvers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  type IconType = ComponentType<{ size?: number; className?: string }>;

  const InfoItem = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value?: string | number | null;
    icon: IconType;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
        <Icon size={12} />
        {label}
      </div>
      <div className="text-gray-900 font-medium text-sm pl-3.5">
        {value ?? "—"}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-3 sm:px-4 py-2 sm:py-3">
        <h1 className="text-base sm:text-lg font-semibold text-white">
          Workflow Summary
        </h1>
        <p className="text-blue-100 text-xs mt-0.5">
          Review details before submission
        </p>
      </div>
      {/* Main Content */}
      <div className="space-y-3 sm:space-y-4">
        {/* Basic Information Card */}
        <div className="bg-gray-50 p-2 sm:p-3 border border-gray-200">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-1.5">
            <BookOpen size={12} className="text-blue-600 sm:w-3 sm:h-3" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            <InfoItem
              label="Title"
              value={formData?.rq_title}
              icon={BookOpen}
            />
            <InfoItem
              label="Workflow Type"
              value={formData?.approval_req_type}
              icon={School}
            />
            <InfoItem
              label="School Year"
              value={formData?.sy_code}
              icon={Calendar}
            />
            <InfoItem
              label="Semester"
              value={formData?.semester_code}
              icon={Clock}
            />
            <InfoItem
              label="Created by"
              value={formData?.requester_id}
              icon={User}
            />
            <InfoItem
              label="Due Date"
              value={formData?.due_date ? formatDate(formData.due_date) : ""}
              icon={Calendar}
            />
          </div>
        </div>

        {/* Approvers Section */}
        <div className="bg-gray-50 p-2 sm:p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1 sm:gap-1.5">
              <User size={12} className="text-green-600 sm:w-3 sm:h-3" />
              Approval Process
            </h2>
            <span className="bg-green-100 text-green-800 text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
              {formData.approvers.length}{" "}
              {formData.approvers.length === 1 ? "step" : "steps"}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-2">
              <div className="animate-pulse text-gray-500 text-xs">
                Loading approvers...
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.approvers.map((approver, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-green-500 text-white rounded-md text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {approverInfo[index]?.admin_name || "Loading..."}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {approverInfo[index]?.admin_job || ""} {approver.email}
                      </div>
                    </div>
                  </div>

                  {approver.date && (
                    <div className="flex items-center gap-1 bg-blue-50 px-1 sm:px-2 py-1 rounded text-xs flex-shrink-0">
                      <Calendar
                        size={10}
                        className="text-blue-600 sm:w-3 sm:h-3"
                      />
                      <span className="text-blue-800 font-medium">
                        {formatDate(approver.date)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attachment Section */}
        {formData.file && (
          <div className="bg-gray-50 p-2 sm:p-3 border border-gray-200">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1 sm:gap-1.5">
              <File size={12} className="text-orange-600 sm:w-3 sm:h-3" />
              Attachment
            </h2>
            <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200">
              <div className="p-1 bg-orange-100 rounded flex-shrink-0">
                <File size={14} className="text-orange-600 sm:w-4 sm:h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {"doc_id" in formData.file
                    ? formData.file.doc_name // ✅ existing DB file
                    : formData.file.name}{" "}
                </div>
                <div className="text-xs text-gray-500">
                  {"size" in formData.file
                    ? `${(formData.file.size / 1024).toFixed(1)} KB` // ✅ uploaded file size
                    : "Existing File"}{" "}
                </div>
              </div>

              {/* Only show "View" button if it's a new uploaded file */}
              {"size" in formData.file && (
                <a
                  href={URL.createObjectURL(formData.file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  View
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowSummary;
