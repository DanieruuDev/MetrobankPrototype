import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import { useState } from "react";
import { Filter, Search, X, SquarePen, Plus } from "lucide-react";
import { IoMdArrowDropdown } from "react-icons/io";
import NextPage from "../../../components/NextPage";
import CreateApprover from "../../../components/CreateApprover";
import { NavLink } from "react-router-dom";

interface Approval {
  approverType: string;
  selectedScholarYear: string;
  selectedSchoolYear: string;
  selectedSemester: string;
  selectedFile: File | null;
  selectedStartDate: string;
  selectedDueDate: string;
  ReqDescription: string;
  approverEmail: string;
}

const Approver = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [approverType, setApproverType] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [selectedScholarYear, setScholarYear] = useState("");
  const [selectedSchoolYear, setSchoolYear] = useState("");
  const [ReqDescription, setReqDescription] = useState<string>("");
  const [selectedSemester, setSemester] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedDueDate, setSelectedDueDate] = useState("");
  const [wordCount, setWordCount] = useState<number>(0);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    const words = inputValue.split(/\s+/).filter((word) => word.length > 0);

    setWordCount(words.length);

    if (words.length <= 100) {
      setReqDescription(inputValue);
    }
  };

  const handleSubmit = () => {
    if (
      !approverType ||
      !selectedScholarYear ||
      !selectedSemester ||
      !selectedFile ||
      !selectedStartDate ||
      !selectedDueDate ||
      !selectedSchoolYear ||
      !approverEmail ||
      !ReqDescription
    ) {
      alert("Please fill out all fields before submitting.");
      return;
    }

    const newApproval: Approval = {
      approverType,
      selectedScholarYear,
      selectedSchoolYear,
      selectedSemester,
      selectedFile,
      selectedStartDate,
      selectedDueDate,
      ReqDescription,
      approverEmail,
    };

    setApprovals((prev) => [...prev, newApproval]);
    console.log("Approver Created:", newApproval);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setApproverType("");
    setApproverEmail("");
    setScholarYear("");
    setSchoolYear("");
    setReqDescription("");
    setSemester("");
    setSelectedFile(null);
    setSelectedDueDate("");
    setWordCount(0);
  };

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <div
        className={`transition-all duration-300 ease-in-out w-full ${
          sidebarToggle ? "ml-30 mr-10 " : "ml-70 mr-10"
        }`}
      >
        <Navbar />
        <div className="mt-2 h-full">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex md:space-x-4 space-x-10">
              <button
                className="md:text-base font-semibold text-gray-600 px-2 md:px-4  cursor-pointer border-b-3 border-gray-300"
                onClick={() => setShowModal}
              >
                All Workflows
              </button>
              <NavLink to={"/approver-view"}>
                <button className="md:text-base font-semibold py-3 text-gray-600 px-2 md:px-4 cursor-pointer border-b-3 border-transparent transition-all duration-200 hover:border-gray-300">
                  My Approvals
                </button>
              </NavLink>
            </div>

            <button
              className="bg-blue-500 font-semibold text-white rounded-xl sm: px-4 py-2 md:px-5.5 md:py-3 mt-4 md:mt-0"
              onClick={() => setShowModal(true)}
            >
              Create Approval
            </button>
          </div>
          <div className="flex flex-row gap-3 mt-4">
            <div
              className="
                 text-gray-600 bg-gray-100 font-medium rounded-xl flex pl-2 items-center pr-3 py-2 w-full md:max-w-78"
            >
              <select
                name="Filter"
                className={`border-none px-2 py-1 w-full bg-gray-100 focus:outline-none appearance-none rounded-xl
                                  `}
                onChange={(e) => setSemester(e.target.value)}
                value={selectedSemester}
              >
                <option>Filter</option>
                <option>Contract Renewal</option>
                <option>Scholarship Fee Processing</option>
                <option>Scholarship Fee Disbursement</option>
                <option>Allowance Fee Processing</option>
                <option>Allowance Fee Disbursement</option>
                <option>Thesis Fee</option>
                <option>Thesis Fee Disbursement</option>
                <option>Internship Allowance</option>
                <option>Internship Allowance Disbursement</option>
              </select>
              <Filter
                className=" text-gray-500 pointer-events-none"
                size={20}
              />
            </div>

            <div className="flex">
              <div className="bg-gray-100 font-medium rounded-xl flex items-center px-3 py-2 w-full md:max-w-50">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block placeholder-gray-500 text-base appearance-none w-full md:w-35 focus:outline-none bg-transparent"
                  placeholder="Search"
                />
                <Search
                  className="text-gray-500 flex-shrink-0 ml-2"
                  size={20}
                />
              </div>
            </div>
          </div>
          <div className="flex mt-4 justify-between items-center px-15 py-3 bg-gray-100 rounded-2xl text-gray-500 font-medium text-sm">
            <p>Request Title</p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <p className="ml-17">Status</p>
                <svg width="8" height="9" viewBox="0 0 7 8" fill="none">
                  <path
                    d="M3.5 0L6.53109 3.23077H0.468911L3.5 0Z"
                    fill="#565656"
                  />
                  <path
                    d="M3.5 8L0.468911 5.23077H6.53109L3.5 8Z"
                    fill="#565656"
                  />
                </svg>
              </div>
              <p>Approver</p>
            </div>

            <p className="">Document</p>
            <div className="flex items-center gap-10 ml-26">
              <div className="flex items-center gap-2">
                <p>Date Started</p>
                <svg width="8" height="9" viewBox="0 0 7 8" fill="none">
                  <path
                    d="M3.5 0L6.53109 3.23077H0.468911L3.5 0Z"
                    fill="#565656"
                  />
                  <path
                    d="M3.5 8L0.468911 5.23077H6.53109L3.5 8Z"
                    fill="#565656"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <p>Due Date</p>
                <svg width="8" height="9" viewBox="0 0 7 8" fill="none">
                  <path
                    d="M3.5 0L6.53109 3.23077H0.468911L3.5 0Z"
                    fill="#565656"
                  />
                  <path
                    d="M3.5 8L0.468911 5.23077H6.53109L3.5 8Z"
                    fill="#565656"
                  />
                </svg>
              </div>
              <p className="mr-10">Details</p>
            </div>
          </div>

          <div className="w-full mt-6">
            <CreateApprover approvals={approvals} />
          </div>
          <NextPage />
        </div>
      </div>

      {showModal && (
        <div className="fixed z-20 inset-0 flex items-center justify-center bg-opacity-50 backdrop-blur-xs">
          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-4xl shadow-lg w-full md:w-xl mx-4 md:mx-0">
            <div className="flex justify-between items-center mb-6 md:mb-10">
              <h2 className="font-medium text-gray-600">
                Create Approval Request
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="relative mt-4 text-gray-600 font-medium">
              <select
                name="Select Approval Type"
                className={`border-none px-4 md:px-6 py-2 md:py-3 w-full bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl`}
                onChange={(e) => setApproverType(e.target.value)}
                value={approverType}
                required
              >
                <option value="">Select Approval Type</option>
                <option>Contract Renewal</option>
                <option>Scholarship Fee Processing</option>
                <option>Scholarship Fee Disbursement</option>
                <option>Allowance Fee Processing</option>
                <option>Allowance Fee Disbursement</option>
                <option>Thesis Fee</option>
                <option>Thesis Fee Disbursement</option>
                <option>Internship Allowance</option>
                <option>Internship Allowance Disbursement</option>
              </select>
              <IoMdArrowDropdown
                size={20}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>

            <div className="mt-4 text-gray-600 font-medium flex flex-row gap-3">
              <div className="relative w-full">
                <select
                  name="Select Approval Type"
                  className={`border-none px-4 md:px-6 py-2 md:py-3 w-full bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl`}
                  onChange={(e) => setScholarYear(e.target.value)}
                  value={selectedScholarYear}
                  required
                >
                  <option value="">Scholar Year Level</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
                <IoMdArrowDropdown
                  size={20}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
              <div className="relative w-full">
                <select
                  name="Select Approval Type"
                  className={`border-none px-4 md:px-6 py-2 md:py-3 w-full bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl`}
                  onChange={(e) => setSemester(e.target.value)}
                  value={selectedSemester}
                  required
                >
                  <option value="">Semester</option>
                  <option>1st Semester</option>
                  <option>2nd Semester</option>
                </select>
                <IoMdArrowDropdown
                  size={20}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>
            </div>
            <div className="mt-4 text-gray-600 font-medium flex flex-col md:flex-row gap-3">
              <input
                type="file"
                name="Upload File"
                className="border-none px-4 md:px-6 py-2 md:py-3 w-full bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
              <input
                type="date"
                className="border-none px-4 md:px-6 py-2 md:py-3 w-full bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl"
                value={selectedStartDate}
                onChange={(e) => setSelectedStartDate(e.target.value)}
                required
              />
            </div>
            <div className="relative mt-4 text-gray-600 bg-gray-100 font-medium rounded-xl">
              <select
                name="Select School Year"
                className={`border-none px-4 md:px-6 py-2 md:py-3 w-full bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl`}
                onChange={(e) => setSchoolYear(e.target.value)}
                value={selectedSchoolYear}
                required
              >
                <option value="">Select School Year</option>
                <option>2024 - 2025</option>
                <option>2025 - 2026</option>
              </select>
              <IoMdArrowDropdown
                size={20}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>

            <h2 className="mt-5 font-medium text-gray-600">
              Requester Designation
            </h2>
            <div className="border-gray-200 border-1 shadow-xs text-sm mt-1 p-3  relative rounded-xl">
              <div className="mt-3 flex  md:flex-row justify-between gap-0.5 text-gray-400 font-medium rounded-xl">
                <div className="flex-row">
                  <h2>Approver Email</h2>
                  <input
                    type="text"
                    name="School Year"
                    id="search"
                    className="border-none mt-2 px-2 py-2 md:py-3  w-full md:w-60 bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl"
                    placeholder="Enter Approvers Email Address"
                    onChange={(e) => setApproverEmail(e.target.value)}
                    value={approverEmail}
                    required
                  />
                </div>
                <div className="flex-row">
                  <h2>Response Required By:</h2>
                  <input
                    type="date"
                    className="border-none mt-2 px-4 md:px-6 py-2 md:py-3 w-full md:w-57 bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl"
                    value={selectedDueDate}
                    onChange={(e) => setSelectedDueDate(e.target.value)}
                    required
                  />
                </div>
                <button className="border-none items-center mt-6.5">
                  <SquarePen size={18} />
                </button>
              </div>
              <div className="flex mt-3 border-t-1 border-gray-300 items-centers text-sm pt-4 ">
                <button className="flex border-none cursor-pointer gap-3">
                  <Plus size={20} />
                  <h2>Add Additional Approver</h2>
                </button>
              </div>
            </div>
            <h2 className="mt-5 font-medium text-gray-600">
              Requester Description
            </h2>
            <textarea
              name="School Year"
              id="search"
              className="border-none relative mt-1 px-2 py-2 md:py-3 w-full h-20 bg-gray-100 focus:outline-none focus:ring-2 appearance-none focus:ring-blue-400 rounded-xl resize-none"
              placeholder="Enter your description"
              onChange={handleTextareaChange}
              value={ReqDescription}
              maxLength={500}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {wordCount} / 100 words
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Approver;
