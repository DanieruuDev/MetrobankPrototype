import React, { useEffect, useState } from "react";
import axios from "axios";

interface RequestType {
  rq_type_id: string;
  rq_title: string;
}
interface Props {
  value: string[];
  onChange: (selected: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestTypeModal({
  value = [],
  onChange,
  isOpen,
  onClose,
}: Props) {
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return; // only fetch when modal is open
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/maintenance/wf_request"
        );
        setRequestTypes(res.data.data);
      } catch (err) {
        console.error("Error fetching request types", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isOpen]);

  const toggleSelect = (id: string) => {
    const newSelected = value.includes(id)
      ? value.filter((s) => s !== id)
      : [...value, id];
    onChange(newSelected);
  };

  const toggleSelectAll = () => {
    if (value.length === requestTypes.length) {
      onChange([]);
    } else {
      onChange(requestTypes.map((r) => r.rq_type_id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Select Request Types</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Select All */}
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={value.length === requestTypes.length}
                onChange={toggleSelectAll}
              />
              <span className="font-semibold">Select All</span>
              <span className="ml-auto text-xs text-gray-500">
                {value.length}/{requestTypes.length}
              </span>
            </label>

            {/* List */}
            <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
              {requestTypes.map((type) => (
                <label
                  key={type.rq_type_id}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(type.rq_type_id)}
                    onChange={() => toggleSelect(type.rq_type_id)}
                  />
                  <span>{type.rq_title}</span>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
