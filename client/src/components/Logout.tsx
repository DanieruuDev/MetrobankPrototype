import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const useLogout = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token"); // remove token from storage
    toast.success("Logged out successfully");
    navigate("/login"); // redirect to login page
  };

  return logout;
};

export default useLogout;
