import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  TooltipItem,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ROITrendChart: React.FC = () => {
  // Chart data for the 12-month trend
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const roiData = [34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 15, 14];

  // Data for the line chart
  const chartData = {
    labels: months,
    datasets: [
      {
        label: "ROI Trend",
        data: roiData,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointHoverRadius: 5,
        pointHitRadius: 10,
      },
    ],
  };

  // Chart options
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "ROI Trend (Last 12 Months)",
        font: {
          size: 18,
          weight: "bold" as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<"line">) => {
            if (tooltipItem.parsed.y !== null) {
              return `${tooltipItem.parsed.y}%`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 10,
        max: 50,
        ticks: {
          callback: (value: string | number) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className=" ">
      <div style={{ height: "240px" }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ROITrendChart;
