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

  // Updated ROI data based on provided mock data
  const roiOverTimeData = [
    { period: "Start", roi: -100 },
    { period: "Month 6", roi: -80 },
    { period: "Month 12", roi: -60 },
    { period: "Month 18", roi: -30 },
    { period: "Month 22", roi: 0 }, // Break-even
    { period: "Month 30", roi: 20 },
    { period: "Month 36", roi: 30 },
  ];

  const roiData: ROIData = {
    labels: roiOverTimeData.map((item) => item.period),
    datasets: [
      {
        label: "Scholar ROI",
        data: roiOverTimeData.map((item) => item.roi),
        borderColor: "rgb(74, 175, 255)",
        backgroundColor: "rgba(74, 175, 255, 0.1)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Break-even Point (22.3 Months)",
        data: roiOverTimeData.map((item) =>
          item.period === "Month 22" ? item.roi : null
        ),
        borderColor: "rgba(255, 99, 132, 0.7)",
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        borderDash: [5, 5],
        pointBackgroundColor: "red",
        pointRadius: 5,
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
