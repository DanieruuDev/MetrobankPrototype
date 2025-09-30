import { CheckCheck, Clock3, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface CheckAllDropdownProps {
  label: string;
  handleCheck: (type: string) => void;
}

function CheckAllDropdown({ label, handleCheck }: CheckAllDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <div
        className="flex items-center justify-center gap-2 cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{label.toUpperCase()}</span>
        <ChevronDown width={19} height={19} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-[25px] bg-white rounded-sm shadow-lg border border-gray-200 z-50">
          <button
            onClick={() => handleCheck("Check All")}
            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
          >
            <CheckCheck size={18} />
            <span>Check All</span>
          </button>
          <button
            onClick={() => handleCheck("Check Remaining")}
            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
          >
            <Clock3 size={18} />
            <span>Check Remaining</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default CheckAllDropdown;
