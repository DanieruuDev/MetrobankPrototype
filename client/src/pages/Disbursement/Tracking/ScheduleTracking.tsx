import { useEffect, useState } from "react";
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import SYSemesterDropdown from "../../../components/maintainables/SYSemesterDropdown";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Banknote, CalendarArrowUp, Vault, Search, X } from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";
import { useSidebar } from "../../../context/SidebarContext";

interface TrackingSummary {
  disbursement_type: string;
  disb_title: string;
  disbursement_date: string;
  disb_sched_id: number;
  number_of_recipients: string;
  sy_code: number;
  semester_code: number;
  status: string;
  total: string;
}

const ScheduleTracking = () => {
  // Set "All" as the default selected status
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sySemester, setSySemester] = useState<string>("2024-2025_2nd");
  const [trackingSummary, setTrackingSummary] = useState<
    TrackingSummary[] | null
  >([]);
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const getTrackingSummary = async (sy_code: string, semester_code: string) => {
    //adjust to make a pagination
    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/tracking/${sy_code}/${semester_code}`
      );
      setTrackingSummary(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const getColorClass = (statusLabel: string, isActive: boolean) => {
    const colorMap: Record<string, string> = {
      Completed: isActive
        ? "bg-green-600 text-white"
        : "text-green-600 hover:bg-green-100",
      "In Progress": isActive
        ? "bg-yellow-400 text-white"
        : "text-yellow-600 hover:bg-yellow-100",
      Overdue: isActive
        ? "bg-red-600 text-white"
        : "text-red-600 hover:bg-red-100",
      All: isActive
        ? "bg-gray-900 text-white"
        : "text-gray-700 hover:bg-gray-200",
    };

    // Default style if status not found
    return colorMap[statusLabel] || "text-gray-700 hover:bg-gray-200";
  };

  const totals = trackingSummary?.reduce(
    (acc, item) => {
      const amount = parseFloat(item.total || "0");

      switch (item.status.toUpperCase()) {
        case "COMPLETED":
          acc.completed += amount;
          break;
        case "PENDING":
          acc.inProgress += amount;
          break;
        case "NOT STARTED":
          acc.notStarted += amount;
          break;
        default:
          break;
      }

      acc.total += amount;
      return acc;
    },
    { completed: 0, inProgress: 0, notStarted: 0, total: 0 }
  );

  const filteredSummary = trackingSummary?.filter((item) => {
    const itemStatus = item.status.toLowerCase();

    const statusMatch =
      selectedStatus === "All"
        ? true
        : selectedStatus === "In Progress"
        ? itemStatus === "in progress"
        : selectedStatus.toLowerCase() === itemStatus;

    const searchMatch =
      searchTerm === "" ||
      item.disb_title.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  useEffect(() => {
    if (!sySemester) return;

    const [sy, semester] = sySemester.split("_");
    const semester_code = semester === "1st" ? 1 : 2;
    const sy_code = sy.replace("-", "");

    getTrackingSummary(sy_code, semester_code.toString());
  }, [sySemester]);

  const handleTypeClick = (disbursement_id: number) => {
    navigate(`/tracking/detailed/${disbursement_id}`);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="flex">
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } transition-[padding-left] duration-300 ease-in-out w-full`}
      >
        <Navbar pageName="Disbursement Tracking" />
        <Sidebar />
        <div className="mt-5 px-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Completed",
                value: totals?.completed.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }),
                icon: <Banknote />,
              },
              {
                label: "In Progress",
                value: totals?.inProgress.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }),
                icon: <CalendarArrowUp />,
              },
              {
                label: "Overdue",
                value: totals?.notStarted.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }),
                icon: <Vault />,
              },
              {
                label: "Total",
                value: totals?.total.toLocaleString("en-PH", {
                  style: "currency",
                  currency: "PHP",
                }),
                icon: null,
              },
            ].map((card, idx) => {
              const color =
                card.label === "Completed"
                  ? "text-green-600"
                  : card.label === "In Progress"
                  ? "text-yellow-600"
                  : card.label === "Overdue"
                  ? "text-red-600"
                  : "text-gray-800";

              return (
                <div
                  key={idx}
                  className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4`}
                >
                  {card.icon && (
                    <div className={`${color} p-2 bg-gray-50 rounded-lg`}>
                      {card.icon}
                    </div>
                  )}
                  <div>
                    <div className={`text-xs font-medium ${color}`}>
                      {card.label}
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-gray-900">
                      {card.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit border border-gray-200">
              {["All", "Completed", "In Progress", "Overdue"].map((status) => {
                const isActive = selectedStatus === status;

                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${getColorClass(
                      status,
                      isActive
                    )}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-7 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm bg-white"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <SYSemesterDropdown onChange={(value) => setSySemester(value)} />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs text-gray-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">
                      Schedule ID
                    </th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSummary?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center text-gray-500 py-12 text-sm"
                      >
                        {searchTerm
                          ? `No disbursements found matching "${searchTerm}" in the "${selectedStatus}" category.`
                          : `No disbursements found in the "${selectedStatus}" category.`}
                      </td>
                    </tr>
                  ) : (
                    filteredSummary?.map((item, index) => (
                      <tr
                        key={item.disb_sched_id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {item.disb_sched_id}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-800">
                          {item.disb_title}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {item.disbursement_type}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {formatDate(item.disbursement_date)}
                        </td>
                        <td className="px-6 py-3">
                          {item.status.toLowerCase() === "completed" && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                              Completed
                            </span>
                          )}
                          {item.status.toLowerCase() === "in progress" && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">
                              In Progress
                            </span>
                          )}
                          {item.status.toLowerCase() === "not started" && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              Not Started
                            </span>
                          )}
                          {item.status.toLowerCase() === "failed" && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-800">
                          {item.total}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-800">
                          {item.number_of_recipients}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-blue-700 hover:bg-blue-50"
                            onClick={() => handleTypeClick(item.disb_sched_id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTracking;
