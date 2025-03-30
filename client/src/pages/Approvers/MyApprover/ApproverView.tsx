import { useState } from "react";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import { NavLink } from "react-router-dom";
import {
  Star,
  CornerUpLeft,
  CornerUpRight,
  Ellipsis,
  ChevronDown,
  Trash2,
  Paperclip,
  Link,
  Image,
  Lock,
  PenTool,
} from "lucide-react";

const ApproverView = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  interface User {
    name: string;
    email: string;
    position: string;
    date: string;
    id: number;
  }

  const user: User = {
    name: "Panturas, Daniel",
    position: "(Position)",
    email: "<panturas.daniel@metrobank.com.ph>",
    date: "2022-01-01",
    id: 112312312,
  };
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
          <div className="mt-2 h-full">
            <div className="flex md:space-x-4 space-x-10">
              <NavLink to={"/approver"}>
                <button className="md:text-base py-3 font-semibold text-gray-600 px-2 md:px-4 cursor-pointer border-b-3 border-transparent transition-all duration-200 hover:border-gray-300">
                  All Workflows
                </button>
              </NavLink>
              <button className="md:text-base py-3 font-semibold text-gray-600 px-2 md:px-4  cursor-pointer border-b-3 border-gray-300">
                My Approvals
              </button>
            </div>
            <div className="w-full border-t-3 border-gray-300 mt-5 pt-6 flex items-center justify-between">
              <div className=" flex items-center gap-8">
                <div className="text-2xl font-medium text-gray-600 border-r-3 border-gray-400 pl-2 pr-6">
                  Request Title
                </div>
                <div className="px-6 py-1 bg-amber-300 text-gray-600  rounded-xl text-sm font-semibold">
                  Pending
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button className="border-r-2 cursor-pointer border-gray-300 py-2 px-5 hover:">
                  <Star size={15} />
                </button>
                <button className="border-r-2  cursor-pointer border-gray-300 py-2 pl-2 pr-5">
                  <CornerUpLeft size={15} />
                </button>
                <button className="border-r-2  cursor-pointer border-gray-300 py-2 pl-3 pr-5">
                  <CornerUpRight size={15} />
                </button>
                <button className="pl-3 py-2  cursor-pointer border-gray-300">
                  <Ellipsis size={15} />
                </button>
              </div>
            </div>
            <div className="ml-2 mt-2 text-gray-600 font-medium flex items-center justify-between">
              <div className="flex justify-between items-center gap-10">
                <p>{user.name}</p>
                <div>{user.position}</div>
                <p>{user.email}</p>
              </div>
              <div>{user.date}</div>
            </div>
            <div className="px-2 mt-2 text-gray-600 border-b-3 text-sm border-gray-300 pb-4">
              <p className="mt-4">to me</p>
              <p className="text-justify mt-4">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus
                unde in ut ratione nisi, ab perferendis, quae alias ipsam earum
                nobis dignissimos repudiandae possimus iste sed nihil laborum
                dolorem consequuntur. Lorem ipsum dolor, sit amet consectetur
                adipisicing elit. Error rerum quasi illo sequi deserunt earum
                odio saepe natus itaque quod. Consequuntur magni laborum ipsum,
                unde dolores aspernatur eligendi ut. Soluta. Lorem ipsum dolor
                sit amet consectetur adipisicing elit. Dolore esse vero,
                molestias ullam eveniet ea nostrum in perspiciatis rem cum non
                repellendus excepturi ex earum alias autem vel.
              </p>
            </div>
            <div className="justify-between items-center flex mt-3 px-2">
              <p>Requst ID: {user.id}</p>
              <div className="flex items-center justify-between gap-3">
                <button className="cursor-pointer px-7 py-2 bg-gray-100 font-semibold text-sm text-green-600 rounded-lg">
                  Approve
                </button>
                <button className="cursor-pointer px-9 py-2 bg-gray-100 font-semibold text-sm text-red-600 rounded-lg">
                  Reject
                </button>
              </div>
            </div>
            <div
              className="max-w-xs mt-5
            "
            >
              <div className="relative">
                <input
                  type="file"
                  name="Upload File"
                  id="file-upload"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer "
                  required
                />
                <div className="border-none bg-gray-100 focus-within:outline-none font-medium p-5">
                  <label className="block text-gray-500 text-sm text-start">
                    FILE INSERT
                  </label>
                </div>
              </div>
            </div>
            <div className="flex mt-15 text-gray-600 border-t-2 border-gray-100 pt-3 relative">
              <div className="relative min-h-[180px]">
                <div className="flex absolute top-0 left-0 items-center justify-between gap-4">
                  <button className="border-r-2 cursor-pointer border-gray-100 py-2 pl-2 pr-5">
                    <CornerUpLeft size={15} />
                  </button>
                  <p className="flex-1 whitespace-nowrap">{user.name}</p>
                  <p>{user.position}</p>
                </div>
                <div className="absolute bottom-0 left-0 flex px-2">
                  <div className="flex items-center justify-between text-gray-600 gap-3">
                    <div className="items-center flex space-x-1 bg-gray-200 px-3 py-2 rounded-xl">
                      <button className="border-r-2 cursor-pointer font-medium border-gray-300 px-2">
                        Reply
                      </button>
                      <button className="items-center cursor-pointer">
                        <ChevronDown size={15} />
                      </button>
                    </div>
                    <div className="items-center flex gap-2 bg-gray-200 px-3 py-2 rounded-xl">
                      <button className="cursor-pointer items-center gap-2 flex font-medium">
                        Cancel
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <button>
                        <Paperclip size={17} />
                      </button>
                      <button>
                        <Link size={17} />
                      </button>
                      <button>
                        <Image size={17} />
                      </button>
                      <button>
                        <Lock size={17} />
                      </button>
                      <button>
                        <PenTool size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApproverView;
