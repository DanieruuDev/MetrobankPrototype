import React, { useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import LineGraph from "../../components/charts/LineGraph";
// DonutChartROI import removed as requested
import MetricCard from "../../components/shared/MetricCard";
import { useSidebar } from "../../context/SidebarContext";

interface ProgramAnalytic {
  program: string;
  roi_percentage: number;
  total_investment: number;
  students_count: number;
}

// ⚠️ NEW: Retention Projection Card Component (Defined before main component for structure)
interface RetentionProjectionProps {
  avgBreakEven: number;
  TrendingUpIcon: React.FC<{ className?: string }>;
}

const RetentionProjectionCard: React.FC<RetentionProjectionProps> = ({
  avgBreakEven,
  TrendingUpIcon,
}) => {
  // Determine key retention milestones (in months)
  const breakEvenMonths = Math.ceil(avgBreakEven);
  const breakEvenDays = Math.ceil(avgBreakEven * 30.44); // 30.44 is average days in a month

  // Profit threshold 1: Break-even + 1 year
  const profitThreshold1 = Math.ceil(avgBreakEven + 12);
  // Profit threshold 2: Break-even + 3 years
  const profitThreshold2 = Math.ceil(avgBreakEven + 36);

  // Generate the core conclusion sentence
  let conclusionText = "";

  // ⚠️ UPDATED LOGIC HERE
  if (avgBreakEven <= 0) {
    conclusionText =
      "The program is profitable from Day 1, indicating initial profit or cost avoidance exceeds the total investment.";
  } else if (avgBreakEven < 1) {
    conclusionText = `To reach the break-even point, the average scholar must stay with the company for a minimum of ${breakEvenDays} days (less than a month).`;
  } else {
    conclusionText = `To reach the break-even point, the average scholar must stay with the company for a minimum of ${breakEvenMonths} months (or ${avgBreakEven.toFixed(
      1
    )} months).`;
  }
  // ⚠️ END OF UPDATED LOGIC

  // Generate predictive statements
  const predictiveStatements = [
    {
      time: `${profitThreshold1} months (${(profitThreshold1 / 12).toFixed(
        1
      )} years)`,
      status: "The program generates significant profit and ROI increases.",
      color: "text-yellow-600",
    },
    {
      time: `${profitThreshold2} months (${(profitThreshold2 / 12).toFixed(
        1
      )} years)`,
      status: "The program achieves long-term exponential return (high ROI).",
      color: "text-green-600",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-blue-500 h-full flex flex-col justify-between">
      <div>
        {/* ⚠️ CHANGE: Updated Title */}
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <TrendingUpIcon className="w-6 h-6 mr-2 text-blue-600" />
          Employee Service Impact & Profit Projection
        </h3>
        <p className="text-lg font-semibold text-gray-700 mb-6">
          {conclusionText}
        </p>

        <h4 className="text-md font-semibold text-gray-600 mb-2 border-b pb-1">
          Financial Status Based on Service Period:
        </h4>
        <div className="space-y-3">
          {/* Key Threshold 1: Initial Profit */}
          <div className="flex items-start">
            {/* ⚠️ CHANGE: Updated Label */}
            <span className="text-sm font-medium w-32 text-gray-500">
              Service until {predictiveStatements[0].time}:
            </span>
            <span
              className={`text-md font-bold ${predictiveStatements[0].color} ml-4`}
            >
              {predictiveStatements[0].status}
            </span>
          </div>

          {/* Key Threshold 2: Long-Term Profit */}
          <div className="flex items-start">
            {/* ⚠️ CHANGE: Updated Label */}
            <span className="text-sm font-medium w-32 text-gray-500">
              Service until {predictiveStatements[1].time}:
            </span>
            <span
              className={`text-md font-bold ${predictiveStatements[1].color} ml-4`}
            >
              {predictiveStatements[1].status}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-4 pt-2 border-t">
        *Projections are based on the current EHC and Monthly Value per Scholar
        inputs.
      </p>
    </div>
  );
};
// ⚠️ END of Retention Projection Card Component

const ROIandAnalytics: React.FC = () => {
  const { collapsed } = useSidebar(); // --- 1. STATE FOR USER INPUTS --- // ⚠️ CHANGE: Updated initial values based on your request

  const [estimatedEHCCost, setEstimatedEHCCost] = useState<number>(300000);
  const [avgMonthlyValuePerScholarInput, setAvgMonthlyValuePerScholarInput] =
    useState<number>(5000); // --- 2. HARDCODED MOCK DATA ---

  const programData: ProgramAnalytic[] = [
    {
      program: "BSCS",
      roi_percentage: 40.0,
      total_investment: 14350000,
      students_count: 35,
    },
    {
      program: "BSIT",
      roi_percentage: 35.0,
      total_investment: 17630000,
      students_count: 43,
    },
  ]; // --- 3. CALCULATE METRICS ---

  const totalInvestment = programData.reduce(
    (sum, program) => sum + program.total_investment,
    0
  );
  const totalStudents = programData.reduce(
    (sum, program) => sum + program.students_count,
    0
  );

  const totalMonthlyGain = avgMonthlyValuePerScholarInput * totalStudents;
  const totalAnnualGain = totalMonthlyGain * 12;

  const totalCostAvoidanceEHC = estimatedEHCCost * totalStudents;

  const totalAnnualReturn = totalAnnualGain + totalCostAvoidanceEHC;

  const totalSavingsOrProfit = totalAnnualReturn - totalInvestment;

  const overallROI =
    totalInvestment === 0 ? 0 : (totalSavingsOrProfit / totalInvestment) * 100; // BREAK-EVEN CALCULATION (Months)

  const netInvestmentToRecover = totalInvestment - totalCostAvoidanceEHC;

  const avgBreakEven =
    totalMonthlyGain <= 0 || netInvestmentToRecover <= 0
      ? 0
      : netInvestmentToRecover / totalMonthlyGain;

  const avgInvestmentPerScholar =
    totalStudents === 0 ? 0 : totalInvestment / totalStudents; // --- 4. DATA STRUCTURES FOR CHARTS --- // Dynamic ROI Time Series for Break-Even Chart

  const generateROISeries = (months: number) => {
    const series = []; // Initial net value is the cost of investment offset by EHC avoidance
    let cumulativeNetValue = -totalInvestment + totalCostAvoidanceEHC;

    series.push({ month: 0, net_value: cumulativeNetValue });

    for (let i = 1; i <= months; i++) {
      cumulativeNetValue += totalMonthlyGain; // Use the Monthly Gain (value generated)
      series.push({ month: i, net_value: cumulativeNetValue });
    }
    return series;
  }; // Generate data for 60 months (5 years)

  const roiTimeSeries = generateROISeries(60); // --- ICONS (Defined locally) ---

  const DollarSignIcon: React.FC<{ className?: string }> = (props) => (
    <svg
      className={props.className || "w-6 h-6"}
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
  const TrendingUpIcon: React.FC<{ className?: string }> = (props) => (
    <svg
      className={props.className || "w-6 h-6"}
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
  const PieChartIcon: React.FC<{ className?: string }> = (props) => (
    <svg
      className={props.className || "w-6 h-6"}
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
  ); // --- FORMATTING FUNCTIONS ---

  const formatCurrencyShort = (value: number): string => {
    if (value === undefined || value === null) return "₱0";
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (absValue >= 1_000_000)
      return `${sign}₱${(absValue / 1_000_000).toFixed(1)}M`;
    if (absValue >= 1_000) return `${sign}₱${(absValue / 1000).toFixed(1)}K`;
    return `${sign}₱${absValue.toFixed(0)}`;
  };

  const formatCurrencyAverage = (value: number): string => {
    if (value === undefined || value === null) return "₱0";
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (absValue >= 1_000_000)
      return `${sign}₱${(absValue / 1_000_000).toFixed(2)}M`;
    if (absValue >= 1_000) return `${sign}₱${(absValue / 1000).toFixed(1)}K`;
    return `${sign}₱${absValue.toFixed(0)}`;
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<number>>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = parseFloat(event.target.value.replace(/[^0-9.]/g, "")) || 0; // ⚠️ NEW LOGIC: Prevent zero or negative values for financial metrics
      if (value <= 0) {
        value = 1; // Default to a minimal value of 1
      }
      setter(value);
    };

  return (
    <div
      className={`${
        collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
      } transition-all duration-300`}
    >
      <Navbar pageName="Scholarship Analytics" />{" "}
      <div className="pt-2 px-6 max-w-[1900px] mx-auto">
        {" "}
        <p className="text-gray-600 mb-6">
          This page provides a comprehensive overview of the scholarship
          program's financial impact. It tracks the total investment and
          calculates the hiring cost savings per scholar by comparing the value
          they return to the estimated cost of hiring from external sources.{" "}
        </p>
        {/* INPUTS SECTION - Now a 2-column grid */}{" "}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {" "}
          <div className="flex flex-col">
            {" "}
            <label
              htmlFor="ehc-input"
              className="text-sm font-medium text-blue-700 mb-1"
            >
              Estimated External Hiring Cost (EHC) per Employee Hire{" "}
            </label>{" "}
            <input
              id="ehc-input"
              type="number"
              value={estimatedEHCCost}
              onChange={handleInputChange(setEstimatedEHCCost)}
              placeholder="e.g., 550000"
              className="p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />{" "}
            <p className="text-xs text-gray-500 mt-1">
              This value is treated as an initial gain/cost avoidance per
              successful hire.{" "}
            </p>{" "}
          </div>{" "}
          <div className="flex flex-col">
            {" "}
            <label
              htmlFor="return-input"
              className="text-sm font-medium text-blue-700 mb-1"
            >
              Average monthly value per scholar (Gains from Investment +
              Post-Absorption){" "}
            </label>{" "}
            <input
              id="return-input"
              type="number"
              value={avgMonthlyValuePerScholarInput}
              onChange={handleInputChange(setAvgMonthlyValuePerScholarInput)}
              placeholder="e.g., 60000"
              className="p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
            />{" "}
            <p className="text-xs text-gray-500 mt-1">
              This value drives the Total ROI (Annualized) and Break-Even
              Length.{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>
      <Sidebar />{" "}
      <div className="flex-1 flex flex-col">
        {" "}
        <div className="pt-2 p-6 flex-1 overflow-auto">
          {" "}
          <div className="max-w-[1900px] mx-auto">
            {/* TOP METRICS ROW - Reduced to 6 cards */}{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
              {" "}
              <MetricCard
                title="Total Investment (Annualized)"
                value={formatCurrencyShort(totalInvestment)}
                icon={<DollarSignIcon />}
                change={0}
              />{" "}
              <MetricCard
                title="Scholarship Program ROI (Annualized)"
                value={`${overallROI.toFixed(1)}%`}
                icon={<PieChartIcon />}
              />{" "}
              <MetricCard
                title="Total Annual Profit/Savings"
                value={formatCurrencyShort(totalSavingsOrProfit)}
                icon={<DollarSignIcon />}
              />{" "}
              <MetricCard
                title="Total Initial Savings (EHC Avoidance)"
                value={formatCurrencyShort(totalCostAvoidanceEHC)}
                icon={<DollarSignIcon />}
              />{" "}
              <MetricCard
                title="Average Break-Even Length"
                value={`${avgBreakEven.toFixed(1)} Months`}
                icon={<TrendingUpIcon />}
              />{" "}
              <MetricCard
                title="Avg Investment per Scholar"
                value={formatCurrencyAverage(avgInvestmentPerScholar)}
                icon={<DollarSignIcon />}
                change={0}
              />{" "}
            </div>
            {/* Main Charts Row */}{" "}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {" "}
              <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2 h-full">
                {" "}
                <h3 className="text-lg text-center font-semibold mb-4">
                  Cumulative Net Value Over Time (Break-Even Analysis){" "}
                </h3>{" "}
                <div className="h-[350px]">
                  <LineGraph data={roiTimeSeries} />{" "}
                </div>{" "}
              </div>{" "}
              <div className="lg:col-span-2">
                {/* REPLACEMENT FOR DONUT CHART */}{" "}
                <RetentionProjectionCard
                  avgBreakEven={avgBreakEven}
                  TrendingUpIcon={TrendingUpIcon}
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};

export default ROIandAnalytics;
