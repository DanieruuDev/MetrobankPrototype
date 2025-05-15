import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { useState } from "react";
import SYSemesterDropdown from "../../../components/shared/SYSemesterDropdown";
import SpecificRenewal from "./RenewalComponents/SpecificRenewal";
import RenewalList from "./RenewalComponents/RenewalList";

export interface SpecificRenewalDetail {
  student_id: number;
  renewal_id: number;
}

function Renewal() {
  const [detailedRenewal, setDetailedRenewal] =
    useState<SpecificRenewalDetail | null>(null);

  const handleRowClick = (student_id: number, renewal_id: number) => {
    setDetailedRenewal({ student_id, renewal_id });
  };

  return (
    <div className="pl-[250px]">
      <nav className="h-[80px]">
        <Navbar pageName="Scholarship Renewal" />
      </nav>
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
