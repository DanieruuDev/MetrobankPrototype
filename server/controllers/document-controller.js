const path = require("path");
const AdmZip = require("adm-zip");
const { v4: uuidv4 } = require("uuid");
const { processPDF } = require("../services/documentService");
const { uploadBuffer } = require("../utils/b2");
const { parseDocument } = require("../services/parseService");
const { setJob } = require("../services/jobTracker.js");

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const bucketId = process.env.B2_BUCKET_ID;
    const ext = path.extname(fileName).toLowerCase();

    // --- Generate job ID and initial status ---
    const jobId = uuidv4();
    await setJob(jobId, "uploaded", { fileName });

    // Respond immediately to the client
    res.json({ jobId, message: "Upload accepted. Processing in background." });

    // --- Background Processing ---
    (async () => {
      try {
        if (ext === ".pdf") {
          await setJob(jobId, "processing", { progress: 0 });
          await uploadBuffer(fileBuffer, fileName, bucketId);
          await setJob(jobId, "processing", { progress: 50 });

          const document = await processPDF(fileBuffer);
          const { extracted, used } = parseDocument(document);

          await setJob(jobId, "done", { progress: 100, extracted, used });
        }

        if (ext === ".zip") {
          const zip = new AdmZip(fileBuffer);
          const pdfEntries = zip
            .getEntries()
            .filter((e) => path.extname(e.entryName).toLowerCase() === ".pdf");

          const results = [];
          let i = 0;
          const totalFiles = pdfEntries.length;
          let processedFiles = 0;

          await setJob(jobId, "processing", {
            totalFiles,
            processedFiles,
            progress: 0,
          });

          for (const pdf of pdfEntries) {
            const pdfBuffer = pdf.getData();
            await uploadBuffer(pdfBuffer, pdf.entryName, bucketId);

            const document = await processPDF(pdfBuffer);
            const { extracted, used } = parseDocument(document);
            results.push({ fileName: pdf.entryName, extracted, used });

            processedFiles++;
            const progress = Math.floor((processedFiles / totalFiles) * 100);

            await setJob(jobId, "processing", {
              totalFiles,
              processedFiles,
              progress,
              documents: results, // stringified inside setJob
            });
          }

          await setJob(jobId, "done", { progress: 100, documents: results });
        }
      } catch (err) {
        await setJob(jobId, "error", { error: err.message });
        console.error("❌ Background processing error:", err);
      }
    })();
  } catch (err) {
    console.error("❌ Upload controller error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadDocument };
