import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number; // 👈 Made 'change' optional
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
}) => {
  // Check if change is defined before checking if it's positive
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      {" "}
      <div className="flex justify-between items-start">
        {" "}
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>{" "}
        </div>{" "}
        <div className="p-2 rounded-lgbg-blue-50 text-blue-600">{icon}</div>{" "}
      </div>{" "}
      {/* 👈 Conditional Rendering: Only render the change div if 'change' is provided */}{" "}
      {change !== undefined && (
        <div
          className={`mt-4 text-sm ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {" "}
          <span>
            {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%{" "}
            {/* Added text to clarify the comparison period */}
            <span className="text-gray-500">vs. Prior Data</span>{" "}
          </span>{" "}
        </div>
      )}{" "}
    </div>
  );
};

export default MetricCard;
