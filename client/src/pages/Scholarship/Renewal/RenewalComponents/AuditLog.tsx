import { useEffect, useState } from "react";
import axios from "axios";
import {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogResponse,
} from "../../../../Interface/IAuditLog";
import {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-4xl max-h-[75vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-md">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-blue-100 rounded-sm">
              <FileText size={14} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Audit Log</h2>
              <p className="text-xs text-gray-600">
                Track all changes and modifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/80 rounded-sm transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Filters Toggle */}
        <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50/30">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Filter size={12} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-1.5">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Role
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Branch
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                <label className="block text-sm font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setFilters({ ...filters, offset: 0 });
                  fetchAuditLogs();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
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
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Audit Log List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-1.5 text-xs">
                  Loading audit logs...
                </p>
              </div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex items-center justify-center h-24">
              <div className="text-center">
                <div className="p-1.5 bg-gray-100 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                  <FileText size={16} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium text-xs">
                  No audit logs found
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Try adjusting your filters
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {auditLogs.map((log) => (
                <div
                  key={log.audit_id}
                  className="border border-gray-100 rounded-sm p-2 hover:border-blue-200 hover:shadow-sm transition-all duration-200 bg-white"
                >
                  {/* Header Row - More Compact */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryColor(
                          log.change_category
                        )}`}
                      >
                        {log.change_category}
                      </span>
                      <div className="text-xs text-gray-500">
                        {log.scholar_name} • {log.campus}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDateTime(log.changed_at)}
                    </div>
                  </div>

                  {/* User Info - More Compact */}
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs">
                    <div className="p-0.5 bg-blue-50 rounded-full">
                      <User size={10} className="text-blue-600" />
                    </div>
                    <span className="font-semibold text-gray-900">
                      {log.changed_by}
                    </span>
                    <span className="text-gray-500">
                      {log.changed_by_role}
                      {log.branch_name && ` • ${log.branch_name}`}
                    </span>
                  </div>

                  {/* Details Grid - More Prominent */}
                  <div className="bg-blue-50/30 rounded-sm p-2 border border-blue-100">
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                          Field Changed
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {formatFieldName(log.field_name)}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                          Student
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {log.scholar_name}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                          School Year
                        </div>
                        <div className="text-gray-800 text-sm font-medium">
                          {log.school_year}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                          Semester
                        </div>
                        <div className="text-gray-800 text-sm font-medium">
                          {log.semester}
                        </div>
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
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 rounded-b-md">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Showing{" "}
                <span className="font-semibold">{filters.offset! + 1}</span> to{" "}
                <span className="font-semibold">
                  {Math.min(
                    filters.offset! + (filters.limit || 50),
                    pagination.total
                  )}
                </span>{" "}
                of <span className="font-semibold">{pagination.total}</span>{" "}
                entries
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="p-1 border border-gray-200 rounded-sm hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="text-xs text-gray-600 px-1.5">
                  Page{" "}
                  <span className="font-semibold">
                    {pagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">{pagination.totalPages}</span>
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-1 border border-gray-200 rounded-sm hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={12} />
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
