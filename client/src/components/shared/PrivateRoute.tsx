import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const auth = useAuth();
  const location = useLocation();

  if (!auth) {
    console.error("AuthContext is undefined");
    return <div>Loading...</div>;
  }

  const { loading, isAuthenticated, user, token } = auth;

  if (loading) {
    return <div>Loading...</div>;
  }

  // 🔹 If not authenticated, save the attempted route then redirect to login
  if (!isAuthenticated || !token) {
    sessionStorage.setItem("lastPage", location.pathname);
    return <Navigate to="/" replace />;
  }

  // 🔹 Role restriction
  if (allowedRoles && user && !allowedRoles.includes(user.role_name)) {
    console.warn("Role check failed, redirecting to /unauthorized", {
      allowedRoles,
      userRole: user.role_name,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
