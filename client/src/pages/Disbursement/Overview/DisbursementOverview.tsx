import { useEffect, useState } from "react";
import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { Users, DollarSign } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DonutChart from "../../../components/charts/DonutChart";
import ComboChart from "../../../components/charts/ComboChart";
import SearchWithDropdownFilter from "../../../components/shared/SearchWithDropdownFilter";
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
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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
  const filteredStudents = (() => {
    // If no search term and no filters (including "All" values), show paginated data
    if (
      !searchTerm &&
      (!filters.schoolYear || filters.schoolYear === "All") &&
      (!filters.branch || filters.branch === "All") &&
      (!filters.year || filters.year === "All")
    ) {
      return studentList;
    }

    // Otherwise, filter all students
    return allStudents?.filter((student) => {
      const matchesSearch =
        !searchTerm ||
        student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(student.student_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesFilters =
        (!filters.schoolYear ||
          filters.schoolYear === "All" ||
          String(student.student_school_year) === filters.schoolYear) &&
        (!filters.branch ||
          filters.branch === "All" ||
          student.student_branch === filters.branch) &&
        (!filters.year ||
          filters.year === "All" ||
          String(student.student_year_lvl) === filters.year);

      return matchesSearch && matchesFilters;
    });
  })();

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
        `${VITE_BACKEND_URL}api/disbursement/overview/scholar-list?page=${page}&limit=10`
      );
      const { data, totalPages, currentPage } = response.data;
      setTotalPage(totalPages);
      setPage(currentPage);
      setStudentList(data);

      // Fetch all students for search functionality
      const allStudentsResponse = await axios.get(
        `${VITE_BACKEND_URL}api/disbursement/overview/scholar-list?page=1&limit=10000`
      );

      // Handle different possible response structures
      let allStudentsData;
      if (allStudentsResponse.data.data) {
        allStudentsData = allStudentsResponse.data.data;
      } else if (Array.isArray(allStudentsResponse.data)) {
        allStudentsData = allStudentsResponse.data;
      } else {
        allStudentsData = [];
      }

      setAllStudents(allStudentsData);

      // Fetch total disbursed amount from backend
      const totalDisbursedResponse = await axios.get(
        `${VITE_BACKEND_URL}api/disbursement/overview/total-disbursed`
      );
      const { totalStudents, totalDisbursed } = totalDisbursedResponse.data;

      setSummaryStats({
        totalStudents,
        totalDisbursed,
      });
    } catch (error) {
      console.error("Error in fetchDisbursementSummary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSy = async () => {
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/maintenance/school-year`
      );
      setSchoolYears(response.data);
    } catch (error) {
      console.error("Error fetching school years:", error);
    }
  };

  const fetchYrLvl = async () => {
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/maintenance/year-level`
      );
      setYears(response.data);
    } catch (error) {
      console.error("Error fetching year levels:", error);
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
      (!filters.schoolYear || filters.schoolYear === "All") &&
      (!filters.branch || filters.branch === "All") &&
      (!filters.year || filters.year === "All")
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
    <div className="flex min-h-screen ">
      <Sidebar />

      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-64"
        }`}
      >
        <Navbar pageName="Disbursement Overview" />

        {/* Main Content */}
        <main className="p-3 sm:p-4 lg:p-6">
          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Scholars
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                    {summaryStats.totalStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-lg bg-green-50">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Disbursed
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                    {formatCurrency(summaryStats.totalDisbursed)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6 min-h-[280px] sm:min-h-[320px]">
              <ComboChart />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6 min-h-[280px] sm:min-h-[320px]">
              {!loading && schoolYears.length > 2 ? (
                <DonutChart school_year={schoolYears[2].sy_code} />
              ) : (
                <div className="flex justify-center items-center h-full min-h-[200px]">
                  <Loading />
                </div>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <SearchWithDropdownFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name or student ID..."
            filters={{
              schoolYear: {
                value: filters.schoolYear || "All",
                options: [
                  { value: "All", label: "All School Years" },
                  ...schoolYears.map((sy) => ({
                    value: sy.school_year,
                    label: sy.school_year,
                  })),
                ],
                onChange: (value) => {
                  setFilters((prev) => ({
                    ...prev,
                    schoolYear: value === "All" ? "" : value,
                  }));
                },
                label: "School Year",
              },
              branch: {
                value: filters.branch || "All",
                options: [
                  { value: "All", label: "All Branches" },
                  ...branches.map((b) => ({ value: b, label: b })),
                ],
                onChange: (value) => {
                  setFilters((prev) => ({
                    ...prev,
                    branch: value === "All" ? "" : value,
                  }));
                },
                label: "Branch",
              },
              year: {
                value: filters.year || "All",
                options: [
                  { value: "All", label: "All Year Levels" },
                  ...years.map((y) => ({
                    value: y.yr_lvl,
                    label: y.yr_lvl,
                  })),
                ],
                onChange: (value) => {
                  setFilters((prev) => ({
                    ...prev,
                    year: value === "All" ? "" : value,
                  }));
                },
                label: "Year Level",
              },
            }}
            className="mb-4 sm:mb-6"
          />

          {/* Students Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Scholar Name
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                      Student ID
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Year Level
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Semester
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      School Year
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Branch
                    </th>
                    <th className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Received
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 sm:px-4 lg:px-6 py-8 text-center"
                      >
                        <Loading />
                      </td>
                    </tr>
                  ) : filteredStudents?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 sm:px-4 lg:px-6 py-8 text-center text-gray-500"
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
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.student_name}
                          </div>
                          <div className="text-xs text-gray-500 sm:hidden">
                            ID: {student.student_id} •{" "}
                            {student.student_year_lvl}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                          {student.student_id}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.student_year_lvl}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                          {student.student_semester}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                          {student.student_school_year}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          {student.student_branch}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-semibold text-green-600">
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
              (!filters.schoolYear || filters.schoolYear === "All") &&
              (!filters.branch || filters.branch === "All") &&
              (!filters.year || filters.year === "All") && (
                <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-200">
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
