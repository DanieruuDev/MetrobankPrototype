import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FileDown, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import SYSemesterDropdown from "../maintainables/SYSemesterDropdown";

interface Student {
  student_id: number;
  student_name: string;
  campus: string;
  year_level: string;
  school_year: string;
  semester: string;
  program?: string;
}

interface DisbursementOption {
  id: number;
  label: string;
}

const ExcelDisbursementTemplateStandalone: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sySemesterValue, setSySemesterValue] = useState<string>("");
  const [selectedDisbursement, setSelectedDisbursement] =
    useState<DisbursementOption | null>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const disbursementOptions: DisbursementOption[] = [
    { id: 1, label: "Tuition Fee and Other School Fees" },
    { id: 2, label: "Semestral Allowance" },
    { id: 3, label: "Thesis Fee" },
    { id: 4, label: "Academic Excellence Award" },
    { id: 5, label: "Internship Allowance" },
  ];
  const [school_year, semester_code] = sySemesterValue.split("_");
  const parseSySemester = () => {
    const sy = school_year.replace("-", "");
    const sem = semester_code === "1" ? "1st" : "2nd";
    return { sy, sem };
  };

  const handleDownload = async () => {
    if (!selectedDisbursement) {
      toast.warning("Please select a disbursement type.");
      return;
    }
    if (!sySemesterValue) {
      toast.warning("Please select a school year and semester.");
      return;
    }

    const { sy, sem } = parseSySemester();
    setIsLoading(true);

    try {
      const res = await axios.get(
        `${VITE_BACKEND_URL}api/workflow/list/${selectedDisbursement.id}/${sy}/${semester_code}`
      );

      console.log(res.data);
      const students: Student[] = res.data;
      if (!students || students.length === 0) {
        toast.info("No students found for the selected criteria.");
        return;
      }

      // ✅ Sort alphabetically by name
      const sorted = [...students].sort((a, b) =>
        (a.student_name || "").localeCompare(b.student_name || "", "en", {
          sensitivity: "base",
        })
      );

      // ✅ Define headers
      const headers = [
        "Student ID",
        "Name",
        "Campus",
        "Program",
        `Year Level (${school_year} ${sem} semester)`,
        selectedDisbursement.label, // blank column
      ];

      // ✅ Build Excel data (amount column blank)
      const data = sorted.map((s) => ({
        "Student ID": s.student_id,
        Name: s.student_name,
        Campus: s.campus,
        Program: s.program || "-",
        [`Year Level (${school_year} ${sem} semester)`]: s.year_level,
        [selectedDisbursement.label]: "", // empty field
      }));

      // ✅ Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
      worksheet["!cols"] = headers.map((h) => ({ wch: h.length + 10 }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

      const safeLabel = selectedDisbursement.label.replace(/\s+/g, "_");
      const safeSemester = semester_code.replace(/\s+/g, "_");
      const fileName = `${safeLabel}_TEMPLATE_${sy}_${safeSemester}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success("Excel template downloaded successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error("❌ Error fetching student list:", error);
      toast.error("Failed to fetch student list.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white  rounded-lg text-[12px] font-medium shadow transition-all duration-200"
      >
        <FileDown className="w-4 h-4" />
        <span>Download Template</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative transition-all">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Download Disbursement Template
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Select a disbursement type and school year/semester.
            </p>

            {/* Disbursement Type */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Disbursement Type
            </label>
            <select
              value={selectedDisbursement?.id || ""}
              onChange={(e) => {
                const opt = disbursementOptions.find(
                  (o) => o.id === Number(e.target.value)
                );
                setSelectedDisbursement(opt || null);
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Select Type --</option>
              {disbursementOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* SY + Semester */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Year & Semester
            </label>
            <div className="mb-5">
              <SYSemesterDropdown
                value={sySemesterValue}
                onChange={setSySemesterValue}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isLoading ? "Generating..." : "Download"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExcelDisbursementTemplateStandalone;
