import React, { useState, useEffect } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import LineGraph from "../../components/charts/LineGraph";
// DonutChartROI import removed as requested
import MetricCard from "../../components/shared/MetricCard";
import { useSidebar } from "../../context/SidebarContext";

interface ROIAnalyticsData {
  totalDisbursed: number;
  totalActiveScholars: number;
  totalScholarsEver: number;
  currentlyActiveScholars: number;
  delistedScholars: number;
  renewedScholars: number;
  renewalRate: number;
  programStats: Array<{
    program: string;
    student_count: number;
    total_investment: number;
  }>;
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
  let verdict = "";
  let insights: string[] = [];

  // ⚠️ UPDATED LOGIC HERE
  if (avgBreakEven <= 0) {
    conclusionText =
      "The program is profitable from Day 1, indicating initial profit or cost avoidance exceeds the total investment.";
    verdict = "EXCELLENT - Immediate Profitability";
    insights = [
      "Program generates immediate returns",
      "Hiring cost savings exceed initial investment",
      "Highly sustainable business model",
      "Consider expanding program capacity",
    ];
  } else if (avgBreakEven < 1) {
    conclusionText = `To reach the break-even point, the average scholar must stay with the company for a minimum of ${breakEvenMonths} months (less than a year).`;
    verdict = "GOOD - Quick Break-Even";
    insights = [
      "Fast return on investment",
      "Low retention risk for profitability",
      "Strong program efficiency",
      "Consider increasing scholar intake",
    ];
  } else if (avgBreakEven < 3) {
    conclusionText = `To reach the break-even point, the average scholar must stay with the company for a minimum of ${breakEvenYears} years (or ${avgBreakEven.toFixed(
      1
    )} years).`;
    verdict = "MODERATE - Reasonable Timeline";
    insights = [
      "Standard break-even timeline",
      "Requires good retention strategies",
      "Balanced risk-reward ratio",
      "Monitor scholar satisfaction closely",
    ];
  } else {
    conclusionText = `To reach the break-even point, the average scholar must stay with the company for a minimum of ${breakEvenYears} years (or ${avgBreakEven.toFixed(
      1
    )} years).`;
    verdict = "CAUTION - Extended Payback Period";
    insights = [
      "Long-term investment required",
      "High retention risk",
      "Consider program optimization",
      "Evaluate cost-benefit ratio",
    ];
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

  // Determine verdict color
  const getVerdictColor = (verdict: string) => {
    if (verdict.includes("EXCELLENT"))
      return "text-green-600 bg-green-50 border-green-200";
    if (verdict.includes("GOOD"))
      return "text-blue-600 bg-blue-50 border-blue-200";
    if (verdict.includes("MODERATE"))
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    if (verdict.includes("CAUTION"))
      return "text-red-600 bg-red-50 border-red-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

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

        {/* Verdict Badge */}
        <div
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border mb-4 ${getVerdictColor(
            verdict
          )}`}
        >
          {verdict}
        </div>

        <p className="text-sm sm:text-lg font-semibold text-gray-700 mb-4 sm:mb-6 leading-relaxed">
          {conclusionText}
        </p>

        {/* Insights Section */}
        <div className="mb-4">
          <h4 className="text-sm sm:text-md font-semibold text-gray-600 mb-2 border-b pb-1">
            Key Insights:
          </h4>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li
                key={index}
                className="text-xs sm:text-sm text-gray-600 flex items-start"
              >
                <span className="text-blue-500 mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

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
  const [absorptionRateDisplay, setAbsorptionRateDisplay] =
    useState<string>("50");
  const [yearlyValueGenerated, setYearlyValueGenerated] =
    useState<number>(300000); // ₱60K per scholar per year
  // This is the POST-GRADUATION employee retention rate for hired scholars
  const [employeeRetentionRate] = useState<number>(0.85); // 85% default retention rate
  const [selectedPredictionYear, setSelectedPredictionYear] =
    useState<number>(5); // AI Prediction year selector

  // Database data state
  const [roiData, setRoiData] = useState<ROIAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isBreakdownExpanded, setIsBreakdownExpanded] =
    useState<boolean>(false);

  // Sync display value with absorption rate
  useEffect(() => {
    setAbsorptionRateDisplay(
      Math.round(scholarAbsorptionRate * 100).toString()
    );
  }, [scholarAbsorptionRate]);

  // Fetch ROI analytics data from API
  useEffect(() => {
    const fetchROIData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/disbursement/overview/roi-analytics"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch ROI analytics data");
        }
        const result = await response.json();
        if (result.success) {
          setRoiData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching ROI data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchROIData();
  }, []);

  // Calculate scholar renewal rate from database data
  const scholarRenewalRate = roiData ? roiData.renewalRate : 0;

  // Note: Program data is available in roiData.programStats if needed for future features

  // Use demo mode or database data based on toggle
  const totalInvestment = isDemoMode
    ? 23500000
    : roiData
    ? roiData.totalDisbursed
    : 0;
  const totalStudents = isDemoMode
    ? 47
    : roiData
    ? roiData.totalActiveScholars
    : 0;

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

  // ROI calculation with safeguard for extremely large numbers
  const overallROI =
    totalInvestment > 0 ? (totalSavingsOrProfit / totalInvestment) * 100 : 0;

  // Cap ROI at reasonable maximum to prevent display issues
  const cappedROI = Math.min(Math.max(overallROI, -1000), 10000); // Cap between -1000% and 10000%

  // Break-even calculation (years)
  const netInvestmentToRecover = totalInvestment - totalHiringCostSavings;
  const avgBreakEvenYears =
    totalYearlyGain <= 0 || netInvestmentToRecover <= 0
      ? 0
      : netInvestmentToRecover / totalYearlyGain;

  const avgInvestmentPerScholar = totalInvestment / totalStudents; // --- 4. DATA STRUCTURES FOR CHARTS --- // Dynamic ROI Time Series for Break-Even Chart

  const generateROISeries = (years: number) => {
    const series = []; // Initial net value is the cost of investment offset by hiring cost savings
    let cumulativeNetValue = -totalInvestment + totalHiringCostSavings;

    series.push({ year: 0, net_value: cumulativeNetValue });

    for (let i = 1; i <= years; i++) {
      // Calculate scholars retained for this year with 2-year service requirement
      let scholarsRetainedThisYear;
      if (i <= 2) {
        scholarsRetainedThisYear = actualHiredScholars; // 100% retention for first 2 years
      } else {
        // After year 2, apply retention rate
        const yearsAfterService = i - 2;
        scholarsRetainedThisYear =
          actualHiredScholars *
          Math.pow(employeeRetentionRate, yearsAfterService);
      }

      // Calculate yearly gain based on retained scholars
      const yearlyGainThisYear =
        scholarsRetainedThisYear * yearlyValueGenerated;
      cumulativeNetValue += yearlyGainThisYear;
      series.push({ year: i, net_value: cumulativeNetValue });
    }
    return series;
  }; // Generate data for 10 years

  const roiTimeSeries = generateROISeries(10);

  // --- AI PREDICTION CALCULATION ---
  const calculateAIPrediction = (selectedYear: number) => {
    // 1. Calculate scholars still retained by year X with 2-year service requirement
    // Years 1-2: 100% retention (mandatory service)
    // Year 3+: Gradual reduction based on retention rate
    let scholarsRetainedAtYearX;
    if (selectedYear <= 2) {
      scholarsRetainedAtYearX = actualHiredScholars; // 100% retention for first 2 years
    } else {
      // After year 2, apply retention rate for remaining years
      const yearsAfterService = selectedYear - 2;
      scholarsRetainedAtYearX =
        actualHiredScholars *
        Math.pow(employeeRetentionRate, yearsAfterService);
    }

    // 2. Calculate cumulative value generated from Year 1 to Year X
    let cumulativeValueGenerated = 0;
    for (let year = 1; year <= selectedYear; year++) {
      let scholarsAtYear;
      if (year <= 2) {
        scholarsAtYear = actualHiredScholars; // 100% retention for first 2 years
      } else {
        // After year 2, apply retention rate
        const yearsAfterService = year - 2;
        scholarsAtYear =
          actualHiredScholars *
          Math.pow(employeeRetentionRate, yearsAfterService);
      }
      cumulativeValueGenerated += scholarsAtYear * yearlyValueGenerated;
    }

    // 3. Initial hiring cost savings (one-time benefit at Year 0)
    const initialHiringSavings = totalHiringCostSavings;

    // 4. Calculate net value at year X
    const netValueAtYearX =
      -totalInvestment + initialHiringSavings + cumulativeValueGenerated;

    // 5. Calculate ROI at year X
    const roiAtYearX = (netValueAtYearX / totalInvestment) * 100;

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
    (setter: React.Dispatch<React.SetStateAction<number>>, maxValue?: number) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const numericValue = parseFloat(rawValue.replace(/[^0-9.]/g, ""));

      // Allow empty input while typing
      if (rawValue === "" || rawValue === ".") {
        setter(0);
        return;
      }

      // Only apply validation after user stops typing
      if (!isNaN(numericValue)) {
        // Apply maximum limit even while typing for very large numbers
        if (maxValue && numericValue > maxValue) {
          setter(maxValue);
        } else {
          setter(numericValue);
        }
      }
    };

  const handleInputBlur =
    (setter: React.Dispatch<React.SetStateAction<number>>, maxValue?: number) =>
    (event: React.FocusEvent<HTMLInputElement>) => {
      let value = parseFloat(event.target.value.replace(/[^0-9.]/g, "")) || 0;

      // Set minimum value of 1 if empty or zero
      if (value <= 0) {
        value = 1;
      }

      // Apply maximum limit if provided
      if (maxValue && value > maxValue) {
        console.log(
          `Value ${value} exceeds max ${maxValue}, capping to ${maxValue}`
        );
        value = maxValue;
      }

      console.log(`Input blur: setting value to ${value}`);
      setter(value);
    };

  // Show loading state
  if (loading) {
    return (
      <div
        className={`min-h-screen bg-white ${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
        } transition-all duration-300 overflow-x-hidden`}
      >
        <Navbar pageName="Scholarship Analytics" />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ROI Analytics Data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        className={`min-h-screen bg-white ${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[250px]"
        } transition-all duration-300 overflow-x-hidden`}
      >
        <Navbar pageName="Scholarship Analytics" />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Error Loading Data
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {/* DEMO MODE NOTICE */}
            {isDemoMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 mx-1 sm:mx-0">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Demo Mode Active
                    </h3>
                    <p className="text-xs text-yellow-700">
                      Using test data: 47 scholars with ₱500K investment each
                      (₱23.5M total)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* INPUTS SECTION - Responsive with glass morphism */}
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mx-1 sm:mx-0">
              <div className="flex flex-col">
                <label
                  htmlFor="hiring-cost-input"
                  className="text-xs sm:text-sm font-medium text-blue-700 mb-1 sm:mb-2"
                >
                  <span className="hidden sm:inline">
                    Average External Hiring Cost
                  </span>
                  <span className="sm:hidden">Yearly Hiring Cost</span>
                </label>
                <input
                  id="hiring-cost-input"
                  type="number"
                  value={avgYearlyExternalHiringCost}
                  onChange={handleInputChange(
                    setAvgYearlyExternalHiringCost,
                    1000000000000
                  )}
                  onBlur={handleInputBlur(
                    setAvgYearlyExternalHiringCost,
                    1000000000000
                  )}
                  placeholder="e.g., 300000"
                  className="p-2 sm:p-3 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                  min="1"
                  max="1000000000000"
                />
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Average costs of recruitment, onboarding, and training on job
                  openings. (Max: ₱1T)
                </p>
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="absorption-input"
                  className="text-xs sm:text-sm font-medium text-blue-700 mb-1 sm:mb-2"
                >
                  <span className="hidden sm:inline">
                    Scholar Absorption Rate (%)
                  </span>
                  <span className="sm:hidden">Absorption Rate</span>
                </label>
                <input
                  id="absorption-input"
                  type="number"
                  value={absorptionRateDisplay}
                  onChange={(e) => {
                    const rawValue = e.target.value;

                    // Update display value immediately
                    setAbsorptionRateDisplay(rawValue);

                    // Handle empty input
                    if (rawValue === "" || rawValue === ".") {
                      setScholarAbsorptionRate(0);
                      return;
                    }

                    // Handle leading zeros: if user types after "0", replace the "0"
                    if (
                      rawValue.startsWith("0") &&
                      rawValue.length > 1 &&
                      !rawValue.startsWith("0.")
                    ) {
                      const cleanValue = rawValue.replace(/^0+/, "");
                      if (cleanValue !== "") {
                        setAbsorptionRateDisplay(cleanValue);
                        const cleanNumericValue = parseFloat(cleanValue);
                        if (!isNaN(cleanNumericValue)) {
                          const clampedValue = Math.min(
                            Math.max(cleanNumericValue, 1),
                            100
                          );
                          setScholarAbsorptionRate(
                            Math.round(clampedValue * 100) / 10000
                          );
                        }
                      }
                      return;
                    }

                    // Process normal input
                    const numericValue = parseFloat(
                      rawValue.replace(/[^0-9.]/g, "")
                    );
                    if (!isNaN(numericValue)) {
                      const clampedValue = Math.min(
                        Math.max(numericValue, 1),
                        100
                      );
                      setScholarAbsorptionRate(
                        Math.round(clampedValue * 100) / 10000
                      );
                    }
                  }}
                  onBlur={(e) => {
                    let value =
                      parseFloat(e.target.value.replace(/[^0-9.]/g, "")) || 0;
                    if (value <= 0) value = 1;
                    if (value > 100) value = 100;

                    // Update both display and actual value
                    setAbsorptionRateDisplay(value.toString());
                    setScholarAbsorptionRate(Math.round(value * 100) / 10000);
                  }}
                  placeholder="e.g., 50"
                  className="p-2 sm:p-3 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Percentage of scholars who get hired by Metrobank after
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
                  onChange={handleInputChange(
                    setYearlyValueGenerated,
                    1000000000000
                  )}
                  onBlur={handleInputBlur(
                    setYearlyValueGenerated,
                    1000000000000
                  )}
                  placeholder="e.g., 60000"
                  className="p-2 sm:p-3 border border-blue-300/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
                  min="1"
                  max="1000000000000"
                />
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Annual value generated (productivity and salary of absorbed
                  scholars). (Max: ₱1T)
                </p>
              </div>
            </div>

            {/* COMPACT METRICS GRID */}
            <div className="mb-4 sm:mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3 mx-1 sm:mx-0">
                <MetricCard
                  title="Initial Program ROI"
                  value={`${cappedROI.toFixed(1)}%${
                    Math.abs(overallROI) > 10000 ? " (Capped)" : ""
                  }`}
                  icon={<PieChartIcon />}
                />
                <MetricCard
                  title="Scholar Renewal Rate"
                  value={`${(scholarRenewalRate * 100).toFixed(1)}%`}
                  icon={<PieChartIcon />}
                />
                <MetricCard
                  title="Break-Even Duration"
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
                  title="Hiring Cost Savings"
                  value={formatCurrencyShort(totalHiringCostSavings)}
                  icon={<DollarSignIcon />}
                />
                <MetricCard
                  title="Avg Investment/Scholar"
                  value={formatCurrencyAverage(avgInvestmentPerScholar)}
                  icon={<DollarSignIcon />}
                />
                {roiData && (
                  <>
                    <MetricCard
                      title="Total Scholars Accepted"
                      value={roiData.totalScholarsEver.toString()}
                      icon={<PieChartIcon />}
                    />
                    <MetricCard
                      title="Delisted Scholars"
                      value={roiData.delistedScholars.toString()}
                      icon={<PieChartIcon />}
                    />
                  </>
                )}
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

            {/* Calculation Breakdown Section */}
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-4 sm:p-6 mx-1 sm:mx-0 mt-4 sm:mt-6">
              <button
                onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                  <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600" />
                  Break-Even Calculation Breakdown
                </h3>
                <div className="text-purple-600">
                  {isBreakdownExpanded ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </button>

              {isBreakdownExpanded && (
                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">
                        Investment Recovery Formula
                      </h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <strong>Net Investment to Recover:</strong>{" "}
                          {formatCurrencyShort(netInvestmentToRecover)}
                        </p>
                        <p>
                          <strong>Annual Value Generated:</strong>{" "}
                          {formatCurrencyShort(totalYearlyGain)}
                        </p>
                        <p>
                          <strong>Break-Even Time:</strong>{" "}
                          {avgBreakEvenYears.toFixed(1)} years
                        </p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Key Variables
                      </h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <strong>Total Investment:</strong>{" "}
                          {formatCurrencyShort(totalInvestment)}
                        </p>
                        <p>
                          <strong>Hiring Cost Savings:</strong>{" "}
                          {formatCurrencyShort(totalHiringCostSavings)}
                        </p>
                        <p>
                          <strong>Actual Hired Scholars:</strong>{" "}
                          {actualHiredScholars}
                          {` (${Math.round(
                            47 * scholarAbsorptionRate
                          )} at ${Math.round(
                            scholarAbsorptionRate * 100
                          )}% absorption)`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Calculation Method
                    </h4>
                    <div className="text-sm text-gray-700">
                      <p className="mb-2">
                        <strong>Step 1:</strong> Net Investment = Total
                        Investment - Hiring Cost Savings
                      </p>
                      <p className="mb-2">
                        <strong>Step 2:</strong> Break-Even Time = Net
                        Investment ÷ Annual Value Generated
                      </p>
                      <p className="mb-2">
                        <strong>Service Requirement:</strong> Scholars must
                        serve 2 years minimum, then retention rate applies (85%
                        per year after year 2)
                      </p>
                      <p>
                        <strong>Result:</strong> Scholars must stay for{" "}
                        {avgBreakEvenYears.toFixed(1)} years to recover the
                        investment
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Prediction Section */}
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-xl shadow-lg p-4 sm:p-6 mx-1 sm:mx-0 mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center mb-3 sm:mb-0">
                  <TrendingUpIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600" />
                  Prediction
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
                <div className="flex items-start justify-between">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed flex-1">
                    <strong className="text-purple-700">💡 Insight:</strong> By
                    Year {selectedPredictionYear}, the program is projected to
                    have{" "}
                    <strong>{aiPrediction.scholarsRetained} scholars</strong>{" "}
                    still retained (
                    {(
                      (aiPrediction.scholarsRetained / actualHiredScholars) *
                      100
                    ).toFixed(1)}
                    % of hired).{" "}
                    {selectedPredictionYear <= 2 && (
                      <span className="text-blue-600 font-medium">
                        Note: 100% retention guaranteed for first 2 years
                        (mandatory service).{" "}
                      </span>
                    )}
                    {selectedPredictionYear > 2 && (
                      <span className="text-green-600 font-medium">
                        Note: After 2-year service requirement, retention rate
                        is {employeeRetentionRate * 100}% per year.{" "}
                      </span>
                    )}
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

                  {/* Demo Mode Toggle Button */}
                  <button
                    onClick={() => setIsDemoMode(!isDemoMode)}
                    className={`ml-4 p-2 rounded-full transition-colors ${
                      isDemoMode
                        ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={
                      isDemoMode ? "Switch to real data" : "Switch to demo data"
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIandAnalytics;
