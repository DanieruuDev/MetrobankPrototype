import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface SampleChartProps {
  revenue: number;
  cost: number;
  roi: number;
}

const SampleChart: React.FC<SampleChartProps> = ({
  revenue = 42142,
  cost = 182310,
  roi = -12,
}) => {
  const profit = revenue - cost;

  const data = {
    labels: ["Revenue", "Cost"],
    datasets: [
      {
        data: [revenue, cost],
        backgroundColor: ["#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#36A2EB", "#FF6384"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            let label = context.label || "";
            if (label) {
              label += ": ";
            }
            if (context.raw) {
              label += "$" + context.raw.toLocaleString();
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#36A2EB" }}>
          R.OI {roi}%
        </div>
        <div style={{ fontSize: "16px", marginTop: "8px", color: "#666" }}>
          ${profit.toLocaleString()}
        </div>
        <div style={{ fontSize: "12px", color: "#999" }}>Profit</div>
      </div>
    </div>
  );
};

export default SampleChart;
