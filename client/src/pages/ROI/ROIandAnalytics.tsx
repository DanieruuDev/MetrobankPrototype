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

  // Icons
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

  const UsersIcon = () => (
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
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );

  // Mock Data
  const programData = [
    {
      program: "BSCS",
      roi_percentage: 40.0,
      total_investment: 14350000,
      total_return: 20090000,
      avg_break_even: 22.3,
      students_count: 35,
    },
    {
      program: "BSIT",
      roi_percentage: 35.0,
      total_investment: 17630000,
      total_return: 23800500,
      avg_break_even: 22.3,
      students_count: 43,
    },
  ];

  const campusData = [
    { campus: "STI Ortigas-Cainta", scholarCount: 20, roiPercentage: 38.0 },
    { campus: "STI Pasay-EDSA", scholarCount: 15, roiPercentage: 36.5 },
    { campus: "STI Global City", scholarCount: 10, roiPercentage: 39.0 },
    { campus: "STI Fairview", scholarCount: 18, roiPercentage: 37.5 },
    { campus: "STI Novaliches", scholarCount: 10, roiPercentage: 35.0 },
    { campus: "STI Sta. Mesa", scholarCount: 5, roiPercentage: 40.0 },
  ];

  // Calculate metrics
  const totalInvestment = programData.reduce(
    (sum, program) => sum + program.total_investment,
    0
  );
  const totalReturn = programData.reduce(
    (sum, program) => sum + program.total_return,
    0
  );
  const overallROI =
    totalInvestment === 0
      ? 0
      : ((totalReturn - totalInvestment) / totalInvestment) * 100;
  const totalBreakEvenMonths = programData.reduce(
    (sum, program) => sum + program.avg_break_even,
    0
  );
  const avgBreakEven =
    programData.length === 0 ? 0 : totalBreakEvenMonths / programData.length;
  const totalStudents = programData.reduce(
    (sum, program) => sum + program.students_count,
    0
  );
  const totalSavings = totalReturn - totalInvestment;
  const avgInvestmentPerStudent =
    totalStudents === 0 ? 0 : totalInvestment / totalStudents;
  const avgReturnPerStudent =
    totalStudents === 0 ? 0 : totalReturn / totalStudents;
  const avgSavingsPerStudent =
    totalStudents === 0 ? 0 : totalSavings / totalStudents;

  // Formatting functions
  const formatCurrencyShort = (value: number): string => {
    if (value === undefined || value === null) return "₱0";
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (absValue >= 1_000) return `₱${(value / 1000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  };

  const formatCurrencyAverage = (value: number): string => {
    if (value === undefined || value === null) return "₱0";
    const absValue = Math.abs(value);
    if (absValue >= 1_000_000) return `₱${(value / 1_000_000).toFixed(2)}M`;
    if (absValue >= 1_000) return `₱${(value / 1000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  };

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-all duration-300`}
    >
      <Navbar pageName="Scholarship Analytics" />
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="pt-2 p-6 flex-1 overflow-auto">
          <div className="max-w-[1900px] mx-auto">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Investment"
                value={formatCurrencyShort(totalInvestment)}
                change={5.2}
                icon={<DollarSignIcon />}
              />
              <MetricCard
                title="Scholarship Program ROI"
                value={`${overallROI.toFixed(1)}%`}
                change={3.7}
                icon={<PieChartIcon />}
              />
              <MetricCard
                title="Total Savings"
                value={formatCurrencyShort(totalSavings)}
                change={8.5}
                icon={<DollarSignIcon />}
              />

              <MetricCard
                title="Average Break-Even Length"
                value={`${avgBreakEven.toFixed(1)} Months`}
                change={-2.3}
                icon={<TrendingUpIcon />}
              />
              <MetricCard
                title="Avg Investment per Scholar"
                value={formatCurrencyAverage(avgInvestmentPerStudent)}
                change={-1.5}
                icon={<DollarSignIcon />}
              />
              <MetricCard
                title="Unique Active Scholars"
                value={totalStudents.toString()}
                change={0}
                icon={<UsersIcon />}
              />
              <MetricCard
                title="Avg Savings per Scholar"
                value={formatCurrencyAverage(avgSavingsPerStudent)}
                change={4.0}
                icon={<DollarSignIcon />}
              />
              <MetricCard
                title="Avg Return per Scholar"
                value={formatCurrencyAverage(avgReturnPerStudent)}
                change={2.1}
                icon={<TrendingUpIcon />}
              />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2 h-full">
                <h3 className="text-lg text-center font-semibold mb-4">
                  ROI Performance Over Time
                </h3>
                <div className="h-[350px]">
                  <LineGraph />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm lg:col-span-2 p-4 h-full">
                <DonutChartROI data={programData} />
              </div>
            </div>

            {/* Campus Bar Graph */}
            <div className="mt-6">
              <BarGraph data={campusData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIandAnalytics;
