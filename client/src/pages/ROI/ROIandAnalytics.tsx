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
  // Determine key retention milestones (in years)
  const breakEvenYears = Math.ceil(avgBreakEven);
  const breakEvenMonths = Math.ceil(avgBreakEven * 12);

  // Profit threshold 1: Break-even + 1 year
  const profitThreshold1 = Math.ceil(avgBreakEven + 1);
  // Profit threshold 2: Break-even + 3 years
  const profitThreshold2 = Math.ceil(avgBreakEven + 3);

  // Generate the core conclusion sentence
  let conclusionText = "";

  // ⚠️ UPDATED LOGIC HERE
  if (avgBreakEven <= 0) {
    conclusionText =
      "The program is profitable from Day 1, indicating initial profit or cost avoidance exceeds the total investment.";
  } else if (avgBreakEven < 1) {
    conclusionText = `To reach the break-even point, the average scholar must stay with the company for a minimum of ${breakEvenMonths} months (less than a year).`;
  } else {
    conclusionText = `To reach the break-even point, the average scholar must stay with the company for a minimum of ${breakEvenYears} years (or ${avgBreakEven.toFixed(
      1
    )} years).`;
  }
  // ⚠️ END OF UPDATED LOGIC

  // Generate predictive statements
  const predictiveStatements = [
    {
      time: `${profitThreshold1} years`,
      status: "The program generates significant profit and ROI increases.",
      color: "text-yellow-600",
    },
    {
      time: `${profitThreshold2} years`,
      status: "The program achieves long-term exponential return (high ROI).",
      color: "text-green-600",
    },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-4 sm:p-6 border border-white/20 h-full flex flex-col justify-between">
      <div>
        {/* ⚠️ CHANGE: Updated Title */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600" />
          <span className="hidden xs:inline">
            Employee Service Impact & Profit Projection
          </span>
          <span className="xs:hidden">Service Impact & Profit</span>
        </h3>
        <p className="text-sm sm:text-lg font-semibold text-gray-700 mb-4 sm:mb-6 leading-relaxed">
          {conclusionText}
        </p>

        <h4 className="text-sm sm:text-md font-semibold text-gray-600 mb-2 border-b pb-1">
          Financial Status Based on Service Period:
        </h4>
        <div className="space-y-2 sm:space-y-3">
          {/* Key Threshold 1: Initial Profit */}
          <div className="flex flex-col xs:flex-row xs:items-start">
            {/* ⚠️ CHANGE: Updated Label */}
            <span className="text-xs sm:text-sm font-medium xs:w-32 text-gray-500 mb-1 xs:mb-0">
              Service until {predictiveStatements[0].time}:
            </span>
            <span
              className={`text-sm sm:text-md font-bold ${predictiveStatements[0].color} xs:ml-4`}
            >
              {predictiveStatements[0].status}
            </span>
          </div>

          {/* Key Threshold 2: Long-Term Profit */}
          <div className="flex flex-col xs:flex-row xs:items-start">
            {/* ⚠️ CHANGE: Updated Label */}
            <span className="text-xs sm:text-sm font-medium xs:w-32 text-gray-500 mb-1 xs:mb-0">
              Service until {predictiveStatements[1].time}:
            </span>
            <span
              className={`text-sm sm:text-md font-bold ${predictiveStatements[1].color} xs:ml-4`}
            >
              {predictiveStatements[1].status}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3 sm:mt-4 pt-2 border-t">
        *Projections are based on the current Yearly Hiring Cost, Absorption
        Rate, and Yearly Value Generated inputs.
      </p>
    </div>
  );
};
// ⚠️ END of Retention Projection Card Component

