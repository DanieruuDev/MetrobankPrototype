import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) throw new Error("AuthContext must be used within an AuthProvider");

  const handleLogout = () => {
    auth.logout(); // Clears auth state and localStorage
    navigate("/login"); // Redirect to login page
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;
