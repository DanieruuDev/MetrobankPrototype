import { useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../../context/SidebarContext";
import * as XLSX from "xlsx";
import { ArrowLeft, X, Users, Filter } from "lucide-react";
import { toast } from "react-toastify";

interface ITrackingStudent {
  student_id: number;
  scholar_name: string;
  course: string;
  campus: string;
  scholarship_status: string;

  // academic basis from renewal_scholar
  yr_lvl: number;
  semester: number;
  school_year: number;

  // disbursement details
  disbursement_status: string;
  required_hours: number | null;
  completed_at: string | null;
  disbursement_amount: number | null;
}

interface ITrackingDisbursement {
  disb_sched_id: number;
  branch_code: string;
  disbursement_type_id: number;
  disbursement_label: string;
  students: ITrackingStudent[];
}

interface ITrackingDetailed {
  sched_id: number;
  sched_title: string;
  event_type: number;
  schedule_status: string;
  schedule_due: string;
  event_start_date: string;
  event_description: string;
  requester: number;

  // event-level academic info
  event_sy_code: number;
  event_semester_code: number;

  disbursement_schedules: ITrackingDisbursement[];
}

type ScholarshipStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type DisbursementStatus =
  | "Completed"
  | "In Progress"
  | "Not Started"
  | "Cancelled";
type StatusStyle = {
  fill?: { fgColor: { rgb: string } };
};

type StatusStyles = Record<ScholarshipStatus | DisbursementStatus, StatusStyle>;

function DetailedTracking() {
  const { sched_id } = useParams<{ sched_id: string }>();
  const [trackingDetailed, setTrackingDetailed] = useState<
    ITrackingDetailed[] | null
  >(null);
  const { collapsed } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();
  console.log(sched_id);
  useEffect(() => {
    const fetchTrackingDetailed = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/disbursement/tracking/${sched_id}`
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
  }, [sched_id]);

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await axios.put(
        `http://localhost:5000/api/disbursement/tracking/complete/${sched_id}`
      );
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/tracking/${sched_id}`
      );
      toast.success("Disbursement completed");
      setTrackingDetailed(response.data);
    } catch (error) {
      console.error("Error completing disbursement:", error);
      toast.error("Failed to complete");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleExportToExcel = () => {
    if (!trackingDetailed || trackingDetailed.length === 0) return;

    const scheduleInfo = trackingDetailed[0];

    // ===== STYLE DEFINITIONS =====
    const headerStyle = {
      fill: { fgColor: { rgb: "2F5597" } },
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
      fill: { fgColor: { rgb: "BDD7EE" } },
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

    const statusStyles: StatusStyles = {
      ACTIVE: { fill: { fgColor: { rgb: "FFFF00" } } },
      INACTIVE: { fill: { fgColor: { rgb: "FFC000" } } },
      PENDING: { fill: { fgColor: { rgb: "FFE699" } } },
      Completed: { fill: { fgColor: { rgb: "92D050" } } },
      "In Progress": { fill: { fgColor: { rgb: "00B0F0" } } },
      "Not Started": { fill: { fgColor: { rgb: "FF0000" } } },
      Cancelled: { fill: { fgColor: { rgb: "7030A0" } } },
    };

    const getStatusStyle = (status: string): StatusStyle =>
      statusStyles[status as keyof StatusStyles] ?? {};

    // ===== PREPARE STUDENT DATA =====
    // Flatten and deduplicate students
    const uniqueStudents = Object.values(
      scheduleInfo.disbursement_schedules
        .flatMap((ds) =>
          ds.students.map((student) => ({
            ...student,
            disbursement_label: ds.disbursement_label,
            branch_code: ds.branch_code,
          }))
        )
        .reduce((acc, student) => {
          acc[student.student_id] = student;
          return acc;
        }, {} as Record<number, ITrackingStudent & { disbursement_label: string; branch_code: string }>)
    );

    const studentData = [
      // Header row
      [
        { v: "Student ID", t: "s", s: headerStyle },
        { v: "Name", t: "s", s: headerStyle },
        { v: "Year Level", t: "s", s: headerStyle },
        { v: "Course", t: "s", s: headerStyle },
        { v: "Campus", t: "s", s: headerStyle },
        { v: "Scholarship Status", t: "s", s: headerStyle },
        { v: "Disbursement Status", t: "s", s: headerStyle },
        { v: "Disbursement Label", t: "s", s: headerStyle },
        { v: "Branch", t: "s", s: headerStyle },
      ],
      // Data rows
      ...uniqueStudents.map((student, index) => {
        const rowStyle =
          index % 2 === 0
            ? { ...dataStyle, fill: { fgColor: { rgb: "FFFFFF" } } }
            : { ...dataStyle, fill: { fgColor: { rgb: "F2F2F2" } } };

        return [
          { v: student.student_id, t: "n", s: rowStyle },
          { v: student.scholar_name, t: "s", s: rowStyle },
          { v: student.yr_lvl, t: "s", s: rowStyle },
          { v: student.course, t: "s", s: rowStyle },
          { v: student.campus, t: "s", s: rowStyle },
          {
            v: student.scholarship_status,
            t: "s",
            s: { ...rowStyle, ...getStatusStyle(student.scholarship_status) },
          },
          {
            v: student.disbursement_status,
            t: "s",
            s: { ...rowStyle, ...getStatusStyle(student.disbursement_status) },
          },
          { v: student.disbursement_label, t: "s", s: rowStyle },
          { v: student.branch_code, t: "s", s: rowStyle },
        ];
      }),
    ];

    // ===== SUMMARY INFO =====
    const summaryInfo = [
      [{ v: "Schedule Information", t: "s", s: titleStyle, $colSpan: 9 }],
      [
        { v: "Title:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        { v: scheduleInfo.sched_title, t: "s", s: dataStyle, $colSpan: 8 },
      ],
      [
        { v: "Due Date:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        {
          v: new Date(scheduleInfo.schedule_due).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          t: "s",
          s: dataStyle,
          $colSpan: 8,
        },
      ],
      [
        { v: "Status:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        {
          v: scheduleInfo.schedule_status,
          t: "s",
          s: { ...dataStyle, ...getStatusStyle(scheduleInfo.schedule_status) },
          $colSpan: 8,
        },
      ],
    ];

    // ===== COMBINE DATA =====
    const fullData = [...summaryInfo, ...studentData];
    const ws = XLSX.utils.aoa_to_sheet(fullData);

    // Column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
    ];

    // Merge cells for titles
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

    // Workbook + save
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracking Report");

    const fileName = `Tracking_${scheduleInfo.sched_title.replace(
      /\s+/g,
      "_"
    )}_${scheduleInfo.sched_id}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "Not Started": "bg-gray-200 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] || "bg-gray-100"
        }`}
      >
        {status}
      </span>
    );
  };

  // Keep layout scaffold (Navbar/Sidebar) visible; render loading/content inside

  const scheduleInfo = trackingDetailed?.[0];
  // replace these state hooks
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("All");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const allStudentRows = scheduleInfo
    ? scheduleInfo.disbursement_schedules.flatMap((s) =>
        s.students.map((st) => ({ schedule: s, student: st }))
      )
    : [];

  const hasActiveFilters =
    selectedBranch !== "All" || selectedYearLevel !== "All";

  // unique year levels
  const uniqueYearLevels = Array.from(
    new Set(allStudentRows.map((r) => r.student.yr_lvl))
  ).sort((a, b) => Number(a) - Number(b));

  const uniqueBranches = Array.from(
    new Set(
      scheduleInfo
        ? scheduleInfo.disbursement_schedules.map((s) => s.branch_code)
        : []
    )
  ).sort();

  const filteredRows = allStudentRows.filter(({ schedule, student }) => {
    const yearLevelOk =
      selectedYearLevel === "All" ||
      String(student.yr_lvl) === String(selectedYearLevel);
    const branchOk =
      selectedBranch === "All" || schedule.branch_code === selectedBranch;
    return yearLevelOk && branchOk;
  });

  const clearFilters = () => {
    setSelectedBranch("All");
    setSelectedYearLevel("All");
  };

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300  bg-gray-50`}
    >
      <Navbar pageName="Disbursement Tracking" />
      <Sidebar />
      <div className="p-6 max-w-6xl mx-auto">
        {isLoading && (
          <div className="min-h-[220px] bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600 text-sm">
                Loading disbursement details...
              </p>
            </div>
          </div>
        )}
        {!isLoading && !trackingDetailed && (
          <div className="min-h-[220px] bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm">
            <p className="text-gray-600 text-sm">No disbursement data found</p>
          </div>
        )}
        {!isLoading && trackingDetailed && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5 gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="group inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft
                  size={22}
                  className="group-hover:-translate-x-1 transition-transform"
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:bg-green-300 transition-colors"
                onClick={handleComplete}
                disabled={
                  isCompleting || scheduleInfo?.schedule_status === "Completed"
                }
              >
                {isCompleting ? (
                  <>
                    <span className="inline-block animate-spin mr-2">↻</span>
                    Completing...
                  </>
                ) : (
                  "Mark as Complete"
                )}
              </button>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
                onClick={handleExportToExcel}
              >
                Export to Excel
              </button>
            </div>
          </div>
        )}

        {scheduleInfo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="p-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
                      Disbursement Information
                    </h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 truncate">
                      {scheduleInfo.sched_title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100">
                        <span className="font-medium">Type:</span>
                        {
                          scheduleInfo.disbursement_schedules[0]
                            .disbursement_label
                        }
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded border border-gray-200">
                        <span className="font-medium">Schedule ID:</span>
                        {scheduleInfo.sched_id}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(scheduleInfo.schedule_status)}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 rounded-md border border-gray-200">
                  <div className="p-3">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Due Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {new Date(scheduleInfo.schedule_due).toLocaleDateString(
                        "en-US",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Event Type
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {scheduleInfo.event_type}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      School Year
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {scheduleInfo.event_sy_code}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      Semester
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {scheduleInfo.event_semester_code}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {scheduleInfo && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Students</h3>
                      <p className="text-xs text-gray-600">{`${filteredRows.length} of ${allStudentRows.length} students`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedYearLevel !== "All" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-300 px-2 py-1 rounded">
                            Year Level: {selectedYearLevel}
                            <button
                              onClick={() => setSelectedYearLevel("All")}
                              className="hover:text-gray-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}

                        {selectedBranch !== "All" && (
                          <span className="inline-flex items-center gap-1 text-xs bg-white border border-gray-300 px-2 py-1 rounded">
                            Branch: {selectedBranch}
                            <button
                              onClick={() => setSelectedBranch("All")}
                              className="hover:text-gray-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                        title="Reset filters"
                      >
                        <X className="w-4 h-4" />
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border ${
                        showFilters
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="pt-2">
                    <div className="flex gap-2 justify-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">
                          Year Level
                        </label>
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                          value={selectedYearLevel}
                          onChange={(e) => setSelectedYearLevel(e.target.value)}
                        >
                          <option value="All">All</option>
                          {uniqueYearLevels.map((yl) => (
                            <option key={yl} value={String(yl)}>
                              {yl}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">Branch</label>
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-28"
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                        >
                          <option value="All">All</option>
                          {uniqueBranches.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-[1]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Semester / SY
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scholarship Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Disbursement Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRows.map(({ schedule, student }, idx) => (
                    <tr
                      key={`${schedule.disb_sched_id}-${student.student_id}`}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {student.scholar_name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {student.yr_lvl}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {student.semester} - {student.school_year}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {schedule.branch_code}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            student.scholarship_status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : student.scholarship_status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {student.scholarship_status}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                        {getStatusBadge(student.disbursement_status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailedTracking;
