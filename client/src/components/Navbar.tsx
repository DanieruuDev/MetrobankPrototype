import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

interface NavbarProps {
  pageName: string;
}
const Navbar = ({ pageName }: NavbarProps) => {
  const auth = useContext(AuthContext);

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  return (
    <nav className="flex space-x-3 mx-4 py-3 border-b-[#024FA8] border-1 border-x-0 border-t-0">
      <div className="text-[#024FA8] text-[32px] font-medium">{pageName}</div>
      <div></div>
      <Link to="/">Home</Link>
      {/* {auth.token ? (
        <button onClick={auth.logout}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )} */}
    </nav>
  );
};

export default Navbar;
