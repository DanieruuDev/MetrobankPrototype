import React, { useState } from "react";
import metrobank from "../assets/images/metrobank.svg";
import { RiArrowDropDownLine } from "react-icons/ri";
import { FileUser } from "lucide-react";
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarLeftExpandFilled,
} from "react-icons/tb";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  sidebarToggle: boolean;
  setSidebarToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({
  sidebarToggle,
  setSidebarToggle,
}) => {
  const [isFinancialSet, setIsFinancialSet] = useState(false);

  return (
    <aside className="z-20">
      <div
        className={`w-64 bg-blue-800 fixed h-full shadow transition-all duration-300 ease-in-out ${
          sidebarToggle ? "-translate-x-44" : "translate-x-0"
        }`}
      >
        <div className="flex justify-between items-center my-7">
          <div
            className={`flex lg:grid-cols-2 overflow-hidden transition-all ${
              sidebarToggle ? "w-0" : "w-70"
            }`}
          >
            <img
              src={metrobank}
              className="inline-block w-11 h-10 ml-10"
              alt="Logo"
            />
            <h1 className="text-l font-bold text-white ml-2">
              Metrobank <br /> S.T.R.O.N.G
            </h1>
          </div>
          <button
            onClick={() => setSidebarToggle(!sidebarToggle)}
            className="rounded-lg text-white p-1.5 mr-5 hover:bg-white hover:text-blue-700"
          >
            {sidebarToggle ? (
              <TbLayoutSidebarLeftExpandFilled className="mr-1.5" size={28} />
            ) : (
              <TbLayoutSidebarLeftCollapseFilled size={28} />
            )}
          </button>
        </div>
        <hr className="border-none" />
        <ul className="mt-3  text-white p-5 font-semibold">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `mb-2 rounded hover:shadow relative  ml-0.5 hover:bg-white hover:text-blue-700 py-2 flex items-center group ${
                sidebarToggle ? "justify-end mb-7" : ""
              } ${isActive ? "bg-white text-blue-700" : ""}`
            }
          >
            <li className="flex items-center">
              <svg
                className={`inline-block w-8 h-8 transition-all mr-2 ${
                  sidebarToggle ? "m-0" : "m-3"
                }`}
                width="24"
                height="26"
                viewBox="0 0 24 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
              >
                <path
                  d="M15.2696 24.2289V14.7737C15.2696 14.4602 15.1444 14.1596 14.9213 13.938C14.6983 13.7163 14.3959 13.5918 14.0805 13.5918H9.32391C9.00853 13.5918 8.70607 13.7163 8.48306 13.938C8.26005 14.1596 8.13477 14.4602 8.13477 14.7737V24.2289"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M1 11.228C0.999917 10.8842 1.07531 10.5445 1.22093 10.2325C1.36654 9.92063 1.57887 9.64405 1.8431 9.42209L10.1671 2.33186C10.5964 1.97127 11.1403 1.77344 11.7023 1.77344C12.2643 1.77344 12.8082 1.97127 13.2375 2.33186L21.5615 9.42209C21.8257 9.64405 22.0381 9.92063 22.1837 10.2325C22.3293 10.5445 22.4047 10.8842 22.4046 11.228V21.8652C22.4046 22.4921 22.154 23.0933 21.708 23.5366C21.262 23.9799 20.6571 24.229 20.0263 24.229H3.37829C2.74753 24.229 2.1426 23.9799 1.69659 23.5366C1.25057 23.0933 1 22.4921 1 21.8652V11.228Z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              {!sidebarToggle && <span className="ml-1">Home</span>}
              {sidebarToggle && (
                <div
                  className={`
                  absolute left-full rounded-md px-2 py-1 ml-6
                  bg-indigo-100 text-indigo-800 text-sm
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
              `}
                >
                  Home
                </div>
              )}
            </li>
          </NavLink>

          <NavLink
            to="/renewal-scholarship"
            className={({ isActive }) =>
              `mb-2 rounded hover:shadow relative  ml-0.5 hover:bg-white hover:text-blue-700 py-2 flex items-center group ${
                sidebarToggle ? "justify-end mb-7" : ""
              } ${isActive ? "bg-white text-blue-700" : ""}`
            }
          >
            <li className="flex items-center ">
              <svg
                className={`inline-block w-8 h-8 transition-all mr-1.5 ${
                  sidebarToggle ? "m-0" : "m-3"
                }`}
                width="22"
                height="27"
                viewBox="0 0 22 27"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
              >
                <path
                  d="M12.9624 1.67969V6.4073C12.9624 7.03422 13.2144 7.63546 13.6631 8.07876C14.1117 8.52206 14.7202 8.7711 15.3546 8.7711H20.1391"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.1586 20.5887C14.1586 19.6483 13.7805 18.7464 13.1076 18.0815C12.4347 17.4165 11.522 17.043 10.5703 17.043C9.61858 17.043 8.70588 17.4165 8.03293 18.0815C7.35999 18.7464 6.98193 19.6483 6.98193 20.5887"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.1572 1.67969H3.39222C2.75777 1.67969 2.14929 1.92873 1.70067 2.37203C1.25204 2.81533 1 3.41657 1 4.04349V22.9539C1 23.5808 1.25204 24.1821 1.70067 24.6254C2.14929 25.0687 2.75777 25.3177 3.39222 25.3177H17.7456C18.38 25.3177 18.9885 25.0687 19.4371 24.6254C19.8857 24.1821 20.1378 23.5808 20.1378 22.9539V7.5892L14.1572 1.67969Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.569 17.044C11.8902 17.044 12.9612 15.9857 12.9612 14.6802C12.9612 13.3747 11.8902 12.3164 10.569 12.3164C9.24779 12.3164 8.17676 13.3747 8.17676 14.6802C8.17676 15.9857 9.24779 17.044 10.569 17.044Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {!sidebarToggle && (
                <span className="ml-1.5">
                  <a href="">
                    Scholarship <br />
                    Renewal
                  </a>
                </span>
              )}
              {sidebarToggle && (
                <div
                  className={`
        absolute left-full rounded-md px-2 py-1 ml-6
        bg-indigo-100 text-indigo-800 text-sm
        invisible opacity-20 -translate-x-3 transition-all
        group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
      `}
                >
                  Scholarship Renewal
                </div>
              )}
            </li>
          </NavLink>

          <li
            className={`mb-2 ml-1 rounded hover:shadow relative hover:bg-white hover:text-blue-700 py-2 flex items-center group ${
              sidebarToggle ? "justify-end mb-7" : ""
            }`}
          >
            <svg
              className={` inline-block w-9 h-8 transition-all mr-1.5 ${
                sidebarToggle ? "m-0" : "m-3"
              }`}
              width="22"
              height="27"
              viewBox="0 0 22 27"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
            >
              <path
                d="M12.9624 1.67969V6.4073C12.9624 7.03422 13.2144 7.63546 13.6631 8.07876C14.1117 8.52206 14.7202 8.7711 15.3546 8.7711H20.1391"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.1586 20.5887C14.1586 19.6483 13.7805 18.7464 13.1076 18.0815C12.4347 17.4165 11.522 17.043 10.5703 17.043C9.61858 17.043 8.70588 17.4165 8.03293 18.0815C7.35999 18.7464 6.98193 19.6483 6.98193 20.5887"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.1572 1.67969H3.39222C2.75777 1.67969 2.14929 1.92873 1.70067 2.37203C1.25204 2.81533 1 3.41657 1 4.04349V22.9539C1 23.5808 1.25204 24.1821 1.70067 24.6254C2.14929 25.0687 2.75777 25.3177 3.39222 25.3177H17.7456C18.38 25.3177 18.9885 25.0687 19.4371 24.6254C19.8857 24.1821 20.1378 23.5808 20.1378 22.9539V7.5892L14.1572 1.67969Z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.569 17.044C11.8902 17.044 12.9612 15.9857 12.9612 14.6802C12.9612 13.3747 11.8902 12.3164 10.569 12.3164C9.24779 12.3164 8.17676 13.3747 8.17676 14.6802C8.17676 15.9857 9.24779 17.044 10.569 17.044Z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {!sidebarToggle && (
              <>
                <span
                  className="ml-2"
                  onClick={() => setIsFinancialSet(!isFinancialSet)}
                >
                  Financial Administration
                </span>
                <button onClick={() => setIsFinancialSet(!isFinancialSet)}>
                  <RiArrowDropDownLine
                    size={30}
                    className={`transition-transform -rotate-90 ${
                      isFinancialSet ? "rotate-0" : ""
                    }`}
                  />
                </button>
              </>
            )}

            {sidebarToggle && (
              <div
                className={`
        absolute left-full rounded-md px-2 py-1 ml-6
        bg-indigo-100 text-indigo-800 text-sm
        invisible opacity-20 -translate-x-3 transition-all
        group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
      `}
              >
                Financial Administration
              </div>
            )}
          </li>

          {!sidebarToggle && isFinancialSet && (
            <ul className="ml-5 mt-2 p-2 font-semibold">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `py-3 mb-2 hover:bg-white hover:text-blue-700 rounded pl-2 flex gap-2 items-center group ${
                    isActive ? "bg-white text-blue-700" : ""
                  }`
                }
              >
                <li className="flex gap-2 items-center">
                  <FileUser size={32} />
                  Financial
                </li>
              </NavLink>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `py-3 mb-2 hover:bg-white hover:text-blue-700 rounded pl-2 flex gap-2 items-center group ${
                    isActive ? "bg-white text-blue-700" : ""
                  }`
                }
              >
                <li className=" flex gap-2  items-center">
                  <FileUser size={32} />
                  Approver
                </li>
              </NavLink>

              <NavLink
                to="/workflow-approval"
                className={({ isActive }) =>
                  `py-3 mb-2 hover:bg-white hover:text-blue-700 rounded pl-2 flex gap-2 items-center group ${
                    isActive ? "bg-white text-blue-700" : ""
                  }`
                }
              >
                <li className=" flex gap-2 items-center">
                  <FileUser size={32} />
                  Approvals
                </li>
              </NavLink>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `py-3 mb-2 hover:bg-white hover:text-blue-700 rounded pl-2 flex gap-2 items-center group ${
                    isActive ? "bg-white text-blue-700" : ""
                  }`
                }
              >
                <li className=" flex gap-2 items-center">
                  <FileUser size={32} />
                  Management
                </li>
              </NavLink>
            </ul>
          )}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `mb-2 rounded hover:shadow relative  ml-0.5 hover:bg-white hover:text-blue-700 py-2 flex items-center group ${
                sidebarToggle ? "justify-end mb-7" : ""
              } ${isActive ? "bg-white text-blue-700" : ""}`
            }
          >
            <li className="flex items-center">
              <svg
                className={`inline-block w-7 h-8 transition-all mr-1.5 ${
                  sidebarToggle ? "m-0" : "m-3"
                }`}
                width="28"
                height="30"
                viewBox="0 0 23 22"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path d="M0 12.1367H6.825V21.2367H0V12.1367ZM15.925 6.44922H22.75V21.2367H15.925V6.44922ZM7.9625 0.761719H14.7875V21.2367H7.9625V0.761719ZM2.275 14.4117V18.9617H4.55V14.4117H2.275ZM10.2375 3.03672V18.9617H12.5125V3.03672H10.2375ZM18.2 8.72422V18.9617H20.475V8.72422H18.2Z" />
              </svg>

              {!sidebarToggle && (
                <span className="ml-1.5">
                  <a href="">
                    Report & <br />
                    Analytics
                  </a>
                </span>
              )}
              {sidebarToggle && (
                <div
                  className={`
                  absolute left-full rounded-md px-2 py-1 ml-6
                  bg-indigo-100 text-indigo-800 text-sm
                  invisible opacity-20 -translate-x-3 transition-all
                  group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
              `}
                >
                  Report & Analytics
                </div>
              )}
            </li>
          </NavLink>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
