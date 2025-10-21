import { useContext, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Calendar,
  BarChart,
  ChevronRight,
  PieChart,
  ChevronLeft,
  FileSpreadsheet,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext"; // Adjust the path as needed
import { useSidebar } from "../../context/SidebarContext";

const Sidebar = () => {
  const auth = useContext(AuthContext);
  const userRole = auth?.user?.role_name || "";
  const { collapsed, setCollapsed, isMobileOpen, setIsMobileOpen } =
    useSidebar();
  // Normalize role to lower case trimmed string for safer comparison
  const normalizedUserRole = userRole.trim().toLowerCase();

  const navItems = [
    {
      to: "/renewal-scholarship",
      label: "Scholarship Renewal",
      Icon: BookOpen,
      allowedRoles: [
        "mb hr",
        "mbs head",
        "system_admin",
        "sti registrar",
        "discipline office",
      ],
    },
    {
      to: "/tuition-invoice",
      label: "Tuition Invoice Upload",
      Icon: FileSpreadsheet,
      allowedRoles: ["mb hr", "mbs head", "system_admin", "sti registrar"],
    },
    {
      to: "/workflow-approval",
      label: "Approvals",
      Icon: CheckCircle,
      allowedRoles: [
        "sti registrar",
        "mb hr",
        "mb financial",
        "mb foundation",
        "mbs head",
        "system_admin",
        "discipline office",
      ],
    },
    {
      to: "/schedule",
      label: "Calendar of Activities",
      Icon: Calendar,
      allowedRoles: [
        "mb hr",
        "mbs head",
        "system_admin",
        "sti registrar",
        "discipline office",
      ],
    },
    {
      to: "/financial-overview",
      label: "Disbursement Overview",
      Icon: BarChart,
      allowedRoles: ["mb hr", "mbs head", "system_admin"],
    },
    {
      to: "/roi",
      label: "Scholarship Analytics",
      Icon: PieChart,
      allowedRoles: ["mb hr", "mbs head", "system_admin"],
    },
  ];

  // Filter nav items based on current user's role
  const filteredNavItems = navItems.filter((item) =>
    item.allowedRoles.some(
      (role) => role.trim().toLowerCase() === normalizedUserRole
    )
  );

  // Handle window resize to close mobile sidebar when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobileOpen]);

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 transition-all duration-500 ease-in-out
          bg-gradient-to-b from-[#024FA8]/90 to-[#0376C0]/90 backdrop-blur-xl shadow-2xl z-[60]
          border-r border-white/20
          ${collapsed && !isMobileOpen ? "w-20 px-2" : "w-[240px] px-4"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          pt-6 text-white font-sans`}
      >
        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden absolute top-10 right-6 p-1 rounded-md 
            bg-white/20 backdrop-blur-sm hover:bg-white/30 
            border border-white/30 shadow-lg
            transition-all duration-200 z-10
            flex items-center justify-center"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>

        {/* Header with logo and toggle button */}
        <div className="flex flex-col items-center mb-10 px-2 relative transition-all duration-500 ease-in-out">
          {/* Show collapsed view only on desktop when collapsed, always show expanded on mobile */}
          {collapsed && !isMobileOpen ? (
            <>
              {/* Toggle button on top */}
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileOpen(false);
                  } else {
                    setCollapsed(!collapsed);
                  }
                }}
                className="p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 
                  border border-white/30 shadow-lg mb-4 flex-shrink-0 
                  transition-all duration-300 hidden lg:block"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Metrobank logo below the button */}
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg p-2 transition-all duration-500 ease-in-out">
                <img
                  src="/MetrobankLogo.png"
                  alt="Metrobank Logo"
                  width={40}
                  height={40}
                  className="object-contain mx-auto transition-all duration-500 ease-in-out"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex cursor-pointer gap-4 items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg p-2 transition-all duration-500 ease-in-out">
                  <img
                    src="/MetrobankLogo.png"
                    alt="Metrobank Logo"
                    width={40}
                    height={40}
                    className="object-contain transition-all duration-500 ease-in-out"
                  />
                </div>

                <div className="min-w-0 transition-all duration-500 ease-in-out">
                  <h1 className="font-extrabold text-base leading-tight truncate transition-all duration-500 ease-in-out">
                    Metrobank <br />
                    STRONG
                  </h1>
                  <p className="text-xs font-normal truncate transition-all duration-500 ease-in-out">
                    Administration
                  </p>
                </div>
              </div>

              {/* Toggle button on right side - only show on desktop */}
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileOpen(false);
                  } else {
                    setCollapsed(!collapsed);
                  }
                }}
                className="p-1 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 
                  border border-white/30 shadow-lg flex-shrink-0 
                  transition-all duration-300 rotate-180 hidden lg:block"
                aria-label="Collapse sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Menu items */}
        <ul className="space-y-2 transition-all duration-500 ease-in-out">
          {filteredNavItems.map(({ to, label, Icon }) => (
            <li key={to} className="relative">
              {/* Container to track hover */}
              <div className="group">
                <NavLink
                  to={to}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsMobileOpen(false);
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center ${
                      collapsed && !isMobileOpen ? "justify-center" : "gap-3"
                    } p-2 rounded-md transition-all duration-500 ease-in-out cursor-pointer
            ${
              isActive
                ? "bg-white/30 backdrop-blur-sm text-white font-semibold border-l-4 border-white/50 shadow-lg"
                : "hover:bg-white/20 hover:backdrop-blur-sm hover:text-white hover:shadow-md"
            }`
                  }
                >
                  <Icon className="w-5 h-5 transition-all duration-500 ease-in-out" />
                  {!(collapsed && !isMobileOpen) && (
                    <span className="text-sm transition-all duration-500 ease-in-out">
                      {label}
                    </span>
                  )}
                </NavLink>

                {/* Custom tooltip - only show on desktop when collapsed */}
                {collapsed && !isMobileOpen && (
                  <div
                    className="absolute left-12 top-1/2 -translate-y-1/2
                       whitespace-nowrap bg-[#0376C0]/90 backdrop-blur-md text-white text-xs rounded-lg px-4 py-2
                       border border-blue-500/50 shadow-2xl
                       opacity-0 group-hover:opacity-100 pointer-events-none
                       transition-all duration-300 ease-out
                       z-50 transform scale-95 group-hover:scale-100
                       hidden lg:block"
                  >
                    {label}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full
                         w-2 h-2 bg-blue-600/90 backdrop-blur-md rotate-45
                         border-l border-t border-blue-500/50 shadow-lg"
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
