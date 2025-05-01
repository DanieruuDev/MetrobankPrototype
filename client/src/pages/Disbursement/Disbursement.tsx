import { useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";

const Disbursement = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

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
      </div>
    </div>
  );
};

export default Disbursement;
