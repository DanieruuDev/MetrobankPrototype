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

// Helper
function extractText(anchor, text) {
  if (!anchor?.textSegments?.length) return "";
  return anchor.textSegments
    .map((seg) => text.substring(seg.startIndex || 0, seg.endIndex))
    .join("");
}

module.exports = { processPDF };
