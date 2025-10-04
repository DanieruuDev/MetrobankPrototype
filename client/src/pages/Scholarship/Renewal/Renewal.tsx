import Sidebar from "../../../components/shared/Sidebar";
import Navbar from "../../../components/shared/Navbar";
import { useState } from "react";

const RenewalListV2 = React.lazy(
  () => import("./RenewalComponents/RenewalListV2")
);
import SpecificRenewal from "./RenewalComponents/SpecificRenewal";
import { useSidebar } from "../../../context/SidebarContext";
import React from "react";

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
      className={`
        bg-[#F9FAFB] min-h-[100vh]
        ${
          collapsed ? "pl-20" : "pl-[240px]"
        } transition-[padding-left] duration-300`}
    >
      <Navbar pageName="Scholarship Renewal" />
      <Sidebar />

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
  );
}

export default Renewal;
