import React, { useEffect, useRef, useState } from "react";
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

interface ROITrendChartProps {
  sidebarToggle?: boolean;
}

const ROITrendChart: React.FC<ROITrendChartProps> = ({ sidebarToggle }) => {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [chartKey, setChartKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chart data
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

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "ROI Trend (Last 12 Months)",
        font: { size: 18, weight: "bold" as const },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<"line">) => {
            return tooltipItem.parsed.y !== null
              ? `${tooltipItem.parsed.y}%`
              : "";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 10,
        max: 50,
        ticks: { callback: (value) => `${value}%` },
      },
    },
  };

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        // First try gentle resize
        chartRef.current.resize();
        chartRef.current.update();

        // If still not working after delay, force a re-render
        setTimeout(() => {
          if (
            chartRef.current?.canvas?.width !==
            containerRef.current?.offsetWidth
          ) {
            setChartKey((prev) => prev + 1);
          }
        }, 5);
      }
    };

    // Initial resize after mount
    const timer1 = setTimeout(handleResize, 300);

    // Additional resize after transition likely completes
    const timer2 = setTimeout(handleResize, 100);

    // Cleanup
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [sidebarToggle]);

  return (
    <div className="w-full h-full" ref={containerRef}>
      <div style={{ height: "260px" }}>
        <Line
          key={`chart-${chartKey}`}
          ref={chartRef}
          data={chartData}
          options={chartOptions}
        />
      </div>
    </div>
  );
};

export default ROITrendChart;
