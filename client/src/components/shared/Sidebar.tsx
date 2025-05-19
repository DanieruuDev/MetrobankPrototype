import { useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  CheckCircle,
  Calendar,
  ClipboardList,
  BarChart,
  ChevronRight,
  PieChart,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext"; // Adjust the path as needed
import { useSidebar } from "../../context/SidebarContext";

const Sidebar = () => {
  const auth = useContext(AuthContext);
  const userRole = auth?.user?.role_name || "";
  const { collapsed, setCollapsed } = useSidebar();
  // Normalize role to lower case trimmed string for safer comparison
  const normalizedUserRole = userRole.trim().toLowerCase();

  const navItems = [
    {
      to: "/",
      label: "Home",
      Icon: Home,
      allowedRoles: [
        "sti registrar",
        "mb hr",
        "mb financial",
        "mb foundation",
        "mbs head",
        "system_admin",
      ],
    },
    {
      to: "/renewal-scholarship",
      label: "Scholarship Renewal",
      Icon: BookOpen,
      allowedRoles: ["mb hr", "mbs head", "system_admin"],
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
      ],
    },
    {
      to: "/schedule",
      label: "Schedule",
      Icon: Calendar,
      allowedRoles: ["mb hr", "mbs head", "system_admin"],
    },
    {
      to: "/tracking",
      label: "Disbursement Tracking",
      Icon: ClipboardList,
      allowedRoles: ["mb hr", "mbs head", "system_admin"],
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
    // Add Analytics here if you have one, same pattern
    // {
    //   to: "/analytics",
    //   label: "Analytics",
    //   Icon: BarChart,
    //   allowedRoles: ["mb hr", "mbs head", "system_admin"],
    // },
  ];

  // Filter nav items based on current user's role
  const filteredNavItems = navItems.filter((item) =>
    item.allowedRoles.some(
      (role) => role.trim().toLowerCase() === normalizedUserRole
    )
  );

  return (
    <div
      className={`fixed left-0 top-0 bottom-0 transition-all duration-300 
        bg-gradient-to-b from-[#024FA8] to-[#0376C0] shadow-lg
        ${collapsed ? "w-20 px-2" : "w-[240px] px-4"}
        pt-6 text-white font-sans`}
    >
      {/* Header with logo and toggle button */}
      <div className="flex flex-col items-center mb-10 px-2 relative">
        {collapsed ? (
          <>
            {/* Toggle button on top */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-full hover:bg-blue-700 mb-4 flex-shrink-0 transition-transform duration-300"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Metrobank logo below the button */}
            <div className="w-10 h-10">
              <img
                src="/MetrobankLogo.png"
                alt="Metrobank Logo"
                width={40}
                height={40}
                className="object-contain mx-auto"
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex cursor-pointer gap-4 items-center">
              <div className="flex-shrink-0 w-10 h-10">
                <img
                  src="/MetrobankLogo.png"
                  alt="Metrobank Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>

              <div className="min-w-0">
                <h1 className="font-extrabold text-base leading-tight truncate">
                  Metrobank <br />
                  S.T.R.O.N.G.
                </h1>
                <p className="text-xs font-normal truncate">Administration</p>
              </div>
            </div>

            {/* Toggle button on right side */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-full hover:bg-blue-700 flex-shrink-0 transition-transform duration-300 rotate-180"
              aria-label="Collapse sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Menu items */}
      <ul className="space-y-2">
        {filteredNavItems.map(({ to, label, Icon }) => (
          <li key={to} className="relative">
            {/* Container to track hover */}
            <div className="group">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center ${
                    collapsed ? "justify-center" : "gap-3"
                  } p-2 rounded-md transition-all duration-300 cursor-pointer
            ${
              isActive
                ? "bg-white text-[#0376C0] font-semibold border-l-4 border-[#0376C0]"
                : "hover:bg-white hover:text-[#0376C0]"
            }`
                }
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="text-sm">{label}</span>}
              </NavLink>

              {/* Custom tooltip */}
              {collapsed && (
                <div
                  className="absolute left-12 top-1/2 -translate-y-1/2
                       whitespace-nowrap bg-[#0376C0] text-white text-xs rounded px-2 py-1
                       opacity-0 group-hover:opacity-100 pointer-events-none
                       transition-opacity duration-300
                       z-50
                       shadow-lg"
                >
                  {label}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full
                         w-2 h-2 bg-[#0376C0] rotate-45
                         shadow-lg"
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
