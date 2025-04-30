import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="max-w-[250px] fixed left-0 w-full top-0 bottom-0 bg-[#024FA8] border-r-1 px-[20px] pt-[20px] text-white">
      <div className="flex items-center justify-center cursor-pointer gap-2">
        <img
          src="/MetrobankLogo.png"
          alt="Metrobank Logo"
          width={40}
          height={40}
        />
        <span className="font-black pt-1 text-[16px]">
          Metrobank <br />
          S.T.R.O.N.G. Administration
        </span>
      </div>
      <ul className="mt-[40px] space-y-2">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block text-[16px] p-2 rounded-sm cursor-pointer transition ${
                isActive
                  ? "bg-white text-[#0376C0] font-bold"
                  : "text-[#FFFAFA] hover:bg-white hover:text-[#0376C0]"
              }`
            }
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/renewal-scholarship"
            className={({ isActive }) =>
              `block text-[16px] p-2 rounded-sm cursor-pointer transition ${
                isActive
                  ? "bg-white text-[#0376C0] font-bold"
                  : "text-[#FFFAFA] hover:bg-white hover:text-[#0376C0]"
              }`
            }
          >
            Scholarship Renewal
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/workflow-approval"
            className={({ isActive }) =>
              `block text-[16px] p-2 rounded-sm cursor-pointer transition ${
                isActive
                  ? "bg-white text-[#0376C0] font-bold"
                  : "text-[#FFFAFA] hover:bg-white hover:text-[#0376C0]"
              }`
            }
          >
            Approvals
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/schedule"
            className={({ isActive }) =>
              `block text-[16px] p-2 rounded-sm cursor-pointer transition ${
                isActive
                  ? "bg-white text-[#0376C0] font-bold"
                  : "text-[#FFFAFA] hover:bg-white hover:text-[#0376C0]"
              }`
            }
          >
            Schedule
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/financial"
            className={({ isActive }) =>
              `block text-[16px] p-2 rounded-sm cursor-pointer transition ${
                isActive
                  ? "bg-white text-[#0376C0] font-bold"
                  : "text-[#FFFAFA] hover:bg-white hover:text-[#0376C0]"
              }`
            }
          >
            Expense Monitoring
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
