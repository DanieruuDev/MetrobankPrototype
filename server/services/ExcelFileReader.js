const { getDownloadStream } = require("../utils/b2.js");
const path = require("path");
const XLSX = require("xlsx");
const pool = require("../database/dbConnect");

// mapping aliases → clean field name
// expected fields and their possible aliases
const HEADER_MAP = {
  student_id: ["Student ID", "Scholar Student ID", "Scholar ID"],
  scholar_name: ["Scholar Name", "Name", "Student Name"],
  campus: ["Campus", "Branch"],
  year_level: ["Year Level"],
  semester: ["Semester", "Term"],
  school_year: ["SY", "School Year", "school year"], // added lowercase
  program: ["Program"],
  batch: ["Batch"],
};

const REQUEST_HEADERS = [
  "Semestral Allowance",
  "Academic Excellence Award",
  "Tuition Fee and Other School Fees",
  "Thesis Fee",
];

const REQUIRED_KEYS = ["student_id", "year_level", "semester", "school_year"];

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Read and parse an XLSX file from B2
async function readXlsx(fileName) {
  if (path.extname(fileName).toLowerCase() !== ".xlsx") {
    throw new Error(`File ${fileName} is not an .xlsx file`);
  }

  const stream = await getDownloadStream(fileName);
  const buffer = await streamToBuffer(stream);

  // Parse the workbook
  const workbook = XLSX.read(buffer, { type: "buffer" });

  // If you want all sheets:
  const allSheets = {};
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    allSheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
    });
  });

  return allSheets;
}

function normalizeKey(str) {
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

function parseYearLevelHeader(header) {
  const match = header
    .replace(/\r?\n/g, " ")
    .match(/\((AY\d{2}-\d{2})\s+(.*?)\)/i);
  if (!match) return { school_year: null, semester: null };

  const ay = match[1]; // e.g. "AY24-25"
  const term = match[2]; // e.g. "1st Term"

  // AY24-25 → 2024-2025
  const [start, end] = ay.replace("AY", "").split("-");
  const school_year = `20${start}-20${end}`;

  // Normalize term → semester
  const semester = term.toLowerCase().includes("term")
    ? term.replace(/term/i, "Semester").trim()
    : term;

  return { school_year, semester };
}

function normalizeRow(row) {
  const normalized = {};
  const keyMap = Object.fromEntries(
    Object.keys(row).map((k) => [normalizeKey(k), k])
  );

  // map general fields
  for (const [field, aliases] of Object.entries(HEADER_MAP)) {
    const matchAlias = aliases.find(
      (alias) => keyMap[normalizeKey(alias)] !== undefined
    );
    normalized[field] = matchAlias
      ? row[keyMap[normalizeKey(matchAlias)]]
      : null;
  }

  // detect request type column
  const reqHeader = REQUEST_HEADERS.find(
    (h) => keyMap[normalizeKey(h)] !== undefined
  );
  if (reqHeader) {
    normalized.request_type = reqHeader;
    normalized.request_amount = row[keyMap[normalizeKey(reqHeader)]];
  } else {
    normalized.request_type = null;
    normalized.request_amount = null;
  }

  // special handling: Year Level (AY.. Term)
  const yearLevelHeader = Object.keys(row).find((h) =>
    /year\s*level.*\(ay\d{2}-\d{2}/i.test(h.replace(/\r?\n/g, " "))
  );

  if (yearLevelHeader) {
    const parsed = parseYearLevelHeader(yearLevelHeader);
    normalized.year_level = row[yearLevelHeader];
    normalized.semester = parsed.semester;
    normalized.school_year = parsed.school_year;
  }

  // validate required fields
  for (const key of REQUIRED_KEYS) {
    if (!normalized[key]) {
      throw new Error(
        `Missing required field "${key}" in row: ${JSON.stringify(row)}`
      );
    }
  }
  if (!normalized.request_type) {
    throw new Error(`Missing request type in row: ${JSON.stringify(row)}`);
  }

  return normalized;
}

function filterDataByHeaders(workbook) {
  const firstSheetName = Object.keys(workbook)[0];
  const rows = workbook[firstSheetName];
  return rows.map(normalizeRow);
}
function transformRowForDB(row) {
  // Convert "3rd year" -> 3
  const yrLvl = parseInt(row.year_level, 10);

  // Convert "1st Semester" -> 1
  let semesterNum = null;
  if (row.semester) {
    const semMatch = row.semester.match(/(\d+)/);
    semesterNum = semMatch ? parseInt(semMatch[1], 10) : null;
  }

  // Convert "2024-2025" -> 20242025
  let schoolYearInt = null;
  if (row.school_year) {
    const match = row.school_year.match(/^(\d{4})-(\d{4})$/);
    schoolYearInt = match ? parseInt(match[1] + match[2]) : null;
  }

  return {
    student_id: row.student_id,
    yr_lvl: yrLvl,
    semester: semesterNum,
    school_year: schoolYearInt, // now in 20242025 format
    request_type: row.request_type,
    request_amount: row.request_amount,
  };
}

const UploadFileToDisbursement = async (fileName, doc_id) => {
  try {
    const data = await readXlsx(fileName);
    console.log(doc_id);
    const allowed = ["Semestral Allowance"];
    const filtered = filterDataByHeaders(data, allowed);

    // Normalize to DB types
    const prepared = filtered.map(transformRowForDB);

    // Loop and call the stored function
    for (const row of prepared) {
      try {
        await pool.query(
          `SELECT insert_disbursement_detail($1, $2, $3, $4, $5, $6,  $7)`,
          [
            row.student_id,
            row.yr_lvl,
            row.semester,
            row.school_year,
            row.request_type,
            row.request_amount,
            doc_id,
          ]
        );
        console.log(
          `Inserted for student ${
            (row.student_id,
            row.yr_lvl,
            row.semester,
            row.school_year,
            row.request_type,
            row.request_amount)
          }`
        );
      } catch (err) {
        console.error(
          `Failed to insert for student ${row.student_id}:`,
          err.message
        );
      }
    }

    console.log("Upload and DB insert completed!");
  } catch (err) {
    console.error("Error:", err.message);
  }
};

module.exports = { readXlsx, filterDataByHeaders, UploadFileToDisbursement };
