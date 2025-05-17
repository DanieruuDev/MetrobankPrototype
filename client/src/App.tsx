import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Workflow from "./pages/Workflow/Workflow";
import NotFound from "./pages/NotFound";
import Renewal from "./pages/Scholarship/Renewal/Renewal";
import Approval from "./pages/Workflow/SpecificApproval/Approval";
import Schedule from "./pages/Disbursement/Scheduling/Schedule";
import DisbursementOverview from "./pages/Disbursement/Overview/DisbursementOverview";
import ScheduleTracking from "./pages/Disbursement/Tracking/ScheduleTracking";
import DetailedOverview from "./pages/Disbursement/Overview/DetailedOverview";
import DetailedTracking from "./pages/Disbursement/Tracking/DetailedTracking";
import PrivateRoute from "./components/shared/PrivateRoute";
import { SidebarProvider } from "./context/SidebarContext";
// import AnalyticsPage from "./pages/Analytics"; // Add your analytics page if available

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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

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
                ]}
              >
                <Workflow />
              </PrivateRoute>
            }
          />

          <Route
            path="/renewal-scholarship"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
              >
                <Renewal />
              </PrivateRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
              >
                <Schedule />
              </PrivateRoute>
            }
          />

          <Route
            path="/tracking"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
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
            path="/financial-overview/detailed/:id"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
              >
                <DetailedOverview />
              </PrivateRoute>
            }
          />

          <Route
            path="/approval/:admin_id/:workflow_id"
            element={
              <PrivateRoute
                allowedRoles={[
                  "STI Registrar",
                  "MB HR",
                  "MB Financial",
                  "MB Foundation",
                  "MBS HEAD",
                  "SYSTEM_ADMIN",
                ]}
              >
                <Approval
                  setDetailedWorkflow={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  fetchWorkflow={function (_requester_id: number): void {
                    throw new Error("Function not implemented.");
                  }}
                />
              </PrivateRoute>
            }
          />

          <Route
            path="/tracking/detailed/:disbursement_id"
            element={
              <PrivateRoute
                allowedRoles={["MB HR", "MBS HEAD", "SYSTEM_ADMIN"]}
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
