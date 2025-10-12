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
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get<ValidSYSemester[]>(
          `${VITE_BACKEND_URL}api/maintenance/valid_sy_semester`
        );

        const formatted: Option[] = res.data.map((item) => ({
          label: item.label, // e.g. "2025-2026 1st Semester"
          value: `${item.school_year}_${item.semester_code}`, // unique combo
        }));

        // sort by school_year and semester_code to find latest
        const sorted = [...formatted].sort((a, b) =>
          b.value.localeCompare(a.value)
        );

        setOptions(formatted);

        // ✅ if no value passed in props, set default as latest
        if (!value && sorted.length > 0) {
          onChange(sorted[0].value);
        }
      } catch (error) {
        console.error("Error fetching valid SY-Semester:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, onChange]);

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

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Dropdown trigger */}
      <div
        className="cursor-pointer flex justify-between items-center text-sm text-gray-700"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selectedOption?.label || "Select SY-Semester"}
        </span>

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
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                opt.value === value
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SYSemesterDropdown;
