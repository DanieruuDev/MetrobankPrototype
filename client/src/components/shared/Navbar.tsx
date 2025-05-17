import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

interface NavbarProps {
  pageName: string;
}

const Navbar = ({ pageName }: NavbarProps) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    auth?.logout();
    toast.success("Logged out successfully!");
    navigate("/login"); // Redirect to login page after logout
  };

  return (
    <nav className="flex space-x-3 mx-4 py-3 border-b-[#024FA8] border-1 border-x-0 border-t-0 bg-white z-50">
      <div className="text-[#024FA8] text-[32px] font-medium">{pageName}</div>
      <div className="flex items-center space-x-6 ml-auto">
        <Link to="/" className="text-[#024FA8] font-semibold hover:underline">
          Home
        </Link>

        {auth?.user ? (
          <>
            <span className="text-gray-600 font-medium">
              Role:{" "}
              <span className="text-[#024FA8]">{auth.user.role_name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white font-semibold px-4 py-1 rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="text-[#024FA8] font-semibold hover:underline"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
