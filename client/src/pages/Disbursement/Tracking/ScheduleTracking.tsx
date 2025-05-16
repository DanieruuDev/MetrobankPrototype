import { useEffect, useState } from "react";
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import SYSemesterDropdown from "../../../components/shared/SYSemesterDropdown";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Banknote, CalendarArrowUp, Vault } from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";

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
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sySemester, setSySemester] = useState<string>("");
  const [trackingSummary, setTrackingSummary] = useState<
    TrackingSummary[] | null
  >([]);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  // Data for disbursement types

  const statusOptions = ["All Status", "COMPLETED", "PENDING", "NOT STARTED"];

  const getTrackingSummary = async (sy_code: string, semester_code: string) => {
    console.log(sy_code);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/tracking/${sy_code}/${semester_code}`
      );
      setTrackingSummary(response.data);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
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
    if (selectedStatus === "All Status" || selectedStatus === "All")
      return true;

    if (selectedStatus === "In Progress") {
      return item.status.toUpperCase() === "PENDING";
    }

    return item.status.toUpperCase() === selectedStatus.toUpperCase();
  });

  useEffect(() => {
    if (!sySemester) return; // Don't run until sySemester is set

    const [sy, semester] = sySemester.split("_");
    const semester_code = semester === "1st" ? 1 : 2;
    const sy_code = sy.replace("-", "");

    getTrackingSummary(sy_code, semester_code.toString());
  }, [sySemester]);

  const handleTypeClick = (disbursement_id: number) => {
    navigate(`/tracking/detailed/${disbursement_id}`);
  };
  return (
    <div className="flex">
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } transition-[padding-left] duration-300 ease-in-out w-full`}
      >
        <Navbar pageName="Disbursement Tracking" />

        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="mt-5 px-4">
          {/* Dropdown menus */}
          <div className="flex flex-wrap gap-4 mt-4">
            <SYSemesterDropdown onChange={(value) => setSySemester(value)} />

            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-gray-100 border-0 shadow-md border-gray-300 rounded-xl pl-6 pr-25  py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          {/*Simple dashboard */}
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
                label: "Not Started",
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
                  : card.label === "Not Started"
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

          <div className="flex justify-between">
            <div className="flex mb-4 rounded-sm bg-gray-100">
              {["All", "Completed", "In Progress", "Overdue"].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-1 text-sm cursor-pointer rounded-l ${
                    selectedStatus === status
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div>All Branch</div>
              <div>Search</div>
            </div>
          </div>

          <div>
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
              <thead className="bg-gray-100 text-sm text-gray-500">
                <tr>
                  <th className="py-2 px-4 text-left">Disbursem ID</th>
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
                {filteredSummary?.map((item) => (
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
                      {item.status.toUpperCase() === "COMPLETED" && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          Completed
                        </span>
                      )}
                      {item.status.toUpperCase() === "PENDING" && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                          In Progress
                        </span>
                      )}
                      {item.status.toUpperCase() === "NOT STARTED" && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                          Not Started
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">{item.total}</td>
                    <td className="py-3 px-4">{item.number_of_recipients}</td>
                    <td className="py-3 text-blue-500 cursor-pointer font-semibold">
                      <span
                        className="border py-1 px-2 rounded-sm border-gray-400"
                        onClick={() => {
                          handleTypeClick(item.disb_sched_id);
                        }}
                      >
                        View Details
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTracking;
