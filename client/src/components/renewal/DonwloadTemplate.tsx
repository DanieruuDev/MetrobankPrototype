import React from "react";
import * as XLSX from "xlsx";

type DownloadTemplateProps = {
  fileName?: string; // defaults to "template.xlsx"
  headers: string[];
  sampleData?: (string | number)[][];
};

const DownloadTemplate: React.FC<DownloadTemplateProps> = ({
  fileName = "template.xlsx",
  headers,
  sampleData = [],
}) => {
  const handleDownload = () => {
    // Prepare worksheet data
    const worksheetData = [headers, ...sampleData];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Write workbook to array buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Create blob
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
    >
      Download Template
    </button>
  );
};

export default DownloadTemplate;
