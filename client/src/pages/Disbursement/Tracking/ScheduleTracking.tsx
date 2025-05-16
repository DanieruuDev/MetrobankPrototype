import { useEffect, useState } from "react";
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import SYSemesterDropdown from "../../../components/shared/SYSemesterDropdown";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// Import necessary icons, including X for clearing search
import { Banknote, CalendarArrowUp, Vault, Search, X } from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";
// Assuming PaginationControl is in a similar relative path as in your Workflow component
import PaginationControl from "../../../components/approval/PaginationControl";
// Assuming you might want a loading indicator later, similar to Workflow
// import Loading from "../../components/shared/Loading";

interface TrackingSummary {
  disbursement_type: string;
  disb_title: string; // We will search based on this field
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
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input
  const navigate = useNavigate();

  // State for pagination (frontend structure only for now)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [loading, setLoading] = useState(false); // Uncomment when adding loading state

  const getTrackingSummary = async (sy_code: string, semester_code: string) => {
    // setLoading(true); // Uncomment when adding loading state
    console.log(sy_code);
    try {
      // Modify this URL later to include pagination, status, and search query parameters
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/tracking/${sy_code}/${semester_code}`
      );
      setTrackingSummary(response.data);
      // You'll need to get totalPages from the backend response when pagination is implemented
      setTotalPages(1); // Placeholder: Set based on actual data and limit later
      console.log(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      // setLoading(false); // Uncomment when adding loading state
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
        case "NOT STARTED": // Assuming "NOT STARTED" corresponds to "Overdue" for the count
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

  // Filtering logic - now includes search term for disbursement titles (client-side)
  // This filtering will be less necessary or change when backend handles filtering/pagination
  const filteredSummary = trackingSummary?.filter((item) => {
    const statusMatch =
      selectedStatus === "All Status" || selectedStatus === "All"
        ? true
        : selectedStatus === "In Progress"
        ? item.status.toUpperCase() === "PENDING"
        : selectedStatus.toUpperCase() === item.status.toUpperCase();

    // Filter by disbursement title (case-insensitive)
    const searchMatch =
      searchTerm === "" ||
      item.disb_title.toLowerCase().includes(searchTerm.toLowerCase());

    // You'll still need to implement the specific logic for "Overdue" filtering if it's date-based
    if (selectedStatus === "Overdue") {
      // Example (conceptual):
      // const currentDate = new Date();
      // const dueDate = new Date(item.disbursement_date);
      // return item.status.toUpperCase() !== 'COMPLETED' && dueDate < currentDate && searchMatch;
      return false; // Placeholder - implement your overdue logic here
    }

    return statusMatch && searchMatch;
  });

  useEffect(() => {
    if (!sySemester) return; // Don't run until sySemester is set

    const [sy, semester] = sySemester.split("_");
    const semester_code = semester === "1st" ? 1 : 2;
    const sy_code = sy.replace("-", "");

    // When backend is ready for pagination/filtering, pass currentPage, selectedStatus, searchTerm here
    getTrackingSummary(sy_code, semester_code.toString());
  }, [sySemester]); // Add currentPage, selectedStatus, searchTerm when backend is ready

  // Function to handle page change (frontend structure only)
  const handlePageChange = (page: number) => {
    // This function will trigger a new data fetch from the backend
    // with the new page number when your collaborator is ready.
    console.log("Changing to page:", page);
    // setCurrentPage(page); // Uncomment when backend is ready
    // const [sy, semester] = sySemester.split("_");
    // const semester_code = semester === "1st" ? 1 : 2;
    // const sy_code = sy.replace("-", "");
    // getTrackingSummary(sy_code, semester_code.toString()); // Call fetch with new page
  };

  const handleTypeClick = (disbursement_id: number) => {
    navigate(`/tracking/detailed/${disbursement_id}`);
  };

  // Function to clear the search term
  const handleClearSearch = () => {
    setSearchTerm("");
    // When backend handles filtering, triggering a new fetch might be needed here
    // const [sy, semester] = sySemester.split("_");
    // const semester_code = semester === "1st" ? 1 : 2;
    // const sy_code = sy.replace("-", "");
    // getTrackingSummary(sy_code, semester_code.toString());
  };

  return (
    <div className="flex">
      {/* Reverted main content padding to fixed */}
      <div
        className={`transition-all duration-300 ease-in-out w-full pl-[250px]`}
      >
        {/* Navbar positioning reverted to fixed */}
        <div className="fixed top-0 right-0 left-[250px] h-[73px] z-10">
          <Navbar pageName="Disbursement Tracking" />
        </div>

        {/* Sidebar component - its responsiveness will be handled elsewhere */}
        <Sidebar />

        {/* Adjusted top margin to clear fixed navbar */}
        <div className="mt-20 p-4">
          {/* Dropdown menus */}
          {/* Removed flex-wrap and gap from this container */}
          <div className="flex gap-4 mb-10">
            <SYSemesterDropdown onChange={(value) => setSySemester(value)} />
            {/* Removed the status dropdown div */}
          </div>

          {/* Simple dashboard - Grid layout reverted to fixed */}
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
                label: "Overdue", // Changed from "Not Started" in the card label based on your screenshot
                value: totals?.notStarted.toLocaleString("en-PH", {
                  // This still uses notStarted total, you might want to adjust this
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
                  : card.label === "Overdue" // Changed from "Not Started" here too
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

          {/* Filter and Search Area - Reverted to fixed layout */}
          <div className="flex justify-between items-center mb-4">
            {" "}
            {/* Removed flex-wrap and gap-4 */}
            <div className="flex rounded-sm bg-gray-100">
              {" "}
              {/* Removed mb-4 from here */}
              {/* These buttons now control the filtering */}
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
            {/* Search bar with clear button */}
            <div className="flex items-center gap-2">
              {" "}
              {/* Flex container for search and potential other controls */}
              <div className="relative flex items-center">
                {" "}
                {/* Relative container for input and icons */}
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-7 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f61c0] focus:border-transparent text-sm" // Removed responsive width
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />{" "}
                {/* Search icon */}
                {searchTerm && ( // Conditionally render clear button
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* You can add the Filter button or other controls here if needed */}
              {/* <button className="...">Filter</button> */}
            </div>
          </div>

          {/* Table Container - Removed horizontal scrolling */}
          <div>
            {" "}
            {/* Removed overflow-x-auto class */}
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
                {/* Loading indicator (uncomment when adding loading state) */}
                {/* {loading ? (
                    <tr>
                       <td colSpan={8} className="text-center py-4">
                           <Loading />
                       </td>
                    </tr>
                 ) : */}
                {filteredSummary?.length === 0 ? ( // Empty state message
                  <tr>
                    {/* Modified the empty state message */}
                    <td colSpan={8} className="text-center text-gray-500 py-8">
                      {searchTerm
                        ? `No disbursements found matching "${searchTerm}" in the "${selectedStatus}" category.`
                        : `No disbursements found in the "${selectedStatus}" category.`}
                    </td>
                  </tr>
                ) : (
                  // Render filteredSummary
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
                        {/* Display "Overdue" status text if the backend provides it as "NOT STARTED" */}
                        {item.status.toUpperCase() === "NOT STARTED" && (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            Overdue{" "}
                            {/* Display Overdue based on your screenshot */}
                          </span>
                        )}
                        {/* You might also need logic here to show "Overdue" if status is PENDING and date has passed */}
                      </td>

                      <td className="py-3 px-4">{item.total}</td>
                      <td className="py-3 px-4">{item.number_of_recipients}</td>
                      <td className="py-3 text-blue-500 cursor-pointer font-semibold">
                        <span
                          className="border py-1 px-2 rounded-sm border-gray-400 text-blue-600 hover:bg-gray-100 focus:outline-none focus:bg-gray-200 transition-colors cursor-pointer" // Combined original border/padding with hover effects
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

          {/* Pagination Control (Frontend Only) */}
          <div className="mt-4">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange} // This function is a placeholder for now
              // You might want to disable the buttons until backend pagination is ready
              // isPreviousDisabled={currentPage === 1}
              // isNextDisabled={currentPage === totalPages}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTracking;
