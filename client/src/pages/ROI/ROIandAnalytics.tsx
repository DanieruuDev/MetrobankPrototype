import React from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import LineGraph from "../../components/charts/LineGraph";
import DonutChartROI from "../../components/charts/DonutChartROI";
import MetricCard from "../../components/shared/MetricCard";
import { useSidebar } from "../../context/SidebarContext";
import BarGraph from "../../components/charts/BarGraph";

const ROIandAnalytics: React.FC = () => {
  const { collapsed } = useSidebar();
  const DollarSignIcon = () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  const TrendingUpIcon = () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );

  const PieChartIcon = () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
      />
    </svg>
  );

  // Example of another icon you might need (add others as required)
  const UsersIcon = () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );

  // --- Hardcoded Data for Demonstration ---
  // Data scaled up so that the average investment per student is around ₱1M (Total Investment ~₱54M for 54 students).
  // In a real application, this data would be fetched from your backend API.
  const programData = [
    {
      program: "BSCS",
      roi_percentage: 45.0,
      total_investment: 29500000,
      total_return: 42775000,
      avg_break_even: 22.3,
      students_count: 24,
    },
    {
      program: "BSIT",
      roi_percentage: 38.0,
      total_investment: 24500000,
      total_return: 33810000,
      avg_break_even: 22.3,
      students_count: 30,
    },
  ];
  // --- End Hardcoded Data ---

  // Calculate total metrics based on programData
  const totalInvestment = programData.reduce(
    (sum, program) => sum + program.total_investment,
    0
  );
  const totalReturn = programData.reduce(
    (sum, program) => sum + program.total_return,
    0
  );
  // Ensure totalInvestment is not zero to avoid division by zero
  const overallROI =
    totalInvestment === 0
      ? 0
      : ((totalReturn - totalInvestment) / totalInvestment) * 100;

  const totalBreakEvenMonths = programData.reduce(
    (sum, program) => sum + program.avg_break_even,
    0
  );
  // Ensure programData has elements to avoid division by zero
  const avgBreakEven =
    programData.length === 0 ? 0 : totalBreakEvenMonths / programData.length;

  const totalStudents = programData.reduce(
    (sum, program) => sum + program.students_count,
    0
  ); // This is the count we'll use for "Unique Active Scholars"
  const totalSavings = totalReturn - totalInvestment;

  // --- Calculate Average Metrics per Student ---
  const avgInvestmentPerStudent =
    totalStudents === 0 ? 0 : totalInvestment / totalStudents;
  const avgReturnPerStudent =
    totalStudents === 0 ? 0 : totalReturn / totalStudents;
  const avgSavingsPerStudent =
    totalStudents === 0 ? 0 : totalSavings / totalStudents;
  // --- End Average Metrics Calculation ---

  // Formatting function
  const formatCurrencyShort = (value: number): string => {
    if (value === undefined || value === null) return "₱0";
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (absValue >= 1_000) return `₱${(value / 1000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  };

  // Formatting function for currency with potentially more precision for averages
  const formatCurrencyAverage = (value: number): string => {
    if (value === undefined || value === null) return "₱0";
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) return `₱${(value / 1_000_000).toFixed(2)}M`; // More precision for M
    if (absValue >= 1_000) return `₱${(value / 1000).toFixed(1)}K`; // Precision for K
    return `₱${value.toFixed(0)}`;
  };

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-all duration-300 `}
    >
      <Navbar pageName="ROI & Analytics" />
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="pt-2 p-6 flex-1 overflow-auto">
          <div className="max-w-[1900px] mx-auto">
            {/* Top Metrics Row */}
            {/* Adjusted grid to accommodate more cards - you might need to fine-tune this layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {" "}
              {/* Example: Added xl:grid-cols-4 */}
              {/* Original Metrics */}
              <MetricCard
                title="Total Investment"
                value={formatCurrencyShort(totalInvestment)} // Now will show ~₱54.0M
                change={5.2} // Example change percentage - replace with real data
                icon={<DollarSignIcon />} // Assuming DollarSignIcon is defined
              />
              <MetricCard
                title="Total Savings"
                value={formatCurrencyShort(totalSavings)} // Now will show ~₱22.6M
                change={8.5} // Example change percentage - replace with real data
                icon={<DollarSignIcon />} // Using DollarSignIcon again
              />
              <MetricCard
                title="Scholarship Program ROI"
                value={`${overallROI.toFixed(1)}%`} // Remains ~41.8%
                change={3.7} // Example change percentage - replace with real data
                icon={<PieChartIcon />} // Assuming PieChartIcon is defined
              />
              <MetricCard
                title="Average Break-Even Length"
                value={`${avgBreakEven.toFixed(1)} Months`} // Remains 22.3 Months
                change={-2.3} // Example change percentage - replace with real data
                icon={<TrendingUpIcon />} // Assuming TrendingUpIcon is defined
              />
              {/* Added Metrics */}
              {/* Changed title from "Total Students" to "Unique Active Scholars" */}
              <MetricCard
                title="Unique Active Scholars"
                value={totalStudents.toString()} // Value is still the sum of students_count
                change={0} // Assuming 0% change for student count example
                icon={<UsersIcon />} // Uses UsersIcon (assuming it's defined below)
              />
              <MetricCard
                title="Avg Investment per Scholar" // Changed "Student" to "Scholar" for consistency with model
                value={formatCurrencyAverage(avgInvestmentPerStudent)} // New metric
                change={-1.5} // Example change percentage - replace with real data
                icon={<DollarSignIcon />} // Example icon
              />
              <MetricCard
                title="Avg Return per Scholar" // Changed "Student" to "Scholar"
                value={formatCurrencyAverage(avgReturnPerStudent)} // New metric
                change={2.1} // Example change percentage - replace with real data
                icon={<TrendingUpIcon />} // Example icon
              />
              <MetricCard
                title="Avg Savings per Scholar" // Changed "Student" to "Scholar"
                value={formatCurrencyAverage(avgSavingsPerStudent)} // New metric
                change={4.0} // Example change percentage - replace with real data
                icon={<DollarSignIcon />} // Example icon
              />
              {/* You can add more MetricCard components here */}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column - Line Graph (2/3 width) */}
              <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2 h-full">
                <h3 className="text-lg text-center font-semibold mb-4">
                  ROI Performance Over Time
                </h3>
                <div className="h-[350px]">
                  {/* Pass time-series data to LineGraph */}
                  {/* <LineGraph data={timeSeriesROIdataScaled} /> */}
                  <LineGraph />{" "}
                  {/* Currently using placeholder or internal data */}
                </div>
              </div>

              {/* Right Column - Donut Chart (1/3 width) */}
              <div className="bg-white rounded-lg shadow-sm lg:col-span-2 p-4 h-full">
                {/* Pass programData to DonutChartROI */}
                {/* Ensure DonutChartROI is updated to accept and use this prop */}
                <DonutChartROI data={programData} />
              </div>
            </div>

            <div>
              <BarGraph />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple icon components (replace with your actual icons) - kept as is

export default ROIandAnalytics;
