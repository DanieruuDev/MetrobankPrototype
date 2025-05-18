import React from 'react';
import Sidebar from '../../components/shared/Sidebar';
import Navbar from '../../components/shared/Navbar';
import LineGraph from '../../components/charts/LineGraph';
import DonutChartROI from '../../components/charts/DonutChartROI';

const ROI: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ">
        <div className="fixed top-0 right-0 left-[250px] h-[73px] z-40">
          <Navbar pageName="ROI" />
        </div>

        <div className="pt-[73px] p-6">
          <div className="max-w-[1800px] mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column - Line Graph */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <LineGraph />
              </div>
              
              {/* Right Column - Donut Chart */}
              <div className="bg-white rounded-lg shadow-md p-6 ">
                <DonutChartROI />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROI;