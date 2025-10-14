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
    <div className="bg-gradient-to-br from-white/80 to-gray-50/70 backdrop-blur-md border border-gray-200/60 rounded-xl shadow-md p-3 sm:p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold text-gray-600 tracking-wide uppercase truncate">
            {title}
          </p>
          <p className="text-lg font-extrabold mt-1 text-gray-900 ">{value}</p>
        </div>
        <div className="p-2 rounded-full bg-blue-50/80 text-blue-600 ml-2 flex-shrink-0 ring-1 ring-blue-200/70 shadow-inner">
          <div className="w-4 h-4">{icon}</div>
        </div>
      </div>
      {/* Conditional Rendering: Only render the change div if 'change' is provided */}
      {change !== undefined && (
        <div className="mt-3 sm:mt-4">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
              isPositive
                ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
            <span className="ml-1 text-gray-500 font-normal">vs prior</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
