import { useEffect, useState, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface ComboData {
  school_year: string;
  semester: string;
  total_scholars: number;
  total_disbursement: number;
}

export const ComboChart = () => {
  const [comboChartData, setComboChartData] = useState<ComboData[]>([]);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchComboChartData = useCallback(async () => {
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/disbursement/overview/semester-scholars`
      );
      if (response.data.success) {
        setComboChartData(response.data.data);
      } else {
        console.error("Fetch succeeded but no data returned.");
      }
    } catch (error) {
      console.error("Failed to fetch combo chart data:", error);
    }
  }, [VITE_BACKEND_URL]);

  const formatDisbursement = (value: number) => {
    if (value >= 1_000_000) {
      return "₱" + (value / 1_000_000).toFixed(1) + "M";
    } else if (value >= 1_000) {
      return "₱" + (value / 1_000).toFixed(1) + "K";
    } else {
      return "₱" + value.toLocaleString();
    }
  };

  // Ensure comboChartData is not empty before calling .slice()
  const displayedData = comboChartData.length ? comboChartData.slice(-6) : [];

  // Add safety checks for empty data
  const maxScholars =
    displayedData.length > 0
      ? Math.ceil(
          Math.max(...displayedData.map((d) => Number(d.total_scholars) || 0)) /
            20
        ) * 20
      : 100;
  const maxDisbursement =
    displayedData.length > 0
      ? Math.ceil(
          Math.max(
            ...displayedData.map((d) => Number(d.total_disbursement) || 0)
          ) / 1000
        ) * 1000
      : 100000;
  const chartData = {
    labels: displayedData.map((item) => {
      const sem =
        typeof item.semester === "string"
          ? item.semester.replace("Semester", "").trim()
          : String(item.semester || ""); // Handle non-string values
      return `${item.school_year} - ${sem}`;
    }),

    datasets: [
      {
        type: "bar" as const,
        label: "Total Scholars",
        data: displayedData.map((item) => Number(item.total_scholars)),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "Total Disbursement",
        data: displayedData.map((item) => Number(item.total_disbursement)),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.7)",
        borderWidth: 2,
        tension: 0.1,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 10,
          padding: 15,
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        cornerRadius: 6,
        padding: 8,
        titleFont: {
          size: 11,
        },
        bodyFont: {
          size: 10,
        },
        callbacks: {
          label: function (context: TooltipItem<"bar" | "line">) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }

            if (typeof context.raw === "number") {
              if (context.datasetIndex === 1) {
                label += formatDisbursement(context.raw);
              } else {
                label += context.raw.toString();
              }
            } else {
              label += "N/A";
            }

            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 9,
          },
          maxTicksLimit: 6,
        },
        grid: {
          display: false,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        min: 0,
        max: maxScholars,
        ticks: {
          stepSize: Math.ceil(maxScholars / 5),
          padding: 8,
          font: {
            size: 9,
          },
          maxTicksLimit: 6,
        },
        grid: {
          drawOnChartArea: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        min: 0,
        max: maxDisbursement,
        ticks: {
          callback: function (value: number | string) {
            if (typeof value === "number") {
              return formatDisbursement(value);
            }
            return value;
          },
          stepSize: maxDisbursement / 4,
          padding: 8,
          font: {
            size: 9,
          },
          maxTicksLimit: 5,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  useEffect(() => {
    fetchComboChartData();
  }, [fetchComboChartData]);

  return (
    <div className="w-full">
      <h3 className="text-center text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3 md:mb-4">
        Semester Disbursements & Scholars
      </h3>
      <div
        style={{
          position: "relative",
          height: "200px",
          width: "100%",
        }}
        className="sm:h-[250px] md:h-[280px] lg:h-[320px] xl:h-[350px]"
      >
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ComboChart;
