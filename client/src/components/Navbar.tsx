import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Navbar = () => {
  const auth = useContext(AuthContext);

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  return (
    <nav className="flex space-x-3 p-2">
      <Link to="/">Home</Link>
      {auth.token ? (
        <button onClick={auth.logout}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
};

export default Navbar;
