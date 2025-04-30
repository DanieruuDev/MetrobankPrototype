import Navbar from "../../components/shared/Navbar";
import Sidebar from "../../components/shared/Sidebar";

import { Bell } from "lucide-react";

function FinancialAdministration() {
  return (
    <div className="pl-[250px] pt-[73px]">
      <div className="fixed top-0 right-0 left-[250px] h-[73px]">
        <Navbar pageName="Financial Administration" />
      </div>

      <Sidebar />

      <div className="pl-4 pt-2 pr-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-semibold ml-4 text-gray-800">
            Coming Soon
          </div>
          <div className="flex items-center gap-2">
            <button className="bg-[#F1F1F1] py-2 px-3 rounded-md group cursor-pointer">
              <Bell className="text-[#565656] group-hover:text-[#2a2a2a]" />
            </button>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-xl p-8 text-center text-gray-600 text-lg mt-8">
          🚧 This section is under development. Please check back later!
        </div>
      </div>
    </div>
  );
}

export default FinancialAdministration;
