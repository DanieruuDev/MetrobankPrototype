import { useState } from "react";

interface IApprover {
  id: number;
  order: number;
  date: string; //format (YYYY-MM-DD)
}

export default function Admin() {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [approvers, setApprovers] = useState<IApprover[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aprQuantity, setAprQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log({ title, dueDate, file, approvers });

    setTimeout(() => {
      setIsSubmitting(false);
      alert("Form submitted successfully!");
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-1/2"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mt-5">
          {Array.from({ length: aprQuantity }, (_, index) => (
            <div key={index + 1}>
              <label htmlFor={`approver ${index + 1}`}>
                Assigned to - {index + 1}
              </label>
              <input
                type="text"
                name={`approver ${index + 1}`}
                id=""
                className="w-full p-2 border rounded"
              />
              <input type="date" className="w-full p-2 border rounded" />
            </div>
          ))}

          <button
            type="button"
            className="bg-gray-300 rounded-md px-3 py-2 mt-2 cursor-pointer"
            onClick={() => setAprQuantity(aprQuantity + 1)}
          >
            Add new item
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded ${
              isSubmitting
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
