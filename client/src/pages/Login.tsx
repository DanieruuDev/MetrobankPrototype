import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  const { login } = auth;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await axios.post("http://localhost:5000/admin/login", {
        email,
        password,
      });
      if (response.status === 200) {
        const { token, email } = response.data;
        login(token, email); // Save token in context and localStorage
      }

      if (response.status === 200) {
        console.log("Login successful:", response.data);

        // Navigate to the protected page
        navigate("/workflow-approval");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`Error: ${err.response.data.message || "Login failed"}`);
        } else if (err.request) {
          setError("Error: No response from server");
        } else {
          setError("Error: Something went wrong");
        }

        console.error("Login failed:", err);
      } else {
        setError("Error: An unexpected error occurred");
        console.error("Unexpected error:", err);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-gray-700 font-medium mb-2 ">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className=" text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="text-red-500">{error}</div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
