import { useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";

const Disbursement = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  const [selectedSemester, setSelectedSemester] = useState(
    "2024 - 2025, 2nd Semester"
  );
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  // Data for disbursement types
  const disbursementTypes = [
    {
      title: "Scholarship Fee",
      scholars: "12/12",
      status: "COMPLETED",
      statusColor: "bg-green-100 text-green-800",
    },
    {
      title: "Thesis Fee",
      scholars: "12/12",
      status: "PENDING",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Allowance Fee",
      scholars: "12/12",
      status: "PENDING",
      statusColor: "bg-yellow-100 text-yellow-800",
    },
    {
      title: "Internship Allowance",
      scholars: "12/12",
      status: "NOT STARTED",
      statusColor: "bg-gray-100 text-gray-800",
    },
  ];

  // Options for dropdowns
  const semesterOptions = [
    "2023 - 2024, 1st Semester",
    "2023 - 2024, 2nd Semester",
    "2024 - 2025, 1st Semester",
    "2024 - 2025, 2nd Semester",
  ];

  const statusOptions = ["All Status", "COMPLETED", "PENDING", "NOT STARTED"];

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
        <Navbar
          pageName="Disbursement Schedule"
          sidebarToggle={sidebarToggle}
        />

        <div className="mt-25">
          {/* Dropdown menus */}
          <div className="flex flex-wrap gap-4 mb-10">
            <div className="relative">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="appearance-none bg-gray-100 border-0 shadow-md border-gray-300 rounded-xl pl-6 pr-25  py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {semesterOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-gray-100 border-0 shadow-md border-gray-300 rounded-xl pl-6 pr-25  py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-6 ml-3 text-blue-700">
            Disbursement Type
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mr-10">
            {disbursementTypes.map((type, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg pb-7 border-1 border-gray-200"
              >
                <div className="px-8 text-lg font-semibold bg-gray-200 rounded-t-lg border-gray-200 shadow py-4 border-b-1">
                  <h2 className="text-blue-700">{type.title}</h2>
                </div>

                <div className="flex justify-between px-4 pt-6">
                  <p className="text-sm text-gray-500">No. of Scholars</p>
                  <p className="text-sm font-medium">{type.scholars}</p>

                  <div className=" border-gray-200">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${type.statusColor}`}
                    >
                      {type.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disbursement;
