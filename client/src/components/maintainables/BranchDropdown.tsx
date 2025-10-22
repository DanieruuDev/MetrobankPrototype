import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

interface Branch {
  campus_id: number;
  campus_name: string;
}

interface BranchDropdownProps {
  formData: string | null; // <-- allow null
  handleInputChange: (value: string | null) => void; // <-- allow null
  disabled?: boolean;
}

const BranchDropdown: React.FC<BranchDropdownProps> = ({
  formData,
  handleInputChange,
  disabled,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const dropdownRef = useRef<HTMLDivElement>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${VITE_BACKEND_URL}api/maintenance/branch`
        );
        setBranches(response.data.data);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedBranch = branches.find(
    (branch) => branch.campus_name === formData
  );

  return (
    <div ref={dropdownRef} className="relative w-full">
      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
        Branch
      </label>
      <div
        className={`p-2 border border-gray-300 rounded-md flex justify-between items-center ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="truncate flex-1 mr-2">
          {isLoading
            ? "Loading..."
            : selectedBranch?.campus_name || formData || "Select Branch"}{" "}
          {/* Default text if null */}
        </span>
        {!disabled && <span className="flex-shrink-0">&#9662;</span>}
      </div>

      {open && !disabled && !isLoading && (
        <div className="absolute w-full border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white z-50 mt-1 shadow-lg">
          <div
            className="p-2 hover:bg-gray-200 cursor-pointer truncate"
            onClick={() => {
              handleInputChange(null); // <-- set null when “Select Branch”
              setOpen(false);
            }}
          >
            Select Branch
          </div>
          <div
            className="p-2 hover:bg-gray-200 cursor-pointer truncate"
            onClick={() => {
              handleInputChange("all");
              setOpen(false);
            }}
          >
            All Branches
          </div>
          {branches.map((branch) => (
            <div
              key={branch.campus_id}
              className="p-2 hover:bg-gray-200 cursor-pointer truncate"
              onClick={() => {
                handleInputChange(branch.campus_name);
                setOpen(false);
              }}
              title={branch.campus_name}
            >
              {branch.campus_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchDropdown;
