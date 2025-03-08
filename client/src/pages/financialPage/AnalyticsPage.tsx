import { useState } from "react";
import Analytics from "../../components/financial/Analytics";
import Sidebar from "../../components/Sidebar";

interface AnalyticsPageProps {
  sidebarToggle: boolean;
  setSidebarToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <Analytics sidebarToggle={sidebarToggle} />
    </div>
  );
};

export default AnalyticsPage;
