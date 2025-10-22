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
  const auth = useAuth();
  const role = auth?.user?.role_id;
  const branch = auth?.info?.branch?.branch_name;
  // ✅ Load active tab from localStorage or default to 1
  const savedTab = Number(localStorage.getItem("activeTabId")) || 1;
  const [activeTabId, setActiveTabId] = useState<number>(savedTab);

  const activeTab = tabMap[activeTabId];

  const [schoolYear, setSchoolYear] = useState("2025-2026");
  const [semester, setSemester] = useState("1st Semester");
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    branch || null
  );

  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  const yearLevelRef = useRef<HTMLDivElement>(null);
  const programRef = useRef<HTMLDivElement>(null);

  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const [yearLevelOpen, setYearLevelOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  const [, setInitialRenewalInfo] = useState<InitialRenewalInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const { collapsed } = useSidebar();
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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
            branch: branch,
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
    if (auth) {
      fetchStudents(activeTabId);
      fetchRenewalInfo();
    }
  }, [schoolYear, semester, activeTabId]);

  const filteredStudents = [...students]
    .filter((student) => {
      const branchMatch =
        selectedBranch === null || student.campus === selectedBranch;
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

  console.log("Students", filteredStudents);
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

  console.log("Brnach:", selectedBranch);

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
              yearLevelOpen={yearLevelOpen}
              setYearLevelOpen={setYearLevelOpen}
              programOpen={programOpen}
              setProgramOpen={setProgramOpen}
              uniqueYearLevels={uniqueYearLevels}
              uniquePrograms={uniquePrograms}
              yearLevelRef={yearLevelRef}
              programRef={programRef}
            />
          </div>

          <div>{renderActiveTab()}</div>
        </div>
      </div>
    </div>
  );
};

export default DisbursementUploadPage;
