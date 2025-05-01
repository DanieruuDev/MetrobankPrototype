import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Workflow from "./pages/Workflow/Workflow";
import NotFound from "./pages/NotFound";
import Renewal from "./pages/Scholarship/Renewal/Renewal";
import Approval from "./pages/Workflow/SpecificApproval/Approval";
import Schedule from "./pages/SchedulingTracking/Schedule";
import FinancialAdministration from "./pages/FinancialAdministration/FinancialAdministration";
import ExpensesMonitoring from "./pages/Expenses/ExpensesMonitoring";
import ExpenseView from "./pages/Expenses/ExpenseView";
import Disbursement from "./pages/Disbursement/Disbursement";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/renewal-scholarship" element={<Renewal />} />
      <Route path="/workflow-approval" element={<Workflow />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/expenses" element={<ExpensesMonitoring />} />
      <Route path="/expenses/:studentId" element={<ExpenseView />} />
      <Route path="/disbursement" element={<Disbursement />} />
      <Route
        path="/approval/:admin_id/:workflow_id"
        element={
          <Approval
            setDetailedWorkflow={function (): void {
              throw new Error("Function not implemented.");
            }}
            fetchWorkflow={function (
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              _requester_id: number
            ): void {
              throw new Error("Function not implemented.");
            }}
          />
        }
      />
      <Route path="/financial" element={<FinancialAdministration />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
