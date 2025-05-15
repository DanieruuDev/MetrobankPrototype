import { Link } from "react-router-dom";

interface NavbarProps {
  pageName: string;
}
const Navbar = ({ pageName }: NavbarProps) => {
  return (
    <nav className="flex space-x-3 mx-4 py-3 border-b-[#024FA8] border-1 border-x-0 border-t-0 bg-white z-50">
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
