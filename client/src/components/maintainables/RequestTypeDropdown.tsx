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
  handleInputChange: (value: string, id: string) => void;
}

const RequestTypeDropdown: React.FC<RequestTypeDropdownProps> = ({
  formData,
  handleInputChange,
}) => {
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${VITE_BACKEND_URL}api/maintenance/wf_request`
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
      <label className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
        Request Type
      </label>

      <div
        className="w-full rounded-md px-3 sm:px-4 py-2 pr-8 sm:pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                  appearance-none text-xs sm:text-sm relative"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs sm:text-sm">
          {selectedRequestType?.rq_title || "Select Request Type"}
        </span>
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm">
          &#9662;
        </span>
      </div>

      {open && (
        <div className="absolute w-full border border-gray-300 rounded-md max-h-40 overflow-y-auto bg-white z-100 mt-1 shadow-lg">
          {requestTypes.map((type) => (
            <div
              key={type.rq_type_id}
              className="p-2 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                handleInputChange(type.rq_title, type.rq_type_id);
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
