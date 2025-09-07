import { useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../../context/SidebarContext";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Calendar,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Filter,
  X,
} from "lucide-react";

interface ITrackingDetailed {
  amount: string;
  branch: string;
  disb_sched_id: number;
  disb_title: string;
  disbursement_date: string;
  quantity: number;
  scholar_name: string;
  scholarship_status: string;
  status: string;
  student_id: number;
  disbursement_label: string;
}

// Define types for status styles
type ScholarshipStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type DisbursementStatus =
  | "Completed"
  | "In Progress"
  | "Not Started"
  | "Cancelled";
type StatusStyles = Record<
  ScholarshipStatus | DisbursementStatus,
  {
    fill: { fgColor: { rgb: string } };
  }
>;

function DetailedTracking() {
  const { disbursement_id } = useParams<{ disbursement_id: string }>();
  const [trackingDetailed, setTrackingDetailed] = useState<
    ITrackingDetailed[] | null
  >(null);
  const { collapsed } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [schoolYearFilter, setSchoolYearFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchTrackingDetailed = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<ITrackingDetailed[]>(
          `http://localhost:5000/api/disbursement/tracking/${disbursement_id}`
        );
        console.log(response.data);
        setTrackingDetailed(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackingDetailed();
  }, [disbursement_id]);

  // Get unique branches and school years for filter options
  const filterOptions = useMemo(() => {
    if (!trackingDetailed) return { branches: [], schoolYears: [] };

    const branches = [
      ...new Set(trackingDetailed.map((student) => student.branch)),
    ].sort();
    const schoolYears = [
      ...new Set(trackingDetailed.map((student) => student.scholarship_status)),
    ].sort();

    return { branches, schoolYears };
  }, [trackingDetailed]);

  // Filter students based on selected filters
  const filteredStudents = useMemo(() => {
    if (!trackingDetailed) return [];

    return trackingDetailed.filter((student) => {
      const matchesBranch = !branchFilter || student.branch === branchFilter;
      const matchesSchoolYear =
        !schoolYearFilter || student.scholarship_status === schoolYearFilter;

      return matchesBranch && matchesSchoolYear;
    });
  }, [trackingDetailed, branchFilter, schoolYearFilter]);

  // Clear all filters
  const clearFilters = () => {
    setBranchFilter("");
    setSchoolYearFilter("");
  };

  // Check if any filters are active
  const hasActiveFilters = branchFilter || schoolYearFilter;

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await axios.put(
        `http://localhost:5000/api/disbursement/tracking/complete/${disbursement_id}`
      );
      const response = await axios.get<ITrackingDetailed[]>(
        `http://localhost:5000/api/disbursement/tracking/${disbursement_id}`
      );
      setTrackingDetailed(response.data);
    } catch (error) {
      console.error("Error completing disbursement:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleExportToExcel = () => {
    if (!trackingDetailed || trackingDetailed.length === 0) return;

    const scheduleInfo = trackingDetailed[0];

    // ============= STYLE DEFINITIONS =============
    const headerStyle = {
      fill: { fgColor: { rgb: "2F5597" } }, // Dark blue background
      font: { bold: true, color: { rgb: "FFFFFF" }, name: "Calibri", size: 11 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const titleStyle = {
      fill: { fgColor: { rgb: "BDD7EE" } }, // Light blue background
      font: { bold: true, size: 14, name: "Calibri" },
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    const dataStyle = {
      font: { name: "Calibri", size: 11 },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } },
      },
    };

    const currencyStyle = {
      ...dataStyle,
      numFmt: '"₱"#,##0.00', // Peso sign with comma formatting
    };

    // Status-specific styles
    const statusStyles: StatusStyles = {
      ACTIVE: { fill: { fgColor: { rgb: "FFFF00" } } }, // Yellow
      INACTIVE: { fill: { fgColor: { rgb: "FFC000" } } }, // Orange
      PENDING: { fill: { fgColor: { rgb: "FFE699" } } }, // Light Yellow
      Completed: { fill: { fgColor: { rgb: "92D050" } } }, // Green
      "In Progress": { fill: { fgColor: { rgb: "00B0F0" } } }, // Blue
      "Not Started": { fill: { fgColor: { rgb: "FF0000" } } }, // Red
      Cancelled: { fill: { fgColor: { rgb: "7030A0" } } }, // Purple
    };

    // Helper to get style safely
    const getStatusStyle = (status: string) =>
      statusStyles[status as ScholarshipStatus | DisbursementStatus] || {};

    // ============= PREPARE DATA =============
    // Student Data with styles
    const studentData = [
      // Header row
      [
        { v: "Student ID", t: "s", s: headerStyle },
        { v: "Name", t: "s", s: headerStyle },
        { v: "Scholarship Status", t: "s", s: headerStyle },
        { v: "Amount", t: "s", s: headerStyle },
        { v: "Disbursement Status", t: "s", s: headerStyle },
      ],
      // Data rows
      ...trackingDetailed.map((student, index) => {
        // Alternate row color
        const rowStyle =
          index % 2 === 0
            ? { ...dataStyle, fill: { fgColor: { rgb: "FFFFFF" } } }
            : { ...dataStyle, fill: { fgColor: { rgb: "F2F2F2" } } };

        const scholarshipStyle = getStatusStyle(student.scholarship_status);
        const disbursementStyle = getStatusStyle(student.status);

        return [
          { v: student.student_id, t: "n", s: rowStyle },
          { v: student.scholar_name, t: "s", s: rowStyle },
          {
            v: student.scholarship_status,
            t: "s",
            s: { ...rowStyle, ...scholarshipStyle },
          },
          {
            v: Number(student.amount),
            t: "n",
            s: { ...currencyStyle, ...rowStyle },
          },
          {
            v: student.status,
            t: "s",
            s: { ...rowStyle, ...disbursementStyle },
          },
        ];
      }),
    ];

    // Summary Information with branch and disbursement label added
    const summaryInfo = [
      [{ v: "Disbursement Information", t: "s", s: titleStyle, $colSpan: 5 }],
      [
        { v: "Title:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        { v: scheduleInfo.disb_title, t: "s", s: dataStyle, $colSpan: 4 },
      ],
      [
        { v: "Date:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        {
          v: new Date(scheduleInfo.disbursement_date).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            }
          ),
          t: "s",
          s: dataStyle,
          $colSpan: 4,
        },
      ],
      [
        { v: "Status:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        {
          v: scheduleInfo.status,
          t: "s",
          s: { ...dataStyle, ...getStatusStyle(scheduleInfo.status) },
          $colSpan: 4,
        },
      ],
      // Add Branch row
      [
        { v: "Branch:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        {
          v: scheduleInfo.branch.replace("-", " "),
          t: "s",
          s: dataStyle,
          $colSpan: 4,
        },
      ],
      // Add Disbursement Label row
      [
        {
          v: "Disbursement Label:",
          t: "s",
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v: scheduleInfo.disbursement_label || "",
          t: "s",
          s: dataStyle,
          $colSpan: 4,
        },
      ],
      [{ v: "Financial Details", t: "s", s: titleStyle, $colSpan: 5 }],
      [
        {
          v: "Amount per student:",
          t: "s",
          s: { ...dataStyle, font: { bold: true } },
        },
        { v: Number(scheduleInfo.amount), t: "n", s: currencyStyle },
        { v: "", t: "s", s: dataStyle },
        {
          v: "Total Students:",
          t: "s",
          s: { ...dataStyle, font: { bold: true } },
        },
        { v: scheduleInfo.quantity, t: "n", s: dataStyle },
      ],
      [
        {
          v: "Total Amount:",
          t: "s",
          s: { ...dataStyle, font: { bold: true } },
        },
        {
          v: Number(scheduleInfo.amount) * scheduleInfo.quantity,
          t: "n",
          s: currencyStyle,
        },
        { v: "", t: "s", s: dataStyle, $colSpan: 3 },
      ],
    ];

    // Combine all rows into full data
    const fullData = [...summaryInfo, ...studentData];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(fullData);

    // Set column widths
    ws["!cols"] = [
      { wch: 15 }, // Student ID
      { wch: 35 }, // Name
      { wch: 25 }, // Scholarship Status
      { wch: 20 }, // Amount
      { wch: 25 }, // Disbursement Status
    ];

    // Merge title cells
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Disbursement Info title
      { s: { r: 6, c: 0 }, e: { r: 6, c: 4 } }, // Financial Details title
    ];

    // Create workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disbursement Report");

    // Format filename safe for use
    const fileName = `Disbursement_${scheduleInfo.disb_title.replace(
      /\s+/g,
      "_"
    )}_${disbursement_id}.xlsx`;

    // Export file
    XLSX.writeFile(wb, fileName);
  };

  // ... (rest of your component code remains exactly the same)
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "Not Started": "bg-gray-100 text-gray-700 border-gray-200",
      "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
      Completed: "bg-green-50 text-green-700 border-green-200",
      Failed: "bg-red-50 text-red-700 border-red-200",
      Cancelled: "bg-purple-50 text-purple-700 border-purple-200",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
          statusClasses[status as keyof typeof statusClasses] ||
          "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {status}
      </span>
    );
  };

  const getScholarshipStatusBadge = (status: string) => {
    const statusClasses = {
      ACTIVE: "bg-green-50 text-green-700 border-green-200",
      INACTIVE: "bg-orange-50 text-orange-700 border-orange-200",
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
          statusClasses[status as keyof typeof statusClasses] ||
          "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {status}
      </span>
    );
  };

  if (!trackingDetailed && !isLoading) {
    return (
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } transition-[padding-left] duration-300`}
      >
        <Navbar pageName="Disbursement Tracking" />
        <Sidebar />
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FileSpreadsheet className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Disbursement Data Found
              </h3>
              <p className="text-gray-500 mb-6">
                The disbursement you're looking for doesn't exist or has been
                removed.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                s
                <ArrowLeft size={16} />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scheduleInfo = trackingDetailed?.[0];

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300`}
    >
      <Navbar pageName="Disbursement Tracking" />

      <Sidebar />

      <div className="p-6 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">
                Loading disbursement details...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className=" mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft
                      size={20}
                      className="group-hover:-translate-x-1 transition-transform"
                    />
                    <span className="text-sm font-medium">Back</span>
                  </button>
                  <div className="h-6 w-px bg-gray-300"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                    onClick={handleComplete}
                    disabled={
                      isCompleting || scheduleInfo?.status === "Completed"
                    }
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Mark as Complete
                      </>
                    )}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    onClick={handleExportToExcel}
                  >
                    <FileSpreadsheet size={16} />
                    Export to Excel
                  </button>
                </div>
              </div>
            </div>

            {scheduleInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Disbursement Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Left - ID & Title */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Disbursement ID
                        </p>
                        <p className="text-xl font-semibold text-gray-900">
                          {disbursement_id}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Title
                        </p>
                        <p className="text-sm font-medium text-gray-900 leading-relaxed">
                          {scheduleInfo.disb_title}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Right - Type & Status */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Type
                        </p>
                        <span className="inline-flex items-center px-3 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md border border-gray-200">
                          {scheduleInfo.disbursement_label}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Status
                        </p>
                        {getStatusBadge(scheduleInfo.status)}
                      </div>
                    </div>
                  </div>

                  {/* Bottom - Date (Full Width) */}
                  <div className="md:col-span-2 bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Disbursement Date
                          </p>
                          <div className="space-y-1">
                            <p className="text-lg font-semibold text-gray-900">
                              {new Date(
                                scheduleInfo.disbursement_date
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {new Date(
                                scheduleInfo.disbursement_date
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <div className="text-center">
                          <p className="text-xs text-gray-500 font-medium mb-1">
                            Days from today
                          </p>
                          <p className="text-lg font-semibold text-gray-700">
                            {Math.ceil(
                              (new Date(
                                scheduleInfo.disbursement_date
                              ).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Student List Table */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              {/* Professional Minimalist Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  {/* Title Section */}
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Students
                      </h3>
                      <p className="text-sm text-gray-600">
                        {hasActiveFilters
                          ? `${filteredStudents.length} of ${
                              trackingDetailed?.length || 0
                            } students`
                          : `${trackingDetailed?.length || 0} students`}
                      </p>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="flex items-center gap-3">
                    {/* Active Filter Tags */}
                    {hasActiveFilters && (
                      <div className="flex items-center gap-2 mr-3">
                        {branchFilter && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                            {branchFilter.replace("-", " ")}
                            <button
                              onClick={() => setBranchFilter("")}
                              className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        )}
                        {schoolYearFilter && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                            {schoolYearFilter}
                            <button
                              onClick={() => setSchoolYearFilter("")}
                              className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-md transition-colors ${
                          showFilters || hasActiveFilters
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Filter size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Professional Filter Panel */}
                {showFilters && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Branch Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch
                        </label>
                        <select
                          value={branchFilter}
                          onChange={(e) => setBranchFilter(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors"
                        >
                          <option value="">All branches</option>
                          {filterOptions.branches.map((branch) => (
                            <option key={branch} value={branch}>
                              {branch.replace("-", " ")}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Scholarship Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={schoolYearFilter}
                          onChange={(e) => setSchoolYearFilter(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-colors"
                        >
                          <option value="">All statuses</option>
                          {filterOptions.schoolYears.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Scholarship Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Branch
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr
                          key={student.student_id}
                          className="hover:bg-gray-50/50 transition-colors bg-white border-b border-gray-100"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {student.student_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {student.scholar_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getScholarshipStatusBadge(
                              student.scholarship_status
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {student.branch.replace("-", " ")}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">
                              No students found
                            </p>
                            <p className="text-sm">
                              {hasActiveFilters
                                ? "Try adjusting your filters to see more results"
                                : "No students are available for this disbursement"}
                            </p>
                            {hasActiveFilters && (
                              <button
                                onClick={clearFilters}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <X size={14} />
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DetailedTracking;
