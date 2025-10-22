import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ProcessProvider } from "./context/ProcessContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProcessProvider>
          <App />
        </ProcessProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
