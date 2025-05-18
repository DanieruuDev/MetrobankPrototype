import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { ChartOptions, TooltipItem } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ROIByDepartment {
  department: string;
  roi_percentage: number;
  total_investment: number;
  total_return: number;
}

export const DonutChartROI = () => {
  // Mock data for ROI by department
  const roiData: ROIByDepartment[] = [
    {
      department: "Marketing",
      roi_percentage: 42,
      total_investment: 1250000,
      total_return: 1775000
    },
    {
      department: "R&D",
      roi_percentage: 28,
      total_investment: 950000,
      total_return: 1216000
    },
    {
      department: "Operations",
      roi_percentage: 35,
      total_investment: 820000,
      total_return: 1107000
    },
    {
      department: "IT",
      roi_percentage: 52,
      total_investment: 680000,
      total_return: 1033600
    }
  ];

  const formatCurrencyShort = (value: number): string => {
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  };

  const totalROI = roiData.reduce((sum, dept) => sum + dept.total_return - dept.total_investment, 0);
  const avgROIPercentage = roiData.reduce((sum, dept) => sum + dept.roi_percentage, 0) / roiData.length;

  const chartData = {
    labels: roiData.map(item => item.department),
    datasets: [{
      data: roiData.map(item => item.total_return),
      backgroundColor: ["#4AAFFF", "#9C84ED", "#54BC4E", "#FF9150"],
      borderWidth: 1,
    }],
  };

  const chartOptions: ChartOptions<"doughnut"> = {
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<"doughnut">) {
            const dept = roiData[context.dataIndex];
            return [
              `Department: ${dept.department}`,
              `ROI: ${dept.roi_percentage}%`,
              `Investment: ${formatCurrencyShort(dept.total_investment)}`,
              `Return: ${formatCurrencyShort(dept.total_return)}`
            ];
          }
        }
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-center text-xl font-semibold mb-2">
        Departmental ROI Analysis
      </h3>
      <p className="text-center text-sm text-gray-500 mb-6">
        Average ROI: <span className="font-bold">{avgROIPercentage.toFixed(1)}%</span> | 
        Total Net Gain: <span className="font-bold">{formatCurrencyShort(totalROI)}</span>
      </p>

      <div className="flex flex-wrap justify-center items-center gap-8">
        <div className="relative flex-1 min-w-[200px] max-w-[260px] aspect-square">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-sm font-medium">Total Returns</span>
            <span className="text-lg font-bold">
              {formatCurrencyShort(roiData.reduce((sum, dept) => sum + dept.total_return, 0))}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="grid gap-4">
            {roiData.map((dept, index) => (
              <div key={dept.department} className="flex items-start gap-3">
                <div 
                  className="w-3 h-3 mt-1.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium">{dept.department}</span>
                    <span className={`text-sm font-bold ${
                      dept.roi_percentage >= 40 ? 'text-green-600' : 
                      dept.roi_percentage >= 30 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {dept.roi_percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Invest: {formatCurrencyShort(dept.total_investment)}</span>
                    <span>Return: {formatCurrencyShort(dept.total_return)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonutChartROI;