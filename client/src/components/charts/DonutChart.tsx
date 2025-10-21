import axios from "axios";
import { Chart, ChartConfiguration, ChartData, registerables } from "chart.js";
import { useCallback, useEffect, useRef, useState } from "react";

// Register all Chart.js components
Chart.register(...registerables);

interface DonutChartProps {
  school_year: number;
}

interface DisbursementDate {
  category: string;
  total_students: number;
  total_amount: string;
}

export const DonutChart = ({ school_year }: DonutChartProps) => {
  const [disbursementData, setDisbursementData] = useState<
    DisbursementDate[] | null
  >([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart<"doughnut"> | null>(null);

  const formatCurrencyShort = useCallback((value: number): string => {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  }, []);

  const totalAmount =
    disbursementData?.reduce(
      (acc, item) => acc + parseFloat(item.total_amount),
      0
    ) ?? 0;

  const totalStudents =
    disbursementData?.reduce((acc, item) => acc + item.total_students, 0) ?? 0;

  const fetchDisbursementData = async () => {
    const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    try {
      console.log("Fetching data for school year:", school_year);
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/disbursement/overview/completed-totals/${school_year}`
      );
      if (!response) throw new Error("Failed to fetch disbursement data.");
      console.log("API response:", response.data);
      setDisbursementData(response.data);
    } catch (error) {
      console.error("Error fetching disbursement data:", error);
      setDisbursementData([]);
    }
  };

  const createChart = useCallback(() => {
    if (!chartRef.current) {
      return;
    }

    if (!disbursementData || disbursementData.length === 0) {
      return;
    }

    // Destroy existing chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) {
      return;
    }

    // Set canvas size for better rendering
    const rect = chartRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    chartRef.current.width = rect.width * dpr;
    chartRef.current.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const chartData: ChartData<"doughnut"> = {
      labels: disbursementData.map((item) => item.category),
      datasets: [
        {
          data: disbursementData.map((item) => parseFloat(item.total_amount)),
          backgroundColor: [
            "#1E40AF", // Dark Blue
            "#3B82F6", // Blue
            "#60A5FA", // Light Blue
            "#93C5FD", // Lighter Blue
            "#DBEAFE", // Very Light Blue
            "#1D4ED8", // Deep Blue
            "#2563EB", // Medium Blue
            "#1E3A8A", // Navy Blue
          ],
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: "#ffffff",
        },
      ],
    };

    const chartConfig: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: chartData,
      options: {
        cutout: "65%",
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 600,
          easing: "easeInOutQuart",
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        onHover: (event, activeElements) => {
          if (event.native?.target) {
            (event.native.target as HTMLElement).style.cursor =
              activeElements.length > 0 ? "pointer" : "default";
          }
        },
        onClick: (_, activeElements) => {
          if (activeElements.length > 0) {
            // You can add custom click handling here
            // const dataIndex = activeElements[0].index;
            // const category = disbursementData?.[dataIndex]?.category;
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            padding: 6,
            titleFont: {
              size: 10,
              weight: "bold",
            },
            bodyFont: {
              size: 9,
            },
            callbacks: {
              title: (context) => {
                return context[0].label;
              },
              label: (context) => {
                const value =
                  typeof context.raw === "number"
                    ? context.raw
                    : parseFloat(context.raw as string);
                const percentage =
                  totalAmount > 0
                    ? ((value / totalAmount) * 100).toFixed(1)
                    : "0.0";
                const students =
                  disbursementData?.[context.dataIndex]?.total_students || 0;
                return [
                  `Amount: ${formatCurrencyShort(value)}`,
                  `Percentage: ${percentage}%`,
                  `Students: ${students}`,
                ];
              },
            },
          },
        },
        elements: {
          arc: {
            borderWidth: 0,
            hoverBorderWidth: 2,
            hoverBorderColor: "#ffffff",
            hoverOffset: 3,
          },
        },
      },
    };

    try {
      chartInstance.current = new Chart(ctx, chartConfig);
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }, [disbursementData, totalAmount, formatCurrencyShort]);

  useEffect(() => {
    if (school_year && !isNaN(Number(school_year))) {
      fetchDisbursementData();
    } else {
      console.warn("Invalid or undefined school_year, skipping fetch.");
    }
  }, [school_year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    createChart();

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [disbursementData, totalAmount, createChart]);

  return (
    <div className="w-full h-full min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
      {!disbursementData || disbursementData.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 py-8 sm:py-12 gap-3 sm:gap-4 h-full">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">
            No disbursement data available
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Complete some disbursements to see the distribution
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-3 sm:gap-4 md:gap-6 h-full p-2 sm:p-3 md:p-4">
          {/* Chart */}
          <div className="relative flex-shrink-0 w-full max-w-[140px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[200px] aspect-square">
            <canvas
              ref={chartRef}
              className="w-full h-full"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                aspectRatio: "1 / 1",
                minHeight: "100px",
                minWidth: "100px",
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[8px] sm:text-[10px] text-gray-500 font-medium">
                Total
              </div>
              <div className="text-xs sm:text-sm font-bold text-gray-900">
                {formatCurrencyShort(totalAmount)}
              </div>
              <div className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5 sm:mt-1">
                {totalStudents} students
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full max-w-sm sm:max-w-md space-y-1.5 sm:space-y-2 min-w-0">
            {disbursementData?.map((item, index) => {
              const percentage =
                totalAmount > 0
                  ? (
                      (parseFloat(item.total_amount) / totalAmount) *
                      100
                    ).toFixed(1)
                  : "0.0";

              return (
                <div
                  key={item.category}
                  className="flex items-start justify-between p-1.5 sm:p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor:
                          [
                            "#1E40AF", // Dark Blue
                            "#3B82F6", // Blue
                            "#60A5FA", // Light Blue
                            "#93C5FD", // Lighter Blue
                            "#DBEAFE", // Very Light Blue
                          ][index] || "#000",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] sm:text-xs font-medium text-gray-900 leading-tight">
                        {item.category}
                      </div>
                      <div className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5">
                        {item.total_students} students
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                    <div className="text-[10px] sm:text-xs font-semibold text-gray-900">
                      {formatCurrencyShort(parseFloat(item.total_amount))}
                    </div>
                    <div className="text-[8px] sm:text-[10px] text-gray-500">
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
