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
      <label className="block text-xs font-medium text-gray-700 mb-1.5 ml-1">
        Branch
      </label>
      <div
        className={`w-full px-3 py-2.5 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-sm hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200 relative z-[60] flex justify-between items-center ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className="truncate flex-1 mr-2 text-sm text-gray-700">
          {isLoading
            ? "Loading..."
            : selectedBranch?.campus_name || formData || "Select Branch"}
        </span>
        {!disabled && (
          <svg
            className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        )}
      </div>

      {open && !disabled && !isLoading && (
        <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
          <div
            className="px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-gray-50 text-gray-700"
            onClick={() => {
              handleInputChange(null);
              setOpen(false);
            }}
          >
            Select Branch
          </div>
          <div
            className="px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-gray-50 text-gray-700"
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
              className="px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-gray-50 text-gray-700"
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
