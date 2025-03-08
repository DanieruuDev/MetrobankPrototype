import { useState } from "react";
import Management from "../../components/financial/Management";
import Sidebar from "../../components/Sidebar";

interface ManagementPageProps {
  sidebarToggle: boolean;
  setSidebarToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

const ManagementPage: React.FC<ManagementPageProps> = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <Management sidebarToggle={sidebarToggle} />
    </div>
  );
};

export default ManagementPage;
