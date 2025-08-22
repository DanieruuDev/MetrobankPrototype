import { Calendar } from "lucide-react";
import React, { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { WorkflowFormData } from "../../Interface/IWorkflow";

interface WorkflowDetailsProps {
  formData: WorkflowFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkflowFormData>>;
}
interface SelectField {
  name: keyof WorkflowFormData;
  label: string;
  options: Record<string, string>;
}

const requestTypeMap: { [key: string]: string } = {
  CR: "Contract Renewal",
  SFP: "Scholarship Fee Processing",
  SFD: "Scholarship Fee Disbursement",
  AFP: "Allowance Fee Processing",
  AFD: "Allowance Fee Disbursement",
  TF: "Thesis Fee",
  TFD: "Thesis Fee Disbursement",
  IA: "Internship Allowance",
  IAD: "Internship Allowance Disbursement",
};
const schoolyearMap: { [key: number]: string } = {
  20242025: "2024-2025",
  20252026: "2025-2026",
};
const semesterMap: { [key: number]: string } = {
  1: "1st Semester",
  2: "2nd Semester",
};
const yrlvlMap: { [key: number]: string } = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

const selectFields: SelectField[] = [
  {
    name: "scholar_level",
    label: "Scholar Year Level",
    options: yrlvlMap,
  },
  {
    name: "semester",
    label: "Semester",
    options: semesterMap,
  },
  {
    name: "school_year",
    label: "School Year",
    options: schoolyearMap,
  },
];

function WorkflowDetails({ formData, setFormData }: WorkflowDetailsProps) {
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayDate = new Date().toISOString().split("T")[0];

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

  return (
    <div>
      <div className="mb-5 font-medium text-[20px]">Workflow Details</div>
      <form className="space-y-3">
        <div>
          <label
            htmlFor="request_title"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Request Title
          </label>
          <input
            type="text"
            name="request_title"
            id="request_title"
            maxLength={100}
            placeholder="Enter request title..."
            required
            className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 text-[15px]"
            value={formData.request_title}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                request_title: e.target.value,
              }))
            }
          />
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <select
              name="req_type_id"
              value={formData.req_type_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  req_type_id: e.target.value,
                }))
              }
              className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                  appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden"
              required
            >
              <option value="" disabled>
                Select Approval Type
              </option>
              {Object.entries(requestTypeMap).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-700">
              ⏷
            </div>
          </div>

          <div
            className="relative flex-1"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            <input
              ref={dateInputRef}
              type="date"
              name="due_date"
              min={todayDate}
              value={formData.due_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, due_date: e.target.value }))
              }
              className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                  appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-datetime-edit]:text-gray-700"
              required
            />
            <Calendar
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 pointer-events-none"
              size={20}
            />
          </div>
        </div>

        <div className="flex gap-3 text-[16px]">
          {selectFields.map(({ name, label, options }) => (
            <div key={name} className="relative flex-1">
              <select
                name={name}
                value={formData[name] as string}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [name]: e.target.value,
                  }))
                }
                className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden"
                required
              >
                <option value="" disabled>
                  {label}
                </option>
                {Object.entries(options).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-700">
                ⏷
              </div>
            </div>
          ))}
        </div>

        <div
          {...getRootProps()}
          className={`w-full px-6 py-10 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center bg-gray-50 hover:bg-gray-100 cursor-pointer `}
        >
          <input {...getInputProps()} />
          {formData.file ? (
            <p className="text-sm text-center text-gray-700">
              File: {formData.file.name}
            </p>
          ) : (
            <p className="text-sm text-center text-gray-500">
              Drag & Drop your file here, or click to select
            </p>
          )}
        </div>
        <div className="text-red">{error}</div>

        <div>
          <textarea
            maxLength={255}
            rows={2}
            name="description"
            id="description"
            placeholder="Enter approval request description..."
            className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 text-[15px] resize-none"
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
