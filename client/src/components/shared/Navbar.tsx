import { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { LogOut, ChevronDown, ChevronUp, User } from "lucide-react";
import NotificationWrapper from "../notification/NotificationWrapper";

interface NavbarProps {
  pageName: string;
}

const Navbar = ({ pageName }: NavbarProps) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    auth?.logout();
    toast.success("Logged out successfully!");
    navigate("/");
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const getInitials = (name: string) => {
    if (!name) return "";
    const names = name.trim().split(" ");
    let initials = names[0].charAt(0).toUpperCase();

    if (names.length > 1) {
      initials += names[names.length - 1].charAt(0).toUpperCase();
    }

    return initials;
  };

  const userName = auth?.info?.admin_name || auth?.user?.email || "";
  const initials = getInitials(userName);

  return (
    <nav className="flex space-x-3 mx-4 py-4 border-b-[#024FA8] border-2 border-x-0 border-t-0 bg-white z-50">
      <div className="text-[#024FA8] text-[25px] font-medium">{pageName}</div>
      <div className="flex items-center space-x-6 ml-auto">
        {auth?.user ? (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-3">
              <div>
                <NotificationWrapper userId={auth?.info?.admin_id || 0} />
              </div>
              {/* Role badge */}
              <div
                className="
                  px-3 py-1 rounded-full border border-blue-600 
                  bg-blue-50 text-blue-700 text-xs font-semibold
                  tracking-wide uppercase
                  shadow-sm
                "
                title={auth.user.role_name}
              >
                {auth.user.role_name}
              </div>

              {/* User info with dropdown */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 group"
                aria-label="User menu"
              >
                <div className="text-sm font-medium text-gray-700">
                  {userName}
                </div>

                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-semibold">
                  {initials}
                </div>

                {isDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>

            {/* Compact dropdown menu */}
            {isDropdownOpen && (
              <div
                className="
                  absolute right-0 mt-2 w-48 bg-white rounded-md 
                  shadow-lg border border-gray-200 py-1
                  z-50
                "
              >
                <div className="px-4 py-2 text-sm text-gray-700 border-b flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span className="truncate">{userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="
                    w-full px-4 py-2 text-sm text-gray-700 
                    hover:bg-gray-100 flex items-center
                  "
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/" className="text-[#024FA8] font-semibold hover:underline">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
