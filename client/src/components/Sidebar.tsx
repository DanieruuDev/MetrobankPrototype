import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="max-w-[300px] fixed left-0 w-full top-0 bottom-0 bg-white border-r-1 px-[40px] pt-[20px]">
      <div className="text-blue-500 flex items-center justify-center cursor-pointer">
        <img
          src="/MetrobankLogo.png"
          alt="Metrobank Logo"
          width={40}
          height={40}
        />
        <span className="font-extrabold text-[#024FA8] pt-1">
          Metrobank <br />
          S.T.R.O.N.G.
        </span>
      </div>
      <ul className="mt-5">
        <li className="text-[#024FA8] hover:bg-gray-300 p-2 rounded-sm border-b-1">
          <Link to={"/workflow-approval"}>Approvals</Link>
        </li>
        <li></li>
        <li></li>
      </ul>
    </div>
  );
}

export default Sidebar;
