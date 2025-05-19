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
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        className="appearance-none bg-gray-100 border-none border-gray-300 rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-8"
      >
        {sortedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}

export default SYSemesterDropdown;
