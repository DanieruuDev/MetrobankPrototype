import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Workflow from "./pages/Workflow/Workflow";
import NotFound from "./pages/NotFound";
import Renewal from "./pages/Scholarship/Renewal/Renewal";
import Approval from "./pages/Workflow/SpecificApproval/Approval";
import Request from "./pages/Workflow/Request";
import Schedule from "./pages/Disbursement/Scheduling/Schedule";
import DisbursementOverview from "./pages/Disbursement/Overview/DisbursementOverview";
import ScheduleTracking from "./pages/Disbursement/Tracking/ScheduleTracking";
import DetailedOverview from "./pages/Disbursement/Overview/DetailedOverview";
import DetailedTracking from "./pages/Disbursement/Tracking/DetailedTracking";
import PrivateRoute from "./components/shared/PrivateRoute";
import { SidebarProvider } from "./context/SidebarContext";
import ROIandAnalytics from "./pages/ROI/ROIandAnalytics";
import TuitionInvoiceUpload from "./pages/TuitionInvoiceUpload/TuitionInvoiceUpload";
import Sample from "./pages/Dashboard/Sample";

function App() {
  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        aria-label="Notification messages"
      />
      <SidebarProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />

          {/* Private routes with role-based access */}
          <Route
            path="/workflow-approval"
            element={
              <PrivateRoute
                allowedRoles={[
                  "STI Registrar",
                  "MB HR",
                  "MB Financial",
                  "MB Foundation",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "Discipline Office",
                ]}
              >
                <Workflow />
              </PrivateRoute>
            }
          />

          <Route
            path="/workflow-approval/:workflow_id"
            element={
              <PrivateRoute
                allowedRoles={[
                  "STI Registrar",
                  "MB HR",
                  "MB Financial",
                  "MB Foundation",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "Discipline Office",
                ]}
              >
                <Approval />
              </PrivateRoute>
            }
          />
          <Route
            path="/workflow-approval/request"
            element={
              <PrivateRoute
                allowedRoles={[
                  "STI Registrar",
                  "MB HR",
                  "MB Financial",
                  "MB Foundation",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "Discipline Office",
                ]}
              >
                <Request />
              </PrivateRoute>
            }
          />

          <Route
            path="/renewal-scholarship"
            element={
              <PrivateRoute
                allowedRoles={[
                  "MB HR",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "STI Registrar",
                  "Discipline Office",
                ]}
              >
                <Renewal />
              </PrivateRoute>
            }
          />
          <Route
            path="/tuition-invoice"
            element={
              <PrivateRoute
                allowedRoles={[
                  "MB HR",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "STI Registrar",
                ]}
              >
                <TuitionInvoiceUpload />
              </PrivateRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <PrivateRoute
                allowedRoles={[
                  "MB HR",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "STI Registrar",
                  "Discipline Office",
                ]}
              >
                <Schedule />
              </PrivateRoute>
            }
          />

          <Route
            path="/tracking"
            element={
              <PrivateRoute
                allowedRoles={[
                  "MB HR",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "STI Registrar",
                  "Discipline Office",
                ]}
              >
                <ScheduleTracking />
              </PrivateRoute>
            }
          />

          <Route
            path="/financial-overview"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
              >
                <DisbursementOverview />
              </PrivateRoute>
            }
          />
          <Route
            path="/roi"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
              >
                <ROIandAnalytics />
              </PrivateRoute>
            }
          />

          <Route
            path="/financial-overview/detailed/:id"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
              >
                <DetailedOverview />
              </PrivateRoute>
            }
          />
          <Route path="/sample" element={<Sample />} />

          <Route
            path="/tracking/detailed/:sched_id"
            element={
              <PrivateRoute
                allowedRoles={[
                  "MB HR",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                  "STI Registrar",
                  "Discipline Office",
                ]}
              >
                <DetailedTracking />
              </PrivateRoute>
            }
          />

          {/* Example Analytics route - add this only if you have Analytics page */}
          {/* 
        <Route
          path="/analytics"
          element={
            <PrivateRoute allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}>
              <AnalyticsPage />
            </PrivateRoute>
          }
        /> 
        */}

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SidebarProvider>
    </>
  );
}

export default App;
