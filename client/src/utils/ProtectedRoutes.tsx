import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = () => {
  const auth = useContext(AuthContext);

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  return auth.token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
