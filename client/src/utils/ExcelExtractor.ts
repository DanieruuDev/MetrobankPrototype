// file: src/utils/extractDisbursementExcel.ts
import * as XLSX from "xlsx";
import axios from "axios";

export interface ExtractedDisbursement {
  student_id: string | number | null;
  scholar_name: string | null;
  campus: string | null;
  program: string | null;
  year_level: string | null;
  semester: string | null;
  school_year: string | null;
  disbursement_type: string | null;
  amount: number | string | null;
}

const HEADER_MAP = {
  student_id: ["Student ID", "Scholar ID", "Scholar Student ID"],
  name: ["Name", "Student Name", "Scholar Name"],
  campus: ["Campus", "Branch", "Campus Name"],
  program: ["Program", "Course"],
  year_level: ["Year Level", "Yr Level"],
} as const;

const REQUEST_HEADERS = [
  "Tuition Fee and Other School Fees",
  "Semestral Allowance",
  "Academic Excellence Award",
  "Thesis Fee",
  "Internship Allowance",
] as const;

function normalizeKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

function parseYearLevelHeader(header: string): {
  school_year: string | null;
  semester: string | null;
} {
  const match = header.match(/\((\d{4}-\d{4})\s+(.*?)\)/);
  if (!match) return { school_year: null, semester: null };
  return { school_year: match[1], semester: match[2] };
}

function getValue(
  row: Record<string, unknown>,
  key: string
): string | number | null {
  const value = row[key];
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  return null;
}

/**
 * Downloads and extracts disbursement Excel file into structured JSON.
 * @param fileUrl The full backend URL to download the Excel file (e.g. `${VITE_BACKEND_URL}api/workflow/download/${filePath}`)
 * @returns ExtractedDisbursement[]
 */
export async function extractDisbursementExcel(
  fileUrl: string
): Promise<ExtractedDisbursement[]> {
  // Step 1: Download Excel file as binary
  const response = await axios.get(fileUrl, {
    responseType: "arraybuffer",
  });

  // Step 2: Parse workbook
  const workbook = XLSX.read(response.data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
  });

  // Step 3: Extract fields per row
  const extracted: ExtractedDisbursement[] = rows.map((row) => {
    const keyMap = Object.keys(row).reduce<Record<string, string>>(
      (acc, key) => {
        acc[normalizeKey(key)] = key;
        return acc;
      },
      {}
    );

    const result: ExtractedDisbursement = {
      student_id: null,
      scholar_name: null,
      campus: null,
      program: null,
      year_level: null,
      semester: null,
      school_year: null,
      disbursement_type: null,
      amount: null,
    };

    // Map known columns
    (
      Object.entries(HEADER_MAP) as [
        keyof typeof HEADER_MAP,
        readonly string[]
      ][]
    ).forEach(([field, aliases]) => {
      const alias = aliases.find((a) => keyMap[normalizeKey(a)] !== undefined);
      if (!alias) return;
      const originalKey = keyMap[normalizeKey(alias)];
      const value = getValue(row, originalKey);

      switch (field) {
        case "student_id":
          result.student_id = value;
          break;
        case "name":
          result.scholar_name = value?.toString() ?? null;
          break;
        case "campus":
          result.campus = value?.toString() ?? null;
          break;
        case "program":
          result.program = value?.toString() ?? null;
          break;
        case "year_level":
          result.year_level = value?.toString() ?? null;
          break;
      }
    });

    // Parse Year Level (2025-2026 1st Semester)
    const yearHeader = Object.keys(row).find((key) =>
      /year\s*level.*\(\d{4}-\d{4}/i.test(key)
    );
    if (yearHeader) {
      const { school_year, semester } = parseYearLevelHeader(yearHeader);
      result.school_year = school_year;
      result.semester = semester;
      const yl = getValue(row, yearHeader);
      result.year_level = yl ? yl.toString() : result.year_level;
    }

    // Find disbursement header + amount
    const disbHeader = REQUEST_HEADERS.find(
      (h) => keyMap[normalizeKey(h)] !== undefined
    );
    if (disbHeader) {
      result.disbursement_type = disbHeader;
      result.amount = getValue(row, keyMap[normalizeKey(disbHeader)]);
    }

    return result;
  });

  return extracted;
}
