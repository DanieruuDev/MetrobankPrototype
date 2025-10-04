import React, { useContext, useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../context/AuthContext";

interface LoginErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  console.log(VITE_BACKEND_URL);
  const validate = (): boolean => {
    const newErrors: LoginErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${VITE_BACKEND_URL}api/auth/login`, {
        email,
        password,
      });
      console.log("API response:", response.data); // Log the response
      const { token } = response.data;

      if (!token || typeof token !== "string") {
        throw new Error("Invalid or missing token in API response");
      }

      auth?.login(token);
      toast.success("Login successful!");
      navigate("/workflow-approval");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage =
        axiosError.response?.data.message || "Network error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#024FA8] to-[#0376C0] px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        <div className="flex justify-center mb-6">
          <img
            src="/mb-logo.png"
            alt="Metrobank Logo"
            className="w-20 h-auto object-contain"
          />
        </div>

        <h2 className="text-center text-2xl font-extrabold text-[#024FA8] mb-6">
          Metrobank STRONG
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#024FA8]"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0376C0] focus:border-[#0376C0] ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-red-600 text-sm">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#024FA8]"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0376C0] focus:border-[#0376C0] ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Your password"
              aria-invalid={!!errors.password}
              aria-describedby="password-error"
            />
            {errors.password && (
              <p id="password-error" className="mt-1 text-red-600 text-sm">
                {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#024FA8] hover:bg-[#0376C0] text-white font-semibold py-2 rounded-md transition-colors duration-300 flex justify-center items-center ${
              loading ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Metrobank. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
