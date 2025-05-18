import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
}) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2 rounded-lgbg-blue-50 text-blue-600">{icon}</div>
      </div>
      <div
        className={`mt-4 text-sm ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        <span>
          {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%{" "}
          <span className="text-gray-500"></span>
        </span>
      </div>
    </div>
  );
};

export default MetricCard;
