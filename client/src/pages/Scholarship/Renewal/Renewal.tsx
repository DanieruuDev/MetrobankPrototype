import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { useState } from "react";
import SYSemesterDropdown from "../../../components/shared/SYSemesterDropdown";
import SpecificRenewal from "./RenewalComponents/SpecificRenewal";
import RenewalList from "./RenewalComponents/RenewalList";
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
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300`}
    >
      <Navbar pageName="Scholarship Renewal" />
      <Sidebar />

      {detailedRenewal === null ? (
        <>
          <div className="flex justify-end px-4">
            <SYSemesterDropdown
              onChange={(val) => console.log("Selected:", val)}
            />
          </div>

          <RenewalList handleRowClick={handleRowClick} />
        </>
      ) : (
        <SpecificRenewal
          student_id={detailedRenewal.student_id}
          renewal_id={detailedRenewal.renewal_id}
          setDetailedRenewal={setDetailedRenewal}
        />
      )}
    </div>
  );
}

export default Renewal;
