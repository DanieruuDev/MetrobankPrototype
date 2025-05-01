import { useState, useEffect } from "react";
import Navbar from "../../components/shared/Navbar";
import Sidebar from "../../components/shared/Sidebar";
import { useParams } from "react-router-dom";
import { Students } from "../../mock-data/mockdata";

interface Student {
  id: string;
  name: string;
  year: string;
  branch: string;
  schoolYear: string;
}

const ExpenseView = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  const { studentId } = useParams();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    const foundStudent = Students.find((s) => s.id === studentId);
    setStudent(foundStudent || null); // Convert undefined to null
  }, [studentId]);

  if (!student) {
    return <div>Loading...</div>;
  }

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
        <Navbar pageName="Expense View" sidebarToggle={sidebarToggle} />
        <div className="mt-20 p-6">
          {/* Student Header */}
          <div className=" ml-5">
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-gray-600">
              {student.id} | {student.year} | {student.branch}
            </p>
          </div>

          {/* Expenses Sections */}
          <div className="space-y-6">
            {/* First Semester */}
            <div className="border-b-3 border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-700">
                Expenses for <br />
                {student.year} {student.schoolYear} 1st Semester
              </h2>
              <div className="grid grid-cols-1  gap-1">
                <div className="border-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Scholarship Fee</p>
                  <p className="text-gray-800">P 00,000.00</p>
                </div>
                <div className="border-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Allowance Fee</p>
                  <p className="text-gray-800">P 00,000.00</p>
                </div>
                <div className="border-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Thesis Fee</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
                <div className="border-gray-200 bg-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Gross Assessment</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
              </div>
            </div>

            <div className=" p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-700">
                Expenses for <br />
                {student.year} {student.schoolYear} 1st Semester
              </h2>
              <div className="grid grid-cols-1  gap-1">
                <div className="border-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Scholarship Fee</p>
                  <p className="text-gray-800">P 00,000.00</p>
                </div>
                <div className="border-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Allowance Fee</p>
                  <p className="text-gray-800">P 00,000.00</p>
                </div>
                <div className="border-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Thesis Fee</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
                <div className="border-gray-200 bg-gray-200 border-1 shadow-md px-8 py-3 rounded-xl flex justify-between">
                  <p className="font-medium">Gross Assessment</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
              </div>
            </div>

            {/* Second Semester */}

            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Annual Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total Scholarship Fee</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
                <div>
                  <p className="font-medium">Total Allowance Fee</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
                <div>
                  <p className="font-medium">Total Thesis Fee</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
                <div>
                  <p className="font-medium">Total Gross Assessment</p>
                  <p className="text-gray-700">P 00,000.00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseView;
