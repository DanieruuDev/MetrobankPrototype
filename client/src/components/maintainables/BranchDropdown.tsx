import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

interface Branch {
  campus_id: number;
  campus_name: string;
}

interface BranchDropdownProps {
  formData: string; // Stores branch name (campus_name)
  handleInputChange: (value: string) => void; // Accepts branch name
  disabled?: boolean; // Added disabled prop
}

const BranchDropdown: React.FC<BranchDropdownProps> = ({
  formData,
  handleInputChange,
  disabled,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(
          `${VITE_BACKEND_URL}api/maintenance/branch`
        );
        setBranches(response.data.data);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Branch
      </label>
      <div
        className={`p-2 border border-gray-300 rounded-md flex justify-between items-center ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span>{selectedBranch?.campus_name || "Select Branch"}</span>
        {!disabled && <span className="ml-2">&#9662;</span>}
      </div>
      {open && !disabled && (
        <div className="absolute w-full border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white z-50 mt-1 shadow-lg">
          {branches.map((branch) => (
            <div
              key={branch.campus_id}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                handleInputChange(branch.campus_name);
                setOpen(false);
              }}
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
