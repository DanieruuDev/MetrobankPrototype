import React, { useCallback, useEffect, useMemo, useState, useContext } from "react";
import axios from "axios";
import Sidebar from "../../components/shared/Sidebar";
import Navbar from "../../components/shared/Navbar";
// Pending approvals table moved to sidebar list; table import not needed
import MiniCalendar from "../../components/shared/MiniCalendar";
import { useSidebar } from "../../context/SidebarContext";
import { AuthContext } from "../../context/AuthContext";
import { ClipboardList, Clock, Tag } from "lucide-react";
import { Link } from "react-router-dom";

interface WorkflowApprovalListItem {
  workflow_id: number;
  workflow_title: string;
  approval_req_type: string;
  school_year: string;
  semester: string;
  approver: {
    approver_id: number;
    approver_status: string;
    approver_due_date: string;
  };
}

interface RenewalRowLite {
  scholar_name: string;
  campus: string;
  scholarship_status: string;
}

const Dashboard: React.FC = () => {
  const { collapsed } = useSidebar();
  const auth = useContext(AuthContext);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const userId = auth?.user?.user_id;
  const userRoleId = auth?.user?.role_id;
  const userRoleName = (auth?.user?.role_name || "").trim().toLowerCase();

  const [pendingRenewals, setPendingRenewals] = useState<number>(0);
  const [pendingRenewalList, setPendingRenewalList] = useState<RenewalRowLite[]>([]);
  const [pendingRequests, setPendingRequests] = useState<WorkflowApprovalListItem[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalDisbursed, setTotalDisbursed] = useState<number>(0);

  // Role-based access control
  const canSeeFinancialStats = useMemo(() => 
    ["mb hr", "mbs head", "system_admin", "mb financial"].includes(userRoleName), 
    [userRoleName]
  );

  const canSeeScholarStats = useMemo(() => 
    ["mb hr", "mbs head", "system_admin", "sti registrar", "mb foundation", "discipline office"].includes(userRoleName), 
    [userRoleName]
  );

  const canSeeApprovals = useMemo(() => 
    ["sti registrar", "mb hr", "mb financial", "mb foundation", "mbs head", "system_admin", "discipline office"].includes(userRoleName), 
    [userRoleName]
  );

  const canSeeSchedules = useMemo(() => 
    ["mb hr", "mbs head", "system_admin"].includes(userRoleName), 
    [userRoleName]
  );

  const canSeeRenewals = useMemo(() => 
    ["mb hr", "mbs head", "system_admin", "sti registrar", "discipline office"].includes(userRoleName), 
    [userRoleName]
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, { title: string; description?: string; href?: string; type?: "approval" | "schedule" }[]> = {};
    
    // Pending approvals events (only for roles that can see approvals)
    if (canSeeApprovals) {
      pendingRequests.forEach((r) => {
        const dateStr = (r.approver?.approver_due_date || "").toString().slice(0, 10);
        if (!dateStr) return;
        map[dateStr] = map[dateStr] || [];
        map[dateStr].push({
          title: r.workflow_title || "Approval Due",
          description: r.approval_req_type ? `Type: ${r.approval_req_type}` : undefined,
          href: "/workflow-approval/request",
          type: "approval",
        });
      });
    }
    
    // Upcoming schedules events (only for roles that can see schedules)
    if (canSeeSchedules) {
      upcomingSchedules.forEach((s) => {
        const dateStr = (s.schedule_due || s.due_date || s.date || "").toString().slice(0, 10);
        if (!dateStr) return;
        map[dateStr] = map[dateStr] || [];
        map[dateStr].push({
          title: s.sched_title || s.title || s.event_title || s.request_title || "Scheduled Disbursement",
          description: s.disbursement_type || s.disbursement_label || s.description || s.details || s.campus || s.branch || undefined,
          href: s.sched_id ? `/tracking/detailed/${s.sched_id}` :
                (s.workflow_id ? `/financial-overview/detailed/${s.workflow_id}` :
                "/schedule"),
          type: "schedule",
        });
      });
    }
    
    return map;
  }, [pendingRequests, upcomingSchedules, canSeeApprovals, canSeeSchedules]);

  const fetchDashboardStats = useCallback(async () => {
    try {
      // Fetch total students count (only if user has permission)
      if (canSeeScholarStats) {
        const studentsRes = await axios.get(`${VITE_BACKEND_URL}api/maintenance/get-all-students`);
        const studentsData = studentsRes.data?.data || [];
        setTotalStudents(studentsData.length);
      }

      // Fetch total disbursed amount (only if user has permission)
      if (canSeeFinancialStats) {
        const disbursedRes = await axios.get(`${VITE_BACKEND_URL}api/disbursement-overview/get-total-disbursed`);
        const disbursedAmount = disbursedRes.data?.total_disbursed || 0;
        setTotalDisbursed(disbursedAmount);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, [VITE_BACKEND_URL, canSeeScholarStats, canSeeFinancialStats]);

  const fetchPendingRenewals = useCallback(async () => {
    try {
      const validRes = await axios.get(
        `${VITE_BACKEND_URL}api/maintenance/valid_sy_semester`
      );
      const list = Array.isArray(validRes.data) ? validRes.data : [];
      if (list.length === 0) return;
      const { school_year, semester } = list[0];

      const renewalsRes = await axios.get(
        `${VITE_BACKEND_URL}api/renewal/fetch-renewals`,
        {
          params: {
            school_year,
            semester,
            user_id: userId,
            role_id: String(userRoleId || ""),
          },
          timeout: 5000,
        }
      );

      const rows: any[] = renewalsRes.data?.data || [];
      // Count rows awaiting validation for the current user's role (is_validated != true)
      const pendingRows = rows.filter((r) => r.is_validated !== true);
      setPendingRenewals(pendingRows.length);
      setPendingRenewalList(
        pendingRows.slice(0, 5).map((r) => ({
          scholar_name: r.scholar_name,
          campus: r.campus,
          scholarship_status: r.scholarship_status,
        }))
      );
    } catch (e) {
      // ignore
    }
  }, [VITE_BACKEND_URL, userId, userRoleId]);

  const fetchUpcomingSchedules = useCallback(async () => {
    try {
      const res = await axios.get(
        `${VITE_BACKEND_URL}api/disbursement/schedule/weeks`
      );
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setUpcomingSchedules(data.slice(0, 5));
    } catch {
      setUpcomingSchedules([]);
    }
  }, [VITE_BACKEND_URL]);

  const fetchPendingApprovals = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${VITE_BACKEND_URL}api/workflow/get-request/${userId}`);
      const list: WorkflowApprovalListItem[] = res.data || [];
      const pendingOnly = list.filter(
        (r) => r?.approver?.approver_status?.toLowerCase() === "pending"
      );
      setPendingRequests(pendingOnly);
    } catch (e) {
      // ignore
    }
  }, [VITE_BACKEND_URL, userId]);

  useEffect(() => {
    fetchDashboardStats();
    fetchPendingRenewals();
    fetchPendingApprovals();
    fetchUpcomingSchedules();
  }, [fetchDashboardStats, fetchPendingRenewals, fetchPendingApprovals, fetchUpcomingSchedules]);

  return (
    <div className="min-h-screen relative bg-gray-50">
      <Sidebar />
      <div
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? "pl-0 lg:pl-20" : "pl-0 lg:pl-[240px]"
        }`}
      >
        <Navbar pageName="Dashboard" />

        <div className="flex items-start gap-3 sm:gap-4 px-2 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Main container (separate) */}
          <main className="flex-1 min-w-0">
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {auth?.user?.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-gray-600">Here's what's happening with your scholarship management system.</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Scholars Card - Role-based */}
              {canSeeScholarStats && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Scholars</p>
                      <p className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Disbursed Card - Role-based */}
              {canSeeFinancialStats && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Disbursed</p>
                      <p className="text-2xl font-bold text-gray-900">₱{totalDisbursed.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional cards can be added here for other roles if needed */}
              
              {/* Placeholder cards to maintain layout when some cards are hidden */}
              {!canSeeScholarStats && !canSeeFinancialStats && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Welcome</p>
                      <p className="text-lg font-bold text-gray-900">Access your tasks below</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

           

          </main>

          {/* Widgets sidebar (separate container) */}
          <aside className="hidden lg:block w-80 xl:w-96 shrink-0 space-y-3 sticky top-4 self-start">
            {/* Mini Calendar - visible to all roles, but events filtered by role access */}
            <MiniCalendar eventsByDate={eventsByDate} />

            {/* Role-based: Pending Approvals widget */}
            {canSeeApprovals && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    Pending Approvals
                    <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {pendingRequests.length}
                    </span>
                  </h3>
                  <Link to="/workflow-approval/request" className="text-xs text-blue-600 hover:underline">View all</Link>
                </div>
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-gray-500">No pending approvals.</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingRequests.slice(0, 5).map((r) => {
                      const due = (r.approver?.approver_due_date || "").toString().slice(0, 10);
                      return (
                        <li key={r.approver.approver_id}>
                          <Link
                            to="/workflow-approval/request"
                            className="block rounded-md border border-gray-200 bg-white px-3 py-2 hover:border-blue-300 hover:shadow-sm transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 text-blue-600">
                                <ClipboardList className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-gray-800 truncate">
                                  {r.workflow_title}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                    <Tag className="w-3 h-3" />
                                    {r.approval_req_type || "Approval"}
                                  </span>
                                  {due && (
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock className="w-3 h-3" />
                                      {due}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Role-based: Pending Renewals widget */}
            {canSeeRenewals && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    Pending Renewals
                    <span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {pendingRenewals}
                    </span>
                  </h3>
                  <Link to="/renewal-scholarship" className="text-xs text-blue-600 hover:underline">View all</Link>
                </div>
                {pendingRenewalList.length === 0 ? (
                  <p className="text-xs text-gray-500">No pending renewals.</p>
                ) : (
                  <ul className="space-y-2">
                    {pendingRenewalList.map((r, idx) => {
                      // Different display based on role
                      const isMBHR = ["mb hr", "mbs head", "system_admin"].includes(userRoleName);
                      
                      if (isMBHR) {
                        // For MB HR: Show "Campus - Count" format
                        return (
                          <li key={idx} className="flex items-center justify-between">
                            <Link to="/renewal-scholarship" className="text-xs text-gray-700 truncate mr-2 hover:underline">
                              {r.campus || "Unknown Campus"}
                            </Link>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                              {r.scholar_name} renewal
                            </span>
                          </li>
                        );
                      } else {
                        // For Registrars: Show Student Name and Status
                        return (
                          <li key={idx} className="flex items-center justify-between">
                            <Link to="/renewal-scholarship" className="text-xs text-gray-700 truncate mr-2 hover:underline">
                              {r.scholar_name}
                            </Link>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                              {r.scholarship_status || "Pending"}
                            </span>
                          </li>
                        );
                      }
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Recent Activity Widget - Visible to all roles */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900">Approval processed</p>
                    <p className="text-[10px] text-gray-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900">Renewal submitted</p>
                    <p className="text-[10px] text-gray-500">4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900">Disbursement scheduled</p>
                    <p className="text-[10px] text-gray-500">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900">Calendar updated</p>
                    <p className="text-[10px] text-gray-500">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;