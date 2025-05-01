import { useNavigate } from "react-router-dom";

interface NavbarProps {
  pageName: string;
  sidebarToggle: boolean;
}

const Navbar = ({ pageName, sidebarToggle }: NavbarProps) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
    // OR use a specific path if needed:
    // navigate('/expense-monitoring');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-10 flex space-x-3 mx-4 py-3 border-b-[#024FA8] border-2 border-x-0 border-t-0 bg-white ${
        sidebarToggle ? "ml-[120px]" : "ml-[280px]"
      } transition-all duration-300 ease-in-out`}
    >
      {pageName === "Expense View" && (
        <button
          onClick={handleBackClick}
          className="flex items-center text-[#024FA8] cursor-pointer hover:text-[#023b7d]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      )}
      <div className="text-[#024FA8] text-[32px] font-medium">{pageName}</div>
    </nav>
  );
};

export default Navbar;
