"use client";
import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  CircleAlert,
  FileX,
} from "lucide-react";
import React, { useState } from "react";
import { formatDate } from "../../utils/DateConvertionFormat";
import PaginationControl from "../../components/shared/PaginationControl";
import { WorkflowApprovalList } from "../../Interface/IWorkflow";
import Loading from "../shared/Loading";
export interface RequestSchema {
  approver_id: number;
  request_title: string;
  approval_req_type: string;
  due_date: string;
  approver_status:
    | "Pending"
    | "Completed"
    | "Missed"
    | "Replaced"
    | "Canceled"
    | "Returned";
  doc_name?: string | null;
  school_details: string;
  current_approver?: string;
}

interface RequestDataTableProps {
  title: string;
  requests: WorkflowApprovalList[];
  loading: boolean;
  onRowClick: (approverId: number) => void;
  titleIcon?: React.ReactNode;
  titleColor?: string;
  emptyStateConfig?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    showCreateButton?: boolean;
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending":
      return <Clock className="text-gray-400" size={16} />;
    case "Completed":
      return <CheckCircle className="text-green-500" size={16} />;
    case "Missed":
      return <CircleAlert className="text-yellow-500" size={16} />;
    case "Returned":
      return <RotateCcw className="text-orange-500" size={16} />;
    case "Replaced":
      return <XCircle className="text-gray-500" size={16} />;
    case "Canceled":
      return <XCircle className="text-red-500" size={16} />;
    default:
      return <Clock className="text-gray-300" size={16} />;
  }
};

const getEmptyStateConfig = (
  title: string,
  customConfig?: RequestDataTableProps["emptyStateConfig"]
) => {
  if (customConfig) return customConfig;

  const titleLower = title.toLowerCase();

  if (titleLower.includes("completed")) {
    return {
      icon: <CheckCircle className="w-6 h-6 text-gray-400" />,
      title: "No completed requests",
      description:
        "Completed requests will appear here once approved or finished.",
      showCreateButton: false,
    };
  }

  if (
    titleLower.includes("pending") ||
    titleLower.includes("requires action")
  ) {
    return {
      icon: <Clock className="w-6 h-6 text-gray-400" />,
      title: "No pending requests",
      description: "Requests requiring your action will appear here.",
      showCreateButton: false,
    };
  }

  if (titleLower.includes("returned")) {
    return {
      icon: <RotateCcw className="w-6 h-6 text-gray-400" />,
      title: "No returned requests",
      description: "Requests returned for revision will appear here.",
      showCreateButton: false,
    };
  }

  if (titleLower.includes("missed")) {
    return {
      icon: <CircleAlert className="w-6 h-6 text-gray-400" />,
      title: "No missed requests",
      description: "Requests you missed will appear here.",
      showCreateButton: false,
    };
  }

  return {
    icon: <FileX className="w-6 h-6 text-gray-400" />,
    title: "No requests found",
    description: "Get started by creating or receiving a request.",
    showCreateButton: true,
  };
};

export default function RequestDataTable({
  title,
  requests,
  loading,
  onRowClick,
  titleIcon,
  titleColor,
  emptyStateConfig,
}: RequestDataTableProps) {
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(requests.length / itemsPerPage);
  const paginatedData = requests.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const emptyState = getEmptyStateConfig(title, emptyStateConfig);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        {titleIcon && <span>{titleIcon}</span>}
        <h3 className={`text-sm font-medium text-${titleColor}-700`}>
          {title} ({requests.length} Items)
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Request Detail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Approval Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Requester
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Additional Info
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      {emptyState.icon}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {emptyState.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {emptyState.description}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((request) => (
                <tr
                  key={request.approver.approver_id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  onClick={() => onRowClick(request.approver.approver_id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {request.workflow_title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.approval_req_type || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(request.approver.approver_status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {request.approver.approver_status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate
                      ? formatDate(request.approver.approver_due_date)
                      : request.approver.approver_due_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                    {request.school_year}-{request.semester}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <PaginationControl
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
