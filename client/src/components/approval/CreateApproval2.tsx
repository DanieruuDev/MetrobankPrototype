import { Calendar, Plus, SquareMinus, X } from "lucide-react";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import distributeDueDates from "../../utils/DistributeDueDate";
import axios from "axios";

interface CreateApproval2Props {
  setIsModal: (isOpen: boolean) => void;
  fetchWorkflows: () => void;
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

function CreateApproval2({ setIsModal, fetchWorkflows }: CreateApproval2Props) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [approvers, setApprovers] = useState<{ id: number; email: string }[]>([
    { id: Date.now(), email: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          setFile(file);
          setError(null);
        } else {
          setFile(null);
          setError("Only PDF, Word, Excel files are allowed.");
        }
      }
    },
    multiple: false,
  });

  const addApprover = () => {
    setApprovers([...approvers, { id: Date.now(), email: "" }]);
  };

  const removeApprover = (id: number) => {
    setApprovers(approvers.filter((approver) => approver.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const formValues: Record<string, string> = {};
    formData.forEach((value, key) => {
      formValues[key] = value.toString();
    });
    const approversWithDueDates = distributeDueDates(
      formValues.due_date,
      approvers
    );
    const approversToSend = approversWithDueDates.map((approver, index) => ({
      email: approver.email,
      order: index + 1,
      date: new Date(approver.dueDateForApproval).toISOString().split("T")[0],
    }));

    const formDataToSend = {
      requester_id: 3, // Change this into dynamic type
      req_type_id: formValues.req_type_id,
      description: formValues.description,
      file: file,
      approvers: JSON.stringify(approversToSend),
      scholar_level: formValues.scholar_level,
      semester: formValues.semester,
      due_date: formValues.due_date,
      school_year: formValues.school_year,
    };
    try {
      const response = await axios.post(
        "http://localhost:5000/admin/create-approval",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      alert("Success");
      fetchWorkflows();
      setIsModal(false);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }

    console.log("Form Data to Send:", formDataToSend);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50 ">
      {loading ? "Loading" : ""}
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl w-full space-y-6 max-h-[95vh] overflow-y-auto">
        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        <div className="flex justify-between">
          <h1 className="text-[20px] font-medium text-[#565656]">
            Create Approval Request
          </h1>
          <button
            className="text-gray-500 hover:text-gray-800 cursor-pointer"
            onClick={() => setIsModal(false)}
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <select
                name="req_type_id"
                defaultValue=""
                className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50 
                  appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden"
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
                className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50 
                  appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-datetime-edit]:text-gray-700"
              />
              <Calendar
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 pointer-events-none"
                size={20}
              />
            </div>
          </div>
          <div className="flex gap-3 text-[16px]">
            {[
              {
                name: "scholar_level",
                label: "Scholar Year Level",
                options: yrlvlMap,
              },
              { name: "semester", label: "Semester", options: semesterMap },
              {
                name: "school_year",
                label: "School Year",
                options: schoolyearMap,
              },
            ].map(({ name, label, options }) => (
              <div key={name} className="relative flex-1">
                <select
                  name={name}
                  defaultValue=""
                  className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50 
                    appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden"
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
            className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
          >
            <input {...getInputProps()} />
            {file ? (
              <p className="text-sm text-center text-gray-700">
                File: {file.name}
              </p>
            ) : (
              <p className="text-sm text-center text-gray-500">
                Drag & Drop your file here, or click to select
              </p>
            )}
          </div>
          <div>
            <h2 className="text-[20px] font-medium text-[#565656]">
              Requester Designation
            </h2>

            <div className="border border-[#EFEFEF] rounded-sm p-4 space-y-2">
              <p className="text-[14px] text-gray-400">
                Note: Number indicates order of approver
              </p>
              {approvers.map(({ id, email }, index) => (
                <div key={id} className="border-b border-[#e4e4e4] pb-2">
                  <label className="text-[#565656] text-[14px] font-medium">
                    Approver Email {index + 1}
                  </label>
                  <div className="flex">
                    <input
                      type="email"
                      value={email}
                      maxLength={30}
                      onChange={(e) =>
                        setApprovers(
                          approvers.map((app) =>
                            app.id === id
                              ? { ...app, email: e.target.value }
                              : app
                          )
                        )
                      }
                      key={`approvers${index}`}
                      name={`approvers${index}`}
                      className="flex-1 rounded-md px-4 py-2 pr-10 text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50"
                      placeholder={`Enter Approver ${index + 1} Email Address`}
                    />
                    {approvers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeApprover(id)}
                        className="cursor-pointer"
                      >
                        <SquareMinus className="w-8 text-gray-300 hover:text-gray-700" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {approvers.length + 1 <= 5 ? (
                <button
                  className="text-[#565656] font-medium flex cursor-pointer gap-1 mt-5"
                  type="button"
                  onClick={addApprover}
                >
                  <Plus className="w-6" />
                  <span className="text-[16px]">Add Additional Approver</span>
                </button>
              ) : (
                ""
              )}
            </div>
          </div>

          <div>
            <textarea
              maxLength={255}
              rows={2}
              name="description"
              id="description"
              placeholder="Enter approval request description..."
              className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50 resize-none p-2 text-[15px]"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsModal(false)}
              type="button"
              className="py-2 px-4 text-[16px] text-[#565656] bg-[#DCDCDC] rounded-md cursor-pointer hover:bg-[#ebebeb]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 text-[16px] text-white bg-[#3B89FD] hover:bg-[#3b58fd] rounded-md cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateApproval2;
