import React from "react";

interface DropdownFilterProps {
  label?: string;
  name: string;
  value: string;
  options: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const DropdownFilter = ({
  label,
  name,
  value,
  options,
  onChange,
}: DropdownFilterProps) => {
  return (
    <div className="relative">
      <div className="py-1 px-2 text-sm text-gray-500 text-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150">
        {label && (
          <label htmlFor={name} className="sr-only">
            {label}
          </label>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none hover:cursor-pointer appearance-none pr-6 py-1 text-sm"
        >
          <option value="" className="px-2 py-1">
            {`All ${label ?? name}`}
          </option>
          {options.map((opt, index) => (
            <option key={index} value={opt} className="px-2 py-1">
              {opt}
            </option>
          ))}
        </select>
        {/* Dropdown icon */}
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DropdownFilter;
