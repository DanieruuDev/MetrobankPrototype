import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { ChartOptions, TooltipItem } from "chart.js";
import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  // Allow school_year to be number or undefined
  school_year: number | undefined;
}

interface DisbursementDate {
  category: string;
  sy_code: number;
  total_amount: string; // Note: Consider parsing this to number earlier if possible
}

export const DonutChart = ({ school_year }: DonutChartProps) => {
  const [disbursementData, setDisbursementData] = useState<
    DisbursementDate[] | null
  >([]);
  const [loading, setLoading] = useState(true); // Added loading state for the chart

  const formatCurrencyShort = (value: number): string => {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  };

  // Calculate total amount safely
  const totalAmount =
    disbursementData?.reduce(
      (acc, item) => acc + parseFloat(item.total_amount || "0"), // Handle potential non-numeric strings
      0
    ) ?? 0;

  const fetchDisbursementData = async (sy_code: number) => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/overview/total/${sy_code}`
      );
      if (!response) throw new Error("Failed to fetch disbursement data.");
      // Assuming response.data is the array of DisbursementDate
      setDisbursementData(response.data);
    } catch (error) {
      console.error("Error fetching disbursement data:", error);
      setDisbursementData([]); // Clear data or set to an error state on failure
      // TODO: Display a user-friendly error message near the chart
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {
    // Fetch data only if school_year is a valid number
    if (typeof school_year === "number" && !isNaN(school_year)) {
      fetchDisbursementData(school_year);
    } else {
      // Clear data if school_year is not valid or undefined
      setDisbursementData([]);
      setLoading(false); // Ensure loading is false if fetch is skipped
      console.warn("Invalid or undefined school_year, skipping fetch.");
    }
  }, [school_year]); // Dependency array ensures fetch runs when school_year changes

  const chartData = {
    labels: disbursementData?.map((item) => item.category),
    datasets: [
      {
        data: disbursementData?.map((item) =>
          parseFloat(item.total_amount || "0")
        ), // Handle potential non-numeric strings
        backgroundColor: [
          "#4AAFFF",
          "#9C84ED",
          "#54BC4E",
          "#FF9150",
          "#A6A6A6",
          "#E57373",
        ], // Added a few more colors
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<"doughnut"> = {
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
    // Added aspect ratio for better control, adjust as needed
    aspectRatio: 1, // Make it square
    plugins: {
      legend: {
        display: false, // Keeping legend hidden as per original code
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function (context: TooltipItem<"doughnut">): string {
            const label = context.label ?? "";
            // Safely parse value for tooltip
            const value =
              typeof context.raw === "number"
                ? context.raw
                : parseFloat((context.raw as string) || "0"); // Handle potential non-numeric
            return `${label}: ${formatCurrencyShort(value)}`;
          },
        },
      },
    },
  };

  // Determine if there is data to display
  const hasData = disbursementData && disbursementData.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="text-center text-lg font-semibold mb-4">
        {/* Display school year if available, otherwise a placeholder */}
        Disbursement Breakdown &#40;
        {school_year !== undefined && typeof school_year === "number"
          ? school_year
          : "Select School Year"}
        &#41;
      </h3>

      {loading ? (
        // Loading state
        <div className="flex flex-col items-center justify-center h-60">
          {" "}
          {/* Increased height for visibility */}
          <svg
            className="animate-spin h-10 w-10 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600">Loading data...</p>
        </div>
      ) : hasData ? (
        // Display chart and legend if data exists
        <div className="flex flex-wrap justify-center items-center gap-6 w-full z-0">
          <div className="relative flex-1 min-w-[180px] max-w-[240px] aspect-square">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold pointer-events-none">
              {formatCurrencyShort(totalAmount)}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 text-sm min-w-[150px]">
            {" "}
            {/* Added min-width */}
            {disbursementData.map((item, index) => (
              <div
                key={item.category}
                className="flex items-center gap-2 break-words"
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor:
                      chartData.datasets[0].backgroundColor[index] || "#000",
                  }}
                />
                <span className="min-w-[90px] text-gray-600">
                  {item.category}:
                </span>{" "}
                {/* Added text color */}
                <span className="font-bold font-mono text-gray-800">
                  {" "}
                  {/* Added text color */}
                  {formatCurrencyShort(parseFloat(item.total_amount || "0"))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Empty state - REDUCED PADDING AND ADDED HEIGHT HERE
        <div className="flex flex-col items-center justify-center text-center text-gray-500 py-4 gap-4 w-full h-60">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
            📊
          </div>
          <p className="text-lg font-medium">
            No data yet for this school year
          </p>
          <p className="text-sm text-gray-400 max-w-xs">
            We couldn&apos;t find any disbursement records for the selected
            year.
          </p>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
