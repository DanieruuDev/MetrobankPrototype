import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

interface RequestType {
  rq_type_id: string;
  rq_title: string;
}

interface RequestTypeDropdownProps {
  value: string[]; // selected request type IDs
  onChange: (selected: string[]) => void;
}

const RequestTypeDropdown: React.FC<RequestTypeDropdownProps> = ({
  value,
  onChange,
}) => {
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/maintenance/wf_request"
        );
        setRequestTypes(res.data.data);
      } catch (err) {
        console.error("Error fetching request types", err);
      }
    };
    fetchData();
  }, []);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Toggle selection
  const toggleSelect = (id: string) => {
    const newSelected = value.includes(id)
      ? value.filter((s) => s !== id)
      : [...value, id];
    onChange(newSelected);
  };

  // ✅ Select All
  const toggleSelectAll = () => {
    if (value.length === requestTypes.length) {
      onChange([]);
    } else {
      onChange(requestTypes.map((r) => r.rq_type_id));
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Request Types
      </label>

      {/* Dropdown Trigger */}
      <div
        className="p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <span>
          {value.length > 0
            ? `${value.length} selected`
            : "Select Request Types"}
        </span>
        <span className="ml-2">&#9662;</span>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute w-full border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white z-50 mt-1 shadow-lg p-2 space-y-1">
          {/* Select All */}
          <label className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
            <input
              type="checkbox"
              checked={value.length === requestTypes.length}
              onChange={toggleSelectAll}
            />
            <span className="font-semibold">Select All</span>
            <span className="ml-auto text-xs text-gray-500">
              {value.length}/{requestTypes.length}
            </span>
          </label>

          <hr className="my-1" />

          {/* List */}
          {requestTypes.map((type) => (
            <label
              key={type.rq_type_id}
              className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded"
            >
              <input
                type="checkbox"
                checked={value.includes(type.rq_type_id)}
                onChange={() => toggleSelect(type.rq_type_id)}
              />
              <span>{type.rq_title}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestTypeDropdown;
