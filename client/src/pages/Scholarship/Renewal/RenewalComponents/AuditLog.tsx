import { useEffect, useState } from "react";
import axios from "axios";
import {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogResponse,
} from "../../../../Interface/IAuditLog";
import {
  Clock,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";

interface AuditLogProps {
  studentId?: number;
  renewalId?: number;
  validationId?: number;
  onClose?: () => void;
}

const AuditLog: React.FC<AuditLogProps> = ({
  studentId,
  renewalId,
  validationId,
  onClose,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({
    student_id: studentId,
    renewal_id: renewalId,
    validation_id: validationId,
    limit: 50,
    offset: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get<AuditLogResponse>(
        `${VITE_BACKEND_URL}api/renewal/audit-log?${params.toString()}`
      );

      if (response.data.success) {
        setAuditLogs(response.data.data);
        setPagination({
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages,
          currentPage: response.data.pagination.currentPage,
        });
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      alert("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.offset]);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: (newPage - 1) * (filters.limit || 50),
    }));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Academic Validation": "bg-blue-100 text-blue-800 border-blue-200",
      "Conduct Validation": "bg-purple-100 text-purple-800 border-purple-200",
      "Enrollment Validation": "bg-green-100 text-green-800 border-green-200",
      "Scholarship Validation":
        "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Renewal Date Update": "bg-orange-100 text-orange-800 border-orange-200",
      "Validator Status Update": "bg-gray-100 text-gray-800 border-gray-200",
      Other: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return colors[category] || colors["Other"];
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50  p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-end px-6 pt-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Filters Toggle */}
        <div className="px-6 py-3 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Filter size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-6  py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={filters.role_id || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      role_id: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                      offset: 0,
                    })
                  }
                >
                  <option value="">All Roles</option>
                  <option value="3">Registrar</option>
                  <option value="7">MBS HR</option>
                  <option value="9">Discipline Office</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={filters.branch_id || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      branch_id: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                      offset: 0,
                    })
                  }
                >
                  <option value="">All Branches</option>
                  <option value="1">STI Ortigas Cainta</option>
                  <option value="2">STI Sta Mesa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={filters.change_category || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      change_category: e.target.value || undefined,
                      offset: 0,
                    })
                  }
                >
                  <option value="">All Categories</option>
                  <option value="Academic Validation">
                    Academic Validation
                  </option>
                  <option value="Conduct Validation">Conduct Validation</option>
                  <option value="Enrollment Validation">
                    Enrollment Validation
                  </option>
                  <option value="Scholarship Validation">
                    Scholarship Validation
                  </option>
                  <option value="Renewal Date Update">
                    Renewal Date Update
                  </option>
                  <option value="Validator Status Update">
                    Validator Status Update
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={filters.start_date || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      start_date: e.target.value || undefined,
                      offset: 0,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={filters.end_date || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      end_date: e.target.value || undefined,
                      offset: 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setFilters({ ...filters, offset: 0 });
                  fetchAuditLogs();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilters({
                    student_id: studentId,
                    renewal_id: renewalId,
                    validation_id: validationId,
                    limit: 50,
                    offset: 0,
                  });
                  fetchAuditLogs();
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Audit Log List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading audit logs...</p>
              </div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No audit logs found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div
                  key={log.audit_id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                            log.change_category
                          )}`}
                        >
                          {log.change_category}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {log.scholar_name} ({log.campus})
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-xs md:text-sm text-gray-600">
                        <div className="flex items-center gap-1 flex-wrap">
                          <User size={12} className="md:w-[14px] md:h-[14px]" />
                          <span className="font-medium">{log.changed_by}</span>
                          <span className="text-gray-400">
                            ({log.changed_by_role}
                            {log.branch_name && ` - ${log.branch_name}`})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock
                            size={12}
                            className="md:w-[14px] md:h-[14px]"
                          />
                          <span>{formatDateTime(log.changed_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2 md:p-3">
                    <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] md:text-xs mb-0.5">
                          Field Changed:
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatFieldName(log.field_name)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] md:text-xs mb-0.5">
                          New Value:
                        </span>
                        <span className="font-medium text-gray-900">
                          {log.new_value || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] md:text-xs mb-0.5">
                          School Year:
                        </span>
                        <span className="text-gray-900">{log.school_year}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[10px] md:text-xs mb-0.5">
                          Semester:
                        </span>
                        <span className="text-gray-900">{log.semester}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && auditLogs.length > 0 && (
          <div className="px-6 rounded-b-2xl py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filters.offset! + 1} to{" "}
                {Math.min(
                  filters.offset! + (filters.limit || 50),
                  pagination.total
                )}{" "}
                of {pagination.total} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
