import { Calendar, Plus, SquareMinus, X } from "lucide-react";
import { useCallback, useContext, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import distributeDueDates from "../../utils/DistributeDueDate";
import { debounce } from "lodash";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import Loading from "../../components/shared/Loading"; // Adjust path as needed
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CreateApproval2Props {
  setIsModal: (isOpen: boolean) => void;
  fetchWorkflows: (page: number) => void;
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
  const [suggestions, setSuggestions] = useState<{ [key: number]: string[] }>(
    {}
  );
  const [suggestionLoading, setSuggestionLoading] = useState<{
    [key: number]: boolean;
  }>({});

  const [approvers, setApprovers] = useState<{ id: number; email: string }[]>([
    { id: Date.now(), email: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayDate = new Date().toISOString().split("T")[0];
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (value: string, id: number) => {
      if (!value.trim()) return;

      setSuggestionLoading((prev) => ({ ...prev, [id]: true }));

      try {
        const res = await axios.get<string[]>(
          `http://localhost:5000/api/workflow/search-approvers/${value}`
        );
        setSuggestions((prev) => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      } finally {
        setSuggestionLoading((prev) => ({ ...prev, [id]: false }));
      }
    }, 300),
    []
  );

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
          toast.error("Only PDF, Word, Excel files are allowed.");
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
    setError(null);

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

    const sendData = new FormData();
    sendData.append("request_title", formValues.request_title);
    sendData.append("requester_id", String(userId));
    sendData.append("req_type_id", formValues.req_type_id);
    sendData.append("description", formValues.description);
    if (file) sendData.append("file", file);
    sendData.append("approvers", JSON.stringify(approversToSend));
    sendData.append("scholar_level", formValues.scholar_level);
    sendData.append("semester", formValues.semester);
    sendData.append("due_date", formValues.due_date);
    sendData.append("school_year", formValues.school_year);

    console.log(sendData);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/workflow/create-workflow",
        sendData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      fetchWorkflows(1);
      setIsModal(false);
      toast.success("Approval request created successfully!");
      setLoading(false);
      console.log(response.data);
    } catch (error) {
      let message = "Failed to create approval request. Please try again.";

      if (axios.isAxiosError(error) && error.response) {
        message = error.response.data?.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50 ">
        <div
          className={`relative bg-white rounded-lg p-8 shadow-lg max-w-2xl w-full space-y-6 max-h-[95vh] overflow-y-auto`}
        >
          {/* Show loading spinner inside modal */}
          {loading && (
            <div className="flex justify-center mb-4">
              <Loading />
            </div>
          )}

          {error && <p className="text-red-500 text-center mt-2">{error}</p>}

          <div className="flex justify-between">
            <h1 className="text-[20px] font-medium text-[#565656]">
              Create Approval Request
            </h1>
            <button
              className="text-gray-500 hover:text-gray-800 cursor-pointer"
              onClick={() => setIsModal(false)}
              disabled={loading}
            >
              <X />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-3"
            aria-busy={loading}
            aria-disabled={loading}
          >
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
                disabled={loading}
                className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 text-[15px]"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <select
                  name="req_type_id"
                  defaultValue=""
                  className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                    appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden"
                  disabled={loading}
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
                  className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 
                    appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-datetime-edit]:text-gray-700"
                  disabled={loading}
                  required
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
                    className="w-full rounded-md px-4 py-2 pr-10 cursor-pointer text-gray-700 border  border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                      appearance-none [&::-ms-expand]:hidden [&::-webkit-select-arrow]:hidden"
                    disabled={loading}
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
              className={`w-full p-6 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center bg-gray-50 hover:bg-gray-100 cursor-pointer ${
                loading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              <input {...getInputProps()} disabled={loading} />
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
                    <div
                      className="flex relative"
                      onBlur={() => {
                        setTimeout(() => {
                          setSuggestions((prev) => ({ ...prev, [id]: [] }));
                        }, 100);
                      }}
                      tabIndex={0}
                    >
                      <input
                        type="email"
                        value={email}
                        maxLength={30}
                        autoComplete="off"
                        onChange={(e) => {
                          const val = e.target.value;
                          setApprovers(
                            approvers.map((app) =>
                              app.id === id ? { ...app, email: val } : app
                            )
                          );
                          fetchSuggestions(val, id);
                        }}
                        key={`approvers${index}`}
                        name={`approvers${index}`}
                        className=" w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 text-[15px]"
                        placeholder={`Enter Approver ${
                          index + 1
                        } Email Address`}
                        disabled={loading}
                        required
                      />
                      {(suggestions[id]?.length > 0 ||
                        suggestionLoading[id]) && (
                        <ul className="absolute top-full left-0 w-full z-20 bg-white border border-gray-300 rounded-md shadow-md max-h-[150px] overflow-y-auto">
                          {suggestionLoading[id] ? (
                            <li className="px-3 py-2 text-sm text-gray-500 italic">
                              Loading...
                            </li>
                          ) : (
                            suggestions[id].map((email, idx) => (
                              <li
                                key={idx}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm text-black"
                                onClick={() => {
                                  setApprovers(
                                    approvers.map((app) =>
                                      app.id === id ? { ...app, email } : app
                                    )
                                  );
                                  setSuggestions((prev) => ({
                                    ...prev,
                                    [id]: [],
                                  }));
                                }}
                              >
                                {email}
                              </li>
                            ))
                          )}
                        </ul>
                      )}

                      {approvers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeApprover(id)}
                          className="cursor-pointer"
                          disabled={loading}
                        >
                          <SquareMinus className="w-8 text-gray-300 hover:text-gray-700" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {approvers.length + 1 <= 5 && (
                  <button
                    className="text-[#565656] font-medium flex cursor-pointer gap-1 mt-5"
                    type="button"
                    onClick={addApprover}
                    disabled={loading}
                  >
                    <Plus className="w-6" />
                    <span className="text-[16px]">Add Additional Approver</span>
                  </button>
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
                className="w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 text-[15px] resize-none"
                disabled={loading}
                required
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModal(false)}
                type="button"
                className="py-2 px-4 text-[16px] text-[#565656] bg-[#DCDCDC] rounded-md cursor-pointer hover:bg-[#ebebeb]"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`py-2 px-4 text-[16px] text-white rounded-md cursor-pointer ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#3B89FD] hover:bg-[#3b58fd]"
                }`}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateApproval2;
