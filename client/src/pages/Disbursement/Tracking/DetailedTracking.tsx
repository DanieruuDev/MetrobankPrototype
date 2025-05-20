import { useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../../context/SidebarContext";
import * as XLSX from "xlsx-js-style"; // Changed to xlsx-js-style for styling support
import { ArrowLeft } from "lucide-react";

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

  useEffect(() => {
    const fetchTrackingDetailed = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<ITrackingDetailed[]>(
          `http://localhost:5000/api/disbursement/tracking/${disbursement_id}`
        );
        setTrackingDetailed(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackingDetailed();
  }, [disbursement_id]);

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

    // Status-specific styles with proper typing
    const statusStyles: StatusStyles = {
      // Scholarship Status
      ACTIVE: { fill: { fgColor: { rgb: "FFFF00" } } }, // Yellow
      INACTIVE: { fill: { fgColor: { rgb: "FFC000" } } }, // Orange
      PENDING: { fill: { fgColor: { rgb: "FFE699" } } }, // Light Yellow

      // Disbursement Status
      Completed: { fill: { fgColor: { rgb: "92D050" } } }, // Green
      "In Progress": { fill: { fgColor: { rgb: "00B0F0" } } }, // Blue
      "Not Started": { fill: { fgColor: { rgb: "FF0000" } } }, // Red
      Cancelled: { fill: { fgColor: { rgb: "7030A0" } } }, // Purple
    };

    // Helper function to safely get status style
    const getStatusStyle = (status: string) => {
      return (
        statusStyles[status as ScholarshipStatus | DisbursementStatus] || {}
      );
    };

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
        // Alternating row colors
        const rowStyle =
          index % 2 === 0
            ? { ...dataStyle, fill: { fgColor: { rgb: "FFFFFF" } } }
            : { ...dataStyle, fill: { fgColor: { rgb: "F2F2F2" } } };

        // Apply status-specific styles using the safe getter
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
            s: { ...currencyStyle, ...rowStyle }, // Apply peso format
          },
          {
            v: student.status,
            t: "s",
            s: { ...rowStyle, ...disbursementStyle },
          },
        ];
      }),
    ];

    // Summary Information
    const summaryInfo = [
      // Disbursement Info
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

      // Financial Details
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

      // Branch Information
      [{ v: "Branch Information", t: "s", s: titleStyle, $colSpan: 5 }],
      [
        { v: "Branch:", t: "s", s: { ...dataStyle, font: { bold: true } } },
        {
          v: scheduleInfo.branch.replace("-", " "),
          t: "s",
          s: dataStyle,
          $colSpan: 4,
        },
      ],

      // Spacer before student list
      [
        { v: "", t: "s", s: dataStyle },
        { v: "", t: "s", s: dataStyle },
        { v: "", t: "s", s: dataStyle },
        { v: "", t: "s", s: dataStyle },
        { v: "", t: "s", s: dataStyle },
      ],
      [{ v: "Student List", t: "s", s: titleStyle, $colSpan: 5 }],
    ];

    // Combine all data
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

    // Set merged cells for titles
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Disbursement Info title
      { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }, // Financial Details title
      { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } }, // Branch Info title
      { s: { r: 12, c: 0 }, e: { r: 12, c: 4 } }, // Student List title
    ];

    // Create workbook and export
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Disbursement Report");

    const fileName = `Disbursement_${scheduleInfo.disb_title.replace(
      /\s+/g,
      "_"
    )}_${disbursement_id}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // ... (rest of your component code remains exactly the same)
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "Not Started": "bg-gray-200 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
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
              ID: {disbursement_id}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:bg-green-500"
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
              className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600 hover:bg-white hover:text-blue-600 px-5 py-2 rounded-md transition"
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
                    {scheduleInfo.disb_title}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {new Date(
                      scheduleInfo.disbursement_date
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
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
                    ₱{Number(scheduleInfo.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total students:</span>
                  <span className="font-medium">{scheduleInfo.quantity}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Total amount:</span>
                  <span className="font-medium text-blue-600">
                    ₱
                    {(
                      Number(scheduleInfo.amount) * scheduleInfo.quantity
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
                  <p className="font-medium capitalize">
                    {scheduleInfo.branch.replace("-", " ")}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>
                    All students in this disbursement are from the same branch
                  </p>
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
                {trackingDetailed.map((student) => (
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
                          student.scholarship_status === "ACTIVE"
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

export default DetailedTracking;
