const client = require("../config/documentai");
require("dotenv").config();

const processPDF = async (fileBuffer) => {
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us/processors/${process.env.DOCUMENT_FORM_PARSER_ID}`;

  const request = {
    name,
    rawDocument: {
      content: fileBuffer.toString("base64"),
      mimeType: "application/pdf",
    },
  };

  const [result] = await client.processDocument(request);
  const { document } = result;

  const kvps = [];
  document.pages?.forEach((page, i) => {
    if (page.formFields?.length) {
      page.formFields.forEach((field) => {
        const key = extractText(field.fieldName?.textAnchor, document.text);
        const value = extractText(field.fieldValue?.textAnchor, document.text);
        if (key.trim() || value.trim()) {
          kvps.push({
            page: i + 1,
            key: key.trim(),
            value: value.trim(),
            confidence: Math.min(
              field.fieldName?.confidence || 1.0,
              field.fieldValue?.confidence || 1.0
            ),
          });
        }
      });
    }
  });

  // 🔄 Fallback to Entities if KVPs are empty or messy
  let entities = [];
  if (!kvps.length || kvps.every((kvp) => !kvp.key || !kvp.value)) {
    if (document.entities?.length) {
      entities = document.entities.map((e) => ({
        type: e.type || "UNKNOWN",
        text: e.mentionText || "",
        confidence: e.confidence || null,
      }));
    }
  }

  // Attach both for controller use
  document.kvps = kvps;
  document.entitiesExtracted = entities;
  return document;
};

function normalizeDecimal(value) {
  if (!value) return null;
  return Number(String(value).trim().replace(",", "."));
}

function getWordsWithCoordsFromPage(page, fullText) {
  const words = [];

  // Prefer tokens (word-level) if available
  if (page.tokens && page.tokens.length) {
    for (const token of page.tokens) {
      const t = extractText(token.layout?.textAnchor, fullText).trim();
      if (!t) continue;

      // use normalizedVertices if present (0..1), else absolute vertices
      const verts =
        token.layout?.boundingPoly?.normalizedVertices ||
        token.layout?.boundingPoly?.vertices ||
        [];
      const x = verts[0]?.x ?? verts[0]?.x ?? 0;
      const y = verts[0]?.y ?? verts[0]?.y ?? 0;

      words.push({ text: t, x: Number(x), y: Number(y) });
    }
    return words;
  }

  // Fallback to lines if tokens are not present
  if (page.lines && page.lines.length) {
    for (const line of page.lines) {
      const lineText = extractText(line.layout?.textAnchor, fullText).trim();
      if (!lineText) continue;

      // try to split into words and approximate positions by splitting bounding poly width
      const verts =
        line.layout?.boundingPoly?.normalizedVertices ||
        line.layout?.boundingPoly?.vertices ||
        [];
      const x0 = verts[0]?.x ?? 0;
      const y0 = verts[0]?.y ?? 0;
      const wordsSplit = lineText.split(/\s+/).filter(Boolean);
      // distribute x along line
      for (let i = 0; i < wordsSplit.length; i++) {
        const frac = wordsSplit.length > 1 ? i / (wordsSplit.length - 1) : 0;
        words.push({
          text: wordsSplit[i],
          x: Number(x0 + frac * 0.001), // small offset if no exact coords
          y: Number(y0),
        });
      }
    }
  }

  return words;
}
const processGradesPDF = async (fileBuffer) => {
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us/processors/${process.env.DOCUMENT_FORM_PARSER_ID}`;

  const request = {
    name,
    rawDocument: {
      content: fileBuffer.toString("base64"),
      mimeType: "application/pdf",
    },
  };

  const [result] = await client.processDocument(request);
  const { document } = result;
  const text = (document?.text || "").replace(/\r/g, "");
  const pageCount = document?.pages?.length || 1;

  // Basic student info via regex on whole text
  const campus =
    text.match(/^[^\n]*STI[^\n]*/m)?.[0]?.trim() ||
    text.match(/^[^\n]*College[^\n]*/m)?.[0]?.trim() ||
    null;
  const student_id =
    text.match(/Student\s*(?:No|Number)\s*[:\-]?\s*([0-9A-Za-z\-_.]+)/i)?.[1] ||
    text.match(/(02\d{6,12})/)?.[1] ||
    null;
  const student_name =
    text.match(/Student\s*Name\s*[:\-]?\s*([A-Z ,.'-]+)/i)?.[1]?.trim() || null;
  const program =
    text.match(/Program\s*[:\-]?\s*([A-Z0-9 &\/\-]+)/i)?.[1]?.trim() || null;
  const level =
    text.match(/Level\s*[:\-]?\s*([A-Za-z0-9\- ]+)/i)?.[1]?.trim() || null;
  const gwaMatch = text.match(/GWA\s*[:\-]?\s*([0-9]{1,2}[.,][0-9]{1,2})/i);
  const gwa = gwaMatch ? normalizeDecimal(gwaMatch[1]) : null;
  // 🧩 Extract School Year (SY) and Semester/Term
  let sy = null;
  let semester = null;

  // Try to match patterns like: "Copy of Grades for the Period: 2024-2025/2nd Term"
  const periodMatch = text.match(
    /Copy\s+of\s+Grades\s+for\s+the\s+Period\s*[:\-]?\s*([0-9]{4}\s*-\s*[0-9]{4})\s*\/?\s*([0-9a-zA-Z\s]+Term)/i
  );

  if (periodMatch) {
    sy = periodMatch[1].trim();
    semester = periodMatch[2].trim();
  } else {
    // Fallback if separated across lines
    const syMatch = text.match(/([0-9]{4}\s*-\s*[0-9]{4})/);
    const semMatch = text.match(/([1-4](st|nd|rd|th)\s*Term|Semester)/i);
    if (syMatch) sy = syMatch[1].trim();
    if (semMatch) semester = semMatch[1].trim();
  }

  const extractedGrades = [];

  // We'll collect rows across pages
  for (const page of document.pages || []) {
    // gather words with coordinates for this page
    const words = getWordsWithCoordsFromPage(page, document.text || "");

    // debug: enable to inspect raw words
    // console.log("DEBUG words:", JSON.stringify(words.slice(0,200), null, 2));

    if (!words.length) continue;

    // cluster by Y coordinate into rows:
    // sort ascending by y
    words.sort((a, b) => a.y - b.y || a.x - b.x);

    const rows = [];
    const yTolerance = 0.01; // tweak if normalized coords used; increase if coords absolute

    for (const w of words) {
      const last = rows[rows.length - 1];
      if (!last) {
        rows.push({ y: w.y, words: [w] });
        continue;
      }
      // if same row (close y) add, else new row
      if (Math.abs(w.y - last.y) <= yTolerance) {
        last.words.push(w);
        // keep representative y
        last.y = (last.y * (last.words.length - 1) + w.y) / last.words.length;
      } else {
        rows.push({ y: w.y, words: [w] });
      }
    }

    // Now parse each row: join sorted by x
    for (const r of rows) {
      const rowWords = r.words.sort((a, b) => a.x - b.x);
      const rowText = rowWords
        .map((w) => w.text)
        .join(" ")
        .trim();

      // identify course code anywhere in row
      const codeMatch = rowText.match(/\b([A-Z]{2,6}\d{3,4}[A-Z]?)\b/);
      if (!codeMatch) continue;
      const course_code = codeMatch[1];

      // Collect numeric tokens in row (units + grade)
      const numericTokens = rowWords
        .map((w) => ({ text: w.text, x: w.x }))
        .filter((t) => /^[0-9]{1,2}[.,]?[0-9]{0,2}$/.test(t.text));

      let final_grade = null;
      let units = null;

      if (numericTokens.length) {
        numericTokens.sort((a, b) => a.x - b.x);

        // Rightmost numeric = final grade
        const rightmost = numericTokens[numericTokens.length - 1];
        final_grade = normalizeDecimal(rightmost.text);

        // Next numeric left of it = units
        if (numericTokens.length >= 2) {
          const secondRight = numericTokens[numericTokens.length - 2];
          const maybeUnits = normalizeDecimal(secondRight.text);
          if (maybeUnits !== null && maybeUnits > 0 && maybeUnits <= 6) {
            units = maybeUnits;
          }
        }
      }

      // 🧩 Extract course description (everything between code and units/grade)
      let course_description = "";
      const codeIndex = rowWords.findIndex((w) =>
        new RegExp(`\\b${course_code}\\b`).test(w.text)
      );

      // Find where the last numeric (grade) appears
      let finalIndex = -1;
      if (numericTokens.length) {
        const rightmostX = numericTokens[numericTokens.length - 1].x;
        finalIndex = rowWords.findIndex(
          (w) => Math.abs(w.x - rightmostX) < 1e-6
        );
        if (finalIndex === -1) {
          for (let i = rowWords.length - 1; i >= 0; i--) {
            if (/^[0-9]{1,2}[.,]?[0-9]{0,2}$/.test(rowWords[i].text)) {
              finalIndex = i;
              break;
            }
          }
        }
      }

      // Capture description between course code and final grade columns
      if (codeIndex !== -1) {
        const start = codeIndex + 1;
        const end =
          finalIndex > start
            ? finalIndex - 1
            : Math.min(start + 6, rowWords.length - 1);
        const descWords = rowWords.slice(start, end + 1).map((w) => w.text);

        // Remove trailing unit (e.g. 3.00) if detected
        if (descWords.length) {
          const lastWord = descWords[descWords.length - 1];
          const unitCandidate = normalizeDecimal(lastWord);
          if (
            unitCandidate !== null &&
            unitCandidate > 0 &&
            unitCandidate <= 6
          ) {
            descWords.pop();
          }
        }

        course_description = descWords
          .join(" ")
          .replace(/\s{2,}/g, " ")
          .trim();
      }

      extractedGrades.push({
        course_code,
        course_description: course_description || null,
        units: units !== null ? Number(units) : null,
        final_grade:
          final_grade !== null ? Number(final_grade.toFixed(2)) : null,
        rawRow: rowText,
      });
    } // end rows
  } // end pages

  // If nothing found, fallback to simple regex on flat text (as earlier)
  if (!extractedGrades.length && text) {
    const fallback = [];
    const regex =
      /\b([A-Z]{2,6}\d{3,4}[A-Z]?)\b[^\n\r]*?(\d{1,2}[.,]\d{1,2})(?!\d)/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      fallback.push({
        course_code: m[1],
        course_description: null,
        units: null,
        final_grade: normalizeDecimal(m[2]),
        rawRow: m[0],
      });
    }
    if (fallback.length)
      return {
        campus,
        student_id,
        student_name,
        program,
        level,
        gwa,
        extractedGrades: fallback,
        pageCount,
      };
  }

  return {
    campus,
    student_id,
    student_name,
    program,
    level,
    gwa,
    sy,
    semester,
    grades: extractedGrades
      .filter((g) => g.course_code && g.final_grade !== null)
      .map((g) => ({
        course_code: g.course_code,
        final_grade: g.final_grade,
      })),
    pageCount,
  };
};

// Helper
function extractText(anchor, text) {
  if (!anchor?.textSegments?.length) return "";
  return anchor.textSegments
    .map((seg) => text.substring(seg.startIndex || 0, seg.endIndex))
    .join("");
}

module.exports = { processPDF, processGradesPDF };
