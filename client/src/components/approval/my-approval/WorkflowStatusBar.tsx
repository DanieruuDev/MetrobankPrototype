import { CircleCheck, RotateCwSquare, TriangleAlert } from "lucide-react";

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
    <div className="flex gap-0 sm:gap-1 md:gap-2 p-1 sm:p-2 bg-white rounded-xl border border-gray-200 shadow-sm w-full sm:w-fit overflow-x-auto">
      {statuses.map((status) => {
        const isActive = activeStatus === status.label;
        const count = counts[status.label] || 0;

        return (
          <button
            key={status.label}
            onClick={() => setActiveStatus(status.label)}
            className={`relative px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-1 sm:flex-none justify-center sm:justify-start rounded-lg sm:rounded-lg
  ${
    isActive
      ? `${status.activeColor} text-white shadow-md`
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
  }
  ${status.label !== "All" ? "border-l border-gray-200 sm:border-l-0" : ""}
`}
          >
            {status.icon && (
              <div
                className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 ${
                  isActive ? "text-white" : status.color
                }`}
              >
                {status.icon}
              </div>
            )}
            <div className="hidden xs:block">{status.label}</div>
            <div className="xs:hidden">
              {status.label === "Needs Attention"
                ? "Attention"
                : status.label === "Completed"
                ? "Done"
                : status.label === "Active"
                ? "Active"
                : status.label}
            </div>

            {/* Count Badge */}
            {count > 0 && (
              <span
                className={`ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 text-xs font-bold rounded-full
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
