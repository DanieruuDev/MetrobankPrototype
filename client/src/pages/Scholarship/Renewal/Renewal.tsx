import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { useState } from "react";

import SpecificRenewal from "./RenewalComponents/SpecificRenewal";
import RenewalList from "./RenewalComponents/RenewalList";

export interface SpecificRenewalDetail {
  student_id: number;
  renewal_id: number;
}

function Renewal() {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);
  const [detailedRenewal, setDetailedRenewal] =
    useState<SpecificRenewalDetail | null>(null);

  const handleRowClick = (student_id: number, renewal_id: number) => {
    setDetailedRenewal({ student_id, renewal_id });
  };

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <div
        className={`transition-all duration-300 ease-in-out w-full ${
          sidebarToggle ? "ml-30 mr-10" : "ml-70 mr-10"
        } overflow-x-auto mt-16`} // Added mt-16 to account for fixed navbar height
      >
        <Navbar pageName="Renewal Scholarship" sidebarToggle={sidebarToggle} />
        {detailedRenewal === null ? (
          <RenewalList handleRowClick={handleRowClick} />
        ) : (
          <SpecificRenewal
            student_id={detailedRenewal.student_id}
            renewal_id={detailedRenewal.renewal_id}
            setDetailedRenewal={setDetailedRenewal}
          />
        )}
      </div>
    </div>
  );
}

export default Renewal;
