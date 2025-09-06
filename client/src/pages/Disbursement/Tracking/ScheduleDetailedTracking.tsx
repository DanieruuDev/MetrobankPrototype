import { useParams } from "react-router-dom";
import Navbar from "../../../components/shared/Navbar";
import Sidebar from "../../../components/shared/Sidebar";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../../../context/SidebarContext";
import { ArrowLeft, Calendar, Users, DollarSign, Building } from "lucide-react";
import { formatDate } from "../../../utils/DateConvertionFormat";

interface ScheduleDetailedInfo {
  disb_sched_id: number;
  disb_title: string;
  disbursement_type: string;
  disbursement_date: string;
  sy_code: number;
  semester_code: number;
  status: string;
  total: string;
  number_of_recipients: string;
  branch?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

function ScheduleDetailedTracking() {
  const { sched_id } = useParams<{ sched_id: string }>();
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleDetailedInfo | null>(
    null
  );
  const { collapsed } = useSidebar();
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScheduleDetails = async () => {
      try {
        setIsLoading(true);
        // For now, we'll use the same endpoint but we should create a specific one for schedule details
        const response = await axios.get<ScheduleDetailedInfo>(
          `http://localhost:5000/api/disbursement/tracking/${sched_id}`
        );
        setScheduleInfo(response.data);
      } catch (error) {
        console.error("Error fetching schedule details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScheduleDetails();
  }, [sched_id]);

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await axios.put(
        `http://localhost:5000/api/disbursement/tracking/complete/${sched_id}`
      );
      // Refresh the data after completion
      const response = await axios.get<ScheduleDetailedInfo>(
        `http://localhost:5000/api/disbursement/tracking/${sched_id}`
      );
      setScheduleInfo(response.data);
    } catch (error) {
      console.error("Error completing schedule:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      "Not Started": "bg-gray-200 text-gray-800",
      "In Progress": "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Failed: "bg-red-100 text-red-800",
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

  const getSemesterText = (semesterCode: number) => {
    return semesterCode === 1 ? "1st Semester" : "2nd Semester";
  };

  if (isLoading) {
    return (
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } bg-gray-50 min-h-screen`}
      >
        <Navbar pageName="Schedule Tracking" />
        <Sidebar />
        <div className="p-6 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading schedule details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!scheduleInfo) {
    return (
      <div
        className={`${
          collapsed ? "pl-20" : "pl-[250px]"
        } bg-gray-50 min-h-screen`}
      >
        <Navbar pageName="Schedule Tracking" />
        <Sidebar />
        <div className="p-6 max-w-6xl mx-auto">
          <p className="text-center text-gray-500">
            No schedule data available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        collapsed ? "pl-20" : "pl-[250px]"
      } transition-[padding-left] duration-300 bg-gray-50`}
    >
      <Navbar pageName="Schedule Tracking" />
      <Sidebar />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft
                size={25}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>
            <span className="text-gray-600 text-sm pb-4 ml-1">
              Schedule ID: {sched_id}
            </span>
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
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 mt-2">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-500 text-sm">
                  Schedule Date
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(scheduleInfo.disbursement_date)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-500 text-sm">
                  Recipients
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {scheduleInfo.number_of_recipients}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-500 text-sm">
                  Total Amount
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {scheduleInfo.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-500 text-sm">Status</h3>
                <div className="mt-1">
                  {getStatusBadge(scheduleInfo.status)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">
              Schedule Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Title
                </label>
                <p className="text-gray-900 font-medium">
                  {scheduleInfo.disb_title}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Disbursement Type
                </label>
                <p className="text-gray-900">
                  {scheduleInfo.disbursement_type}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  School Year
                </label>
                <p className="text-gray-900">{scheduleInfo.sy_code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Semester
                </label>
                <p className="text-gray-900">
                  {getSemesterText(scheduleInfo.semester_code)}
                </p>
              </div>
              {scheduleInfo.branch && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Branch
                  </label>
                  <p className="text-gray-900 capitalize">
                    {scheduleInfo.branch}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">
              Financial Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Recipients</span>
                <span className="font-semibold text-gray-900">
                  {scheduleInfo.number_of_recipients}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold text-gray-900">
                  {scheduleInfo.total}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Status</span>
                {getStatusBadge(scheduleInfo.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {scheduleInfo.description && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {scheduleInfo.description}
            </p>
          </div>
        )}

        {/* Timeline Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-4">
            {scheduleInfo.created_at && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Schedule Created
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(scheduleInfo.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Scheduled Date
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(scheduleInfo.disbursement_date)}
                </p>
              </div>
            </div>
            {scheduleInfo.updated_at && scheduleInfo.status === "Completed" && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Completed</p>
                  <p className="text-sm text-gray-500">
                    {new Date(scheduleInfo.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduleDetailedTracking;
