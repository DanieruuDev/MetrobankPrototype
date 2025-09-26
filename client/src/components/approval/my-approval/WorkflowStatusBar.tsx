import { CircleCheck, RotateCwSquare, TriangleAlert } from "lucide-react";
import React from "react";
const statuses = [
  {
    label: "All",
    color: "text-gray-600",
    activeColor: "bg-gray-600",
    icon: null,
  },
  {
    label: "Active",
    icon: <RotateCwSquare />,
    color: "text-blue-600",
    activeColor: "bg-blue-600",
  },
  {
    label: "Needs Attention",
    icon: <TriangleAlert />,
    color: "text-red-600",
    activeColor: "bg-red-600",
  },
  {
    label: "Completed",
    icon: <CircleCheck />,
    color: "text-green-600",
    activeColor: "bg-green-600",
  },
];

interface StatusFilterProps {
  activeStatus: string;
  setActiveStatus: (status: string) => void;
  counts: Record<string, number>;
}

function WorkflowStatusBar({
  activeStatus,
  setActiveStatus,
  counts,
}: StatusFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 p-1 bg-white rounded-xl border border-gray-200 shadow-sm w-fit">
      {statuses.map((status) => {
        const isActive = activeStatus === status.label;
        const count = counts[status.label] || 0;

        return (
          <button
            key={status.label}
            onClick={() => setActiveStatus(status.label)}
            className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2
  ${
    isActive
      ? `${status.activeColor} text-white shadow-md`
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
  }
`}
          >
            {status.icon && (
              <div
                className={`flex items-center justify-center w-5 h-5 ${
                  isActive ? "text-white" : status.color
                }`}
              >
                {status.icon}
              </div>
            )}
            <div>{status.label}</div>

            {/* 🔹 Badge */}
            {count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full
                ${
                  status.label === "Needs Attention"
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default WorkflowStatusBar;
