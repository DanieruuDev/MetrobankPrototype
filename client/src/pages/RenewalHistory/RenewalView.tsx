import { useState } from "react";
import { Settings } from "lucide-react";
import { MdOutlineArrowDropDown } from "react-icons/md";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

const RenewalView = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  const [status, setStatus] = useState([
    "Select Status",
    "Select Status",
    "Select Status",
    "Select Status",
    "Select Status",
    "Select Status",
    "Select Status",
  ]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null
  );

  const handleDropdownToggle = (index: number) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };

  const handleStatusChange = (index: number, newStatus: string) => {
    setStatus((prevStatus) =>
      prevStatus.map((s, i) => (i === index ? newStatus : s))
    );
    setOpenDropdownIndex(null);
  };

  return (
    <>
      <div className="flex">
        <Sidebar
          sidebarToggle={sidebarToggle}
          setSidebarToggle={setSidebarToggle}
        />
        <div
          className={`transition-all duration-300 ease-in-out w-full  ${
            sidebarToggle ? "ml-30 mr-10" : "ml-70 mr-10"
          }`}
        >
          <Navbar />
          <div className="flex mt-4 justify-between text-xs">
            <div className="flex items-center">
              <div className="border-r-2 pr-6 border-gray-300 mr-10">
                <p className="text-xl py-2 text-gray-700  font-medium">
                  Caneso, Jericho V.
                </p>
                <p className="text-sm">020020202020</p>
              </div>
              <div className="border text-white bg-green-600 rounded-xl px-2 mr-10">
                Active
              </div>
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
            <Settings className="mt-5" />
          </div>
          <h1 className="ml-8 text-xl mt-5 text-blue-500 py-3 font-semibold">
            Validation Status
          </h1>
          <div className="bg-gray-100 px-5  rounded-2xl pb-5">
            <div className=" flex items-center justify-between">
              <div className="flex">
                <div className="flex items-center mr-2">
                  <p className="text-xl mr-18 font-semibold text-gray-600">
                    GPA:
                  </p>
                  <p className="text-xl border-b-2 px-3 border-gray-400 mr-8 font-semibold text-gray-600">
                    1.24
                  </p>
                </div>
                <div className="border-none my-5 text-white text-sm bg-green-600 rounded-xl px-2 mr-18">
                  Passed
                </div>
              </div>
              <div className="flex">
                <div className="flex items-center">
                  <p className="text-l text-gray-600 mr-2">
                    Scholarship Status:
                  </p>
                  <p className="text-sm border-b-2 px-3 border-gray-400 mr-8 text-green-600 ">
                    Renewed
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="text-xs">
                  <p>No Failing Grade Status</p>
                  <div className="border border-gray-300 shadow-xs rounded gap-10 py-2 mt-3 mb-5 flex items-center justify-between relative ">
                    <span
                      className={`${
                        status[index] === "Passed"
                          ? "text-green-600"
                          : "text-red-600"
                      }  ml-5 min-w-[70px]`}
                    >
                      {status[index]}
                    </span>
                    <button
                      onClick={() => handleDropdownToggle(index)}
                      className="px-2"
                    >
                      <MdOutlineArrowDropDown size={24} />
                    </button>
                    {openDropdownIndex === index && (
                      <ul className="absolute top-full left-0 bg-white border border-gray-300 shadow-md mt-1 w-full rounded z-10">
                        {["Passed", "Failed"].map((item) => (
                          <li
                            key={item}
                            className="px-5 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleStatusChange(index, item)}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mr-8 mt-5">
              <button className="text-white bg-blue-500 px-7 py-2 text-sm rounded">
                Save Changes
              </button>
            </div>
          </div>
          <h1 className="ml-8 text-xl mt-5 text-blue-500 py-3 font-semibold">
            Validation History
          </h1>
          <div className="flex items-center border-none bg-gray-100 p-4 rounded-2xl text-gray-400 text-sm justify-between">
            <p>Renewal Date</p>
            <p>Year Level</p>
            <p>Semester</p>
            <p>School Year</p>
            <p>Status</p>
            <p>Validator</p>
            <p>Delisted Reason</p>
          </div>
          <div className="flex items-center border-b-1 mt-5 p-4 px-3 text-gray-400 text-sm justify-between">
            <p>Renewal Date</p>
            <p>Year Level</p>
            <p>Semester</p>
            <p>School Year</p>
            <p>Status</p>
            <p>Validator</p>
            <p>Delisted Reason</p>
          </div>
          <div className="flex items-center border-b-1 mt-5 p-4 px-3 text-gray-400 text-sm justify-between">
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
    </>
  );
};

export default RenewalView;
