import { useEffect, useState } from "react";
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import SYSemesterDropdown from "../../../components/shared/SYSemesterDropdown";
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
          <div className="grid grid-cols-4 gap-4 mb-6">
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
                  ? "text-green-500"
                  : card.label === "In Progress"
                  ? "text-yellow-500"
                  : card.label === "Overdue"
                  ? "text-red-500"
                  : "text-gray-800";

              return (
                <div
                  key={idx}
                  className={`bg-white p-4 rounded-xl shadow flex items-center gap-4`}
                >
                  {card.icon && <div className={`${color}`}>{card.icon}</div>}
                  <div>
                    <div className={`text-sm ${color}`}>{card.label}</div>
                    <div className="text-xl font-semibold">{card.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
              {["All", "Completed", "In Progress", "Overdue"].map((status) => {
                const isActive = selectedStatus === status;

                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${getColorClass(
                      status,
                      isActive
                    )}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 ">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-7 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f61c0] focus:border-transparent text-sm"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <SYSemesterDropdown onChange={(value) => setSySemester(value)} />
            </div>
          </div>

          <div>
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
              <thead className="bg-gray-100 text-sm text-gray-500">
                <tr>
                  <th className="py-2 px-4 text-left">Disbursement ID</th>
                  <th className="py-2 px-4 text-left">Title</th>
                  <th className="py-2 px-4 text-left">Disbursement Type</th>
                  <th className="py-2 px-4 text-left">Schedule</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Total</th>
                  <th className="py-2 px-4 text-left">Recipients</th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-500 py-8">
                      {searchTerm
                        ? `No disbursements found matching "${searchTerm}" in the "${selectedStatus}" category.`
                        : `No disbursements found in the "${selectedStatus}" category.`}
                    </td>
                  </tr>
                ) : (
                  filteredSummary?.map((item) => (
                    <tr
                      key={item.disb_sched_id}
                      className="border-b border-gray-300 py-4 text-[13px] font-medium text-gray-700"
                    >
                      <td className="py-3 px-4">{item.disb_sched_id}</td>
                      <td className="py-3 px-4">{item.disb_title}</td>
                      <td className="py-3 px-4">{item.disbursement_type}</td>
                      <td className="py-3 px-4">
                        {formatDate(item.disbursement_date)}
                      </td>
                      <td className="py-3 px-4">
                        {item.status.toLowerCase() === "completed" && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                            Completed
                          </span>
                        )}
                        {item.status.toLowerCase() === "in progress" && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                            In Progress
                          </span>
                        )}
                        {item.status.toLowerCase() === "not started" && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            Not Started
                          </span>
                        )}
                        {item.status.toLowerCase() === "failed" && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            Failed
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">{item.total}</td>
                      <td className="py-3 px-4">{item.number_of_recipients}</td>
                      <td className="py-3 text-blue-500 cursor-pointer font-semibold">
                        <span
                          className="border py-1 px-2 rounded-sm border-gray-400 text-blue-600 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 transition-colors cursor-pointer"
                          onClick={() => {
                            handleTypeClick(item.disb_sched_id);
                          }}
                        >
                          View Details
                        </span>
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
  );
};

export default ScheduleTracking;
