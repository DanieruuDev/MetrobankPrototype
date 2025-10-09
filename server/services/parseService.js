// services/parserService.js
const normalizeText = (s) => (s || "").replace(/\s+/g, " ").trim();

const parseDocument = (document) => {
  const fullText = (document.text || "").replace(/\r\n/g, "\n");

  // Prefer page 2 for certain fields
  let page2Raw = fullText;
  if (document.pages && document.pages[1] && document.pages[1].paragraphs) {
    page2Raw = document.pages[1].paragraphs
      .map((p) => (p.textAnchor?.content ? p.textAnchor.content : ""))
      .join("\n");
  }
  const pageText = normalizeText(page2Raw);
  const text = normalizeText(fullText);

  // KVP helpers
  const kvps = document.kvps || [];
  const findKvpByKey = (patterns = []) => {
    if (!kvps.length) return null;
    return kvps.find((pair) =>
      patterns.some((pat) => new RegExp(pat, "i").test(pair.key))
    );
  };
  const findKvpByValueMatch = (regex) => {
    if (!kvps.length) return null;
    return kvps.find((pair) => {
      if (!pair.value) return false;
      if (regex.test(pair.value)) return true;
      const lines = pair.value.split(/\r?\n/).map((l) => l.trim());
      return lines.some((ln) => regex.test(ln));
    });
  };
  const extractFromValue = (value = "", regex) => {
    if (!value) return "";
    const m = value.match(regex);
    if (!m) return "";
    return m[1] || m[0];
  };

  // Regexes
  const schoolYearTermRegex =
    /([0-9]{4}\s*-\s*[0-9]{4},\s*(?:1st|2nd|3rd|4th)\s*Term)/i;
  const yearRangeRegex = /([0-9]{4}\s*-\s*[0-9]{4})/i;
  const studentNumberRegex = /(02\d{6,12})/;
  const totalBalanceRegex =
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)/;

  const extracted = {
    studentName: "",
    studentNumber: "",
    program: "",
    schoolYearTerm: "",
    totalBalance: "",
  };
  const used = {};

  // --- 1) Student Name ---
  const kvStudentName = findKvpByKey(["^STUDENT\\s*NAME", "^STUDENT NAME:"]);
  if (kvStudentName?.value) {
    extracted.studentName = kvStudentName.value.trim();
    used.studentName = { source: "kvp", key: kvStudentName.key };
  }

  // --- 2) Student Number ---
  const kvStudentNumber =
    findKvpByKey(["^STUDENT\\s*(NO\\.?|NUMBER)", "^STUDENT NUMBER"]) ||
    findKvpByValueMatch(studentNumberRegex);
  if (kvStudentNumber?.value) {
    extracted.studentNumber =
      extractFromValue(kvStudentNumber.value, studentNumberRegex) ||
      kvStudentNumber.value.trim();
    used.studentNumber = { source: "kvp", key: kvStudentNumber.key };
  }

  // --- 3) Program ---
  const kvProgram = findKvpByKey([
    "PROGRAM\\/YEAR\\s*LEVEL",
    "^PROGRAM\\b",
    "^PROGRAM/YEAR",
  ]);
  if (kvProgram?.value) {
    const lines = kvProgram.value
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const programLine =
      lines.find((l) => /\b(BSCS|BSIT|BSHM|BSBA|BSTM)\b/i.test(l)) ||
      lines.find((l) => l !== ":") ||
      kvProgram.value;
    extracted.program = programLine;
    used.program = { source: "kvp", key: kvProgram.key };
  }

  // --- 4) School Year / Term ---
  const kvSchool = findKvpByKey([
    "SCHOOL\\s*YEAR",
    "SCHOOL YEAR AND TERM",
    "^SCHOOL YEAR",
    "^SCHOOL YEAR AND TERM:",
  ]);
  if (kvSchool?.value) {
    const found =
      extractFromValue(kvSchool.value, schoolYearTermRegex) ||
      extractFromValue(kvSchool.value, yearRangeRegex);
    if (found) {
      extracted.schoolYearTerm = found.trim();
      used.schoolYearTerm = { source: "kvp", key: kvSchool.key };
    }
  }
  if (!extracted.schoolYearTerm) {
    const kvFound =
      findKvpByValueMatch(schoolYearTermRegex) ||
      findKvpByValueMatch(yearRangeRegex);
    if (kvFound?.value) {
      const found =
        extractFromValue(kvFound.value, schoolYearTermRegex) ||
        extractFromValue(kvFound.value, yearRangeRegex);
      if (found) {
        extracted.schoolYearTerm = found.trim();
        used.schoolYearTerm = { source: "kvp", key: kvFound.key };
      }
    }
  }

  // --- 5) Total Balance ---
  const kvTotal =
    findKvpByKey([
      "TOTAL\\s*BALANCE",
      "NET\\s*BALANCE",
      "TOTAL\\s*AMOUNT",
      "^TOTAL AMOUNT",
      "^TOTAL BALANCE",
    ]) || findKvpByValueMatch(totalBalanceRegex);
  if (kvTotal?.value) {
    let balance = kvTotal.value.trim();
    const doubleDotRegex = /^(\d+)\.(\d{3})\.(\d{2})$/;
    const match = balance.match(doubleDotRegex);
    if (match) balance = match[1] + match[2] + "." + match[3];
    balance = balance.replace(/\s+/g, "");
    extracted.totalBalance = balance;
    used.totalBalance = {
      source: "kvp",
      key: kvTotal.key,
      confidence: kvTotal.confidence,
    };
  }

  // --- 6) Fallback to regex ---
  const fallback = (field, regexes) => {
    if (extracted[field]) return;
    for (const r of regexes) {
      const m = text.match(r) || pageText.match(r);
      if (m) {
        extracted[field] = (m[1] || m[0]).trim();
        break;
      }
    }
  };
  fallback("studentName", [
    /STUDENT\s+NAME[:\s]*([A-Z][A-Z0-9 ,.'-]+?)(?=\s+(?:PROGRAM|STUDENT NUMBER|ADDRESS|SCHOOL YEAR|MS OFFICE|DATE|PASSWORD|$))/i,
  ]);
  fallback("studentNumber", [
    studentNumberRegex,
    /STUDENT\s*NUMBER[:\s]*(02\d{6,12})/i,
  ]);
  fallback("program", [
    /\b(BSCS|BSIT|BSHM|BSBA|BSTM|BSEMC|BSAIS|BSHRM)\s*[, ]*\s*([1-4](?:st|nd|rd|th)\s*Year)\b/i,
  ]);
  fallback("schoolYearTerm", [schoolYearTermRegex, yearRangeRegex]);
  fallback("totalBalance", [
    /NET\s*ASSESSMENT[:\s]*([\d,]+\.\d{2})/i,
    /TOTAL\s*BALANCE[:\s]*([\d,]+\.\d{2})/i,
    totalBalanceRegex,
  ]);
  if (extracted.totalBalance)
    extracted.totalBalance = extracted.totalBalance.replace(/[\s,]/g, "");

  return { extracted };
};

module.exports = { parseDocument, normalizeText };
