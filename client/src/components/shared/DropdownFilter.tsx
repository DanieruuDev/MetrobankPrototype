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
    <div className="gap-4 text-sm text-gray-500 text-center bg-gray-200 rounded-lg">
      <div className="py-1 px-2">
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
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none focus:border-none"
        >
          <option value="">{`All ${label ?? name}`}</option>
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
