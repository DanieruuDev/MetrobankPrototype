// src/utils/extractGradesExcel.ts
import * as XLSX from "xlsx";

import { ScholarGradeDocument } from "../Interface/IRenewal";

export async function extractGradesExcel(
  file: File
): Promise<ScholarGradeDocument[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
  });

  // 🔍 Extract header row for identifying subject columns
  const headerRow =
    XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0] || [];

  // 🧭 Detect grade-related columns dynamically
  const subjectColumns = headerRow.filter(
    (h) =>
      !/student|name|id|program|course|average|gwa|campus|school|year|term|sem|level/i.test(
        h
      )
  );

  const documents: ScholarGradeDocument[] = rows.map((row) => {
    // Helper: get cell by regex key
    const get = (pattern: string): string | null => {
      const key = Object.keys(row).find((k) =>
        new RegExp(pattern, "i").test(k)
      );
      if (!key) return null;
      const val = row[key];
      return val !== null && val !== undefined ? String(val).trim() : null;
    };

    // 🎓 Extract core metadata
    const student_id = get("id|student") || "";
    const scholar_name = get("name|student name|scholar name") || "";
    const campus = get("campus|college|school") || "";
    const program = get("program|course") || "";
    const sy = get("school.?year|sy") || null;
    const year_level = get("year.?level|level") || "";
    const semester = get("term|sem|semester") || null;

    const gwaStr = get("average|gwa|gpa");
    const gwa = gwaStr ? parseFloat(gwaStr.replace(",", ".")) || null : null;

    // 📘 Extract subjects + grades dynamically
    const grades =
      subjectColumns
        .map((subject) => {
          const val = row[subject];
          if (val === null || val === undefined || val === "") return null;
          const num = parseFloat(String(val));
          if (isNaN(num)) return null;
          return {
            course_code: String(subject).trim(),
            final_grade: parseFloat(num.toFixed(2)),
          };
        })
        .filter(
          (g): g is { course_code: string; final_grade: number } => g !== null
        ) || [];

    return {
      student_id,
      scholar_name,
      campus,
      program,
      sy,
      year_level,
      semester,
      gwa,
      grades,
    };
  });

  return documents;
}
