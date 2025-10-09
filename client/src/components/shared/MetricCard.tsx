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
    <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-lg shadow-sm p-2 sm:p-3 hover:bg-white/80 transition-all duration-300 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
            {title}
          </p>
          <p className="text-sm sm:text-base lg:text-lg font-bold mt-1 text-gray-800">
            {value}
          </p>
        </div>
        <div className="p-1.5 rounded-md bg-blue-50/80 backdrop-blur-sm text-blue-600 ml-2 flex-shrink-0">
          <div className="w-3 h-3 sm:w-4 sm:h-4">{icon}</div>
        </div>
      </div>
      {/* Conditional Rendering: Only render the change div if 'change' is provided */}
      {change !== undefined && (
        <div
          className={`mt-3 sm:mt-4 text-xs sm:text-sm ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          <span>
            {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
            <span className="text-gray-500 ml-1">vs. Prior Data</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
