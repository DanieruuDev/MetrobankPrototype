import React from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register all required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface CampusData {
  campus: string;
  scholarCount: number;
  roiPercentage: number;
}

interface BarGraphProps {
  data: CampusData[];
}

const BarGraph: React.FC<BarGraphProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.scholarCount - a.scholarCount);

  // Chart data configuration
  const chartData = {
    labels: sortedData.map((item) => item.campus),
    datasets: [
      {
        type: "bar" as const,
        label: "Number of Scholars",
        data: sortedData.map((item) => item.scholarCount),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "ROI Percentage",
        data: sortedData.map((item) => item.roiPercentage),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  // Chart options configuration
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Scholars Distribution and ROI by Campus",
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.datasetIndex === 0) {
              label += context.raw;
            } else {
              label += context.raw + "%";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: { display: true, text: "Number of Scholars" },
        beginAtZero: true,
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: { drawOnChartArea: false },
        title: { display: true, text: "ROI Percentage (%)" },
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full">
      <div className="h-[400px]">
        {/* Use Chart instead of Bar for combo charts */}
        <Chart type="bar" data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarGraph;
