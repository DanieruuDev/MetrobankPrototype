// extractDocumentController.js
const path = require("path");
const AdmZip = require("adm-zip");
const { v4: uuidv4 } = require("uuid");
const { processPDF } = require("../services/documentService");
const { getDownloadStream } = require("../utils/b2");
const { parseDocument } = require("../services/parseService");
const { setJob } = require("../services/jobTracker");
const { uploadBuffer } = require("../utils/b2");

const extractDocumentController = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const ext = path.extname(fileName).toLowerCase();

    const jobId = uuidv4();
    await setJob(jobId, "extracting", { fileName });
    res.json({ jobId, message: "Extraction started" });

    // --- Background extraction process ---
    (async () => {
      try {
        if (ext === ".pdf") {
          await setJob(jobId, "processing", {
            progress: 50,
            totalFiles: 1,
            processedFiles: 0,
          });
          const document = await processPDF(fileBuffer);
          const { extracted, used } = parseDocument(document);
          const results = [{ fileName: fileName, extracted, used }];
          await setJob(jobId, "done", {
            progress: 100,
            documents: results,
            totalFiles: 1,
            processedFiles: 1,
          });
        }

        if (ext === ".zip") {
          const zip = new AdmZip(fileBuffer);
          const pdfEntries = zip
            .getEntries()
            .filter((e) => path.extname(e.entryName).toLowerCase() === ".pdf");

          const results = [];
          let processed = 0;
          const total = pdfEntries.length;

          await setJob(jobId, "processing", {
            totalFiles: total,
            progress: 0,
            processedFiles: 0,
          });

          for (const pdf of pdfEntries) {
            const pdfBuffer = pdf.getData();
            const document = await processPDF(pdfBuffer);
            const { extracted, used } = parseDocument(document);

            results.push({ fileName: pdf.entryName, extracted, used });
            processed++;
            await setJob(jobId, "processing", {
              progress: Math.floor((processed / total) * 100),
              documents: results,
              processedFiles: processed,
            });
          }

          await setJob(jobId, "done", {
            progress: 100,
            documents: results,
            processedFiles: processed,
          });
        }
      } catch (err) {
        await setJob(jobId, "error", { error: err.message });
        console.error("❌ Extraction failed:", err);
      }
    })();
  } catch (err) {
    console.error("❌ extractDocumentController error:", err);
    res.status(500).json({ error: err.message });
  }
};

const uploadFileController = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const bucketId = process.env.B2_BUCKET_ID;
    const jobId = uuidv4();

    await setJob(jobId, "uploading", { fileName: req.file.originalname });
    res.json({ jobId, message: "File accepted for upload." });

    // Background upload
    (async () => {
      try {
        await uploadBuffer(req.file.buffer, req.file.originalname, bucketId);
        await setJob(jobId, "uploaded", { progress: 100 });
      } catch (err) {
        await setJob(jobId, "error", { error: err.message });
        console.error("❌ Upload failed:", err);
      }
    })();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const downloadFile = async (req, res) => {
  const { fileName } = req.params;

  if (!fileName) {
    return res.status(400).json({ message: "File name is required" });
  }

  try {
    // Get the readable stream from B2
    const stream = await getDownloadStream(fileName);

    // Set headers for the browser to handle the PDF properly
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    // Pipe the B2 stream directly to the response
    stream.pipe(res);
  } catch (err) {
    console.error("Error downloading file:", err);
    res
      .status(500)
      .json({ message: "Failed to download file", error: err.message });
  }
};

module.exports = {
  extractDocumentController,
  uploadFileController,
  downloadFile,
};
