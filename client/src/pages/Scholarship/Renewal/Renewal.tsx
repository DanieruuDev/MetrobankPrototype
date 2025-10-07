import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { useState } from "react";
import RenewalListV2 from "./RenewalComponents/RenewalListV2";
import SpecificRenewal from "./RenewalComponents/SpecificRenewal";
import { useSidebar } from "../../../context/SidebarContext";

export interface SpecificRenewalDetail {
  student_id: number;
  renewal_id: number;
}

function Renewal() {
  const [detailedRenewal, setDetailedRenewal] =
    useState<SpecificRenewalDetail | null>(null);
  const { collapsed } = useSidebar();
  const handleRowClick = (student_id: number, renewal_id: number) => {
    setDetailedRenewal({ student_id, renewal_id });
  };

  return (
    <div className=" min-h-screen relative">
      <Sidebar />
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"}
        `}
      >
        <Navbar pageName="Scholarship Renewal" />
        <div className="px-2 sm:px-4 lg:px-6 pt-2 sm:pt-4 pb-8">
          {detailedRenewal === null ? (
            <>
              <RenewalListV2 handleRowClick={handleRowClick} />
            </>
          ) : (
            <SpecificRenewal
              student_id={detailedRenewal.student_id}
              renewal_id={detailedRenewal.renewal_id}
              setDetailedRenewal={setDetailedRenewal}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Renewal;
