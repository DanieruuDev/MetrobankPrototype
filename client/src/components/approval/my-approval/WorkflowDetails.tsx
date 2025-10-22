import { Calendar, Users } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import type {
  EligibleScholar,
  WorkflowFormData,
} from "../../../Interface/IWorkflow";
import SySemesterValidatedDropdown from "../../maintainables/SySemesterValidatedDropdown";
import RequestTypeValidatedDropDown from "../../maintainables/RequestTypeValidatedDropDown";
import EligibleListModal from "../EligibleListModal";

interface WorkflowDetailsProps {
  formData: WorkflowFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>;
}

function WorkflowDetails({ formData, setFormData }: WorkflowDetailsProps) {
  const [validatedSY, setValidatedSY] = useState("");
  const [disbTypeId, setDisbTypeId] = useState(0);
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  const [eligibleList, setEligibleList] = useState<EligibleScholar[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  /** ✅ Fetch Eligible List */
  const fetchEligibleList = async (
    semester_code: string,
    sy_code: string,
    disbursement_type_id: number
  ) => {
    if (!semester_code || !sy_code || !disbursement_type_id) return;

    try {
      const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const semester = semester_code === "1" ? "1st Semester" : "2nd Semester";
      const school_year = sy_code.replace(/(\d{4})(\d{4})/, "$1-$2");

      const response = await axios.get(
        `${VITE_BACKEND_URL}api/workflow/list/eligible`,
        {
          params: { semester, school_year, disbursement_type_id },
        }
      );

      if (response.data.success) {
        setEligibleCount(response.data.count);
        setEligibleList(response.data.data);
      } else {
        setEligibleCount(0);
        setEligibleList([]);
      }
    } catch (error) {
      console.error("❌ Error fetching eligible scholars:", error);
      setEligibleCount(0);
      setEligibleList([]);
    }
  };

  const handleRequestTypeChange = (
    value: string,
    id: string,
    disbursement_type_id: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      approval_req_type: value,
      rq_type_id: id,
    }));
    setDisbTypeId(disbursement_type_id);
  };

  useEffect(() => {
    fetchEligibleList(formData.semester_code, formData.sy_code, disbTypeId);
  }, [formData.semester_code, formData.sy_code, disbTypeId]);

  /** 🔽 Main Render */
  return (
    <div>
      <form className="space-y-3 sm:space-y-4">
        {/* --- Request Title --- */}
        <div>
          <label
            htmlFor="rq_title"
            className="block mb-1 text-xs sm:text-sm font-medium text-gray-700"
          >
            Approval Request Title
          </label>
          <input
            type="text"
            id="rq_title"
            maxLength={100}
            placeholder="Enter request title..."
            required
            className="w-full rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 p-2 text-xs sm:text-[15px]"
            value={formData.rq_title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rq_title: e.target.value }))
            }
          />
        </div>

        {/* --- SY & Semester --- */}
        <SySemesterValidatedDropdown
          value={validatedSY}
          onChange={(selectedValue) => {
            setValidatedSY(selectedValue);
            const [school_year, semester_label] = selectedValue.split("_");
            const semester_code = semester_label.toLowerCase().includes("1st")
              ? "1"
              : "2";
            const sy_code = school_year.replace("-", "");
            setFormData((prev) => ({ ...prev, sy_code, semester_code }));
          }}
        />

        {/* --- Request Type + Due Date --- */}
        <div className="grid grid-cols-2 gap-3">
          <RequestTypeValidatedDropDown
            formData={formData.approval_req_type}
            handleInputChange={handleRequestTypeChange}
            sy_code={Number(formData.sy_code)}
            semester_code={Number(formData.semester_code)}
          />

          <div
            className="relative"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <label
              htmlFor="due_date"
              className="block mb-1 text-xs sm:text-sm font-medium text-gray-700"
            >
              Due Date
            </label>
            <input
              ref={dateInputRef}
              type="date"
              id="due_date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, due_date: e.target.value }))
              }
              className="w-full rounded-md px-3 py-2 text-gray-700 border border-gray-300 focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm"
              required
            />
            <Calendar className="absolute right-3 top-9 text-gray-700 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        {/* --- Eligible Scholars Count --- */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">
              Eligible Scholars:{" "}
              <b className="text-blue-900">{eligibleCount}</b>
            </span>
          </div>
          {eligibleCount > 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-all"
            >
              View List
            </button>
          )}
        </div>

        {/* --- Description --- */}
        <div>
          <label
            htmlFor="description"
            className="block mb-1 text-xs sm:text-sm font-medium text-gray-700"
          >
            Additional Details
          </label>
          <textarea
            maxLength={300}
            rows={2}
            id="description"
            placeholder="Enter additional details for the approval request..."
            className="w-full rounded-md border border-gray-300 focus:ring-1 focus:ring-blue-500 p-2 text-xs sm:text-[15px] resize-none"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </div>
      </form>

      {/* ✅ Use the separate modal here */}
      <EligibleListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eligibleList={eligibleList}
        schoolYear={formData.sy_code}
        semesterCode={formData.semester_code}
      />
    </div>
  );
}

export default WorkflowDetails;
