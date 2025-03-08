import { useState } from "react";
import Financial from "../../components/financial/Financial";
import Sidebar from "../../components/Sidebar";

interface FinancialPageProps {
  sidebarToggle: boolean;
  setSidebarToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

const FinancialPage: React.FC<FinancialPageProps> = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <Financial sidebarToggle={sidebarToggle} />
    </div>
  );
};

export default FinancialPage;
