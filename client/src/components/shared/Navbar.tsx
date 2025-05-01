interface NavbarProps {
  pageName: string;
  sidebarToggle: boolean;
}

const Navbar = ({ pageName, sidebarToggle }: NavbarProps) => {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-10 flex space-x-3 mx-4 py-3 border-b-[#024FA8] border-2 border-x-0 border-t-0 bg-white ${
        sidebarToggle ? "ml-[120px]" : "ml-[280px]"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="text-[#024FA8] text-[32px] font-medium">{pageName}</div>
    </nav>
  );
};

export default Navbar;
