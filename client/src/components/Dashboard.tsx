import React from "react";
import Navbar from "./Navbar";

interface DashboardProps {
  sidebarToggle: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ sidebarToggle }) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out w-full  ${
        sidebarToggle ? "ml-30 mr-10" : "ml-70 mr-10"
      }`}
    >
      <Navbar />
      <h1 className="text-2xl font-bold p-5 mt-5">Dashboard</h1>
    </div>
  );
};

export default Dashboard;
