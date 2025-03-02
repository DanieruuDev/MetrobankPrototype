import React, { useState } from "react";

import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { scholarshipData } from "../../../mock-data/mockdata";

// Main navigation component
function ScholarshipSystem() {
  // Navigation state
  const [currentView, setCurrentView] = useState<
    "branches" | "courses" | "years" | "scholars"
  >("branches");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [, setSelectedScholar] = useState<number | null>(null);

  // Function to navigate back
  const goBack = () => {
    if (currentView === "scholars") {
      setCurrentView("years");
      setSelectedScholar(null);
    } else if (currentView === "years") {
      setCurrentView("courses");
      setSelectedYear(null);
    } else if (currentView === "courses") {
      setCurrentView("branches");
      setSelectedCourse(null);
    }
  };

  // Function to handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    scholarId: number
  ) => {
    const { name, value } = e.target;

    // In a real application, update your data here
    console.log(`Updating ${name} to ${value} for scholar ${scholarId}`);
  };

  // Render different views based on navigation state
  const renderContent = () => {
    if (currentView === "branches") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {scholarshipData.branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
              onClick={() => {
                setSelectedBranch(branch.id);
                setCurrentView("courses");
              }}
            >
              <div className="h-40 bg-blue-600 flex items-center justify-center">
                <img
                  src="/api/placeholder/200/150"
                  alt={branch.name}
                  className="object-cover h-full w-full opacity-80"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {branch.name}
                </h2>
                <p className="text-gray-600 mt-2">
                  {branch.courses.length} Programs Available
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {branch.courses.reduce((total, course) => {
                      return (
                        total +
                        course.years.reduce((yearTotal, year) => {
                          return yearTotal + year.scholars.length;
                        }, 0)
                      );
                    }, 0)}{" "}
                    Scholars
                  </span>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (currentView === "courses") {
      const branch = scholarshipData.branches.find(
        (b) => b.id === selectedBranch
      );
      if (!branch) return <div>Branch not found</div>;

      return (
        <>
          <div className="flex items-center mb-6">
            <button
              onClick={goBack}
              className="mr-4 bg-gray-200 p-2 rounded-full hover:bg-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-bold">{branch.name} Programs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branch.courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => {
                  setSelectedCourse(course.id);
                  setCurrentView("years");
                }}
              >
                <div className="h-40 bg-blue-500 flex items-center justify-center p-4">
                  <img
                    src="/api/placeholder/200/150"
                    alt={course.name}
                    className="object-cover h-full w-full opacity-80"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800">
                    {course.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{course.code}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {course.years.reduce(
                        (total, year) => total + year.scholars.length,
                        0
                      )}{" "}
                      Scholars
                    </span>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                      View Years
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (currentView === "years") {
      const branch = scholarshipData.branches.find(
        (b) => b.id === selectedBranch
      );
      if (!branch) return <div>Branch not found</div>;

      const course = branch.courses.find((c) => c.id === selectedCourse);
      if (!course) return <div>Course not found</div>;

      return (
        <>
          <div className="flex items-center mb-6">
            <button
              onClick={goBack}
              className="mr-4 bg-gray-200 p-2 rounded-full hover:bg-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold">{course.name}</h2>
              <p className="text-gray-600">
                {branch.name} - {course.code}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {course.years.map((year) => (
              <div
                key={year.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
                onClick={() => {
                  setSelectedYear(year.id);
                  setCurrentView("scholars");
                }}
              >
                <div className="h-32 bg-blue-400 flex items-center justify-center">
                  <h3 className="text-3xl font-bold text-white">{year.name}</h3>
                </div>
                <div className="p-4">
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-gray-600">
                      {year.scholars.length} Scholars
                    </span>
                    <button className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm">
                      View All
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (currentView === "scholars") {
      const branch = scholarshipData.branches.find(
        (b) => b.id === selectedBranch
      );
      if (!branch) return <div>Branch not found</div>;

      const course = branch.courses.find((c) => c.id === selectedCourse);
      if (!course) return <div>Course not found</div>;

      const year = course.years.find((y) => y.id === selectedYear);
      if (!year) return <div>Year not found</div>;

      return (
        <>
          <div className="flex items-center mb-6">
            <button
              onClick={goBack}
              className="mr-4 bg-gray-200 p-2 rounded-full hover:bg-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl font-bold">{year.name} Scholars</h2>
              <p className="text-gray-600">
                {branch.name} - {course.name}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {year.scholars.map((scholar) => (
              <div
                key={scholar.id}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-xl font-bold mb-4">
                  {scholar.name}{" "}
                  <span className="text-gray-500 text-sm ml-2">
                    ({scholar.schoolId})
                  </span>
                </h3>

                <div className="mb-6 flex flex-wrap gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      scholar.scholarshipStatus === "Active"
                        ? "bg-green-100 text-green-800"
                        : scholar.scholarshipStatus === "Delisted"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {scholar.scholarshipStatus}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    Batch: {scholar.batch}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-lg mb-4 text-blue-700">
                      Current Status
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          Year Level
                        </label>
                        <input
                          type="text"
                          name="yearLevel"
                          value={scholar.yearLevel}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          Semester
                        </label>
                        <input
                          type="text"
                          name="semester"
                          value={scholar.semester}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          School Year
                        </label>
                        <input
                          type="text"
                          name="schoolYear"
                          value={scholar.schoolYear}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold text-lg mb-4 text-blue-700">
                      Renewal Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          Renewal Date
                        </label>
                        <input
                          type="date"
                          name="renewalDate"
                          value={scholar.renewalDate}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          Year Level Basis
                        </label>
                        <input
                          type="text"
                          name="renewalYearLevelBasis"
                          value={scholar.renewalYearLevelBasis}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          School Year Basis
                        </label>
                        <input
                          type="text"
                          name="renewalSchoolYearBasis"
                          value={scholar.renewalSchoolYearBasis}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-8">
                  <h4 className="font-bold text-lg mb-4 text-blue-700">
                    Validation Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">GPA</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name="gpa"
                          value={scholar.gpa}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-1 rounded-md w-16 text-center"
                        />
                        <select
                          name="gpaValidationStatus"
                          value={scholar.gpaValidationStatus}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className={`rounded-md p-1 text-sm ${
                            scholar.gpaValidationStatus === "Passed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <option value="Passed">Passed</option>
                          <option value="Failed">Failed</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">
                        No Failing Grades
                      </label>
                      <select
                        name="noFailingGradeValidationStatus"
                        value={scholar.noFailingGradeValidationStatus}
                        onChange={(e) => handleChange(e, scholar.id)}
                        className={`rounded-md p-1 text-sm ${
                          scholar.noFailingGradeValidationStatus === "Passed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">
                        No Other Scholarship
                      </label>
                      <select
                        name="noOtherScholarshipValidationStatus"
                        value={scholar.noOtherScholarshipValidationStatus}
                        onChange={(e) => handleChange(e, scholar.id)}
                        className={`rounded-md p-1 text-sm ${
                          scholar.noOtherScholarshipValidationStatus ===
                          "Passed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">
                        Good Moral
                      </label>
                      <select
                        name="goodMoralValidationStatus"
                        value={scholar.goodMoralValidation}
                        onChange={(e) => handleChange(e, scholar.id)}
                        className={`rounded-md p-1 text-sm ${
                          scholar.goodMoralValidation === "Passed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">Full Load</label>
                      <select
                        name="fullLoadValidationStatus"
                        value={scholar.fullLoadValidation}
                        onChange={(e) => handleChange(e, scholar.id)}
                        className={`rounded-md p-1 text-sm ${
                          scholar.fullLoadValidation === "Passed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">
                        Enrollment
                      </label>
                      <select
                        name="enrollmentValidationStatus"
                        value={scholar.enrollmentValidation}
                        onChange={(e) => handleChange(e, scholar.id)}
                        className={`rounded-md p-1 text-sm ${
                          scholar.enrollmentValidation === "Passed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                </div>

                {scholar.scholarshipStatus === "Delisted" && (
                  <div className="bg-red-50 p-4 rounded-lg mb-8 border border-red-200">
                    <h4 className="font-bold text-lg mb-4 text-red-700">
                      Delisting Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          Delisted Date
                        </label>
                        <input
                          type="date"
                          name="delistedDate"
                          value={scholar.delistedDate}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm text-gray-500">
                          Delisting Root Cause
                        </label>
                        <select
                          name="delistingRootCause"
                          value={scholar.delistingRootCause}
                          onChange={(e) => handleChange(e, scholar.id)}
                          className="border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">Select a reason</option>
                          <option value="Low GPA">Low GPA</option>
                          <option value="Failing Grades">Failing Grades</option>
                          <option value="Has Other Scholarship">
                            Has Other Scholarship
                          </option>
                          <option value="Moral Issues">Moral Issues</option>
                          <option value="Incomplete Load">
                            Incomplete Load
                          </option>
                          <option value="Not Enrolled">Not Enrolled</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  {scholar.scholarshipStatus === "Active" && (
                    <button
                      type="button"
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                    >
                      Delist Scholar
                    </button>
                  )}
                  <button
                    type="button"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="pl-[300px]">
      <div className="">
        <Sidebar />
      </div>

      <div className="flex-1 ">
        <nav className="h-[80px] border-b-1">
          <Navbar />
        </nav>

        <div className="p-6">
          <h1 className="text-3xl font-semibold mb-6">
            Scholarship Renewal Management
          </h1>

          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default ScholarshipSystem;
