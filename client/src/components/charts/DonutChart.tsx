import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { TooltipItem } from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  school_year: number;
}

interface DisbursementDate {
  category: string;
  sy_code: number;
  total_amount: string;
}

export const DonutChart = ({ school_year }: DonutChartProps) => {
  const [disbursementData, setDisbursementData] = useState<
    DisbursementDate[] | null
  >([]);

  const formatCurrencyShort = (value: number): string => {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  };

  const totalAmount =
    disbursementData?.reduce(
      (acc, item) => acc + parseFloat(item.total_amount),
      0
    ) ?? 0;

  const fetchDisbursementData = async (sy_code: number) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/overview/total/${sy_code}`
      );
      if (!response) throw new Error("Failed to fetch disbursement data.");
      setDisbursementData(response.data);
    } catch (error) {
      console.error("Error fetching disbursement data:", error);
    }
  };

  useEffect(() => {
    if (school_year && !isNaN(Number(school_year))) {
      fetchDisbursementData(school_year);
    } else {
      console.warn("Invalid or undefined school_year, skipping fetch.");
    }
  }, [school_year]);

  console.log(school_year);
  const chartData = useMemo(
    () => ({
      labels: disbursementData?.map((item) => item.category) ?? [],
      datasets: [
        {
          data:
            disbursementData?.map((item) => parseFloat(item.total_amount)) ??
            [],
          backgroundColor: ["#4AAFFF", "#9C84ED", "#54BC4E", "#FF9150"],
          borderWidth: 1,
        },
      ],
    }),
    [disbursementData]
  );

  const chartOptions = useMemo(
    () => ({
      cutout: "70%",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"doughnut">) => {
              const label = context.label ?? "";
              const value =
                typeof context.raw === "number"
                  ? context.raw
                  : parseFloat(context.raw as string);
              return `${label}: ${formatCurrencyShort(value)}`;
            },
          },
        },
      },
    }),
    []
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="text-center text-lg font-semibold mb-4">
        Disbursement Breakdown &#40;{school_year}&#41;
      </h3>

      {disbursementData && disbursementData.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10 gap-4 w-full">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
            📊
          </div>
          <p className="text-lg font-medium">
            No data yet for this school year
          </p>
          <p className="text-sm text-gray-400 max-w-xs">
            We couldn&apos;t find any disbursement records for the selected
            year.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center items-center gap-6 w-full z-0">
          <div className="relative flex-1 min-w-[180px] max-w-[240px] aspect-square">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold pointer-events-none">
              {formatCurrencyShort(totalAmount)}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 text-sm">
            {disbursementData?.map((item, index) => (
              <div
                key={item.category}
                className="flex items-center gap-2 break-words"
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor:
                      chartData.datasets[0].backgroundColor[index] || "#000",
                  }}
                />
                <span className="min-w-[90px]">{item.category}:</span>
                <span className="font-bold font-mono">
                  {formatCurrencyShort(parseFloat(item.total_amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonutChart;
