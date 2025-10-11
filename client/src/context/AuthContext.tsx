import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";
import axios, { AxiosError } from "axios";

interface JwtPayload {
  user_id: number;
  email: string;
  role_id: number;
  role_name: string;
  campus: Branch | null;
  exp?: number;
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
  branch: Branch | null;
}

interface Info {
  admin_id: number;
  admin_email: string;
  role_id: number;
  role_name: string;
  admin_name: string;
  admin_job: string;
  branch: Branch | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  logout: () => Promise<void>;
  setToken: (token: string) => void;
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
  axios.defaults.withCredentials = true;

  const fetchUserInfo = useCallback(
    async (accessToken: string) => {
      try {
        const response = await axios.get(
          `${VITE_BACKEND_URL}api/auth/user-info`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        return null;
      }
    },
    [VITE_BACKEND_URL]
  );

  const logout = useCallback(async () => {
    try {
      await axios.post(
        `${VITE_BACKEND_URL}api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    setToken(null);
    setInfo(null);
  }, [VITE_BACKEND_URL]);

  useEffect(() => {
    const refreshAccessToken = async () => {
      try {
        const res = await axios.get(
          `${VITE_BACKEND_URL}api/auth/refresh-token`,
          {
            withCredentials: true,
          }
        );

        const newAccessToken = res.data.newAccessToken;
        console.log("Refreshed access token:", newAccessToken);

        if (newAccessToken) {
          setToken(newAccessToken);
          const decoded = jwtDecode<JwtPayload>(newAccessToken);
          console.log("New token", decoded);
          setUser({
            user_id: decoded.user_id,
            email: decoded.email,
            role_id: decoded.role_id,
            role_name: decoded.role_name,
            branch: decoded.campus,
          });
          await fetchUserInfo(newAccessToken);
        } else {
          throw new Error("No access token returned");
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          await logout(); // Clear auth state on 401
        }
        setToken(null);
        setUser(null);
        setInfo(null);
      } finally {
        setLoading(false);
      }
    };
    refreshAccessToken();
  }, [VITE_BACKEND_URL, fetchUserInfo, logout]);

  const setTokenAndUser = (newToken: string) => {
    setToken(newToken);
    try {
      const decoded = jwtDecode<JwtPayload>(newToken);
      setUser({
        user_id: decoded.user_id,
        email: decoded.email,
        role_id: decoded.role_id,
        role_name: decoded.role_name,
        branch: null,
      });
      fetchUserInfo(newToken);
    } catch (err) {
      console.error("Failed to decode token:", err);
      setToken(null);
      setUser(null);
    }
  };

  // Only render children when loading is complete
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setToken: setTokenAndUser,
        logout,
        isAuthenticated: !!token && !!user,
        loading,
        info,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
