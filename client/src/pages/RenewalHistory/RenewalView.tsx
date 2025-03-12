import { useState } from "react";
import { Settings } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { IoMdArrowDropdown } from "react-icons/io";

const RenewalView = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [fgstatus, fgsetStatus] = useState<string>("");
  const [gmstatus, gmsetStatus] = useState<string>("");
  const [flstatus, flsetStatus] = useState<string>("");
  const [evstatus, evsetStatus] = useState<string>("");
  const [osstatus, ossetStatus] = useState<string>("");
  const [prstatus, prsetStatus] = useState<string>("");
  const [wstatus, wsetStatus] = useState<string>("");

  return (
    <>
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
          <div className="flex mt-4 justify-between text-sm ">
            <div className="flex items-center">
              <div className="border-r-2 pr-10 border-gray-300 mr-13">
                <p className="text-xl py-2 text-gray-700 font-medium">
                  Caneso, Jericho V.
                </p>
                <p className="text-sm">020020202020</p>
              </div>
              <div className="border text-white bg-green-600 rounded-xl px-2 mr-10">
                Active
              </div>
              <div className="hidden sm:flex justify-between">
                <div className="flex-col text-gray-600 mr-10">
                  <p className="py-2">Program / Year Level</p>
                  <div className="flex gap-8 font-semibold py-2">
                    <p>BSCS</p>
                    <p>3rd Year</p>
                  </div>
                </div>
                <div className="flex-col text-gray-600 mr-10">
                  <p className="py-2">Campus</p>
                  <p className="py-2 font-semibold">Ortigas - Cainta</p>
                </div>
                <div className="flex-col text-gray-600 mr-10">
                  <p className="py-2">Semester</p>
                  <p className="py-2 font-semibold">1st Semester</p>
                </div>
                <div className="flex-col text-gray-600 mr-10">
                  <p className="py-2">School Year</p>
                  <p className="py-2 font-semibold">Ortigas - Cainta</p>
                </div>
                <div className="flex-col text-gray-600 mr-10">
                  <p className="py-2">Batch</p>
                  <p className="py-2 font-semibold">3.1</p>
                </div>
              </div>
            </div>
            <Settings className="mt-8 hidden sm:block" />
          </div>

          <h1 className="lg:ml-8 text-lg mt-5 text-blue-500 py-3 font-semibold ">
            Validation Status
          </h1>
          <div className="bg-gray-100 px-5 rounded-2xl pb-5 w-full py-2 mx-auto mb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-5">
                <p className="text-lg font-semibold text-gray-600">GPA:</p>
                <p className="text-lg border-b-2 px-3 lg:ml-25 border-gray-400 font-semibold">
                  1.24
                </p>
                <div className="bg-green-600 text-white text-sm rounded-xl px-2">
                  Passed
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Scholarship Status:</p>
                <p className="text-sm border-b-2 px-3 border-gray-400 text-green-600">
                  Renewed
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1">
              <div className="grid lg:mr-25 mb-7">
                <label className="text-sm text-gray-600">
                  No Failing Grades
                </label>
                <div className="relative mt-3 shrink-0">
                  <select
                    name="Select Status"
                    className={`w-full appearance-none rounded-md py-1.5 pl-5 text-base shadow focus:outline-2 focus:outline-gray-200 sm:text-sm
                      ${fgstatus === "" ? "text-gray-500" : ""}
                      ${fgstatus === "Passed" ? "text-green-600" : ""}
                      ${fgstatus === "Failed" ? "text-red-600" : ""}`}
                    onChange={(e) => fgsetStatus(e.target.value)}
                    value={fgstatus}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Status
                    </option>
                    <option value="Passed" className="text-green-600">
                      Passed
                    </option>
                    <option value="Failed" className="text-red-600">
                      Failed
                    </option>
                  </select>
                  <IoMdArrowDropdown
                    size={20}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>
              <div className="grid lg:mr-25 mb-7">
                <label className="text-sm text-gray-600">
                  No Failing Grades
                </label>
                <div className="relative mt-3 shrink-0">
                  <select
                    name="Select Status"
                    className={`w-full appearance-none rounded-md py-1.5 pl-5 text-base shadow focus:outline-2 focus:outline-gray-200 sm:text-sm
                    ${gmstatus === "" ? "text-gray-500" : ""}
                    ${gmstatus === "Passed" ? "text-green-600" : ""}
                    ${gmstatus === "Failed" ? "text-red-600" : ""}`}
                    onChange={(e) => gmsetStatus(e.target.value)}
                    value={gmstatus}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Status
                    </option>
                    <option value="Passed" className="text-green-600">
                      Passed
                    </option>
                    <option value="Failed" className="text-red-600">
                      Failed
                    </option>
                  </select>
                  <IoMdArrowDropdown
                    size={20}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="grid lg:mr-25 mb-7">
                <label className="text-sm text-gray-600">
                  No Failing Grades
                </label>
                <div className="relative mt-3 shrink-0">
                  <select
                    name="Select Status"
                    className={`w-full appearance-none rounded-md py-1.5 pl-5 text-base shadow focus:outline-2 focus:outline-gray-200 sm:text-sm
                    ${flstatus === "" ? "text-gray-500" : ""}
                    ${flstatus === "Passed" ? "text-green-600" : ""}
                    ${flstatus === "Failed" ? "text-red-600" : ""}`}
                    onChange={(e) => flsetStatus(e.target.value)}
                    value={flstatus}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Status
                    </option>
                    <option value="Passed" className="text-green-600">
                      Passed
                    </option>
                    <option value="Failed" className="text-red-600">
                      Failed
                    </option>
                  </select>
                  <IoMdArrowDropdown
                    size={20}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="grid lg:mr-25 mb-7">
                <label className="text-sm text-gray-600">
                  No Failing Grades
                </label>
                <div className="relative mt-3 shrink-0">
                  <select
                    name="Select Status"
                    className={`w-full appearance-none rounded-md py-1.5 pl-5 text-base shadow focus:outline-2 focus:outline-gray-200 sm:text-sm
                    ${evstatus === "" ? "text-gray-500" : ""}
                    ${evstatus === "Passed" ? "text-green-600" : ""}
                    ${evstatus === "Failed" ? "text-red-600" : ""}`}
                    onChange={(e) => evsetStatus(e.target.value)}
                    value={evstatus}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Status
                    </option>
                    <option value="Passed" className="text-green-600">
                      Passed
                    </option>
                    <option value="Failed" className="text-red-600">
                      Failed
                    </option>
                  </select>
                  <IoMdArrowDropdown
                    size={20}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="grid lg:mr-25 mb-7">
                <label className="text-sm text-gray-600">
                  No Failing Grades
                </label>
                <div className="relative mt-3 shrink-0">
                  <select
                    name="Select Status"
                    className={`w-full appearance-none rounded-md py-1.5 pl-5 text-base shadow focus:outline-2 focus:outline-gray-200 sm:text-sm
                    ${osstatus === "" ? "text-gray-500" : ""}
                    ${osstatus === "Passed" ? "text-green-600" : ""}
                    ${osstatus === "Failed" ? "text-red-600" : ""}`}
                    onChange={(e) => ossetStatus(e.target.value)}
                    value={osstatus}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Status
                    </option>
                    <option value="Passed" className="text-green-600">
                      Passed
                    </option>
                    <option value="Failed" className="text-red-600">
                      Failed
                    </option>
                  </select>
                  <IoMdArrowDropdown
                    size={20}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="grid lg:mr-25 mb-7">
                <label className="text-sm text-gray-600">
                  No Failing Grades
                </label>
                <div className="relative mt-3 shrink-0">
                  <select
                    name="Select Status"
                    className={`w-full appearance-none rounded-md py-1.5 pl-5 text-base shadow focus:outline-2 focus:outline-gray-200 sm:text-sm
                    ${prstatus === "" ? "text-gray-500" : ""}
                    ${prstatus === "Passed" ? "text-green-600" : ""}
                    ${prstatus === "Failed" ? "text-red-600" : ""}`}
                    onChange={(e) => prsetStatus(e.target.value)}
                    value={prstatus}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Status
                    </option>
                    <option value="Passed" className="text-green-600">
                      Passed
                    </option>
                    <option value="Failed" className="text-red-600">
                      Failed
                    </option>
                  </select>
                  <IoMdArrowDropdown
                    size={20}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>

              <div className="grid lg:mr-25 mb-7">
                <label className="text-sm text-gray-600">
                  No Failing Grades
                </label>
                <div className="relative mt-3 shrink-0">
                  <select
                    name="Select Status"
                    className={`w-full appearance-none rounded-md py-1.5 pl-5 text-base shadow focus:outline-2 focus:outline-gray-200 sm:text-sm
                    ${wstatus === "" ? "text-gray-500" : ""}
                    ${wstatus === "Passed" ? "text-green-600" : ""}
                    ${wstatus === "Failed" ? "text-red-600" : ""}`}
                    onChange={(e) => wsetStatus(e.target.value)}
                    value={wstatus}
                  >
                    <option value="" disabled className="text-gray-500">
                      Select Status
                    </option>
                    <option value="Passed" className="text-green-600">
                      Passed
                    </option>
                    <option value="Failed" className="text-red-600">
                      Failed
                    </option>
                  </select>
                  <IoMdArrowDropdown
                    size={20}
                    className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            <div className="relative">
              {showAlert && (
                <div className="fixed inset-0 flex items-center ml-20 justify-center bg-opacity-50 backdrop-blur-xs">
                  <div className="bg-white p-5 rounded-3xl shadow-lg ">
                    <p className="text-lg font-medium  mb-1">Save Changes?</p>
                    <div className="flex flex-wrap gap-3 sm:justify-start lg:ml-30 ml-10">
                      <button
                        onClick={() => setShowAlert(false)}
                        className="mt-4 bg-blue-500 text-white px-6 sm:px-10 py-2 rounded-lg hover:bg-blue-300 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowAlert(false)}
                        className="mt-4 bg-blue-500 text-white px-6 sm:px-7 py-2 rounded-lg hover:bg-blue-300 transition"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowAlert(true)}
                  className="text-white bg-blue-500 px-7 py-2 text-sm rounded-lg hover:bg-blue-400"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col">
            <h1 className="text-lg text-blue-500 py-3 font-semibold lg:ml-8 ">
              Validation History
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 border-none bg-gray-100 px-4 py-2 rounded-2xl text-gray-400 text-sm font-semibold text-center">
              <p>Renewal Date</p>
              <p>Year Level</p>
              <p>Semester</p>
              <p>School Year</p>
              <p>Status</p>
              <p>Validator</p>
              <p>Delisted Reason</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 border-b mt-5 p-4 text-gray-400 text-sm text-center">
              <p>Renewal Date</p>
              <p>Year Level</p>
              <p>Semester</p>
              <p>School Year</p>
              <p>Status</p>
              <p>Validator</p>
              <p>Delisted Reason</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 border-b mt-5 p-4 text-gray-400 text-sm text-center">
              <p>Renewal Date</p>
              <p>Year Level</p>
              <p>Semester</p>
              <p>School Year</p>
              <p>Status</p>
              <p>Validator</p>
              <p>Delisted Reason</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RenewalView;
