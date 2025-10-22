"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { CheckCircle, XCircle } from "lucide-react";

interface RequestType {
  rq_type_id: string;
  rq_title: string;
  disbursement_type_id: number | null;
}
export interface UploadStatusSummary {
  program_source: string;
  process_id: number;
  sy_code: number;
  semester_code: number;
  disbursement_type_id: number;
  is_fully_completed: boolean;
  total_branches: number;
  completed_branches: number;
  last_completed_at: string | null;
  last_updated_at: string | null;
}

interface RequestTypeValidatedDropDownProps {
  formData: string;
  handleInputChange: (
    value: string,
    id: string,
    disbursement_type_id: number
  ) => void;
  sy_code: number;
  semester_code: number;
}

const RequestTypeValidatedDropDown: React.FC<
  RequestTypeValidatedDropDownProps
> = ({ formData, handleInputChange, sy_code, semester_code }) => {
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [completedDisbursementTypes, setCompletedDisbursementTypes] = useState<
    number[]
  >([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  /** ✅ Fetch request types */
  useEffect(() => {
    const fetchRequestTypes = async () => {
      try {
        const res = await axios.get(
          `${VITE_BACKEND_URL}api/maintenance/wf_request`
        );
        setRequestTypes(res.data.data);
      } catch (err) {
        console.error("Error fetching request types:", err);
      }
    };
    fetchRequestTypes();
  }, []);

  /** ✅ Fetch completed upload summary */
  useEffect(() => {
    const fetchCompletedUploads = async () => {
      try {
        const completedTypes: number[] = [];

        for (const reqType of requestTypes) {
          if (!reqType.disbursement_type_id) continue;

          try {
            const res = await axios.get(
              `${VITE_BACKEND_URL}api/status/summary`,
              {
                params: {
                  sy_code,
                  semester_code,
                  disbursement_type_id: reqType.disbursement_type_id,
                },
              }
            );

            const data: UploadStatusSummary[] = res.data;
            if (data.some((item) => item.is_fully_completed)) {
              completedTypes.push(reqType.disbursement_type_id);
            }
          } catch {
            // Ignore 404s
          }
        }

        setCompletedDisbursementTypes(completedTypes);
      } catch (err) {
        console.error("Error fetching upload summaries:", err);
      }
    };

    if (sy_code && semester_code && requestTypes.length > 0) {
      fetchCompletedUploads();
    }
  }, [sy_code, semester_code, requestTypes]);

  /** ✅ Define fixed display order */
  /** ✅ Define fixed display order */
  const displayOrder = [
    "Tuition Fee",
    "Semestral Allowance",
    "Thesis Fee",
    "Internship Allowance",
    "Academic Excellence Award", // ✅ last
  ];

  /** ✅ Sort request types based on fixed order */
  const orderedRequestTypes = [...requestTypes].sort((a, b) => {
    const indexA =
      displayOrder.findIndex((label) =>
        a.rq_title.toLowerCase().includes(label.toLowerCase())
      ) ?? 999;
    const indexB =
      displayOrder.findIndex((label) =>
        b.rq_title.toLowerCase().includes(label.toLowerCase())
      ) ?? 999;
    return indexA - indexB;
  });

  /** ✅ Handle outside click */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedRequestType = requestTypes.find(
    (type) => type.rq_title === formData
  );

  return (
    <div ref={dropdownRef} className="relative w-full">
      <label className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
        Validated Request Type
      </label>

      <div
        className="w-full rounded-md px-3 sm:px-4 py-2 pr-8 sm:pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                  appearance-none text-xs sm:text-sm relative bg-white"
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
        <div className="absolute w-full border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white z-50 mt-1 shadow-lg">
          {orderedRequestTypes.length === 0 ? (
            <div className="p-2 text-gray-400 text-sm text-center">
              No request types available
            </div>
          ) : (
            orderedRequestTypes.map((type) => {
              const isCompleted = completedDisbursementTypes.includes(
                type.disbursement_type_id ?? -1
              );

              return (
                <div
                  key={type.rq_type_id}
                  className={`flex justify-between items-center p-2 text-sm rounded-md ${
                    isCompleted
                      ? "hover:bg-gray-100 cursor-pointer text-gray-700"
                      : "opacity-60 cursor-not-allowed text-gray-400"
                  }`}
                  onClick={() => {
                    if (!isCompleted) return;
                    handleInputChange(
                      type.rq_title,
                      type.rq_type_id,
                      type.disbursement_type_id ?? 0
                    );
                    setOpen(false);
                  }}
                >
                  <span>{type.rq_title}</span>
                  {isCompleted ? (
                    <CheckCircle className="text-green-500 w-4 h-4" />
                  ) : (
                    <XCircle className="text-red-400 w-4 h-4" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default RequestTypeValidatedDropDown;
