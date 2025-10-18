import React, { useState } from "react";
import Tesseract from "tesseract.js";

interface ExtractedGrade {
  courseCode: string;
  description: string;
  finalGrade: string;
}

const GradeImageExtractor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [grades, setGrades] = useState<ExtractedGrade[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setText("");
    setGrades([]);
  };

  const extractText = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await Tesseract.recognize(image, "eng");
      const extractedText = result.data.text;
      setText(extractedText);

      // Parse simple table (you can enhance this regex as needed)
      const tableRegex = /(COSC|CITE|INSY|INTE)\d+\s+([\w\s]+)\s+(\d+\.\d+)/g;
      const matches = [...extractedText.matchAll(tableRegex)];

      const parsedGrades = matches.map((m) => ({
        courseCode: m[1] + m[0].match(/\d+/)?.[0],
        description: m[2].trim(),
        finalGrade: m[3],
      }));

      setGrades(parsedGrades);
    } catch (err) {
      console.error("OCR failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🧾 OCR Grade Extractor</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {image && (
        <div className="mb-4">
          <img
            src={image}
            alt="uploaded"
            className="max-w-sm border rounded shadow"
          />
        </div>
      )}

      <button
        onClick={extractText}
        disabled={!image || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Extracting..." : "Extract Text"}
      </button>

      {text && (
        <>
          <h3 className="mt-6 font-semibold">Extracted Text:</h3>
          <pre className="bg-gray-100 p-2 text-xs rounded overflow-auto max-h-60">
            {text}
          </pre>
        </>
      )}

      {grades.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Detected Grades:</h3>
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-2 border">Course Code</th>
                <th className="p-2 border">Description</th>
                <th className="p-2 border">Final Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={i}>
                  <td className="p-2 border">{g.courseCode}</td>
                  <td className="p-2 border">{g.description}</td>
                  <td className="p-2 border text-center">{g.finalGrade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GradeImageExtractor;
