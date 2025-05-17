import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const auth = useContext(AuthContext);

  if (!auth) {
    // Auth context not ready yet
    return <div>Loading...</div>;
  }

  if (auth.isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    auth.user &&
    !allowedRoles.includes(auth.user.role_name)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
