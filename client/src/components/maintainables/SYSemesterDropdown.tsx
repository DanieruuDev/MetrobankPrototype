import React from "react";

export type Option = {
  label: string;
  value: string;
};

const options: Option[] = [
  { label: "2024-2025 1st Semester", value: "2024-2025_1st" },
  { label: "2024-2025 2nd Semester", value: "2024-2025_2nd" },
];

type Props = {
  value?: string;
  onChange: (value: string) => void;
};

function SYSemesterDropdown({ value, onChange }: Props) {
  const sortedOptions = React.useMemo(() => {
    return [...options].sort((a, b) => b.value.localeCompare(a.value));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative max-w-[250px]">
      <select
        value={value}
        onChange={handleChange}
        className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pr-10 text-sm font-medium text-gray-700  transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        {sortedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg
          className="h-4 w-4 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}

export default SYSemesterDropdown;
