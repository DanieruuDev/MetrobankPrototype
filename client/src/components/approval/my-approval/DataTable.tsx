import {
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Disc,
  CircleAlert,
  FileX,
  Search,
  Archive,
  Edit,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { formatDate } from "../../../utils/DateConvertionFormat";
import PaginationControl from "../../shared/PaginationControl";
import { useNavigate } from "react-router-dom";
import { WorkflowDisplaySchema } from "../../../Interface/IWorkflow";

interface DataTableProps {
  title: string;
  workflows: WorkflowDisplaySchema[];
  loading: boolean;
  onArchived: (workflowId: number) => void;
  titleIcon?: React.ReactNode;
  titleColor?: string;
  emptyStateConfig?: {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    showCreateButton?: boolean;
  };
  editApproval: (workflow_id: number | null) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Not Started":
      return <Clock className="text-gray-400" size={16} />;
    case "In Progress":
      return <Disc className="text-blue-500" size={16} />;
    case "Completed":
      return <CheckCircle className="text-green-500" size={16} />;
    case "Missed":
      return <CircleAlert className="text-yellow-500" size={16} />;
    case "Failed":
      return <XCircle className="text-red-500" size={16} />;
    case "Rejected":
      return <RotateCcw className="text-orange-500" size={16} />;
    default:
      return <Clock className="text-gray-300" size={16} />;
  }
};

const getEmptyStateConfig = (
  title: string,
  customConfig?: DataTableProps["emptyStateConfig"]
) => {
  if (customConfig) {
    return customConfig;
  }

  const titleLower = title.toLowerCase();

  if (titleLower.includes("completed") || titleLower.includes("finished")) {
    return {
      icon: <CheckCircle className="w-6 h-6 text-gray-400" />,
      title: "No completed requests",
      description:
        "Completed workflows will appear here once they're finished.",
      showCreateButton: false,
    };
  }

  if (titleLower.includes("pending") || titleLower.includes("in progress")) {
    return {
      icon: <Clock className="w-6 h-6 text-gray-400" />,
      title: "No In Progress requests",
      description: "Active workflows requiring attention will appear here.",
      showCreateButton: false,
    };
  }

  if (titleLower.includes("failed") || titleLower.includes("rejected")) {
    return {
      icon: <XCircle className="w-6 h-6 text-gray-400" />,
      title: "No failed requests",
      description: "Failed or rejected workflows will appear here.",
      showCreateButton: false,
    };
  }

  if (titleLower.includes("returned")) {
    return {
      icon: <RotateCcw className="w-6 h-6 text-gray-400" />,
      title: "No returned requests",
      description: "Workflows returned for revision will appear here.",
      showCreateButton: false,
    };
  }
  if (titleLower.includes("missed")) {
    return {
      icon: <CircleAlert className="w-6 h-6 text-gray-400" />,
      title: "No missed requests",
      description: "Workflows you missed will appear here.",
      showCreateButton: false,
    };
  }

  if (titleLower.includes("search") || titleLower.includes("filter")) {
    return {
      icon: <Search className="w-6 h-6 text-gray-400" />,
      title: "No matching requests",
      description: "Try adjusting your search criteria or filters.",
      showCreateButton: false,
    };
  }

  // Default for general/all workflows
  return {
    icon: <FileX className="w-6 h-6 text-gray-400" />,
    title: "No requests found",
    description: "Get started by creating your first approval request.",
    showCreateButton: true,
  };
};

export default function DataTable({
  title,
  workflows,
  loading,
  onArchived,
  titleIcon,
  titleColor,
  emptyStateConfig,
  editApproval,
}: DataTableProps) {
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const totalPages = Math.ceil(workflows.length / itemsPerPage);
  const paginatedData = workflows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const onEdit = (workflow_id: number) => {
    console.log(workflow_id);
  };
  console.log(workflows);

  const emptyState = getEmptyStateConfig(title, emptyStateConfig);

  console.log("Data table", paginatedData);
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div
        className={`px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2`}
      >
        {titleIcon && <span>{titleIcon}</span>}
        <h3 className={`text-sm font-medium text-${titleColor}-700`}>
          {title} ({workflows.length} Items)
        </h3>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
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
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Additional Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
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
              paginatedData.map((workflow) => (
                <tr
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/workflow-approval/${workflow.workflow_id}`);
                  }}
                  key={workflow.workflow_id}
                  className={` hover:bg-gray-50 transition-colors duration-150 cursor-pointer`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {workflow.request_title}
                      </div>
                      {workflow.doc_name && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {workflow.doc_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workflow.approval_req_type || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(workflow.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {workflow.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(workflow.due_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">
                    {workflow.school_details || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center  gap-1">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editApproval(workflow.workflow_id);
                            onEdit(workflow.workflow_id);
                          }}
                          className="text-blue-600 cursor-pointer hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors duration-150"
                          title="Edit workflow"
                        >
                          <Edit size={18} />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchived(workflow.workflow_id);
                        }}
                        className="text-yellow-600 cursor-pointer hover:text-yellow-900 p-1 rounded-md hover:bg-yellow-50 transition-colors duration-150"
                        title="Archive workflow"
                      >
                        <Archive size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {paginatedData.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {emptyState.icon}
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {emptyState.title}
              </p>
              <p className="text-sm text-gray-500">{emptyState.description}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 px-1 py-1">
            {paginatedData.map((workflow) => (
              <div
                key={workflow.workflow_id}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/workflow-approval/${workflow.workflow_id}`);
                }}
                className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
              >
                {/* Header with Status and Actions */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                    {getStatusIcon(workflow.status)}
                    <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize truncate">
                      {workflow.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editApproval(workflow.workflow_id);
                          onEdit(workflow.workflow_id);
                        }}
                        className="text-blue-600 cursor-pointer hover:text-blue-900 p-1.5 rounded-md hover:bg-blue-50 transition-colors duration-150 touch-manipulation"
                        title="Edit workflow"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchived(workflow.workflow_id);
                      }}
                      className="text-yellow-600 cursor-pointer hover:text-yellow-900 p-1.5 rounded-md hover:bg-yellow-50 transition-colors duration-150 touch-manipulation"
                      title="Archive workflow"
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                </div>

                {/* Request Title */}
                <div className="mb-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
                    {workflow.request_title}
                  </h3>
                  {workflow.doc_name && (
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {workflow.approval_req_type
                        ? `${workflow.approval_req_type}.xlsx`
                        : "Request Type.xlsx"}
                    </p>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Type:</span>
                    <span className="text-gray-900 font-semibold text-right flex-1 ml-2 truncate">
                      {workflow.approval_req_type || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Due Date:</span>
                    <span className="text-gray-900 font-semibold text-right flex-1 ml-2 truncate">
                      {formatDate(workflow.due_date)}
                    </span>
                  </div>
                  {workflow.school_details && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">School:</span>
                      <span className="text-gray-900 font-semibold text-right flex-1 ml-2 truncate">
                        {workflow.school_details}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
