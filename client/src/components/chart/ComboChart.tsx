import React from "react";
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
  semester_label: string;
  total_scholars: number;
  total_disbursement: number;
}

interface ComboChartProps {
  data: ComboData[];
}

export const ComboChart: React.FC<ComboChartProps> = ({ data }) => {
  // Format disbursement values to millions for better readability
  const formatDisbursement = (value: number) => {
    return "₱" + (value / 1000000).toFixed(1) + "M";
  };

  const chartData = {
    labels: data.map((item) => {
      const [year, semester] = item.semester_label.split(" ");
      return [year, semester];
    }),
    datasets: [
      {
        type: "bar" as const,
        label: "Total Scholars",
        data: data.map((item) => item.total_scholars),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "Total Disbursement",
        data: data.map((item) => item.total_disbursement),
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
          boxWidth: 12,
          padding: 20,
        },
      },
      tooltip: {
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
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,

          font: {
            size: 8.5, // Smaller font size for semester labels
          },
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
        max: 140,
        ticks: {
          stepSize: 20,
          padding: 10,
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,

        min: 0,
        max: 8000000,
        ticks: {
          callback: function (value: number | string) {
            if (typeof value === "number") {
              return formatDisbursement(value);
            }
            return value;
          },
          stepSize: 1000000,
          padding: 10,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div
      style={{
        position: "relative",
        height: "250px",
        width: "100%",
      }}
    >
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

export default ComboChart;
