import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export type Option = {
  label: string;
  value: string;
};

type Props = {
  value?: string;
  onChange: (value: string) => void;
};

interface ValidSYSemester {
  id: number;
  label: string;
  sy_code: number;
  semester_code: number;
  school_year: string;
  semester: string;
}

const SYSemesterDropdown: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch from valid_sy_semester only
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get<ValidSYSemester[]>(
          "http://localhost:5000/api/maintenance/valid_sy_semester"
        );

        const formatted: Option[] = res.data.map((item) => ({
          label: item.label, // e.g. "2025-2026 1st Semester"
          value: `${item.school_year}_${item.semester_code}`, // unique combo
        }));

        setOptions(formatted);
      } catch (error) {
        console.error("Error fetching valid SY-Semester:", error);
      }
    };

    fetchData();
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // ✅ Close dropdown when clicking outside
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
  console.log(selectedOption);
  return (
    <div ref={dropdownRef} className="relative w-full max-w-xs">
      {/* Dropdown trigger */}
      <button
        type="button"
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm flex justify-between items-center shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate text-gray-800">
          {selectedOption?.label || (value ? value : "Select SY - Semester")}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 12z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto z-50">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options</div>
          ) : (
            options.map((opt) => (
              <button
                type="button"
                key={opt.value}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SYSemesterDropdown;
