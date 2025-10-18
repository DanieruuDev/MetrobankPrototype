import React, { useState } from "react";
import axios from "axios";

const GradeExtractorUI = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}api/document/extract-grades`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    setResult(res.data);
    setLoading(false);
  };

  return (
    <div>
      <h1>📄 Extract Course Grades (PDF/ZIP)</h1>
      <input type="file" accept=".pdf,.zip" onChange={handleFileChange} />
      <button onClick={handleSubmit} disabled={!file || loading}>
        {loading ? "Processing..." : "Extract"}
      </button>

      {result && (
        <pre className="bg-gray-100 p-2 text-xs rounded mt-4">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default GradeExtractorUI;

import React, { useState } from "react";
import {
  extractGradesExcel,
  ExtractedGrade,
} from "../../utils/ExtractGradesExcel";

const Sample: React.FC = () => {
  const [grades, setGrades] = useState<ExtractedGrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await extractGradesExcel(file);
      setGrades(result);
    } catch (err) {
      console.error(err);
      setError("Failed to extract grades.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-700">
        📘 Modular Grade Extractor
      </h1>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="block mb-6 text-sm text-gray-700"
      />

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {grades.length > 0 && (
        <pre className="bg-gray-100 p-4 text-xs rounded border border-gray-300 overflow-auto max-h-96">
          {JSON.stringify(grades, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default Sample;
