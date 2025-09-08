import { useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../../context/SidebarContext";
import * as XLSX from "xlsx";
import { ArrowLeft } from "lucide-react";

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
      const response = await axios.get<ITrackingDetailed[]>(
        `http://localhost:5000/api/disbursement/tracking/${sched_id}`
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

  if (isLoading) {
    return (
      <div className="pl-[250px] pt-[73px] min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disbursement details...</p>
        </div>
      </div>
    );
  }

  if (!trackingDetailed) {
    return (
      <div className="pl-[250px] pt-[73px] min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No disbursement data found</p>
        </div>
      </div>
    );
  }

  const scheduleInfo = trackingDetailed?.[0];

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300  bg-gray-50`}
    >
      <Navbar pageName="Disbursement Tracking" />
      <Sidebar />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft
                size={25}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>
            <span className="text-gray-600 text-sm pb-4 ml-1">
              ID: {sched_id}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:bg-green-300"
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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={handleExportToExcel}
            >
              Export to Excel
            </button>
          </div>
        </div>

        {scheduleInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-2">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-gray-500 mb-2">
                Disbursement Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-lg font-semibold">
                    {scheduleInfo.sched_title}
                  </p>
                  <p className="text-[14px] mb-2 font-semibold">
                    Type:{" "}
                    {scheduleInfo.disbursement_schedules[0].disbursement_label}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {new Date(scheduleInfo.schedule_due).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                      }
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  {getStatusBadge(scheduleInfo.schedule_status)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold">
              Student List ({trackingDetailed.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleInfo.disbursement_schedules.flatMap((schedule) =>
                  schedule.students.map((student) => (
                    <tr
                      key={`${schedule.disb_sched_id}-${student.student_id}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.student_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.scholar_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.yr_lvl}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.semester} - {student.school_year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.campus}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getStatusBadge(student.disbursement_status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailedTracking;