const ROIandAnalytics: React.FC = () => {
  const { collapsed } = useSidebar(); // --- 1. STATE FOR USER INPUTS --- // ⚠️ CHANGE: Updated initial values based on your request

  const [avgYearlyExternalHiringCost, setAvgYearlyExternalHiringCost] =
    useState<number>(300000);
  const [scholarAbsorptionRate, setScholarAbsorptionRate] =
    useState<number>(0.5); // 50% default
  const [yearlyValueGenerated, setYearlyValueGenerated] =
    useState<number>(60000); // ₱60K per scholar per year
  const [scholarRetentionRate] = useState<number>(0.85); // 85% default retention rate
  const [selectedPredictionYear, setSelectedPredictionYear] =
    useState<number>(5); // AI Prediction year selector

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

  // Calculate actual hired scholars based on absorption rate
  const actualHiredScholars = Math.round(totalStudents * scholarAbsorptionRate);

  // Calculate yearly gains from hired scholars
  const totalYearlyGain = yearlyValueGenerated * actualHiredScholars;

  // Calculate hiring cost savings from hired scholars
  const totalHiringCostSavings =
    avgYearlyExternalHiringCost * actualHiredScholars;

  // Total annual return (value generated + hiring cost savings)
  const totalAnnualReturn = totalYearlyGain + totalHiringCostSavings;

  // Net profit/savings
  const totalSavingsOrProfit = totalAnnualReturn - totalInvestment;

  // ROI calculation
  const overallROI =
    totalInvestment === 0 ? 0 : (totalSavingsOrProfit / totalInvestment) * 100;

  // Break-even calculation (years)
  const netInvestmentToRecover = totalInvestment - totalHiringCostSavings;
  const avgBreakEvenYears =
    totalYearlyGain <= 0 || netInvestmentToRecover <= 0
      ? 0
      : netInvestmentToRecover / totalYearlyGain;

  const avgInvestmentPerScholar =
    totalStudents === 0 ? 0 : totalInvestment / totalStudents; // --- 4. DATA STRUCTURES FOR CHARTS --- // Dynamic ROI Time Series for Break-Even Chart

  const generateROISeries = (years: number) => {
    const series = []; // Initial net value is the cost of investment offset by hiring cost savings
    let cumulativeNetValue = -totalInvestment + totalHiringCostSavings;

    series.push({ year: 0, net_value: cumulativeNetValue });

    for (let i = 1; i <= years; i++) {
      cumulativeNetValue += totalYearlyGain; // Use the Yearly Gain (value generated)
      series.push({ year: i, net_value: cumulativeNetValue });
    }
    return series;
  }; // Generate data for 10 years

  const roiTimeSeries = generateROISeries(10);

  // --- AI PREDICTION CALCULATION ---
  const calculateAIPrediction = (selectedYear: number) => {
    // 1. Calculate scholars still retained by year X (exponential decay)
    const scholarsRetainedAtYearX =
      actualHiredScholars * Math.pow(scholarRetentionRate, selectedYear);

    // 2. Calculate cumulative value generated from Year 1 to Year X
    let cumulativeValueGenerated = 0;
    for (let year = 1; year <= selectedYear; year++) {
      const scholarsAtYear =
        actualHiredScholars * Math.pow(scholarRetentionRate, year);
      cumulativeValueGenerated += scholarsAtYear * yearlyValueGenerated;
    }

    // 3. Initial hiring cost savings (one-time benefit at Year 0)
    const initialHiringSavings = totalHiringCostSavings;

    // 4. Calculate net value at year X
    const netValueAtYearX =
      -totalInvestment + initialHiringSavings + cumulativeValueGenerated;

    // 5. Calculate ROI at year X
    const roiAtYearX =
      totalInvestment === 0 ? 0 : (netValueAtYearX / totalInvestment) * 100;

    // 6. Break-even status
    const hasReachedBreakEven = netValueAtYearX >= 0;

    // 7. Annual value being generated in that specific year
    const annualValueAtYearX = scholarsRetainedAtYearX * yearlyValueGenerated;

    return {
      selectedYear,
      scholarsRetained: Math.round(scholarsRetainedAtYearX),
      cumulativeValue: cumulativeValueGenerated,
      netValue: netValueAtYearX,
      roi: roiAtYearX,
      hasReachedBreakEven,
      annualValue: annualValueAtYearX,
      totalReturn: initialHiringSavings + cumulativeValueGenerated,
    };
  };

  const aiPrediction = calculateAIPrediction(selectedPredictionYear);

  // --- ICONS (Defined locally) ---

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
      className={`min-h-screen bg-white ${
        collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
      } transition-all duration-300 overflow-x-hidden`}
    >
      <Navbar pageName="Scholarship Analytics" />
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <div className="pt-2 sm:px-4 lg:px-6 flex-1 overflow-auto">
          <div className="max-w-[1900px] mx-auto">
            {/* INPUTS SECTION - Responsive with glass morphism */}
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mx-1 sm:mx-0">
              <div className="flex flex-col">
                <label
                  htmlFor="hiring-cost-input"
                  className="text-xs sm:text-sm font-medium text-blue-700 mb-1 sm:mb-2"
                >
                  <span className="hidden sm:inline">
                    Average Yearly External Hiring Cost
                  </span>
                  <span className="sm:hidden">Yearly Hiring Cost</span>
                </label>
                <input
                  id="hiring-cost-input"
                  type="number"
                  value={avgYearlyExternalHiringCost}
                  onChange={handleInputChange(setAvgYearlyExternalHiringCost)}
                  placeholder="e.g., 300000"
                  className="p-2 sm:p-3 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                  min="1"
                />
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Cost saved per scholar hired internally vs. external
                  recruitment.
                </p>
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="absorption-input"
                  className="text-xs sm:text-sm font-medium text-blue-700 mb-1 sm:mb-2"
                >
                  <span className="hidden sm:inline">
                    Scholar Absorption Rate
                  </span>
                  <span className="sm:hidden">Absorption Rate</span>
                </label>
                <input
                  id="absorption-input"
                  type="number"
                  value={scholarAbsorptionRate * 100}
                  onChange={(e) => {
                    let value =
                      parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                    if (value <= 0) value = 1;
                    if (value > 100) value = 100;
                    setScholarAbsorptionRate(value / 100);
                  }}
                  placeholder="e.g., 50"
                  className="p-2 sm:p-3 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Percentage of scholars who get hired by MetroBank after
                  graduation.
                </p>
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="value-input"
                  className="text-xs sm:text-sm font-medium text-blue-700 mb-1 sm:mb-2"
                >
                  <span className="hidden sm:inline">
                    Yearly Value Generated by Scholarship Program
                  </span>
                  <span className="sm:hidden">Yearly Value Generated</span>
                </label>
                <input
                  id="value-input"
                  type="number"
                  value={yearlyValueGenerated}
                  onChange={handleInputChange(setYearlyValueGenerated)}
                  placeholder="e.g., 60000"
                  className="p-2 sm:p-3 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                  min="1"
                />
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Annual value generated per scholar (productivity + cost
                  savings).
                </p>
              </div>
            </div>

            {/* COMPACT METRICS GRID */}
            <div className="mb-4 sm:mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3 mx-1 sm:mx-0">
                <MetricCard
                  title="Program ROI"
                  value={`${overallROI.toFixed(1)}%`}
                  icon={<PieChartIcon />}
                />
                <MetricCard
                  title="Retention Rate"
                  value={`${(scholarRetentionRate * 100).toFixed(1)}%`}
                  icon={<PieChartIcon />}
                />
                <MetricCard
                  title="Break-Even"
                  value={`${avgBreakEvenYears.toFixed(1)}Y`}
                  icon={<TrendingUpIcon />}
                />
                <MetricCard
                  title="Total Investment"
                  value={formatCurrencyShort(totalInvestment)}
                  icon={<DollarSignIcon />}
                />
                <MetricCard
                  title="Annual Profit"
                  value={formatCurrencyShort(totalSavingsOrProfit)}
                  icon={<DollarSignIcon />}
                />
                <MetricCard
                  title="Hiring Savings"
                  value={formatCurrencyShort(totalHiringCostSavings)}
                  icon={<DollarSignIcon />}
                />
                <MetricCard
                  title="Avg per Scholar"
                  value={formatCurrencyAverage(avgInvestmentPerScholar)}
                  icon={<DollarSignIcon />}
                />
              </div>
            </div>

            {/* Main Charts Row - Responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mx-1 mb-3 sm:mx-0">
              {/* Line Graph Chart */}
              <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-3 sm:p-4 lg:col-span-2 h-full">
                <h3 className="text-sm sm:text-lg text-center font-semibold mb-3 sm:mb-4 text-gray-800">
                  <span className="hidden sm:inline">
                    Cumulative Net Value Over Time (Break-Even Analysis)
                  </span>
                  <span className="sm:hidden">Break-Even Analysis</span>
                </h3>
                <div className="text-xs text-gray-600 mb-2 px-2">
                  <p>
                    <strong>Chart Elements:</strong>
                  </p>
                  <p>
                    • <strong>Initial Value:</strong> -Total Investment + Hiring
                    Cost Savings
                  </p>
                  <p>
                    • <strong>Yearly Growth:</strong> +Yearly Value Generated
                    per Hired Scholar
                  </p>
                  <p>
                    • <strong>Break-Even Point:</strong> When cumulative value
                    reaches ₱0
                  </p>
                </div>
                <div className="h-[200px] xs:h-[250px] sm:h-[300px] lg:h-[350px]">
                  <LineGraph data={roiTimeSeries} />
                </div>
              </div>

              {/* Retention Projection Card */}
              <div className="lg:col-span-2">
                <RetentionProjectionCard
                  avgBreakEven={avgBreakEvenYears}
                  TrendingUpIcon={TrendingUpIcon}
                />
              </div>
            </div>

            {/* AI Prediction Section */}
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-4 sm:p-6 mx-1 sm:mx-0 mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center mb-3 sm:mb-0">
                  <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600" />
                  AI Prediction
                </h3>

                {/* Year Selector */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Predict at Year:
                  </label>
                  <select
                    value={selectedPredictionYear}
                    onChange={(e) =>
                      setSelectedPredictionYear(Number(e.target.value))
                    }
                    className="px-3 py-2 border border-purple-300/50 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 bg-white/80 backdrop-blur-sm text-sm font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prediction Results Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Scholars Retained */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 sm:p-4 border border-purple-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="text-xs font-medium text-purple-600">
                      Scholars Retained
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">
                    {aiPrediction.scholarsRetained}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {(
                      (aiPrediction.scholarsRetained / actualHiredScholars) *
                      100
                    ).toFixed(1)}
                    % retention
                  </div>
                </div>

                {/* Net Value */}
                <div
                  className={`rounded-xl p-3 sm:p-4 border ${
                    aiPrediction.hasReachedBreakEven
                      ? "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50"
                      : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSignIcon
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        aiPrediction.hasReachedBreakEven
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    />
                    <span
                      className={`text-xs font-medium ${
                        aiPrediction.hasReachedBreakEven
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      Net Value
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">
                    {formatCurrencyShort(aiPrediction.netValue)}
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {aiPrediction.hasReachedBreakEven ? (
                      <span className="text-green-600">✓ Profitable</span>
                    ) : (
                      <span className="text-red-600">⚠ Not yet profitable</span>
                    )}
                  </div>
                </div>

                {/* ROI */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 sm:p-4 border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">
                      ROI
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">
                    {aiPrediction.roi.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Return on Investment
                  </div>
                </div>

                {/* Annual Value */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 sm:p-4 border border-amber-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSignIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">
                      Annual Value
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">
                    {formatCurrencyShort(aiPrediction.annualValue)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Generated in Year {selectedPredictionYear}
                  </div>
                </div>

                {/* Total Return */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-3 sm:p-4 border border-indigo-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSignIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <span className="text-xs font-medium text-indigo-600">
                      Total Return
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">
                    {formatCurrencyShort(aiPrediction.totalReturn)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Cumulative by Year {selectedPredictionYear}
                  </div>
                </div>
              </div>

              {/* Insight Note */}
              <div className="mt-4 p-3 bg-purple-50/50 border border-purple-200/50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <strong className="text-purple-700">💡 Insight:</strong> By
                  Year {selectedPredictionYear}, the program is projected to
                  have <strong>{aiPrediction.scholarsRetained} scholars</strong>{" "}
                  still retained (
                  {(
                    (aiPrediction.scholarsRetained / actualHiredScholars) *
                    100
                  ).toFixed(1)}
                  % of hired).{" "}
                  {aiPrediction.hasReachedBreakEven ? (
                    <>
                      The program will be{" "}
                      <strong className="text-green-700">profitable</strong>{" "}
                      with a net value of{" "}
                      <strong>
                        {formatCurrencyShort(aiPrediction.netValue)}
                      </strong>{" "}
                      and an ROI of{" "}
                      <strong>{aiPrediction.roi.toFixed(1)}%</strong>.
                    </>
                  ) : (
                    <>
                      The program will{" "}
                      <strong className="text-red-700">
                        not yet be profitable
                      </strong>
                      , with a net deficit of{" "}
                      <strong>
                        {formatCurrencyShort(Math.abs(aiPrediction.netValue))}
                      </strong>
                      . Break-even is estimated at{" "}
                      <strong>{avgBreakEvenYears.toFixed(1)} years</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIandAnalytics;
