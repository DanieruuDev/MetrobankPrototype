import { useEffect, useState, useMemo } from "react"; // Import useMemo
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { Search } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DonutChart from "../../../components/charts/DonutChart";
import ComboChart from "../../../components/charts/ComboChart";
import DropdownFilter from "../../../components/shared/DropdownFilter";
// Assuming you have a Pagination component
// import Pagination from "../../../components/shared/Pagination";

interface StudentDisbursement {
  student_name: string;
  student_id: number;
  student_year_lvl: string;
  student_semester: string;
  student_school_year: string;
  student_branch: string;
  total_received: number;
}

interface SchoolYear {
  sy_code: number;
  school_year: string;
}

interface YearLevel {
  yr_lvl_code: number;
  yr_lvl: string;
}

const DisbursementOverview = () => {
  const [studentList, setStudentList] = useState<StudentDisbursement[] | null>(
    []
  );
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [years, setYears] = useState<YearLevel[]>([]);
  const [filters, setFilters] = useState({
    schoolYear: "",
    branch: "",
    year: "",
  });
  const [collapsed, setCollapsed] = useState(false);
  const [loadingSchoolYears, setLoadingSchoolYears] = useState(false); // Specific loading state for school years
  const [searchTerm, setSearchTerm] = useState<string>("");

  // State for pagination (example)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Example: 10 items per page

  const navigate = useNavigate();

  // Create a unique list of branches from student data
  const branches = Array.from(
    new Set(studentList?.map((student) => student.student_branch))
  );

  // --- Filtering Logic ---
  const filteredStudents = useMemo(
    () => {
      if (!studentList) return []; // Return empty array if studentList is null

      return studentList.filter((student) => {
        const matchesSearch =
          student.student_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          String(student.student_id)
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesFilters =
          (filters.schoolYear === "" ||
            student.student_school_year === filters.schoolYear) &&
          (filters.branch === "" ||
            student.student_branch === filters.branch) &&
          (filters.year === "" || student.student_year_lvl === filters.year);

        return matchesSearch && matchesFilters;
      });
    },
    [studentList, searchTerm, filters] // Dependencies for useMemo
  );
  // --- End Filtering Logic ---

  // --- Pagination Logic ---
  const paginatedStudents = useMemo(
    () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredStudents.slice(startIndex, endIndex);
    },
    [filteredStudents, currentPage, itemsPerPage] // Dependencies for useMemo
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Optional: Scroll to the top of the table when changing pages
    // const tableElement = document.querySelector('table');
    // if (tableElement) {
    //     tableElement.scrollIntoView({ behavior: 'smooth' });
    // }
  };
  // --- End Pagination Logic ---

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const fetchDisbursementSummary = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/disbursement/overview/scholar-list"
      );
      setStudentList(response.data.data);
    } catch (error) {
      console.error("Error fetching student summary:", error);
      setStudentList([]); // Set to empty array on error
      // TODO: Display a user-friendly error message on the UI
    }
  };

  const fetchSy = async () => {
    setLoadingSchoolYears(true); // Use specific loading state
    try {
      const response = await axios.get(
        "http://localhost:5000/api/maintenance/school-year"
      );
      // Assuming response.data is an array of SchoolYear objects
      setSchoolYears(response.data);
    } catch (error) {
      console.error("Error fetching school years:", error);
      setSchoolYears([]); // Set to empty array on error
      // TODO: Display a user-friendly error message on the UI
    } finally {
      setLoadingSchoolYears(false); // End loading
    }
  };

  const fetchYrLvl = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/maintenance/year-level"
      );
      // Assuming response.data is an array of YearLevel objects
      setYears(response.data);
    } catch (error) {
      console.error("Error fetching year levels:", error);
      setYears([]); // Set to empty array on error
      // TODO: Display a user-friendly error message on the UI
    }
  };

  useEffect(() => {
    fetchDisbursementSummary();
    fetchSy();
    fetchYrLvl();
  }, []);

  // --- Logic to determine which school_year sy_code to pass to DonutChart ---
  const schoolYearForDonutChart = useMemo(() => {
    if (filters.schoolYear === "") {
      // If no school year filter is selected, use the sy_code of the latest school year
      if (schoolYears.length > 0) {
        // Assuming the schoolYears array is sorted in descending order by sy_code
        // If not, you might need to sort it or find the max sy_code
        return schoolYears[0].sy_code; // Using index 0 for the latest year
      }
      return undefined; // No school years loaded yet
    } else {
      // If a school year filter is selected, find its corresponding sy_code
      const selectedSy = schoolYears.find(
        (sy) => sy.school_year === filters.schoolYear
      );
      return selectedSy?.sy_code;
    }
  }, [filters.schoolYear, schoolYears]); // Re-calculate when filter or schoolYears change
  // --- End Logic for DonutChart School Year ---

  return (
    <div className="flex min-h-screen">
      {" "}
      {/* Added min-h-screen */}
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      {/* Main Content Wrapper */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          collapsed ? "ml-20" : "ml-[250px]" // Use ml for margin-left
        }`}
      >
        {/* Navbar */}
        <Navbar pageName="Disbursement Overview" />

        {/* Main Content Area with Padding and Max Width */}
        <div className="container mx-auto px-4 py-8">
          {" "}
          {/* Added container, mx-auto, px-4, py-8 */}
          {/* Header Section - Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {" "}
            {/* Increased bottom margin */}
            {/* Combo Chart Container */}
            <div className="bg-white rounded-lg shadow p-6 text-sm">
              {/* TODO: Add Title to ComboChart */}
              <ComboChart />
              {/* TODO: Add Loading and Empty States for ComboChart */}
            </div>
            {/* Donut Chart Container */}
            <div className="bg-white rounded-lg shadow p-6 text-sm flex items-center justify-center">
              {" "}
              {/* Added flex and center classes */}
              {/* Pass the determined schoolYearForDonutChart */}
              <DonutChart school_year={schoolYearForDonutChart} />
            </div>
          </div>
          {/* Search and Filter Section */}
          {/* Responsive flex container for search and filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
            {" "}
            {/* Changed to responsive flex, increased gap, centered items */}
            {/* Search Input */}
            {/* Flex-grow allows search to take up more space */}
            <div className="relative text-gray-500 font-medium text-sm w-full sm:w-auto flex-grow">
              <input
                type="text"
                id="search"
                placeholder="Search Scholar Name or ID"
                className="w-full py-2 rounded-lg pl-9 pr-4 bg-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900" // Adjusted padding and text color
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} />
              </div>
            </div>
            {/* School Year Dropdown Filter */} {/* Re-added */}
            <DropdownFilter
              label="School Year"
              name="schoolYear"
              value={filters.schoolYear}
              options={[...schoolYears.map((sy) => sy.school_year)]}
              onChange={handleFilterChange}
            />
            {/* Filter Dropdowns (Remaining) */}
            {/* Added min-w to prevent squishing on smaller screens */}
            <DropdownFilter
              label="Branch"
              name="branch"
              value={filters.branch}
              options={[...branches]}
              onChange={handleFilterChange}
            />
            <DropdownFilter
              label="Year Level"
              name="year"
              value={filters.year}
              options={[...years.map((year) => year.yr_lvl)]}
              onChange={handleFilterChange}
            />
          </div>
          {/* Students Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Added responsive overflow wrapper for horizontal scrolling */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scholar Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      School Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Received{" "}
                      {/* Consider changing label to Cumulative Total Received */}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStudents && paginatedStudents.length > 0 ? (
                    paginatedStudents.map((student, index) => (
                      <tr
                        key={student.student_id} // Use a stable key
                        className="hover:bg-gray-100 cursor-pointer transition-colors duration-150 ease-in-out" // Added hover effect and cursor
                        onClick={() => {
                          navigate(
                            `/financial-overview/detailed/${student.student_id}`
                          );
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_year_lvl}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_school_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.student_branch}
                        </td>
                        {/* Corrected td structure and formatting */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {
                            // Attempt to parse the value as a float, default to 0 if parsing fails or value is null/undefined
                            parseFloat(
                              (student.total_received as any) || "0"
                            ).toLocaleString("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            })
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Empty state for the table
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        {studentList === null
                          ? "Loading students..."
                          : "No students found matching your criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination Component */}
          <div className="mt-6 flex justify-center">
            {" "}
            {/* Centered the pagination */}
            {/*
                    TODO: Integrate your Pagination component here.
                    Pass the necessary props. Example:
                */}
            {/* <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                 /> */}
            {/* Display simple text pagination for now */}
            {filteredStudents.length > itemsPerPage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          {/* TODO: Consider a different table display for very small screens (e.g., cards) */}
        </div>
      </div>
    </div>
  );
};

export default DisbursementOverview;
