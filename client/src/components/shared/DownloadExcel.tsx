import React from "react";
import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";

interface Student {
  student_id: number;
  scholar_name: string;
  campus: string;
  year_level: string;
  school_year: string;
  semester: string;
  disbursement_amount: number | null;
  disbursement_label: string;
  program?: string;
}

interface ExcelDownloadButtonProps {
  students: Student[];
  schoolYear: string;
  semester: string;
  disbursementLabel: string; // ✅ e.g. “Tuition Fee and Other School Fees”
}

const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({
  students,
  schoolYear,
  semester,
  disbursementLabel,
}) => {
  const handleDownload = () => {
    if (!students || students.length === 0) {
      alert("No student data to export.");
      return;
    }

    // ✅ Sort alphabetically by Name
    const sortedStudents = [...students].sort((a, b) =>
      a.scholar_name.localeCompare(b.scholar_name, "en", {
        sensitivity: "base",
      })
    );

    // ✅ Define headers dynamically
    const headers = [
      "Student ID",
      "Name",
      "Campus",
      "Program",
      `Year Level (${schoolYear} ${semester})`,
      disbursementLabel,
    ];

    // ✅ Map sorted data
    const data = sortedStudents.map((s) => ({
      "Student ID": s.student_id,
      Name: s.scholar_name,
      Campus: s.campus,
      Program: s.program || "-",
      [`Year Level (${schoolYear} ${semester})`]: s.year_level,
      [disbursementLabel]:
        s.disbursement_amount !== null
          ? `₱${s.disbursement_amount.toLocaleString()}`
          : "N/A",
    }));

    // ✅ Create Excel sheet
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // ✅ Auto column width
    worksheet["!cols"] = headers.map((h) => ({ wch: h.length + 10 }));

    // ✅ Proper filename
    const safeSemester = semester.replace(/\s+/g, "_");
    const safeLabel = disbursementLabel.replace(/\s+/g, "_");
    const fileName = `${safeLabel}_${schoolYear}_${safeSemester}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow transition-all duration-200"
    >
      <FileDown className="w-4 h-4" />
      <span>Download Excel</span>
    </button>
  );
};

export default ExcelDownloadButton;
