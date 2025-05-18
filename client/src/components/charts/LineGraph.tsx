import React, { useEffect, useRef } from "react";
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  ChartTypeRegistry,
  TooltipItem,
} from "chart.js";

// Register chart components
Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  RadialLinearScale,
  Filler
);

interface ROIData {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
    fill?: boolean;
    borderDash?: number[];
    pointBackgroundColor?: string;
    pointRadius?: number;
  }[];
}

const LineGraph = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  // Scholar ROI data (Break-even at ~22 months, approximated to Month 24)
  const roiData: ROIData = {
    labels: [
      "Month 1",
      "Month 3",
      "Month 6",
      "Month 9",
      "Month 12",
      "Month 18",
      "Month 24", // Closest to 22 months
      "Month 30",
      "Month 36",
    ],
    datasets: [
      {
        label: "Scholar ROI",
        // Data points adjusted to reach 0% at Month 24 (~22 months)
        data: [-67, -55, -40, -25, -10, 0, 15, 40, 70],
        borderColor: "rgb(74, 175, 255)",
        backgroundColor: "rgba(74, 175, 255, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Break-even Point (~22 Months)",
        // Highlight break-even at Month 24 (approximating 22 months)
        data: [null, null, null, null, null, null, 0, null, null], // Only shows a point at Month 24
        borderColor: "rgba(255, 99, 132, 0.7)", // Red color for visibility
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        borderDash: [5, 5],
        pointBackgroundColor: "red", // Red dot at break-even
        pointRadius: 5, // Larger dot for emphasis
        tension: 0,
        fill: false,
      },
    ],
  };

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        const chart = new Chart(ctx, {
          type: "line",
          data: roiData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  font: {
                    size: 12,
                  },
                },
              },
              title: {
                display: false,
              },
              tooltip: {
                mode: "index",
                intersect: false,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleFont: {
                  size: 14,
                },
                bodyFont: {
                  size: 12,
                },
                padding: 12,
                callbacks: {
                  label: function (
                    context: TooltipItem<keyof ChartTypeRegistry>
                  ) {
                    let label = context.dataset.label || "";
                    if (label) label += ": ";
                    if (context.parsed.y !== null) {
                      label += context.parsed.y + "%";
                    }
                    return label;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                min: -100,
                max: 100,
                grid: {
                  color: "rgba(0, 0, 0, 0.05)",
                  drawTicks: false,
                },
                border: {
                  display: false,
                },
                ticks: {
                  callback: function (value: number | string) {
                    if (typeof value === "number") {
                      return value + "%";
                    }
                    return value;
                  },
                  font: {
                    size: 11,
                  },
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  font: {
                    size: 11,
                  },
                },
                border: {
                  display: false,
                },
              },
            },
            elements: {
              point: {
                radius: 3,
                hoverRadius: 6,
                hoverBorderWidth: 2,
              },
              line: {
                borderWidth: 2,
              },
            },
            interaction: {
              mode: "nearest",
              axis: "x",
              intersect: false,
            },
          },
        });

        return () => chart.destroy();
      }
    }
  }, []);

  return (
    <div className="h-[350px] w-full">
      <canvas ref={chartRef} />
    </div>
  );
};

export default LineGraph;
