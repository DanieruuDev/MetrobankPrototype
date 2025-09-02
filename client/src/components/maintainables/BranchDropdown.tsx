import React, { useEffect, useState } from "react";
import axios from "axios";

interface Branch {
  campus_id: number;
  campus_name: string;
}

interface BranchDropdownProps {
  formData: number | "";
  handleInputChange: (value: number) => void; // Accept branch ID directly
}

const BranchDropdown: React.FC<BranchDropdownProps> = ({
  formData,
  handleInputChange,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/maintenance/branch"
        );
        setBranches(response.data.data);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
      }
    };

    fetchBranches();
  }, []);

  const selectedBranch = branches.find(
    (branch) => branch.campus_id === formData
  );

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Branch
      </label>

      <div
        className="p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <span>{selectedBranch?.campus_name || "Select Branch"}</span>
        <span className="ml-2">&#9662;</span>
      </div>

      {open && (
        <div className="absolute w-full border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white z-10 mt-1 shadow-lg">
          {branches.map((branch) => (
            <div
              key={branch.campus_id}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                handleInputChange(branch.campus_id);
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
