"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

interface RequestType {
  rq_type_id: string;
  rq_title: string;
}

interface RequestTypeDropdownProps {
  formData: string;
  handleInputChange: (value: string) => void;
}

const RequestTypeDropdown: React.FC<RequestTypeDropdownProps> = ({
  formData,
  handleInputChange,
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

  const selectedRequestType = requestTypes.find(
    (type) => type.rq_title === formData
  );

  return (
    <div ref={dropdownRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Request Type
      </label>

      <div
        className="p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <span>{selectedRequestType?.rq_title || "Select Request Type"}</span>
        <span className="ml-2">&#9662;</span>
      </div>

      {open && (
        <div className="absolute w-full border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white z-100 mt-1 shadow-lg">
          {requestTypes.map((type) => (
            <div
              key={type.rq_type_id}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                handleInputChange(type.rq_title);
                setOpen(false);
              }}
            >
              {type.rq_title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestTypeDropdown;
