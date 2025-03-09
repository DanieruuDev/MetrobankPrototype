import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./NotFound";
import AnalyticsPage from "./pages/financialPage/AnalyticsPage";
import ApprovalPage from "./pages/financialPage/ApprovalPage";
import ManagementPage from "./pages/financialPage/ManagementPage";
import FinancialPage from "./pages/financialPage/FinancialPage";
import { useState } from "react";

function App() {
  const [sidebarToggle, setSidebarToggle] = useState(true);

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Home
              sidebarToggle={sidebarToggle}
              setSidebarToggle={setSidebarToggle}
            />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/financialpage/analyticspage"
          element={
            <AnalyticsPage
              sidebarToggle={sidebarToggle}
              setSidebarToggle={setSidebarToggle}
            />
          }
        />
        <Route
          path="/financialpage/approvalpage"
          element={
            <ApprovalPage
              sidebarToggle={sidebarToggle}
              setSidebarToggle={setSidebarToggle}
            />
          }
        />
        <Route
          path="/financialpage/managementpage"
          element={
            <ManagementPage
              sidebarToggle={sidebarToggle}
              setSidebarToggle={setSidebarToggle}
            />
          }
        />
        <Route
          path="/financialpage/financialpage"
          element={
            <FinancialPage
              sidebarToggle={sidebarToggle}
              setSidebarToggle={setSidebarToggle}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
