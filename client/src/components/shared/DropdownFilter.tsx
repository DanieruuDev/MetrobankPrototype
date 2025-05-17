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
    // Removed bg-gray-200 and rounded-lg classes
    <div className="text-sm text-gray-500">
      {" "}
      {/* Kept text styles and removed gap-4 */}
      <div className="py-1 px-2">
        {" "}
        {/* Kept padding */}
        {label && (
          // sr-only hides the label visually but keeps it for screen readers
          <label htmlFor={name} className="sr-only">
            {label}
          </label>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          // Added back some basic border/styling to the select itself
          // You might need to adjust these classes based on your design system
          className="w-full bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          {/* The "All" option */}
          <option value="">{`All ${label ?? name}`}</option>
          {/* Other options */}
          {options.map((opt, index) => (
            <option key={index} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DropdownFilter;
