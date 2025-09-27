import { useEffect, useRef, useMemo } from "react";
import { Chart, registerables } from "chart.js/auto";
import type { ChartOptions, TooltipItem } from "chart.js/auto";

Chart.register(...registerables);

// **1. Define Props Interface to fix TypeScript error in ROIandAnalytics.tsx**
export interface LineGraphProps {
  data: { month: number; net_value: number }[];
}

// Helper function to format currency for axis ticks and tooltips
const formatCurrencyForGraph = (value: number): string => {
  if (value === undefined || value === null) return "₱0";
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absValue >= 1_000_000)
    return `${sign}₱${(absValue / 1_000_000).toFixed(1)}M`;
  if (absValue >= 1_000) return `${sign}₱${(absValue / 1000).toFixed(0)}K`;
  return `${sign}₱${absValue.toFixed(0)}`;
};

// **2. Update component signature to accept the data prop**
const LineGraph: React.FC<LineGraphProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  // **3. Dynamic Data Generation (Replaces hardcoded roiOverTimeData)**
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    // Find the first month where the net value is zero or positive (Break-Even)
    const breakEvenItem = data.find(
      (item) => item.net_value >= 0 && item.month > 0
    );
    const breakEvenMonth = breakEvenItem ? breakEvenItem.month : 0;

    // If the initial net value (Month 0) is already positive, the program is instantly profitable.
    const isProfitableFromStart = data[0].net_value >= 0;

    return {
      labels: data.map((item) => `Month ${item.month}`),
      datasets: [
        {
          label: "Cumulative Net Value",
          data: data.map((item) => item.net_value),
          borderColor: "rgb(74, 175, 255)",
          backgroundColor: "rgba(74, 175, 255, 0.1)",
          tension: 0.3,
          fill: true,
          yAxisID: "y",
        },
        // Break-Even Highlight Point
        {
          label: isProfitableFromStart
            ? "Initial Profit (Month 0)"
            : `Break-Even Point (${breakEvenMonth.toFixed(1)} Months)`,
          data: data.map((item) =>
            // Plot a point only at the exact break-even month
            item.month === breakEvenItem?.month ? breakEvenItem.net_value : null
          ),
          borderColor: isProfitableFromStart ? "green" : "red",
          pointBackgroundColor: isProfitableFromStart ? "green" : "red",
          pointRadius: 5,
          tension: 0,
          fill: false,
          showLine: false, // Only show the point
          yAxisID: "y",
        },
      ],
    };
  }, [data]);

  // **4. Update Chart Options for Currency and dynamic scale**
  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 },
          },
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleFont: { size: 14 },
          bodyFont: { size: 12 },
          padding: 12,
          callbacks: {
            title: (context) => context[0].label,
            label: (context: TooltipItem<"line">) => {
              if (context.dataset.label === "Cumulative Net Value") {
                return `${context.dataset.label}: ${formatCurrencyForGraph(
                  context.parsed.y
                )}`;
              }
              // Don't show tooltip for the single break-even highlight point
              return null;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          // Add a horizontal line at 0 (the break-even line)
          grid: {
            color: (context) =>
              context.tick.value === 0
                ? "rgba(255, 99, 132, 0.6)"
                : "rgba(0, 0, 0, 0.05)",
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            callback: (value) => formatCurrencyForGraph(Number(value)),
            font: { size: 11 },
          },
          title: {
            display: true,
            text: "Cumulative Net Value (₱)",
          },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
          border: { display: false },
          title: {
            display: true,
            text: "Program Duration (Months)",
          },
        },
      },
      elements: {
        point: { radius: 3, hoverRadius: 6, hoverBorderWidth: 2 },
        line: { borderWidth: 2 },
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
    }),
    []
  );

  // **5. Use dynamic chartData in useEffect**
  useEffect(() => {
    if (!chartRef.current || chartData.labels.length === 0) return;
    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart instance before creating a new one
    let chartInstance: Chart | null = Chart.getChart(ctx);
    if (chartInstance) {
      chartInstance.destroy();
    }

    const newChart = new Chart(ctx, {
      type: "line",
      data: chartData,
      options,
    });

    return () => newChart.destroy();
  }, [chartData, options]);

  return (
    <div className="h-[350px] w-full">
      <canvas ref={chartRef} />
    </div>
  );
};

export default LineGraph;
