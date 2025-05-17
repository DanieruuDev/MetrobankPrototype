import { useEffect, useState } from "react";
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { Search } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DonutChart from "../../../components/charts/DonutChart";
import ComboChart from "../../../components/charts/ComboChart";
import DropdownFilter from "../../../components/shared/DropdownFilter";
import { useSidebar } from "../../../context/SidebarContext";

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
  const { collapsed } = useSidebar();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const navigate = useNavigate();

  const branches = [
    ...new Set(studentList?.map((student) => student.student_branch)),
  ];

  // Filter students based on search term and filters
  const filteredStudents = studentList?.filter((student) => {
    const matchesSearch =
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(student.student_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilters =
      (filters.schoolYear === "" ||
        student.student_school_year === filters.schoolYear) &&
      (filters.branch === "" || student.student_branch === filters.branch) &&
      (filters.year === "" || student.student_year_lvl === filters.year);

    return matchesSearch && matchesFilters;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchDisbursementSummary = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/disbursement/overview/scholar-list"
      );
      setStudentList(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSy = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/maintenance/school-year"
      );
      setSchoolYears(response.data); // Response should be an array of SchoolYear objects
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYrLvl = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/maintenance/year-level"
      );
      setYears(response.data); // Response should be an array of YearLevel objects
    } catch (error) {
      console.log(error);
    }
  };
  console.log(schoolYears[0]?.school_year);

  useEffect(() => {
    fetchDisbursementSummary();
    fetchSy();
    fetchYrLvl();
  }, []);

  return (
    <div className="flex">
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } transition-all duration-300 ease-in-out w-full `}
      >
        <Navbar pageName="Disbursement Overview" />

        <Sidebar />

        {/* Main Content */}
        <div className="md:ml-4 mx-4 mt-12">
          {/* Header Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6 text-sm">
              <ComboChart />
            </div>

            <div className="bg-white rounded-lg shadow p-6 text-sm">
              {!loading ? (
                <DonutChart school_year={schoolYears[2]?.sy_code} />
              ) : (
                <div>Loading...</div>
              )}
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 flex gap-2">
            <div className="relative text-center text-gray-500 font-medium text-sm">
              <input
                type="text"
                id="search"
                placeholder="Search"
                className="w-full py-1 rounded-lg pl-9 pr-50 bg-gray-200  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} />
              </div>
            </div>

            <DropdownFilter
              label="School Year"
              name="schoolYear"
              value={filters.schoolYear}
              options={schoolYears.map((sy) => sy.school_year)} // Update with school_year string
              onChange={handleFilterChange}
            />

            <DropdownFilter
              label="Branch"
              name="branch"
              value={filters.branch}
              options={branches}
              onChange={handleFilterChange}
            />
            <DropdownFilter
              label="Year"
              name="year"
              value={filters.year}
              options={years.map((year) => year.yr_lvl)} // Update with yr_lvl string
              onChange={handleFilterChange}
            />
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
                  {filteredStudents?.map((student, index) => (
                    <tr
                      key={index}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.total_received}
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

export default DisbursementOverview;
