import { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { LogOut, ChevronDown, ChevronUp, User, Menu } from "lucide-react";
import NotificationWrapper from "../notification/NotificationWrapper";
import { useSidebar } from "../../context/SidebarContext";

interface NavbarProps {
  pageName: string;
}

const Navbar = ({ pageName }: NavbarProps) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const { setIsMobileOpen } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    auth?.logout();
    toast.success("Logged out successfully!");
    navigate("/login");
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
    <nav className="flex items-center justify-between lg:ml-10  px-2 sm:px-4 py-2 sm:py-3 lg:py-4 border-b-[#024FA8] border-2 border-x-0 border-t-0 bg-white z-50">
      {/* Left side - Hamburger menu (mobile) and page title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        {/* Hamburger menu - only visible on mobile */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-md bg-white/20 backdrop-blur-sm 
            hover:bg-white/30 border border-white/30 shadow-md 
            transition-all duration-200 flex-shrink-0"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-[#024FA8]" />
        </button>

        {/* Page title */}
        <div className="text-[#024FA8] text-sm sm:text-lg lg:text-[25px] font-medium truncate min-w-0">
          {pageName}
        </div>
      </div>

      {/* Right side - User info and notifications */}
      <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
        {auth?.user ? (
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              {/* Notifications */}
              <div className="flex-shrink-0">
                <NotificationWrapper userId={auth?.info?.admin_id || 0} />
              </div>

              {/* Role badge - hidden on mobile and tablet */}
              <div
                className="hidden lg:block px-2 lg:px-3 py-1 rounded-full border border-blue-600/50 
                  bg-blue-50/80 backdrop-blur-sm text-blue-700 text-xs font-semibold
                  tracking-wide uppercase shadow-lg"
                title={auth.user.role_name}
              >
                {auth.user.role_name}
              </div>

              {/* User info with dropdown */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Username - hidden on mobile, visible on tablet and desktop */}
                <div className="hidden sm:block text-xs sm:text-sm font-medium text-gray-700 max-w-[80px] lg:max-w-none truncate">
                  {userName}
                </div>

                {/* User avatar button - clickable on all devices */}
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full 
                    bg-gradient-to-tr from-blue-500/90 to-indigo-600/90 backdrop-blur-sm 
                    text-white font-semibold text-xs sm:text-sm 
                    hover:from-blue-600/90 hover:to-indigo-700/90 
                    border border-white/30 shadow-lg hover:shadow-xl 
                    transition-all duration-200 group"
                  aria-label="User menu"
                >
                  {initials}
                </button>

                {/* Dropdown arrow - hidden on mobile */}
                <div className="hidden sm:block">
                  {isDropdownOpen ? (
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Compact dropdown menu */}
            {isDropdownOpen && (
              <div
                className="
                  absolute right-0 mt-2 w-40 sm:w-48 bg-white/90 backdrop-blur-xl rounded-lg 
                  shadow-xl border border-white/30 py-1 z-50
                "
              >
                <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 border-b border-white/30 flex items-center bg-white/50 backdrop-blur-sm">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="truncate">{userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="
                    w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 
                    hover:bg-white/60 hover:backdrop-blur-sm flex items-center
                    transition-all duration-200
                  "
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="text-[#024FA8] font-semibold hover:underline text-sm sm:text-base
              px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm hover:bg-white/30 
              border border-white/30 shadow-md transition-all duration-200"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
