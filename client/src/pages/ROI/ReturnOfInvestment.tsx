import { useState } from "react";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
import SampleChart from "../../components/chart/SampleChart";
import { branchData } from "../../mock-data/mockdata";
import ROITrendChart from "../../components/chart/ROITrendChart";

const ReturnOfInvestment = () => {
  const [sidebarToggle, setSidebarToggle] = useState<boolean>(false);

  return (
    <div className="flex">
      <Sidebar
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
      />
      <div
        className={`transition-all duration-300 ease-in-out w-full ${
          sidebarToggle ? "ml-30 mr-10" : "ml-70 mr-10"
        }`}
      >
        <Navbar
          pageName="Scholarship Investment Analytics"
          sidebarToggle={sidebarToggle}
        />

        <div className="mt-25">
          <div className="flex gap-4">
            <div
              className={`grid  gap-4 col-span-1 h-[300px] transition-all duration-300 ease-in-out w-full ${
                sidebarToggle ? "lg:w-[1050px]" : "md:w-[900px]"
              }`}
            >
              <div className="border-none shadow rounded-xl col-span-3">
                <ROITrendChart />
              </div>
            </div>
            <div className="border-none rounded-xl shadow w-[310px]">
              <SampleChart revenue={958977} cost={2739935} roi={-65} />
            </div>
          </div>
          <div className="mt-10">
            <div
              className="border border-gray-200 rounded-lg overflow-hidden pt-5 mb-10
             px-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold mb-6 text-blue-700">
                  Branch Investments
                </h1>
                <div className=" text-sm text-gray-500 border-0 rounded-2xl px-3 py-1 bg-blue-100">
                  Active Investments
                </div>
              </div>
              <table className="w-full">
                <thead className="">
                  <tr>
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchData.map((branch) => (
                    <tr key={branch.branch}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm  text-gray-500">
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
