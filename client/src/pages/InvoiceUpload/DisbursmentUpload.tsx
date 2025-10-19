import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/shared/Navbar";
import Sidebar from "../../components/shared/Sidebar";
import TuitionUpload from "./DisbursementType/TuitionInvoiceUpload";
import SemestralInvoice from "./DisbursementType/SemestralInvoice";
import ThesisFeeUpload from "./DisbursementType/ThesisFeeUpload";
import InternshipAllowanceUpload from "./DisbursementType/InternshipAllowanceUpload";
import AcademicAwardUpload from "./DisbursementType/AcademicAwardUpload";
import { useSidebar } from "../../context/SidebarContext";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Student } from "../../Interface/ITuitionInvoice";
import { toast } from "react-toastify";
import StudentFilter from "../../components/invoice/tuition-invoice/StudentFilter";
import { InitialRenewalInfo } from "../../Interface/IRenewal";

type DisbursementTab =
  | "tuition"
  | "allowance"
  | "thesis"
  | "internship"
  | "award";

const tabMap: Record<number, DisbursementTab> = {
  1: "tuition",
  2: "allowance",
  3: "thesis",
  4: "internship",
  5: "award",
};

const tabLabels = [
  { id: 1, label: "Tuition Fee" },
  { id: 2, label: "Semestral Allowance" },
  { id: 3, label: "Thesis Fee" },
  { id: 4, label: "Internship Allowance" },
  { id: 5, label: "Academic Excellence Award" },
];

const DisbursementUploadPage: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<number>(1);
  const activeTab = tabMap[activeTabId];

  const [schoolYear, setSchoolYear] = useState("2025-2026");
  const [semester, setSemester] = useState("1st Semester");
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  const branchRef = useRef<HTMLDivElement>(null);
  const yearLevelRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);

  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [branchOpen, setBranchOpen] = useState(false);
  const [yearLevelOpen, setYearLevelOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  const [, setInitialRenewalInfo] = useState<InitialRenewalInfo | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(1);
  const itemsPerPage = 10;

  const [isLoading, setIsLoading] = useState(true);
  const { collapsed } = useSidebar();
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const auth = useAuth();
  const role = auth?.user?.role_id;

  // ✅ Fetch students based on tab
  const fetchStudents = async (tabId = activeTabId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/invoice/list/${schoolYear}/${semester}`,
        {
          params: {
            branch: auth?.user?.branch?.branch_name,
            disbursement_type_id: tabId, // 👈 now tied to tab ID
          },
        }
      );

      const data = response.data;
      console.log(`Fetched data for tab ${tabId}:`, data);
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load student data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRenewalInfo = async () => {
    try {
      const semesterCode =
        semester === "1st Semester" ? 1 : semester === "2nd Semester" ? 2 : 3;

      const response = await axios.get(
        `${VITE_BACKEND_URL}api/renewal/count-renewal`,
        {
          params: {
            school_year: schoolYear.replace("-", ""),
            semester: semesterCode,
            branch: auth?.user?.branch?.branch_id || null,
          },
        }
      );

      if (response.data?.data) {
        setInitialRenewalInfo(response.data.data);
      } else {
        setInitialRenewalInfo(null);
      }
    } catch (error) {
      console.error("Error fetching renewal info:", error);
      toast.error("Failed to load renewal info");
    }
  };
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  // ✅ Refetch when tab, semester, or school year changes
  useEffect(() => {
    fetchStudents(activeTabId);
    fetchRenewalInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolYear, semester, activeTabId]);

  // ✅ Filter logic
  const filteredStudents = students.filter((student) => {
    const branchMatch =
      selectedBranch === "all" || student.campus === selectedBranch;
    const yearLevelMatch =
      selectedYearLevel === "all" || student.year_level === selectedYearLevel;
    const programMatch =
      selectedProgram === "all" || student.program === selectedProgram;
    return branchMatch && yearLevelMatch && programMatch;
  });

  const uniqueBranches = Array.from(
    new Set(students.map((s) => s.campus))
  ).sort();
  const uniqueYearLevels = Array.from(
    new Set(students.map((s) => s.year_level))
  ).sort();
  const uniquePrograms = Array.from(
    new Set(students.map((s) => s.program))
  ).sort();

  // ✅ Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        branchRef.current &&
        !branchRef.current.contains(event.target as Node)
      )
        setBranchOpen(false);
      if (
        yearLevelRef.current &&
        !yearLevelRef.current.contains(event.target as Node)
      )
        setYearLevelOpen(false);
      if (
        programRef.current &&
        !programRef.current.contains(event.target as Node)
      )
        setProgramOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Render active tab content
  const renderActiveTab = () => {
    switch (activeTab) {
      case "tuition":
        return (
          <TuitionUpload
            students={students}
            filteredStudents={filteredStudents}
            fetchStudents={() => fetchStudents(activeTabId)}
            schoolYear={schoolYear}
            semester={semester}
            role={role}
            isLoading={isLoading}
            setSelectedBranch={setSelectedBranch}
            setSelectedYearLevel={setSelectedYearLevel}
            setSelectedProgram={setSelectedProgram}
          />
        );
      case "allowance":
        return (
          <SemestralInvoice
            students={students}
            filteredStudents={filteredStudents}
            fetchStudents={() => fetchStudents(activeTabId)}
            schoolYear={schoolYear}
            semester={semester}
            role={role}
            isLoading={isLoading}
            setSelectedBranch={setSelectedBranch}
            setSelectedYearLevel={setSelectedYearLevel}
            setSelectedProgram={setSelectedProgram}
            page={page}
            itemsPerPage={itemsPerPage}
            handlePageChange={handlePageChange}
            totalPages={totalPages}
          />
        );
      case "thesis":
        return <ThesisFeeUpload />;
      case "internship":
        return <InternshipAllowanceUpload />;
      case "award":
        return <AcademicAwardUpload />;
      default:
        return null;
    }
  };

  console.log("Student:", students);

  return (
    <div className="min-h-screen relative">
      <Sidebar />
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"
        }`}
      >
        <Navbar pageName="Disbursement Uploads" />

        {/* ✅ Tab Navigation */}
        <div className="flex flex-wrap gap-2 px-6 pt-4 border-b border-gray-200 bg-white sticky top-0 z-20">
          {tabLabels.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTabId(id)}
              className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                activeTabId === id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ✅ Filter + Upload Section */}
        <div>
          <div className="px-4 sm:px-6 pt-6">
            <StudentFilter
              role={role}
              students={students}
              filteredStudents={filteredStudents}
              schoolYear={schoolYear}
              semester={semester}
              setSchoolYear={setSchoolYear}
              setSemester={setSemester}
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
              selectedYearLevel={selectedYearLevel}
              setSelectedYearLevel={setSelectedYearLevel}
              selectedProgram={selectedProgram}
              setSelectedProgram={setSelectedProgram}
              filtersExpanded={filtersExpanded}
              setFiltersExpanded={setFiltersExpanded}
              branchOpen={branchOpen}
              setBranchOpen={setBranchOpen}
              yearLevelOpen={yearLevelOpen}
              setYearLevelOpen={setYearLevelOpen}
              programOpen={programOpen}
              setProgramOpen={setProgramOpen}
              uniqueBranches={uniqueBranches}
              uniqueYearLevels={uniqueYearLevels}
              uniquePrograms={uniquePrograms}
              branchRef={branchRef}
              yearLevelRef={yearLevelRef}
              programRef={programRef}
            />
          </div>

          {/* ✅ Active Upload Component */}
          <div>{renderActiveTab()}</div>
        </div>
      </div>
    </div>
  );
};

export default DisbursementUploadPage;
