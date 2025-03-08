import { useState } from "react";
import Approvals from "../../components/financial/Approvals";
import Sidebar from "../../components/Sidebar";

interface ApprovalPageProps {
  sidebarToggle: boolean;
  setSidebarToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

const ApprovalPage: React.FC<ApprovalPageProps> = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <Approvals sidebarToggle={sidebarToggle} />
    </div>
  );
};

export default ApprovalPage;
