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
    <div ref={dropdownRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        SY-Semester
      </label>

      {/* Dropdown trigger */}
      <div
        className="p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <span>
          {selectedOption?.label || (value ? value : "Select SY-Semester")}
        </span>

        <span className="ml-2">&#9662;</span>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute w-full border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white z-100 mt-1 shadow-lg">
          {options.map((opt) => (
            <div
              key={opt.value}
              className="p-2 hover:bg-gray-200 cursor-pointer"
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
