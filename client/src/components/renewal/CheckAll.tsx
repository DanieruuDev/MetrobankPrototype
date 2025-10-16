import {
  CheckCheck,
  Clock3,
  ChevronDown,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface CheckAllDropdownProps {
  label: string;
  handleCheck: (type: string) => void;
  isEditMode?: boolean;
}

function CheckAllDropdown({
  label,
  handleCheck,
  isEditMode,
}: CheckAllDropdownProps) {
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
    <div className="relative z-50" ref={dropdownRef}>
      {/* Trigger */}
      <div
        className={`flex items-center justify-center gap-2 ${
          isEditMode ? "cursor-pointer" : "cursor-not-allowed opacity-50"
        }`}
        onClick={() => {
          if (isEditMode) {
            setIsOpen((prev) => !prev);
          }
        }}
        title={
          isEditMode
            ? "Click to show options"
            : "Enable edit mode to use this feature"
        }
      >
        <span>{label.toUpperCase()}</span>
        {isEditMode && <ChevronDown width={19} height={19} />}
      </div>

      {/* Dropdown */}
      {isOpen && isEditMode && (
        <div className="absolute top-[25px] bg-white rounded-sm shadow-lg border border-gray-200 z-50 min-w-[180px]">
          <button
            onClick={() => {
              handleCheck("Check All");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
          >
            <CheckCheck size={18} />
            <span>Check All</span>
          </button>
          <button
            onClick={() => {
              handleCheck("Check Remaining");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
          >
            <Clock3 size={18} />
            <span>Check Remaining</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => {
              handleCheck("Uncheck All");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer text-red-600"
          >
            <XCircle size={18} />
            <span>Uncheck All</span>
          </button>
          <button
            onClick={() => {
              handleCheck("Uncheck Remaining");
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer text-orange-600"
          >
            <MinusCircle size={18} />
            <span>Uncheck Remaining</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default CheckAllDropdown;
