import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

interface JwtPayload {
  user_id: number;
  email: string;
  role_id: number;
  role_name: string;
}

interface Branch {
  branch_id: number;
  branch_name: string;
}

interface User {
  user_id: number;
  email: string;
  role_id: number;
  role_name: string;
  branch: Branch | null; // Added branch field
}

interface Info {
  admin_id: number;
  admin_email: string; // Changed to match backend field name
  role_id: number;
  role_name: string;
  admin_name: string;
  admin_job: string;
  branch: Branch | null; // Added branch field
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  info: Info | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<Info | null>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const fetchUserInfo = useCallback(
    async (authToken: string | null) => {
      if (!authToken) return null;
      try {
        const response = await axios.get(
          `${VITE_BACKEND_URL}api/auth/user-info`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        return null;
      }
    },
    [VITE_BACKEND_URL]
  );

  useEffect(() => {
    const loadUser = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        try {
          const decoded = jwtDecode<JwtPayload>(savedToken);
          setUser({
            user_id: decoded.user_id,
            email: decoded.email,
            role_id: decoded.role_id,
            role_name: decoded.role_name,
            branch: null, // Branch info not available in JWT, fetched separately
          });
          setToken(savedToken);

          const freshUser = await fetchUserInfo(savedToken);
          if (freshUser) {
            setInfo({
              admin_id: freshUser.admin_id,
              admin_email: freshUser.admin_email,
              role_id: freshUser.role_id,
              role_name: freshUser.role_name,
              admin_name: freshUser.admin_name,
              admin_job: freshUser.admin_job,
              branch: freshUser.branch, // Include branch from backend response
            });
          }
        } catch (error) {
          console.error("Invalid token:", error);
          setUser(null);
          setToken(null);
          setInfo(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [fetchUserInfo]);

  const login = async (authToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(authToken);
      setUser({
        user_id: decoded.user_id,
        email: decoded.email,
        role_id: decoded.role_id,
        role_name: decoded.role_name,
        branch: null, // Branch info not included in JWT, fetched separately
      });
      setToken(authToken);
      localStorage.setItem("token", authToken);

      const freshUser = await fetchUserInfo(authToken);
      if (freshUser) {
        setInfo({
          admin_id: freshUser.admin_id,
          admin_email: freshUser.admin_email,
          role_id: freshUser.role_id,
          role_name: freshUser.role_name,
          admin_name: freshUser.admin_name,
          admin_job: freshUser.admin_job,
          branch: freshUser.branch, // Include branch from backend response
        });
      }
    } catch (error) {
      console.error("Invalid token during login:", error);
      setUser(null);
      setToken(null);
      setInfo(null);
      localStorage.removeItem("token");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setInfo(null);
    localStorage.removeItem("token");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
        info,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
