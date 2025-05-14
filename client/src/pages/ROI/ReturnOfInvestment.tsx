import { useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import SampleChart from "../../components/chart/SampleChart";
import { branchData } from "../../mock-data/mockdata";
import ROITrendChart from "../../components/chart/ROITrendChart";

const ReturnOfInvestment = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarToggle ? "ml-[75px]" : "ml-[250px]"
        }`}
      >
        <Navbar
          pageName="Scholarship Investment Analytics"
          sidebarToggle={sidebarToggle}
        />

        <div className="p-5 mt-20">
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            <div className="flex-1 min-w-0">
              <div className="bg-white shadow rounded-xl h-full p-4">
                <ROITrendChart sidebarToggle={sidebarToggle} />
              </div>
            </div>

            <div className="w-auto">
              <div className="bg-white shadow rounded-xl h-full p-4">
                <SampleChart revenue={958977} cost={2739935} roi={-65} />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="mt-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-blue-700">
                  Branch Investments
                </h1>
                <div className="text-sm text-gray-500 rounded-2xl px-3 py-1 bg-blue-100">
                  Active Investments
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Investment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Returns
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ROI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branchData.map((branch) => (
                    <tr key={branch.branch}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.branch}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.percentage}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${branch.investment}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${branch.returns}
                      </td>
                      <td
                        className={`px-4 py-4 whitespace-nowrap text-sm ${
                          parseFloat(branch.roi) < 0
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {branch.roi}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnOfInvestment;
