import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, Search } from "lucide-react";

interface AddEligibleScholarModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  schoolYear: string;
  branchName: string | undefined;
  fetchStudents: () => void;
}

interface Scholar {
  renewal_id: number;
  scholar_name: string;
  student_id: number;
  program: string;
  year_level: string;
  semester: string;
  school_year: string;
  campus: string;
  disbursement_id: number;
  has_academic_award: boolean;
}

const AddEligibleScholarModal: React.FC<AddEligibleScholarModalProps> = ({
  showModal,
  setShowModal,
  schoolYear,
  branchName,
  fetchStudents,
}) => {
  const [loading, setLoading] = useState(false);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (showModal) fetchScholars();
  }, [showModal]);

  // 🧭 Fetch eligible scholars
  const fetchScholars = async () => {
    setLoading(true);

    const params: { school_year: string; campus_name?: string } = {
      school_year: schoolYear,
    };
    if (branchName && branchName.trim() !== "") {
      params.campus_name = branchName.trim();
    }

    try {
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/invoice/list/academic-award`,
        { params }
      );
      console.log(response.data.data);
      setScholars(response.data.data || []);
    } catch (err) {
      console.error("Error fetching eligible scholars:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Select / Deselect individual
  const toggleSelect = (disbId: number) => {
    setSelected((prev) =>
      prev.includes(disbId)
        ? prev.filter((id) => id !== disbId)
        : [...prev, disbId]
    );
  };

  // ✅ Add selected scholars
  const handleConfirm = async () => {
    if (selected.length === 0) return;

    try {
      const response = await axios.post(
        `${VITE_BACKEND_URL}api/invoice/add-academic-award`,
        { scholars: selected }
      );

      if (response.data.success) {
        alert(
          `✅ ${response.data.insertedCount} scholar(s) added successfully.`
        );
        fetchStudents();
        setShowModal(false);
      } else if (response.status === 409) {
        alert(
          `⚠️ Some scholars already exist:\n${response.data.duplicates.join(
            ", "
          )}`
        );
      } else {
        alert(response.data.message || "Failed to add scholars.");
      }
    } catch (error) {
      console.error("❌ Error adding scholars:", error);
      alert("Server error while adding scholars.");
    }
  };

  // 🔍 Filter by search
  const filteredScholars = scholars.filter(
    (scholar) =>
      scholar.student_id.toString().includes(searchQuery) ||
      scholar.scholar_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  console.log(selected);
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-6 relative">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
            <span>🎓</span> Eligible Scholars for Academic Excellence Award
          </h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="mt-4 max-h-[420px] overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="text-center py-6 text-gray-500 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              Loading eligible scholars...
            </div>
          ) : filteredScholars.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No eligible scholars found.
            </div>
          ) : (
            <table className="min-w-full border-collapse text-sm text-gray-700">
              <thead className="bg-yellow-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? filteredScholars
                                .filter((s) => !s.has_academic_award)
                                .map((s) => s.disbursement_id)
                            : []
                        )
                      }
                      checked={
                        selected.length > 0 &&
                        selected.length ===
                          filteredScholars.filter((s) => !s.has_academic_award)
                            .length
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-800">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-800">
                    Scholar Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-800">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-800">
                    Year Level
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-800">
                    School Year / Semester
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-800">
                    Campus
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-800">
                    Academic Award
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredScholars.map((s, index) => (
                  <tr
                    key={s.disbursement_id}
                    className={`border-b hover:bg-gray-50 transition ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(s.disbursement_id)}
                        onChange={() => toggleSelect(s.disbursement_id)}
                        disabled={s.has_academic_award}
                        className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                          s.has_academic_award
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">{s.student_id}</td>
                    <td className="px-4 py-3">{s.scholar_name}</td>
                    <td className="px-4 py-3">{s.program}</td>
                    <td className="px-4 py-3">{s.year_level}</td>
                    <td className="px-4 py-3">{`${s.school_year} / ${s.semester}`}</td>
                    <td className="px-4 py-3">{s.campus}</td>

                    <td className="px-4 py-3">
                      {s.has_academic_award ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                          ✅ Added
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          ⏳ Not Yet
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
              selected.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Add {selected.length > 0 ? `(${selected.length})` : ""} Scholars
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEligibleScholarModal;
