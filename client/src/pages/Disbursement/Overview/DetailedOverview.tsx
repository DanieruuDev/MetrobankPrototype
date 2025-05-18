import React, { useState, useEffect } from "react";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import axios, { AxiosError } from "axios";

import { useSidebar } from "../../../context/SidebarContext";
import { ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";

export interface ScholarDisbursement {
  amount: string | null;
  completed_at: string | null;
  current_campus: string;
  current_scholarship_status: string;
  current_school_year: string;
  current_semester: string;
  current_yr_lvl: string;
  disbursement_date: string | null;
  disbursement_id: number;
  disbursement_school_year: string;
  disbursement_semester: string;
  disbursement_status: string;
  disbursement_type: string;
  disbursement_yr_lvl: string;
  required_hours: number | null;
  scholar_name: string;
  student_id: number;
}

interface TermGroup {
  school_year: string;
  semester: string;
  year_level: string;
  disbursements: ScholarDisbursement[];
}

const DetailedOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Added for navigation
  const [disbursements, setDisbursements] = useState<
    ScholarDisbursement[] | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTermIndex, setSelectedTermIndex] = useState<number>(0);
  const { collapsed } = useSidebar();

  // Make sure this is the ONLY formatCurrency function in your file
  const formatCurrency = (amount: number): string => {
    return (
      "Php " +
      amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const generatePDF = async () => {
    try {
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 40;

      // Set a font that supports the ₱ symbol
      pdf.addFont("helvetica", "Helvetica", "normal");
      pdf.setFont("helvetica");

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(15, 46, 89);
      pdf.text(
        `${currentScholar.scholar_name} - Disbursement History`,
        pageWidth / 2,
        margin,
        { align: "center" }
      );

      // Student info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Student ID: ${currentScholar.student_id}`, margin, margin + 40);
      pdf.text(`Campus: ${currentScholar.current_campus}`, margin, margin + 60);
      pdf.text(
        `Status: ${currentScholar.current_scholarship_status}`,
        margin,
        margin + 80
      );

      // Calculate totals
      const totalCompleted = allTerms.reduce((total, term) => {
        const completed = term.disbursements.filter(
          (d) => d.disbursement_status === "Completed"
        );
        return total + calculateTotalAmount(completed);
      }, 0);

      pdf.text(
        `Total Completed Disbursements: ${formatCurrency(totalCompleted)}`,
        margin,
        margin + 100
      );

      let yPosition = margin + 140;

      // Process terms
      for (const term of allTerms) {
        pdf.setFontSize(14);
        pdf.setTextColor(15, 46, 89);
        pdf.text(
          `${term.school_year} | ${term.semester} | ${term.year_level}`,
          margin,
          yPosition
        );
        yPosition += 30;

        // Table headers
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.setFillColor(15, 46, 89);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, "F");
        pdf.text("Type", margin + 10, yPosition + 15);
        pdf.text("Status", margin + 150, yPosition + 15);
        pdf.text("Amount", margin + 250, yPosition + 15);
        pdf.text("Date", margin + 350, yPosition + 15);
        yPosition += 30;

        // Disbursement rows
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        let rowColor = false;

        for (const item of term.disbursements) {
          if (rowColor) {
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, yPosition - 10, pageWidth - 2 * margin, 20, "F");
          }
          rowColor = !rowColor;

          pdf.text(item.disbursement_type, margin + 10, yPosition);
          pdf.text(item.disbursement_status, margin + 150, yPosition);

          // Fixed amount display with guaranteed ₱ symbol
          const amountValue =
            item.disbursement_status === "Completed" && item.amount
              ? parseFloat(item.amount)
              : 0;
          const displayAmount = formatCurrency(amountValue);

          pdf.text(displayAmount, margin + 250, yPosition);
          pdf.text(formatDate(item.disbursement_date), margin + 350, yPosition);
          yPosition += 20;

          if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            yPosition = margin;
          }
        }

        // Term total
        const termCompleted = term.disbursements
          .filter((d) => d.disbursement_status === "Completed")
          .reduce((sum, d) => sum + (d.amount ? parseFloat(d.amount) : 0), 0);

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, "bold");
        pdf.text("Term Total (Completed):", margin + 100, yPosition + 10);
        pdf.text(formatCurrency(termCompleted), margin + 250, yPosition + 10);
        yPosition += 40;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()} • Confidential`,
        margin,
        pdf.internal.pageSize.getHeight() - 20
      );

      pdf.save(`${currentScholar.scholar_name}_disbursements.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Make sure this is your only formatCurrency function in the file

  const fetchDisbursementData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/overview/history/${id}`
      );

      if (response.status === 200) {
        setDisbursements(response.data);
      } else {
        setError("Unexpected response status");
      }
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        setError("Server responded with error");
      } else if (axiosError.request) {
        setError("No response received");
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisbursementData();
  }, [id]);

  const organizeByTerms = (): TermGroup[] => {
    if (!disbursements || disbursements.length === 0) return [];

    const termMap = new Map<string, TermGroup>();

    disbursements.forEach((disburse) => {
      const termKey = `${disburse.disbursement_school_year}-${disburse.disbursement_semester}-${disburse.disbursement_yr_lvl}`;

      if (!termMap.has(termKey)) {
        termMap.set(termKey, {
          school_year: disburse.disbursement_school_year,
          semester: disburse.disbursement_semester,
          year_level: disburse.disbursement_yr_lvl,
          disbursements: [],
        });
      }

      termMap.get(termKey)!.disbursements.push(disburse);
    });

    // Sort terms by school_year and semester (newest first)
    return Array.from(termMap.values()).sort((a, b) => {
      if (a.school_year !== b.school_year) {
        return b.school_year.localeCompare(a.school_year);
      }
      return b.semester.localeCompare(a.semester);
    });
  };

  const calculateTotalAmount = (
    disbursements: ScholarDisbursement[]
  ): number => {
    return disbursements.reduce((total, disburse) => {
      return total + (disburse.amount ? parseFloat(disburse.amount) : 0);
    }, 0);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-700";
    let dotColor = "bg-gray-400";

    switch (status) {
      case "Completed":
        bgColor = "bg-green-50";
        textColor = "text-green-700";
        dotColor = "bg-green-500";
        break;
      case "In Progress":
        bgColor = "bg-yellow-50";
        textColor = "text-yellow-700";
        dotColor = "bg-yellow-500";
        break;
    }

    return (
      <div
        className={`inline-flex items-center ${bgColor} ${textColor} rounded-full py-1 px-3 text-xs`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mr-1.5`}></div>
        {status}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !disbursements || disbursements.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading Data
          </h2>
          <p className="mt-2 text-gray-600">
            {error || "Failed to load disbursement data"}
          </p>
          <button
            onClick={() => fetchDisbursementData()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const allTerms = organizeByTerms();
  const totalHistoricalAmount = allTerms.reduce((total, term) => {
    return total + calculateTotalAmount(term.disbursements);
  }, 0);

  const currentScholar = disbursements[0];
  const currentTerm = allTerms[selectedTermIndex];

  return (
    <div className="flex">
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } transition-[padding-left] duration-300 w-full`}
      >
        <Navbar pageName="Disbursement Overview" />

        <Sidebar />
        <div className="mt-4 px-8 pb-12 max-w-8xl mx-auto">
          {/* Back button and Scholar Profile Summary */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/financial-overview")}
              className="group flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft
                size={25}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>

            <div className="flex items-center justify-between mt-10">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold mr-4">
                  {currentScholar.scholar_name
                    .split(" ")
                    .map((name) => name[0])
                    .join("")}
                </div>
                <div>
                  <h1 className="text-xl font-semibold">
                    {currentScholar.scholar_name}
                  </h1>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <span>ID: {currentScholar.student_id}</span>
                    <span className="mx-2">•</span>
                    <span>{currentScholar.current_campus}</span>
                    <span className="mx-2">•</span>
                    <span>{currentScholar.current_yr_lvl}</span>
                    <span className="mx-2">•</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        currentScholar.current_scholarship_status === "Active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {currentScholar.current_scholarship_status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600 hover:bg-white hover:text-blue-600 px-5 py-2 rounded-2xl transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </button>
            </div>
          </div>

          {/* Rest of your component remains the same */}
          {/* Current Term & Total Assessment */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm text-gray-500 mb-1">Current Term</h3>
              <p className="text-lg font-medium">
                {currentScholar.current_school_year} |{" "}
                {currentScholar.current_semester}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm text-gray-500 mb-1">Total Assessment</h3>
              <p className="text-lg font-medium text-blue-600">
                {formatCurrency(totalHistoricalAmount)}
              </p>
            </div>
          </div>

          {/* Term Selection */}
          <div className="mb-6">
            <div className="flex space-x-1 overflow-x-auto pb-2">
              {allTerms.map((term, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${
                    selectedTermIndex === index
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedTermIndex(index)}
                >
                  {term.school_year} | {term.semester}
                </button>
              ))}
            </div>
          </div>

          {/* Disbursement Breakdown */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium">
                {currentTerm.school_year} | {currentTerm.semester} |{" "}
                {currentTerm.year_level}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Disbursement breakdown for selected term
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTerm.disbursements.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6 whitespace-nowrap font-medium">
                        {item.disbursement_type}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={item.disbursement_status} />
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap font-medium">
                        {item.amount
                          ? formatCurrency(parseFloat(item.amount))
                          : "—"}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-gray-500">
                        {formatDate(item.disbursement_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="py-3 px-6 font-medium">
                      Term Total
                    </td>
                    <td
                      colSpan={2}
                      className="py-3 px-6 font-medium text-blue-600"
                    >
                      {formatCurrency(
                        calculateTotalAmount(currentTerm.disbursements)
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Historical Summary */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-medium">Historical Disbursements</h2>
              <p className="text-sm text-gray-500 mt-1">Summary of all terms</p>
            </div>

            <div className="grid grid-cols-1 divide-y divide-gray-100">
              {allTerms.map((term, idx) => (
                <div
                  key={idx}
                  className={`p-6 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedTermIndex === idx ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedTermIndex(idx)}
                >
                  <div>
                    <h3 className="font-medium">
                      {term.school_year} | {term.semester}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {term.year_level} • {term.disbursements.length} items
                    </p>
                  </div>
                  <div className="font-medium text-blue-600">
                    {formatCurrency(calculateTotalAmount(term.disbursements))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedOverview;
