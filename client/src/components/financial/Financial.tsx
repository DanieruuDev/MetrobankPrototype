import React from "react";
import Navbar from "../Navbar";

interface FinancialProps {
  sidebarToggle: boolean;
}

const Dashboard: React.FC<FinancialProps> = ({ sidebarToggle }) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out w-full  ${
        sidebarToggle ? "ml-40 mr-40" : "ml-75 mr-20"
      }`}
    >
      <Navbar />
      <h1 className="text-2xl font-bold p-5 mt-5">Financial</h1>
    </div>
  );
};

export default Dashboard;
