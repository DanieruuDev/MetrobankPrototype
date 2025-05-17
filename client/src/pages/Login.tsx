import { useState } from "react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    // Simple email regex for demo (you can improve this)
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

    // Return true if no errors
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Proceed with login
    alert(`Logging in with: ${email}`);
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
          Metrobank S.T.R.O.N.G.
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
            {errors.email && (
              <p className="mt-1 text-red-600 text-sm">{errors.email}</p>
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
            />
            {errors.password && (
              <p className="mt-1 text-red-600 text-sm">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#024FA8] hover:bg-[#0376C0] text-white font-semibold py-2 rounded-md transition-colors duration-300"
          >
            Log In
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
