import { useParams } from "react-router-dom";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import * as XLSX from "xlsx";
import { ArrowLeft } from "lucide-react";

interface IStudentInfo {
  student_id: number;
  scholar_name: string;
  scholarship_status: string;
  amount: string;
  status: string;
}

interface ITrackingDetailed {
  disb_sched_id: number;
  disb_title: string;
  disbursement_date: string;
  branch: string;
  disbursement_label: string;
  status: string;
  student_count: number;
  students: IStudentInfo[]; // JSON array from backend
}

function ScheduleDetailedTracking() {
  const { sched_id } = useParams<{ sched_id: string }>();
  const [trackingDetailed, setTrackingDetailed] =
    useState<ITrackingDetailed | null>(null);
  const { collapsed } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<ITrackingDetailed>(
          `http://localhost:5000/api/disbursement/tracking/${sched_id}`
        );
        setTrackingDetailed(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sched_id]);

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await axios.put(
        `http://localhost:5000/api/disbursement/tracking/complete/${sched_id}`
      );
      const response = await axios.get<ITrackingDetailed>(
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
    if (!trackingDetailed || trackingDetailed.students.length === 0) return;

    const scheduleInfo = trackingDetailed;

    // Header row
    const studentData = [
      [
        "Student ID",
        "Name",
        "Scholarship Status",
        "Amount",
        "Disbursement Status",
      ],
      ...scheduleInfo.students.map((student) => [
        student.student_id,
        student.scholar_name,
        student.scholarship_status,
        Number(student.amount),
        student.status,
      ]),
    ];

    // Summary Information
    const summaryInfo = [
      ["Disbursement Information"],
      ["Title:", scheduleInfo.disb_title],
      [
        "Date:",
        new Date(scheduleInfo.disbursement_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        }),
      ],
      ["Status:", scheduleInfo.status],
      ["Branch:", scheduleInfo.branch],
      ["Disbursement Label:", scheduleInfo.disbursement_label || ""],
      [],
      ["Financial Details"],
      ["Amount per student:", Number(scheduleInfo.students[0]?.amount) || 0],
      ["Total Students:", scheduleInfo.student_count],
      [
        "Total Amount:",
        (Number(scheduleInfo.students[0]?.amount) || 0) *
          scheduleInfo.student_count,
      ],
      [],
    ];

    // Combine data
    const fullData = [...summaryInfo, ...studentData];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(fullData);

    // Set column widths
    ws["!cols"] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disbursement Report");

    // Filename
    const fileName = `Disbursement_${scheduleInfo.disb_title.replace(
      /\s+/g,
      "_"
    )}_${sched_id}.xlsx`;

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
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } bg-gray-50 min-h-screen`}
      >
        <Navbar pageName="Schedule & Tracking Details" />
        <Sidebar />
        <div className="p-6 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Loading disbursement details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingDetailed) {
    return (
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } bg-gray-50 min-h-screen`}
      >
        <Navbar pageName="Schedule & Tracking Details" />
        <Sidebar />
        <div className="p-6 max-w-6xl mx-auto">
          <p className="text-center text-gray-500">No data available.</p>
        </div>
      </div>
    );
  }

  const scheduleInfo = trackingDetailed;

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300 bg-gray-50`}
    >
      <Navbar pageName="Schedule & Tracking Details" />
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
              disabled={isCompleting || scheduleInfo?.status === "Completed"}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-2">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-500 mb-2">
              Disbursement Information
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-lg font-semibold">
                  {scheduleInfo.disb_title}
                </p>
                <p className="text-[14px] mb-2 font-semibold">
                  Type: {scheduleInfo.disbursement_label}
                </p>
                <p className="text-gray-600 text-sm">
                  {new Date(scheduleInfo.disbursement_date).toLocaleDateString(
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
                {getStatusBadge(scheduleInfo.status)}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-500 mb-2">
              Financial Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount per student:</span>
                <span className="font-medium">
                  ₱
                  {Number(
                    scheduleInfo.students[0]?.amount || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total students:</span>
                <span className="font-medium">
                  {scheduleInfo.student_count}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-500">Total amount:</span>
                <span className="font-medium text-blue-600">
                  ₱
                  {(
                    (Number(scheduleInfo.students[0]?.amount) || 0) *
                    scheduleInfo.student_count
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-500 mb-2">
              Branch Information
            </h3>
            <div className="space-y-2">
              <div>
                <p className="font-medium capitalize">{scheduleInfo.branch}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>
                  All students in this disbursement are from the same branch
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold">
              Student List ({scheduleInfo.student_count ?? 0})
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
                    Scholarship Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disbursement Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduleInfo.students.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.scholar_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          student.scholarship_status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {student.scholarship_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₱{Number(student.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStatusBadge(student.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleDetailedTracking;
