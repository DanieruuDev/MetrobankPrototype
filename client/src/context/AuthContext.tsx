import React, { createContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

interface JwtPayload {
  user_id: number;
  email: string;
  role_id: number;
  role_name: string;
}

interface User {
  user_id: number;
  email: string;
  role_id: number;
  role_name: string;
}
interface Info {
  admin_id: number;
  email: string;
  role_id: number;
  role_name: string;
  admin_name: string;
  admin_job: string;
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

  const fetchUserInfo = async (authToken: string | null) => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/user-info",
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
  };

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
          });
          setToken(savedToken);

          const freshUser = await fetchUserInfo(savedToken);
          if (freshUser) {
            setInfo(freshUser);
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
  }, []);

  const login = async (authToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(authToken);
      setUser({
        user_id: decoded.user_id,
        email: decoded.email,
        role_id: decoded.role_id,
        role_name: decoded.role_name,
      });
      console.log(decoded.user_id);
      setToken(authToken);
      localStorage.setItem("token", authToken);

      const freshUser = await fetchUserInfo(authToken);
      if (freshUser) {
        setInfo(freshUser);
      }
    } catch (error) {
      console.error("Invalid token during login:", error);
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
