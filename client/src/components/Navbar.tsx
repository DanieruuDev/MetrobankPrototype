import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";

const Navbar = () => {
  const auth = useContext(AuthContext);

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  return (
    <nav className="bg-white py-2 flex justify-between relative border-b-3 border-solid border-blue-600">
      <button className="text-gray-600 cursor-pointer ">
        <ArrowLeft size={25} />
      </button>
      <div className="flex items-center gap-x-5 m-5">
        <div className="flex items-center text-xl ml-4 gap-x-5 text-gray-500">
          <div className="text-sm font-semibold">Metrobank, Admin 1</div>
          <div className="relative">
            <button className="group cursor-pointer">
              <ChevronDown size={25} />
              <div className="absolute z-10 hidden text-sm bg-white rounded-lg shadow w-32 group-focus:block top-full right-0">
                <ul className="py-4 text-gray-500">
                  <li>
                    <a href="#" className="block py-1 sm:py-2 md:py-3">
                      Profile
                    </a>
                  </li>
                  <li>
                    <a href="#" className="block py-1 sm:py-2 md:py-3">
                      Settings
                    </a>
                  </li>
                  <li>
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
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
