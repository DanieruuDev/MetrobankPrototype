import React, { useState, useEffect } from "react";

export type Option = {
  label: string;
  value: string;
};

const options: Option[] = [
  { label: "2024-2025 1st Semester", value: "2024-2025_1st" },
  { label: "2024-2025 2nd Semester", value: "2024-2025_2nd" },
];

type Props = {
  onChange?: (value: string) => void;
};

function SYSemesterDropdown({ onChange }: Props) {
  const sortedOptions = React.useMemo(() => {
    return [...options].sort((a, b) => b.value.localeCompare(a.value));
  }, []);

  const [selected, setSelected] = useState(sortedOptions[0].value);

  // Only call onChange once on mount
  useEffect(() => {
    if (onChange) onChange(sortedOptions[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected(value);
    if (onChange) onChange(value);
  };

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={handleChange}
        className="appearance-none bg-gray-100 border border-gray-300 rounded-md px-4 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-8"
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
