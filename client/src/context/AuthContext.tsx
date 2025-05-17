import React, { createContext, useState, useEffect, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  user_id: number; // Add this
  email: string;
  role_id: number;
  role_name: string;
  // other fields if needed
}

interface User {
  user_id: number; // Add this
  email: string;
  role_id: number;
  role_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // NEW loading state

  useEffect(() => {
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
      } catch (error) {
        console.error("Invalid token:", error);
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
      }
    }
    setLoading(false); // done loading token
  }, []);

  const login = (authToken: string) => {
    try {
      const decoded = jwtDecode<JwtPayload>(authToken);
      setUser({
        user_id: decoded.user_id,
        email: decoded.email,
        role_id: decoded.role_id,
        role_name: decoded.role_name,
      });

      setToken(authToken);
      localStorage.setItem("token", authToken);
    } catch (error) {
      console.error("Invalid token during login:", error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  if (loading) {
    // You can return a loading spinner here or null to prevent rendering children too early
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};
