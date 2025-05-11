import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export const DonutChart = () => {
  const disbursementData = [
    { category: "Allowance", total_amount: 4600000.0 },
    { category: "Internship", total_amount: 1150000.0 },
    { category: "Scholarship", total_amount: 3450000.0 },
    { category: "Thesis", total_amount: 1725000.0 },
  ];

  const chartData = {
    labels: disbursementData.map((item) => item.category),
    datasets: [
      {
        data: disbursementData.map((item) => item.total_amount),
        backgroundColor: ["#4AAFFF", "#9C84ED", "#54BC4E", "#FF9150"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    cutout: "75%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "40px",
        maxWidth: "800px",
      }}
    >
      {/* Donut Chart - Made larger */}
      <div style={{ width: "150px", height: "200px", position: "relative" }}>
        <Doughnut data={chartData} options={chartOptions} />
      </div>

      {/* Custom Legend - Adjusted for better alignment and smaller text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {disbursementData.map((item, index) => (
          <div
            key={item.category}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: chartData.datasets[0].backgroundColor[index],
                borderRadius: "3px",
                flexShrink: 0,
              }}
            />
            <span style={{ minWidth: "80px" }}>{item.category}:</span>
            <span style={{ fontWeight: "bold", fontFamily: "monospace" }}>
              {item.total_amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
