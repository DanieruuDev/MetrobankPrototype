const { DocumentProcessorServiceClient } =
  require("@google-cloud/documentai").v1;
require("dotenv").config();

const client = new DocumentProcessorServiceClient();

const processPDF = async (fileBuffer) => {
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/locations/us/processors/${process.env.DOCUMENT_FORM_PARSER_ID}`;

  const request = {
    name,
    rawDocument: {
      content: fileBuffer.toString("base64"),
      mimeType: "application/pdf",
    },
  };

  console.log("⚙️ Sending document to Form Parser (KVP extraction)...");
  const [result] = await client.processDocument(request);
  const { document } = result;

  console.log("✅ Document processed by Form Parser.");
  console.log(`📄 Pages: ${document.pages?.length || 0}`);

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

  console.log("🔍 Extracted Key-Value Pairs:", kvps.length);
  kvps.forEach((kv) =>
    console.log(`   [Page ${kv.page}] ${kv.key} → ${kv.value}`)
  );

  // 🔄 Fallback to Entities if KVPs are empty or messy
  let entities = [];
  if (!kvps.length || kvps.every((kvp) => !kvp.key || !kvp.value)) {
    console.log("⚠️ No valid KVPs detected. Using Entities instead...");
    if (document.entities?.length) {
      entities = document.entities.map((e) => ({
        type: e.type || "UNKNOWN",
        text: e.mentionText || "",
        confidence: e.confidence || null,
      }));
      entities.forEach((ent) =>
        console.log(`   [Entity] ${ent.type}: ${ent.text}`)
      );
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
