import React, { useState, useEffect } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import { useSidebar } from "../../context/SidebarContext";
import { Upload, Eye } from "lucide-react";
import { toast } from "react-toastify";
import Loading from "../../components/shared/Loading";
import PaginationControl from "../../components/shared/PaginationControl";

// Define interfaces for TypeScript
interface Student {
  renewal_id: number;
  student_id: number;
  scholar_name: string;
  campus: string;
  batch: string;
  renewal_date: string;
  is_initial: boolean;
  year_level: string;
  semester: string;
  school_year: string;
  initialized_by: number;
  scholarship_status: string;
  delisted_date: string | null;
  delisting_root_cause: string | null;
  validation_id: number;
  is_validated: boolean;
  role_id: number | null;
  hr_completed_at: string | null;
}

interface UploadedFile {
  id: number;
  studentId: number;
  filename: string;
  uploadedAt: string;
}

// Mock data
const mockStudents: Student[] = [
  {
    renewal_id: 1,
    student_id: 1001,
    scholar_name: "John Doe",
    campus: "Main Campus",
    batch: "Batch 2024",
    renewal_date: "2025-10-01",
    is_initial: true,
    year_level: "2nd Year",
    semester: "1st Semester",
    school_year: "2025-2026",
    initialized_by: 101,
    scholarship_status: "Passed",
    delisted_date: null,
    delisting_root_cause: null,
    validation_id: 1,
    is_validated: true,
    role_id: 3,
    hr_completed_at: "2025-10-01 14:10",
  },
  {
    renewal_id: 2,
    student_id: 1002,
    scholar_name: "Jane Smith",
    campus: "North Campus",
    batch: "Batch 2023",
    renewal_date: "2025-10-02",
    is_initial: true,
    year_level: "3rd Year",
    semester: "2nd Semester",
    school_year: "2025-2026",
    initialized_by: 102,
    scholarship_status: "Passed",
    delisted_date: null,
    delisting_root_cause: null,
    validation_id: 2,
    is_validated: true,
    role_id: 9,
    hr_completed_at: "2025-10-02 09:10",
  },
  {
    renewal_id: 3,
    student_id: 1003,
    scholar_name: "Alex Brown",
    campus: "South Campus",
    batch: "Batch 2024",
    renewal_date: "2025-10-03",
    is_initial: true,
    year_level: "1st Year",
    semester: "1st Semester",
    school_year: "2025-2026",
    initialized_by: 103,
    scholarship_status: "Delisted",
    delisted_date: "2025-10-05",
    delisting_root_cause: "Failed GPA",
    validation_id: 3,
    is_validated: true,
    role_id: 7,
    hr_completed_at: "2025-10-03 10:10",
  },
];

const mockUploadedFiles: UploadedFile[] = []; // Initialize empty for mock uploads

const TuitionInvoiceUpload: React.FC = () => {
  const { collapsed } = useSidebar();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [uploadedFiles, setUploadedFiles] =
    useState<UploadedFile[]>(mockUploadedFiles);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const itemsPerPage = 5;

  // Handle file upload (mock logic)
  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      if (!selectedStudent) {
        toast.error("Please select a student first");
        return;
      }
      // Mock upload simulation with current date/time (05:13 AM PST, Oct 10, 2025)
      console.log(
        "Uploading file for student:",
        selectedStudent.student_id,
        file
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newUpload: UploadedFile = {
        id: uploadedFiles.length + 1,
        studentId: selectedStudent.student_id,
        filename: file.name,
        uploadedAt: "10/10/2025, 05:13 AM PST",
      };
      setUploadedFiles((prev) => [newUpload, ...prev]);
      toast.success("File uploaded successfully (mock)");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsLoading(false);
      setIsUploadOpen(false);
      setSelectedStudent(null); // Reset selection after upload
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Set initial pagination
  useEffect(() => {
    setTotalPage(Math.ceil(mockStudents.length / itemsPerPage));
  }, []);

  return (
    <div className="min-h-screen relative">
      <Sidebar />

      <div
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"}
        `}
      >
        <Navbar pageName="Tuition Invoice Upload" />

        <div className="px-4 sm:px-6 py-6">
          {/* Header and Upload Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Tuition Invoice Upload
            </h2>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
              onClick={() => setIsUploadOpen(true)}
              disabled={!selectedStudent}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Invoice</span>
            </button>
          </div>

          {/* Upload Modal */}
          {isUploadOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">
                  Upload Tuition Invoice
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Selected Student:{" "}
                  {selectedStudent ? selectedStudent.scholar_name : "None"}
                </p>
                <input
                  type="file"
                  accept=".pdf,.zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="mb-4 w-full border border-gray-300 rounded p-2"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsUploadOpen(false)}
                    className="px-4 py-2 bg-gray-300 text-white rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && <Loading />}

          {/* Students Table */}
          {!isLoading && (
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80 backdrop-blur-sm">
                    <tr className="text-slate-700 text-xs sm:text-sm font-medium text-left">
                      <th className="px-4 py-3 border border-gray-300">View</th>
                      <th className="px-4 py-3 border border-gray-300">
                        Student ID
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        Scholar Name
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        Campus
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        Year Level
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        Semester
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        School Year
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200 text-[12px] sm:text-[14px]">
                    {mockStudents
                      .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                      .map((student) => (
                        <tr
                          key={student.renewal_id}
                          className={`border border-gray-300 ${
                            selectedStudent?.renewal_id === student.renewal_id
                              ? "bg-blue-100"
                              : ""
                          }`}
                          onClick={() => setSelectedStudent(student)}
                        >
                          <td className="px-4 py-2 border border-gray-300 text-center">
                            <Eye className="w-4 h-4 text-blue-600 cursor-pointer" />
                          </td>

                          <td className="px-4 py-2 border border-gray-300">
                            {student.student_id}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.scholar_name}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.campus}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.year_level}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.semester}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.school_year}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {student.scholarship_status}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-slate-50/80 backdrop-blur-sm border-t border-slate-200">
                <PaginationControl
                  currentPage={page}
                  totalPages={totalPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}

          {/* Uploaded Files Table (if any) */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 px-4 py-3">
                Uploaded Invoices
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80 backdrop-blur-sm">
                    <tr className="text-slate-700 text-xs sm:text-sm font-medium text-left">
                      <th className="px-4 py-3 border border-gray-300">ID</th>
                      <th className="px-4 py-3 border border-gray-300">
                        Student ID
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        Filename
                      </th>
                      <th className="px-4 py-3 border border-gray-300">
                        Uploaded At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-slate-200 text-[12px] sm:text-[14px]">
                    {uploadedFiles.map((file) => (
                      <tr key={file.id} className="border border-gray-300">
                        <td className="px-4 py-2 border border-gray-300">
                          {file.id}
                        </td>
                        <td className="px-4 py-2 border border-gray-300">
                          {file.studentId}
                        </td>
                        <td className="px-4 py-2 border border-gray-300">
                          {file.filename}
                        </td>
                        <td className="px-4 py-2 border border-gray-300">
                          {file.uploadedAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TuitionInvoiceUpload;
