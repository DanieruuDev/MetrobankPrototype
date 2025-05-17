import React, { useState, useEffect } from "react";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import axios, { AxiosError } from "axios";
import ComingSoonDialog from "../../../components/shared/ComingSoonDialog";

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
  const navigate = useNavigate(); // Initialize useNavigate hook
  const [disbursements, setDisbursements] = useState<
    ScholarDisbursement[] | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTermIndex, setSelectedTermIndex] = useState<number>(0);
  const [collapsed, setCollapsed] = useState(false);

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
        setDisbursements([]); // Set to empty on unexpected status
      }
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        setError(`Server responded with error: ${axiosError.response.status}`); // More specific error
      } else if (axiosError.request) {
        setError("No response received from server");
      } else {
        setError("An unexpected error occurred");
      }
      setDisbursements([]); // Set to empty on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisbursementData();
  }, [id]); // Dependency array ensures fetch runs when ID changes

  const organizeByTerms = (): TermGroup[] => {
    if (!disbursements || disbursements.length === 0) return [];

    const termMap = new Map<string, TermGroup>();

    disbursements.forEach((disburse) => {
      const termKey = `${disburse.disbursement_school_year}-${disburse.disbursement_semester}-${disburse.disbursement_yr_lvl}`; // Include year level in key
      const termDisplay = `${disburse.disbursement_school_year} | ${disburse.disbursement_semester} | ${disburse.disbursement_yr_lvl}`; // Display format

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

    // Optional: Sort terms if needed (e.g., chronologically)
    const sortedTerms = Array.from(termMap.values()).sort((a, b) => {
      // Example sorting by school year and then semester
      const syA = parseInt(a.school_year.split("-")[0]);
      const syB = parseInt(b.school_year.split("-")[0]);
      if (syA !== syB) return syA - syB;
      const semOrder: Record<string, number> = {
        "1st": 1,
        "2nd": 2,
        Summer: 3,
      }; // Adjust based on your semester names
      return semOrder[a.semester] - semOrder[b.semester];
    });

    return sortedTerms;
  };

  const calculateTotalAmount = (
    disbursements: ScholarDisbursement[]
  ): number => {
    return disbursements.reduce((total, disburse) => {
      return total + (disburse.amount ? parseFloat(disburse.amount) : 0);
    }, 0);
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";

    // Try parsing as ISO date or date string
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date"; // Or return dateString if you prefer to show the raw value
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Reusing the StatusBadge component logic here
  const StatusBadge: React.FC<{ status: string | null }> = ({ status }) => {
    if (!status) return null; // Or return '—' as a string

    let bgColor = "bg-gray-100";
    let textColor = "text-gray-700";
    let dotColor = "bg-gray-400";

    switch (
      status.toLowerCase() // Use lower case for robust comparison
    ) {
      case "completed":
        bgColor = "bg-green-50";
        textColor = "text-green-700";
        dotColor = "bg-green-500";
        break;
      case "in progress": // Assuming this might be a status
        bgColor = "bg-yellow-50";
        textColor = "text-yellow-700";
        dotColor = "bg-yellow-500";
        break;
      case "pending": // Assuming 'Pending' is also a possibility
        bgColor = "bg-yellow-50";
        textColor = "text-yellow-700";
        dotColor = "bg-yellow-500";
        break;
      case "not started": // Assuming this might be a status
        bgColor = "bg-red-50"; // Or gray if preferred
        textColor = "text-red-700"; // Or gray
        dotColor = "bg-red-500"; // Or gray
        break;
      case "cancelled": // Assuming this might be a status
        bgColor = "bg-red-50";
        textColor = "text-red-700";
        dotColor = "bg-red-500";
        break;
      // Add other statuses if needed
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        {" "}
        {/* Added bg-gray-50 for consistency */}
        <div className="text-center">
          {/* Removed the animation div */}
          <p className="mt-4 text-gray-600">Loading disbursement details...</p>
        </div>
      </div>
    );
  }

  // Error or No data state
  if (error || !disbursements || disbursements.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          {error ? (
            <>
              <h2 className="text-xl font-semibold text-red-600">
                Error Loading Data
              </h2>
              <p className="mt-2 text-gray-600">{error}</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800">
                No Disbursement Data Found
              </h2>
              <p className="mt-2 text-gray-600">
                No historical disbursements found for scholar ID: {id}.
              </p>
            </>
          )}

          {/* Add Back button to error/empty state */}
          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition text-sm flex items-center justify-center mx-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const allTerms = organizeByTerms();
  // Calculate total historical amount from all terms
  const totalHistoricalAmount = allTerms.reduce((total, term) => {
    return total + calculateTotalAmount(term.disbursements);
  }, 0);

  const currentScholar = disbursements[0]; // Assuming all entries are for the same scholar
  // Ensure currentTerm exists before accessing its properties
  const currentTerm = allTerms[selectedTermIndex];

  return (
    <div className="flex">
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } transition-all duration-300 ease-in-out w-full bg-gray-50`}
      >
        <Navbar pageName="Disbursement Overview" /> {/* Navbar name */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="mt-4 px-8 pb-12 max-w-6xl mx-auto">
          {/* Scholar Profile Summary */}
          <div className="flex justify-between items-start mb-8">
            {" "}
            {/* Changed items-center to items-start for better alignment with back button */}
            {/* Back Button and Scholar Info */}
            <div>
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)} // Navigates to the previous page
                className="flex items-center text-gray-600 hover:text-gray-900 text-sm mb-4" // Added mb-4 for spacing
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Overview {/* Clarified button text */}
              </button>

              <div className="flex items-center">
                {" "}
                {/* Scholar Initials and Name */}
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold mr-4 flex-shrink-0">
                  {" "}
                  {/* Added flex-shrink-0 */}
                  {/* Safely get initials */}
                  {currentScholar.scholar_name
                    ?.split(" ")
                    .map((name) => name[0]?.toUpperCase()) // Use optional chaining and toUpperCase
                    .join("") || "?"}{" "}
                  {/* Fallback to "?" */}
                </div>
                <div>
                  <h1 className="text-xl font-semibold">
                    {currentScholar.scholar_name}
                  </h1>
                  <div className="flex items-center text-sm text-gray-500 mt-1 flex-wrap">
                    {" "}
                    {/* Added flex-wrap */}
                    <span>ID: {currentScholar.student_id}</span>
                    <span className="mx-2">•</span>
                    <span>{currentScholar.current_campus}</span>
                    <span className="mx-2">•</span>
                    <span>{currentScholar.current_yr_lvl}</span>
                    <span className="mx-2">•</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        currentScholar.current_scholarship_status.toUpperCase() ===
                        "ACTIVE" // Use toUpperCase for comparison
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700" // Assuming non-active is red
                      }`}
                    >
                      {currentScholar.current_scholarship_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Download PDF Button (uses ComingSoonDialog) */}
            <ComingSoonDialog
              triggerText="Download PDF"
              // Ensure the buttonClassName makes it visible - it seems correct
              buttonClassName="text-sm bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 px-4 py-2 rounded transition flex items-center justify-center" // Added justify-center
            />
          </div>

          {/* Current Term & Total Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm text-gray-500 mb-1">
                Current Term (from latest data)
              </h3>{" "}
              {/* Clarified label */}
              {currentScholar && ( // Use currentScholar for current term info
                <p className="text-lg font-medium">
                  {currentScholar.current_school_year} |{" "}
                  {currentScholar.current_semester}
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-sm text-gray-500 mb-1">
                Total Historical Assessment
              </h3>{" "}
              {/* Clarified label */}
              <p className="text-lg font-medium text-blue-600">
                {formatCurrency(totalHistoricalAmount)}
              </p>
            </div>
          </div>

          {/* Term Selection */}
          {/* Only show term selection if there's more than one term */}
          {allTerms.length > 1 && (
            <div className="mb-6">
              <div className="flex space-x-1 overflow-x-auto pb-2">
                {allTerms.map((term, index) => (
                  <button
                    key={index} // Using index as key is acceptable for this stable list of terms
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      selectedTermIndex === index
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setSelectedTermIndex(index)}
                  >
                    {term.school_year} | {term.semester} ({term.year_level}){" "}
                    {/* Added Year Level */}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disbursement Breakdown for Selected Term */}
          {/* Ensure currentTerm exists before rendering breakdown */}
          {currentTerm && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium">
                  Disbursement Breakdown ({currentTerm.school_year} |{" "}
                  {currentTerm.semester}) {/* Simplified title */}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Breakdown for the selected term ({currentTerm.year_level}){" "}
                  {/* Included Year Level */}
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
                    {currentTerm.disbursements.length > 0 ? ( // Check if there are disbursements for the term
                      currentTerm.disbursements.map((item, idx) => (
                        <tr
                          key={idx} // Index as key is okay here as term disbursements are likely static within a term
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-800">
                            {" "}
                            {/* Added text color */}
                            {item.disbursement_type}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap">
                            <StatusBadge status={item.disbursement_status} />{" "}
                            {/* Use StatusBadge component */}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap font-medium text-gray-800">
                            {" "}
                            {/* Added text color */}
                            {item.amount
                              ? formatCurrency(parseFloat(item.amount))
                              : "—"}
                          </td>
                          <td className="py-4 px-6 whitespace-nowrap text-gray-500">
                            {formatDate(item.disbursement_date)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-gray-500 py-8"
                        >
                          No disbursements recorded for this term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="py-3 px-6 font-semibold text-gray-700"
                      >
                        {" "}
                        {/* Adjusted font/color */}
                        Term Total
                      </td>
                      <td
                        colSpan={2}
                        className="py-3 px-6 font-semibold text-blue-600"
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
          )}

          {/* Historical Summary Section (Remains the same) */}
          {allTerms.length > 0 && ( // Only show if there are terms
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-medium">
                  Historical Disbursements Summary
                </h2>{" "}
                {/* Clarified title */}
                <p className="text-sm text-gray-500 mt-1">
                  Summary of all terms
                </p>
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
                      <h3 className="font-medium text-gray-800">
                        {" "}
                        {/* Added text color */}
                        {term.school_year} | {term.semester}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {term.year_level} • {term.disbursements.length} items
                      </p>
                    </div>
                    <div className="font-semibold text-blue-600">
                      {" "}
                      {/* Adjusted font */}
                      {formatCurrency(calculateTotalAmount(term.disbursements))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedOverview;
