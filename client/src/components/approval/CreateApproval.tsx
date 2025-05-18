import axios from "axios";
import { useState } from "react";
import { WorkflowDisplaySchema } from "../../pages/Workflow/Workflow";

interface CreateApprovalProps {
  setIsModalOpen: (isOpen: boolean) => void;
  requester_id: number;
  setWorkflowDisplay: React.Dispatch<
    React.SetStateAction<WorkflowDisplaySchema[]>
  >;
  fetchWorkflows: () => void;
}
interface WFApprover {
  email: string;
  order: number;
  date: string;
}
interface CreateWorkflowSchema {
  requester_id: number;
  req_type_id: string;
  rq_description: string;
  file: File | null;
  approvers: WFApprover[];
  scholar_level: string;
  semester: string;
  due_date: string;
  school_year: string;
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

function CreateApproval({
  setIsModalOpen,
  requester_id,
  setWorkflowDisplay,
  fetchWorkflows,
}: CreateApprovalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<CreateWorkflowSchema>({
    requester_id: requester_id,
    req_type_id: "",
    rq_description: "",
    file: null,
    approvers: [{ email: "", order: 1, date: "" }],
    scholar_level: "",
    semester: "",
    due_date: "",
    school_year: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const addApprover = () => {
    setFormData((prev) => ({
      ...prev,
      approvers: [
        ...prev.approvers,
        { email: "", order: prev.approvers.length + 1, date: "" },
      ],
    }));
  };
  const handleApproverChange = (
    index: number,
    field: keyof WFApprover,
    value: string
  ) => {
    setFormData((prev) => {
      const newApprovers = [...prev.approvers];
      newApprovers[index] = { ...newApprovers[index], [field]: value };
      return { ...prev, approvers: newApprovers };
    });
  };
  const removeApprover = (index: number) => {
    setFormData((prev) => {
      const newApprovers = prev.approvers.filter((_, i) => i !== index);
      return {
        ...prev,
        approvers: newApprovers.map((approver, i) => ({
          ...approver,
          order: i + 1,
        })),
      };
    });
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword", // .doc
      ];
      const maxSize = 25 * 1024 * 1024; // 25MB limit

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Only PDF and Word files are allowed.");
        setFormData((prev) => ({ ...prev, file: null }));
        return;
      }

      if (selectedFile.size > maxSize) {
        setError("File size should not exceed 25MB.");
        setFormData((prev) => ({ ...prev, file: null }));
        return;
      }

      setError("");
      setFormData((prev) => ({ ...prev, file: selectedFile }));
    }
  };
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    console.log(requester_id);
    const formDataToSend = new FormData();
    formDataToSend.append("requester_id", String(formData.requester_id));
    formDataToSend.append("req_type_id", formData.req_type_id);
    formDataToSend.append("rq_description", formData.rq_description);
    formDataToSend.append("due_date", formData.due_date);
    formDataToSend.append("school_year", formData.school_year);
    formDataToSend.append("semester", formData.semester);
    formDataToSend.append("scholar_level", formData.scholar_level);

    // Convert approvers array to JSON string before appending
    formDataToSend.append("approvers", JSON.stringify(formData.approvers));

    if (
      !formData.req_type_id ||
      !formData.due_date ||
      !formData.school_year ||
      !formData.scholar_level ||
      !formData.semester ||
      !formData.rq_description ||
      formData.approvers.some((a) => !a.email || !a.date)
    ) {
      setError("All fields are required. Please fill them in.");
      setLoading(false);
      return;
    }

    if (formData.file) {
      formDataToSend.append("file", formData.file);
    }
    for (const [key, value] of formDataToSend.entries()) {
      console.log(`${key}: ${value}`);
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/workflow/create-workflow",
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(response.data);
      setWorkflowDisplay((prev) => [
        {
          workflow_id: response.data.workflow_id, // New workflow first
          rq_title: requestTypeMap[formData.req_type_id] || "Unknown",
          due_date: formData.due_date,
          status: "Pending",
          doc_name: formData.file ? formData.file.name : "N/A",
          current_approver: formData.approvers[0]?.email || "TBD",
          school_details: `${formData.school_year} - ${formData.semester} (${formData.scholar_level})`,
        },
        ...prev, // Keep existing ones after
      ]);

      alert("Success");
      fetchWorkflows();
      setIsModalOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(
          error.response.data.message || "Submission failed. Try again."
        );
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50">
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl w-full">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Approval Request</h2>
          <button
            className="text-gray-500 hover:text-gray-800"
            onClick={() => setIsModalOpen(false)}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <select
              id="req_type_id"
              name="req_type_id"
              className="border border-gray-400 px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md"
              value={formData.req_type_id}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select Approval Type
              </option>
              <option value="CR">Contract Renewal</option>
              <option value="SFP">Scholarship Fee Processing</option>
              <option value="SFD">Scholarship Fee Disbursement</option>
              <option value="AFP">Allowance Fee Processing</option>
              <option value="AFD">Allowance Fee Disbursement</option>
              <option value="TF">Thesis Fee</option>
              <option value="thesis_fee_disbursement">
                Thesis Fee Disbursement
              </option>
              <option value="IA">Internship Allowance</option>
              <option value="IAD">Internship Allowance Disbursement</option>
            </select>
            <input
              id="due_date"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleChange}
              required
              className="border border-gray-400 px-3 py-2 w-full"
            />
          </div>

          <input
            type="file"
            required
            className="border border-gray-400 px-3 py-2 w-full"
            onChange={handleFileChange}
          />

          {/* New Inputs: Scholar Level, Semester, School Year */}
          <div className="grid grid-cols-2 gap-4">
            <select
              id="scholar_level"
              name="scholar_level"
              className="border border-gray-400 px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md"
              value={formData.scholar_level}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select Scholar Level
              </option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            <select
              id="semester"
              name="semester"
              className="border border-gray-400 px-3 py-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-md"
              value={formData.semester}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select Semester
              </option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
            </select>
          </div>

          <input
            id="school_year"
            name="school_year"
            type="text"
            placeholder="Enter School Year (e.g., 2024-2025)"
            className="border border-gray-400 px-3 py-2 w-full"
            value={formData.school_year}
            onChange={handleChange}
            required
          />

          {/* Requester Designation (Approvers) */}
          <div className="border p-4 rounded-md">
            <h3 className="font-semibold mb-3">Requester Designation</h3>
            {formData.approvers.map((approver, index) => (
              <div className="flex gap-4 mb-2" key={index}>
                <input
                  type="email"
                  placeholder={`Approver ${index + 1} Email`}
                  className="border border-gray-400 px-3 py-2 w-full"
                  required
                  value={approver.email}
                  onChange={(e) =>
                    handleApproverChange(index, "email", e.target.value)
                  }
                />
                <input
                  type="date"
                  className="border border-gray-400 px-3 py-2 w-full"
                  required
                  value={approver.date}
                  onChange={(e) =>
                    handleApproverChange(index, "date", e.target.value)
                  }
                />
                <button
                  type="button"
                  className={` ${
                    index === 0 ? "text-gray-300" : "text-red-500"
                  } `}
                  onClick={() => removeApprover(index)}
                  disabled={index === 0}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-blue-600 mt-2"
              onClick={addApprover}
            >
              + Add Approver
            </button>
          </div>

          <textarea
            id="rq_description"
            name="rq_description"
            placeholder="Enter your description here..."
            className="border border-gray-400 px-3 py-2 w-full h-20"
            value={formData.rq_description}
            onChange={handleChange}
          ></textarea>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateApproval;
