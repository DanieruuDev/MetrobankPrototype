import DisbursementTable from "../../../components/invoice/DisbursementTable";
import { Student } from "../../../Interface/ITuitionInvoice";

interface ThesisFeeUploadProps {
  students: Student[];
  filteredStudents: Student[];
  fetchStudents: () => void;
  schoolYear: string;
  semester: string;
  role: number | undefined;
  isLoading: boolean;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string>>;
  setSelectedYearLevel: React.Dispatch<React.SetStateAction<string>>;
  setSelectedProgram: React.Dispatch<React.SetStateAction<string>>;
  page: number;
  itemsPerPage: number;
  handlePageChange: (newPage: number) => void;
  totalPages: number;
}

function ThesisFeeUpload({
  students,
  filteredStudents,
  schoolYear,
  semester,
  isLoading,
  setSelectedBranch,
  setSelectedYearLevel,
  setSelectedProgram,
  page,
  itemsPerPage,
  handlePageChange,
  totalPages,
}: ThesisFeeUploadProps) {
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  return (
    <div className="px-4 sm:px-6">
      <DisbursementTable
        students={students}
        filteredStudents={filteredStudents}
        isLoading={isLoading}
        schoolYear={schoolYear}
        semester={semester}
        VITE_BACKEND_URL={VITE_BACKEND_URL}
        page={page}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
        setSelectedBranch={setSelectedBranch}
        setSelectedYearLevel={setSelectedYearLevel}
        setSelectedProgram={setSelectedProgram}
      />
    </div>
  );
}

export default ThesisFeeUpload;
