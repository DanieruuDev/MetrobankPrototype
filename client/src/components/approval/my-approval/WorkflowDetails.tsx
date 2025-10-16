import { Calendar } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import type { WorkflowFormData } from "../../../Interface/IWorkflow";
import RequestTypeDropdown from "../../maintainables/RequestTypeDropdown";
import SySemesterValidatedDropdown from "../../maintainables/SySemesterValidatedDropdown";

interface WorkflowDetailsProps {
  formData: WorkflowFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>;
}

function WorkflowDetails({ formData, setFormData }: WorkflowDetailsProps) {
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [validatedSY, setValidatedSY] = useState("");
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (
          fileExtension === "pdf" ||
          fileExtension === "docx" ||
          fileExtension === "doc" ||
          fileExtension === "xlsx" ||
          fileExtension === "xls"
        ) {
          setFormData((prev) => ({
            ...prev,
            file: file,
          }));

          setError(null);
        } else {
          setFormData((prev) => ({
            ...prev,
            file: null,
          }));
          setError("Only PDF, Word, Excel files are allowed.");
          toast.error("Only PDF, Word, Excel files are allowed.");
        }
      }
    },
    multiple: false,
  });

  const handleRequestTypeChange = (value: string, id: string) => {
    setFormData((prev) => ({
      ...prev,
      approval_req_type: value,
      rq_type_id: id,
    }));
  };

  console.log(formData.semester_code, formData.sy_code);

  return (
    <div>
      <form className="space-y-3 sm:space-y-4">
        <div>
          <label
            htmlFor="rq_title"
            className="block mb-1 text-xs sm:text-sm font-medium text-gray-700"
          >
            Approval Request Title
          </label>
          <input
            type="text"
            name="rq_title"
            id="rq_title"
            maxLength={100}
            placeholder="Enter request title..."
            required
            className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 text-xs sm:text-[15px]"
            value={formData.rq_title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rq_title: e.target.value,
              }))
            }
          />
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-1 gap-2 sm:gap-3">
          <RequestTypeDropdown
            formData={formData.approval_req_type}
            handleInputChange={handleRequestTypeChange}
          />

          <div
            className="relative flex-1"
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
              name="due_date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, due_date: e.target.value }))
              }
              className="w-full rounded-md px-3 sm:px-4 py-2 pr-8 sm:pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                  appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-datetime-edit]:text-gray-700 text-xs sm:text-sm"
              required
            />
            <Calendar
              className="absolute right-2 sm:right-3 top-9 sm:top-11 transform -translate-y-1/2 text-gray-700 pointer-events-none w-4 h-4 sm:w-5 sm:h-5"
              size={20}
            />
          </div>
        </div>
        {/* <div className="grid grid-cols-2 xs:grid-cols-1 gap-2 sm:gap-3">
          <div className="flex gap-2 sm:gap-3">
            {sySelectFields.map(({ name, label, options }) => (
              <div key={name} className="relative flex-1">
                <label
                  htmlFor={name}
                  className="block mb-1 text-xs sm:text-sm font-medium text-gray-700"
                >
                  {label}
                </label>
                <select
                  name={name}
                  value={formData[name] as string}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [name]: e.target.value,
                    }))
                  }
                  className="w-full rounded-md px-3 sm:px-4 py-2 pr-8 sm:pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden text-xs sm:text-sm"
                  required
                >
                  <option value="" disabled>
                    Select {label}
                  </option>
                  {Object.entries(options).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2 sm:right-3 top-5 sm:top-6 flex items-center pointer-events-none text-gray-700 text-xs sm:text-sm">
                  ⏷
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 sm:gap-3">
            {semSelectFields.map(({ name, label, options }) => (
              <div key={name} className="relative flex-1">
                <label
                  htmlFor={name}
                  className="block mb-1 text-xs sm:text-sm font-medium text-gray-700"
                >
                  {label}
                </label>
                <select
                  name={name}
                  value={formData[name] as string}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [name]: e.target.value,
                    }))
                  }
                  className="w-full rounded-md px-3 sm:px-4 py-2 pr-8 sm:pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden text-xs sm:text-sm"
                  required
                >
                  <option value="" disabled>
                    Select {label}
                  </option>
                  {Object.entries(options).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-2 sm:right-3 top-5 sm:top-6 flex items-center pointer-events-none text-gray-700 text-xs sm:text-sm">
                  ⏷
                </div>
              </div>
            ))}
          </div>
        </div> */}
        <SySemesterValidatedDropdown
          value={validatedSY}
          onChange={(selectedValue) => {
            setValidatedSY(selectedValue);

            // 🧩 Parse the combined value back to school_year and semester
            const [school_year, semester_label] = selectedValue.split("_");

            // Convert semester label to a code
            const semester_code = semester_label.toLowerCase().includes("1st")
              ? "1"
              : "2";

            // Convert school year (e.g., "2025-2026") into code (remove dash)
            const sy_code = school_year.replace("-", "");

            // ✅ Update formData
            setFormData((prev) => ({
              ...prev,
              sy_code,
              semester_code,
            }));
          }}
        />
        ;
        <div
          {...getRootProps()}
          className={`w-full px-4 sm:px-6 py-6 sm:py-10 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center bg-gray-50 hover:bg-gray-100 cursor-pointer`}
        >
          <input {...getInputProps()} />
          {formData.file ? (
            "doc_id" in formData.file ? ( // ✅ existing DB file
              <p className="text-xs sm:text-sm text-center text-gray-700">
                Existing File:{" "}
                <a
                  href={formData.file.doc_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {formData.file.doc_name}
                </a>
              </p>
            ) : (
              // ✅ new uploaded file
              <p className="text-xs sm:text-sm text-center text-gray-700">
                File: {formData.file.name}
              </p>
            )
          ) : (
            <p className="text-xs sm:text-sm text-center text-gray-500">
              Drag & Drop your file here, or click to select
            </p>
          )}
        </div>
        <div className="text-red text-xs sm:text-sm">{error}</div>
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
            name="description"
            id="description"
            placeholder="Enter additional details for the approval request..."
            className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 text-xs sm:text-[15px] resize-none"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            required
          ></textarea>
        </div>
      </form>
    </div>
  );
}

export default WorkflowDetails;
