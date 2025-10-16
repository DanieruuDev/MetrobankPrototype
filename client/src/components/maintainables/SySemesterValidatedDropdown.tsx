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

interface SySemProcess {
  process_id: number;
  school_year: string;
  semester: string;
  renewal_status: string;
}

const SySemesterValidatedDropdown: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get<SySemProcess[]>(
          `${VITE_BACKEND_URL}api/maintenance/sysem-process`
        );

        // 🧩 Transform data to dropdown options
        const formatted: Option[] = res.data.map((item) => ({
          label: `${item.school_year} ${item.semester}`, // e.g. "2025-2026 1st Semester"
          value: `${item.school_year}_${item.semester}`, // unique combo
        }));

        // ✅ Sort newest first (by school year then semester)
        const sorted = [...formatted].sort((a, b) =>
          b.value.localeCompare(a.value)
        );

        setOptions(sorted);
      } catch (error) {
        console.error("❌ Error fetching validated SY-Semester:", error);
      }
    };

    fetchData();
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Dropdown trigger */}
      <div
        className="cursor-pointer flex justify-between items-center text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selectedOption?.label || "Select Validated SY-Semester"}
        </span>
        <svg
          className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg z-[9999]">
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No validated SY-Semester found
            </div>
          )}
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

export default SySemesterValidatedDropdown;
