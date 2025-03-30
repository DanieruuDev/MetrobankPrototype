import { useState, useRef, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";

const Navbar = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getNavbarTitle = (pathname: string) => {
    const pageTitles: Record<string, string> = {
      "/renewal-status": "Renewal Status",
      "/workflow-approval": "Workflow Approval",
      "/renewal-scholarship": "Scholarship Renewal",
      "/approver": "Approver",
      "/approver-view": "My Approvals",
    };
    return pageTitles[pathname] || "";
  };

  const navbarTitle = getNavbarTitle(location.pathname);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white py-2 flex justify-between relative border-b-3 border-solid border-blue-600">
      <div className="flex items-center gap-10">
        <button className="text-gray-600 cursor-pointer">
          <ArrowLeft size={25} />
        </button>
        <div className="text-3xl text-blue-800 font-medium">{navbarTitle}</div>
      </div>
      <div className="flex items-center gap-x-5 m-5">
        <div className="flex items-center text-xl ml-4 gap-x-5 text-gray-500">
          <div className="text-sm font-semibold">Metrobank, Admin 1</div>
          <div className="relative" ref={dropdownRef}>
            <button
              className="cursor-pointer flex items-center"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <ChevronDown size={25} />
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 text-sm bg-white rounded-lg shadow w-32 top-full right-0">
                <ul className="py-4 text-gray-500">
                  <li className="text-center">
                    <a href="#" className="block py-1 sm:py-2 md:py-3">
                      Profile
                    </a>
                  </li>
                  <li className="text-center">
                    <a href="#" className="block py-1 sm:py-2 md:py-3">
                      Settings
                    </a>
                  </li>
                  <li className="text-center">
                    <a href="#" className="block py-1 sm:py-2 md:py-3">
                      {auth.token ? (
                        <button onClick={auth.logout}>Logout</button>
                      ) : (
                        <Link to="/login">Login</Link>
                      )}
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
