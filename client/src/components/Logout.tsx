import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const useLogout = () => {
  const navigate = useNavigate();

  const logout = () => {
    toast.success("Logged out successfully");
    navigate("/"); // redirect to login page
  };

  return logout;
};

export default useLogout;
