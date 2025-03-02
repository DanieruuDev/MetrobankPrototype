import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Workflow from "./pages/Workflow/Workflow";
import NotFound from "./pages/NotFound";
import Renewal from "./pages/Scholarship/Renewal/Renewal";

import Approval from "./pages/Workflow/SpecificApproval/Approval";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/renewal-scholarship" element={<Renewal />} />
      <Route path="/workflow-approval" element={<Workflow />} />
      <Route path="/approval/:admin_id/:workflow_id" element={<Approval />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
