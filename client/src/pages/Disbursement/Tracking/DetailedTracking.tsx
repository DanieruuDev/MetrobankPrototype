import { useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ITrackingDetailed {
  amount: string;
  branch: string;
  disb_sched_id: number;
  disb_title: string;
  disbursement_date: string;
  quantity: number;
  scholar_name: string;
  scholarship_status: string;
  status: string;
  student_id: number;
}

function DetailedTracking() {
  const { disbursement_id } = useParams<{ disbursement_id: string }>();
  const [trackingDetailed, setTrackingDetailed] = useState<
    ITrackingDetailed[] | null
  >(null);
  const [collapsed, setCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrackingDetailed = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<ITrackingDetailed[]>(
          `http://localhost:5000/api/disbursement/tracking/${disbursement_id}`
        );
        setTrackingDetailed(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackingDetailed();
  }, [disbursement_id]);

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await axios.put(
        `http://localhost:5000/api/disbursement/tracking/complete/${disbursement_id}`
      );
      const response = await axios.get<ITrackingDetailed[]>(
        `http://localhost:5000/api/disbursement/tracking/${disbursement_id}`
      );
      setTrackingDetailed(response.data);
    } catch (error) {
      console.error("Error completing disbursement:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const scheduleInfo = trackingDetailed?.[0];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "Not Started": "bg-gray-200 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses] || "bg-gray-100"
        }`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="pl-[250px] pt-[73px] min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading disbursement details...</p>
        </div>
      </div>
    );
  }

  if (!trackingDetailed) {
    return (
      <div className="pl-[250px] pt-[73px] min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No disbursement data found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300  bg-gray-50`}
    >
      <Navbar pageName="Disbursement Tracking" />

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
            <span className="text-gray-600 text-sm">ID: {disbursement_id}</span>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:bg-green-300"
              onClick={handleComplete}
              disabled={isCompleting || scheduleInfo?.status === "Completed"}
            >
              {isCompleting ? (
                <>
                  <span className="inline-block animate-spin mr-2">↻</span>
                  Completing...
                </>
              ) : (
                "Mark as Complete"
              )}
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Export to Excel
            </button>
          </div>
        </div>

        {scheduleInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-gray-500 mb-2">
                Disbursement Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-lg font-semibold">
                    {scheduleInfo.disb_title}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {new Date(
                      scheduleInfo.disbursement_date
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status:</span>
                  {getStatusBadge(scheduleInfo.status)}
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-gray-500 mb-2">
                Financial Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount per student:</span>
                  <span className="font-medium">
                    ₱{Number(scheduleInfo.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total students:</span>
                  <span className="font-medium">{scheduleInfo.quantity}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Total amount:</span>
                  <span className="font-medium text-blue-600">
                    ₱
                    {(
                      Number(scheduleInfo.amount) * scheduleInfo.quantity
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-medium text-gray-500 mb-2">
                Branch Information
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="font-medium capitalize">
                    {scheduleInfo.branch.replace("-", " ")}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <p>
                    All students in this disbursement are from the same branch
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold">
              Student List ({trackingDetailed.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scholarship Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disbursement Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trackingDetailed.map((student) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.scholar_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          student.scholarship_status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {student.scholarship_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₱{Number(student.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStatusBadge(student.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailedTracking;
