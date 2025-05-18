import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { ChartOptions, TooltipItem } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProgramROIData {
  program: string;
  roi_percentage: number;
  total_investment: number;
  total_return: number;
  avg_break_even: number;
  students_count: number;
}

// Define props interface for the component
interface DonutChartProps {
  data: ProgramROIData[]; // Expecting an array of ProgramROIData objects
}

// Accept the data prop
const DonutChartROI: React.FC<DonutChartProps> = ({ data: programData }) => {
  // Removed the internal hardcoded programData array

  const formatCurrencyShort = (value: number): string => {
    if (value === undefined || value === null) return "₱0"; // Handle potential undefined/null
    if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}K`;
    return `₱${value.toFixed(0)}`;
  };

  // Calculate totals from the data prop
  const totalInvestment = programData.reduce(
    (sum, program) => sum + program.total_investment,
    0
  );
  const totalReturns = programData.reduce(
    (sum, program) => sum + program.total_return,
    0
  );

  // Calculate Total Savings to display in the center and as a slice
  // Note: Chart.js Doughnut typically represents parts of a whole.
  // If you want Investment vs. Savings, the slices should sum to Total Investment + Total Savings
  // Or represent how Total Investment was covered by Savings so far vs remaining investment.
  // Based on your image, it seems to show "Total Investment" vs "Total Savings".
  // Let's calculate total savings
  const totalSavings = totalReturns - totalInvestment;

  // Adjust chartData to represent Investment vs Savings as slices
  // The sum of slices should be Total Investment + Total Savings OR represent proportion of Total Return.
  // The image shows "Total Savings ₱4.7M" in the center and slices likely representing Investment and Return/Savings contributions to ROI.
  // Let's assume the slices should represent Total Investment vs Total Savings for simplicity based on the image labels.
  // A common pattern is Investment Cost vs. Gains/Savings towards covering that cost.
  // Let's make the slices represent Total Investment and Total Savings
  const chartData = {
    labels: ["Total Investment", "Total Savings"],
    datasets: [
      {
        // Data points should likely represent the contribution amounts
        // If representing Investment vs Savings contribution to ROI, it could be [Total Investment, Total Savings]
        // If representing how Total Investment is covered by Total Returns, it could be [Total Investment, Total Returns] or [Total Investment, Total Savings]
        // Let's use [Total Investment, Total Savings] for now, but clarify the visual meaning.
        data: [totalInvestment, totalSavings],
        backgroundColor: [" #C68EFD", "#4E71FF"], // Match colors to image if possible
        borderColor: "#ffffff", // Optional: Add border for separation
        borderWidth: 2, // Optional: Adjust border width
      },
    ],
  };

  const chartOptions: ChartOptions<"doughnut"> = {
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Legend is displayed manually next to the chart
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            // Display label and formatted value from the slice
            const value = context.raw as number;
            return `${context.label}: ${formatCurrencyShort(value)}`;
          },
          afterLabel: function (context: TooltipItem<"doughnut">) {
            // Optional: Add percentage to tooltip
            const total = context.dataset.data.reduce(
              (sum, val) => (sum as number) + (val as number),
              0
            ) as number;
            const value = context.raw as number;
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `(${percentage}%)`;
          },
        },
      },
    },
    // You might need to add layout or padding options here if needed
    layout: {
      padding: {
        top: 10, // Adjust padding if necessary
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
  };

  return (
    <div className="h-full flex flex-col">
      <div className="text-center mb-6 md:mb-10">
        {" "}
        {/* Adjusted bottom margin */}
        <h3 className="text-lg font-semibold">Program Investment vs Savings</h3>
      </div>

      {/* Flex container for chart and legend/details */}
      {/* Added justify-center for smaller screens, md:justify-between for larger */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-center md:items-start flex-1">
        {/* Chart Container */}
        {/* Adjusted max-w for better responsiveness */}
        <div className="relative w-full max-w-[250px] md:max-w-[280px] aspect-square">
          <Doughnut data={chartData} options={chartOptions} />
          {/* Text overlay for Total Savings */}
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-sm text-gray-500">Total Savings</span>
            <span className="text-xl font-bold">
              {formatCurrencyShort(totalSavings)} {/* Display Total Savings */}
            </span>
          </div>
        </div>

        {/* Program Details Legend */}
        {/* Adjusted margin top for md screens */}
        <div className="w-full md:w-auto mt-4 md:mt-18">
          {" "}
          {/* Adjusted margin top */}
          <div className="grid gap-4">
            {programData.map((program, index) => (
              <div
                key={program.program}
                className="flex text-sm items-start gap-3"
              >
                {/* Color indicator - match chart colors if possible */}
                {/* The original colors were hardcoded here, let's use colors that relate to the chart slices or program identity */}
                {/* The chart slices are Investment vs Savings. The legend is Program details. */}
                {/* Let's use distinct colors for programs or perhaps colors derived from investment/return? */}
                {/* For simplicity, let's use distinct colors for each program */}
                <div
                  className="w-4 h-4 mt-1 rounded-sm flex-shrink-0"
                  style={{
                    // Using distinct colors for programs in the legend
                    backgroundColor: index === 0 ? "#4E71FF" : "#C68EFD", // Example distinct colors
                  }}
                />
                <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium">{program.program}</span>
                    <span className="text-sm font-semibold">
                      {program.students_count} Students
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      Invested: {formatCurrencyShort(program.total_investment)}
                    </span>
                    <span>ROI: {program.roi_percentage}%</span>
                  </div>
                  {/* ROI progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, program.roi_percentage)}%`, // Cap at 100% for bar width
                        // Using distinct colors for programs in the progress bar
                        backgroundColor: index === 0 ? "#4E71FF" : "#C68EFD", // Example distinct colors
                      }}
                    />
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
