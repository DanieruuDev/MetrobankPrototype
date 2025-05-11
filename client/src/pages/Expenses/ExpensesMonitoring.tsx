import { useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { Search } from "lucide-react";
import { ComboChartData, Students } from "../../mock-data/mockdata";
import { useNavigate } from "react-router-dom";
import { ComboChart } from "../../components/chart/ComboChart";

const ExpensesMonitoring = () => {
  const navigate = useNavigate();
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filters, setFilters] = useState({
    schoolYear: "",
    branch: "",
    year: "",
  });
  const handleRowClick = (studentId: string) => {
    navigate(`/expenses/${studentId}`);
  };
  // Get unique values for dropdowns
  // Get unique values for dropdowns and sort years
  const schoolYears = [
    ...new Set(Students.map((student) => student.schoolYear)),
  ];
  const branches = [...new Set(Students.map((student) => student.branch))];
  const years = [...new Set(Students.map((student) => student.year))].sort(
    (a, b) => {
      // Extract the numeric part from the year string and convert to number
      const getYearNumber = (yearStr: string) => {
        const match = yearStr.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };
      return getYearNumber(a) - getYearNumber(b);
    }
  );

  // Filter students based on search term and filters
  const filteredStudents = Students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters =
      (filters.schoolYear === "" ||
        student.schoolYear === filters.schoolYear) &&
      (filters.branch === "" || student.branch === filters.branch) &&
      (filters.year === "" || student.year === filters.year);

    return matchesSearch && matchesFilters;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <div
        className={`transition-all duration-300 ease-in-out w-full ${
          sidebarToggle ? "ml-30 mr-10" : "ml-70 mr-10"
        }`}
      >
        <Navbar pageName="Expense Monitoring" sidebarToggle={sidebarToggle} />

        {/* Main Content */}
        <div className="md:ml-4 ml-1 mt-20">
          {/* Header Section */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Left Column */}
            <div className="bg-white rounded-lg shadow p-6 text-sm ">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Budget Allocation
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Total Allocated Budget</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Thesis Fee</li>
                    <li>Allowance Fee</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow w-full max-w-[600px] h-[250px] mx-auto ">
              <ComboChart data={ComboChartData} />
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-sm">
              <h3 className="text-lg font-semibold mb-4">
                Total Allocated Budget
              </h3>
              <div className="space-y-4">
                <div>
                  <p>₽ 17,500,000.00</p>
                </div>
                <div>
                  <p className="font-medium">Total Budget Spent</p>
                  <p>₽ 9,312,482.00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div
            className="mb-6
           flex gap-2  "
          >
            <div className="relative text-center text-gray-500 font-medium text-sm">
              <input
                type="text"
                id="search"
                placeholder="Search"
                className="w-full py-1 rounded-lg pl-9 pr-50
                  bg-gray-200  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0  left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} />
              </div>
            </div>
            <div className="gap-4 text-sm text-gray-500 text-center bg-gray-200 rounded-lg px-2">
              {/* School Year Filter */}
              <div className="py-1 px-2">
                <select
                  id="schoolYear"
                  name="schoolYear"
                  value={filters.schoolYear}
                  onChange={handleFilterChange}
                  className="w-full bg-transparent cursor-pointer border-none focus:ring-0 focus:outline-none focus:border-none"
                >
                  <option value="" className="pr-4">
                    All School Years
                  </option>
                  {schoolYears.map((year, index) => (
                    <option key={index} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="gap-4 text-sm text-gray-500 text-center bg-gray-200 rounded-lg">
              {/* School Year Filter */}
              <div className="py-1 px-2">
                <select
                  id="branch"
                  name="branch"
                  value={filters.branch}
                  onChange={handleFilterChange}
                  className="w-full bg-transparent cursor-pointer border-none focus:ring-0 focus:outline-none focus:border-none"
                >
                  <option value="">All Branch</option>
                  {branches.map((branch, index) => (
                    <option key={index} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="gap-4 text-sm text-gray-500 text-center bg-gray-200 rounded-lg">
              {/* School Year Filter */}
              <div className="py-1 px-2">
                <select
                  id="year"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  className="w-full bg-transparent cursor-pointer border-none focus:ring-0 focus:outline-none focus:border-none"
                >
                  <option value="">All Year</option>
                  {years.map((year, index) => (
                    <option key={index} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-y-auto">
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
                      Total Received
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={index}
                      onClick={() => handleRowClick(student.id)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.semester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.schoolYear}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.received}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesMonitoring;
