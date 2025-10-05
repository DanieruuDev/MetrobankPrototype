import { Navigate } from "react-router-dom";
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

  if (!auth) {
    console.error("AuthContext is undefined");
    return <div>Loading...</div>;
  }

  const { loading, isAuthenticated, user } = auth;

  if (loading) {
    console.log("Auth is still loading");
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log("User is not authenticated, redirecting to /");
    return <Navigate to="/" replace />;
  }

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role_name)) {
    console.log(
      "Role check failed, redirecting to /unauthorized",
      user,
      !allowedRoles.includes(user.role_name),
      {
        allowedRoles,
        userRole: user.role_name,
      }
    );

    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
