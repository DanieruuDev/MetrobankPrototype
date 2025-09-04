export const workflowStatusBG = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-500";
    case "In Progress":
      return "bg-yellow-400";
    case "Failed":
      return "bg-red-500 text-red-800";
    case "Not Started":
      return "bg-gray-400";
  }
};

export const workflowStatusText = (status: string) => {
  switch (status) {
    case "Completed":
      return "text-green-500";
    case "On Progress":
      return "text-yellow-500";
    case "Not Started":
      return "text-gray-400";
  }
};

export const approverStatusBadge = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Completed":
      return "bg-green-100 text-green-800";
    case "Missed":
      return "bg-red-200 text-red-900";
    case "Replaced":
      return "bg-gray-200 text-gray-800";
  }
};
// export const approverStatusText = (status: string) => {};

// export const approverBadge = (status: string) => {

// };
