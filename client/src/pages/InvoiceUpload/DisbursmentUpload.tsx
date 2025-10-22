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

const DisbursementUploadPage: React.FC = () => {
  // ✅ Load active tab from localStorage or default to 1
  const savedTab = Number(localStorage.getItem("activeTabId")) || 1;
  const [activeTabId, setActiveTabId] = useState<number>(savedTab);

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

  const [isLoading, setIsLoading] = useState(true);
  const { collapsed } = useSidebar();
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const auth = useAuth();
  const role = auth?.user?.role_id;
  console.log(role);
  // ✅ Save active tab to localStorage when it changes

  const tabLabels = [
    { id: 1, label: "Tuition Fee" },
    { id: 2, label: "Semestral Allowance" },
    { id: 3, label: "Thesis Fee" },
    { id: 4, label: "Internship Allowance" },
    { id: 5, label: "Academic Excellence Award" },
  ];

  useEffect(() => {
    localStorage.setItem("activeTabId", activeTabId.toString());
  }, [activeTabId]);

  // ✅ Fetch students based on tab
  const fetchStudents = async (tabId = activeTabId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/invoice/list/${schoolYear}/${semester}`,
        {
          params: {
            branch: auth?.user?.branch?.branch_name,
            disbursement_type_id: tabId,
          },
        }
      );
      setStudents(response.data);
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

      setInitialRenewalInfo(response.data?.data || null);
    } catch (error) {
      console.error("Error fetching renewal info:", error);
      toast.error("Failed to load renewal info");
    }
  };

  useEffect(() => {
    fetchStudents(activeTabId);
    fetchRenewalInfo();
  }, [schoolYear, semester, activeTabId]);

  const filteredStudents = [...students]
    .filter((student) => {
      const branchMatch =
        selectedBranch === "all" || student.campus === selectedBranch;
      const yearLevelMatch =
        selectedYearLevel === "all" || student.year_level === selectedYearLevel;
      const programMatch =
        selectedProgram === "all" || student.program === selectedProgram;
      return branchMatch && yearLevelMatch && programMatch;
    })
    .sort((a, b) => {
      const aHasFileOrAmount =
        (a.disbursement_files && a.disbursement_files.length > 0) ||
        (a.disbursement_amount && a.disbursement_amount > 0);
      const bHasFileOrAmount =
        (b.disbursement_files && b.disbursement_files.length > 0) ||
        (b.disbursement_amount && b.disbursement_amount > 0);

      // Incomplete first (those without file or amount)
      if (aHasFileOrAmount !== bHasFileOrAmount) {
        return aHasFileOrAmount ? 1 : -1;
      }

      // Alphabetical by name
      return a.scholar_name.localeCompare(b.scholar_name, "en", {
        sensitivity: "base",
      });
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

  // ✅ Close dropdowns when clicking outside
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

  const renderActiveTab = () => {
    // Prevent unauthorized roles from seeing restricted tabs
    if (role !== 7 && (activeTabId === 2 || activeTabId === 4)) {
      return (
        <div className="text-center text-gray-500 py-10">
          You don’t have permission to access this section.
        </div>
      );
    }

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
            type={"tuition"}
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
            type={"semestral_allowance"}
          />
        );
      case "thesis":
        return (
          <ThesisFeeUpload
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
            type={"thesis_fee"}
          />
        );
      case "internship":
        return (
          <InternshipAllowanceUpload
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
            type={"intership"}
          />
        );
      case "award":
        return (
          <AcademicAwardUpload
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
            type={"academic_award"}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      <Sidebar />
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"
        }`}
      >
        <Navbar pageName="Disbursement Uploads" />

        {/* ✅ Tab Navigation - Mobile Responsive */}
        <div className="bg-white sticky top-0 z-20 border-b border-gray-200">
          {/* Mobile: Hidden - using bottom navigation instead */}
          <div className="hidden sm:block"></div>

          {/* Desktop: Normal flex layout */}
          <div className="hidden sm:flex flex-wrap gap-2 px-6 pt-4">
            {tabLabels
              .filter(({ id }) => {
                // Only role 7 can see Semestral Allowance (id=2) and Internship Allowance (id=4)
                if (role !== 7 && (id === 2 || id === 4)) return false;
                return true;
              })
              .map(({ id, label }) => (
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
        </div>

        {/* ✅ Filter + Upload Section */}
        <div className="pb-20 sm:pb-0">
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

          <div>{renderActiveTab()}</div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="block sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex justify-around items-center py-2">
            {tabLabels
              .filter(({ id }) => {
                // Only role 7 can see Semestral Allowance (id=2) and Internship Allowance (id=4)
                if (role !== 7 && (id === 2 || id === 4)) return false;
                return true;
              })
              .map(({ id, label }) => {
                // Professional SVG icon mapping for each tab
                const getTabIcon = (tabId: number) => {
                  switch (tabId) {
                    case 1:
                      return (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l9-5-9-5-9 5 9 5z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                          />
                        </svg>
                      ); // Tuition Fee
                    case 2:
                      return (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      ); // Semestral Allowance
                    case 3:
                      return (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      ); // Thesis Fee
                    case 4:
                      return (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                          />
                        </svg>
                      ); // Internship Allowance
                    case 5:
                      return (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                          />
                        </svg>
                      ); // Academic Award
                    default:
                      return (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      );
                  }
                };

                return (
                  <button
                    key={id}
                    onClick={() => setActiveTabId(id)}
                    className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                      activeTabId === id
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {getTabIcon(id)}
                    <span className="text-xs font-medium mt-1 leading-tight">
                      {label.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisbursementUploadPage;
