import { useEffect, useState } from "react";
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { Search, Users, DollarSign } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DonutChart from "../../../components/charts/DonutChart";
import ComboChart from "../../../components/charts/ComboChart";
import DropdownFilter from "../../../components/shared/DropdownFilter";
import { useSidebar } from "../../../context/SidebarContext";
import PaginationControl from "../../../components/shared/PaginationControl";
import Loading from "../../../components/shared/Loading";

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

interface SummaryStats {
  totalStudents: number;
  totalDisbursed: number;
}

const DisbursementOverview = () => {
  const [studentList, setStudentList] = useState<StudentDisbursement[] | null>(
    []
  );
  const [allStudents, setAllStudents] = useState<StudentDisbursement[] | null>(
    []
  );
  const [page, setPage] = useState<number>(1);
  const [totalPage, setTotalPage] = useState<number>(1);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [years, setYears] = useState<YearLevel[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalStudents: 0,
    totalDisbursed: 0,
  });
  const [filters, setFilters] = useState({
    schoolYear: "",
    branch: "",
    year: "",
  });
  const { collapsed } = useSidebar();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const branches = [
    ...new Set(allStudents?.map((student) => student.student_branch)),
  ];

  // Filter students based on search term and filters
  const filteredStudents =
    searchTerm || filters.schoolYear || filters.branch || filters.year
      ? allStudents?.filter((student) => {
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
        })
      : studentList;

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const fetchDisbursementSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/disbursement/overview/scholar-list?page=${page}&limit=10`
      );
      const { data, totalPages, currentPage } = response.data;
      setTotalPage(totalPages);
      setPage(currentPage);
      setStudentList(data);

      // Fetch all students for search functionality
      const allStudentsResponse = await axios.get(
        `http://localhost:5000/api/disbursement/overview/scholar-list?page=1&limit=10000`
      );
      setAllStudents(allStudentsResponse.data.data);

      // Fetch total disbursed amount from backend
      const totalDisbursedResponse = await axios.get(
        `http://localhost:5000/api/disbursement/overview/total-disbursed`
      );
      console.log("Total disbursed API response:", totalDisbursedResponse.data);
      const { totalStudents, totalDisbursed } = totalDisbursedResponse.data;

      setSummaryStats({
        totalStudents,
        totalDisbursed,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSy = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:5000/api/maintenance/school-year"
      );
      setSchoolYears(response.data);
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
      setYears(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDisbursementSummary();
    fetchSy();
    fetchYrLvl();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Only fetch paginated data when not searching/filtering
    if (
      !searchTerm &&
      !filters.schoolYear &&
      !filters.branch &&
      !filters.year
    ) {
      fetchDisbursementSummary();
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 when search or filters change
  useEffect(() => {
    if (searchTerm || filters.schoolYear || filters.branch || filters.year) {
      setPage(1);
    }
  }, [searchTerm, filters.schoolYear, filters.branch, filters.year]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Navbar pageName="Disbursement Overview" />

        {/* Main Content */}
        <main className="p-6">
          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Scholars
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summaryStats.totalStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Disbursed
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(summaryStats.totalDisbursed)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <ComboChart />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {!loading && schoolYears.length > 2 ? (
                <DonutChart school_year={schoolYears[2].sy_code} />
              ) : (
                <div className="flex justify-center items-center h-64">
                  <Loading />
                </div>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or student ID..."
                  className="block w-full pl-10 pr-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <DropdownFilter
                  label="School Year"
                  name="schoolYear"
                  value={filters.schoolYear}
                  options={schoolYears.map((sy) => sy.school_year)}
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
                  label="Year Level"
                  name="year"
                  value={filters.year}
                  options={years.map((year) => year.yr_lvl)}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Scholar Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Year Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Semester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      School Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Received
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <Loading />
                      </td>
                    </tr>
                  ) : filteredStudents?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No scholars found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents?.map((student, index) => (
                      <tr
                        key={index}
                        onClick={() =>
                          navigate(
                            `/financial-overview/detailed/${student.student_id}`
                          )
                        }
                        className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {student.student_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.student_year_lvl}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.student_semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.student_school_year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.student_branch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(student.total_received)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!searchTerm &&
              !filters.schoolYear &&
              !filters.branch &&
              !filters.year && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <PaginationControl
                    currentPage={page}
                    totalPages={totalPage}
                    onPageChange={setPage}
                  />
                </div>
              )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DisbursementOverview;
