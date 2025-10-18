// extractDocumentController.js
const path = require("path");
const AdmZip = require("adm-zip");
const { v4: uuidv4 } = require("uuid");
const { processPDF, processGradesPDF } = require("../services/documentService");
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

const extractGradesController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 🆔 Create a new job ID
    const jobId = uuidv4();

    // 📝 Initialize job in Redis
    await setJob(jobId, "pending", {
      progress: 0,
      fileName: req.file.originalname,
      message: "Job created and pending.",
    });

    // ⚡ Return job ID immediately to client
    res.json({ jobId });

    // --- Background processing ---
    process.nextTick(async () => {
      try {
        await setJob(jobId, "processing", {
          progress: 10,
          message: "Processing started...",
        });

        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const ext = path.extname(fileName).toLowerCase();

        let finalResult;

        // --- Single PDF ---
        if (ext === ".pdf") {
          const result = await processGradesPDF(fileBuffer, true);
          finalResult = { fileName, ...result };
        }
        // --- ZIP with multiple PDFs ---
        else if (ext === ".zip") {
          const zip = new AdmZip(fileBuffer);
          const pdfEntries = zip
            .getEntries()
            .filter((e) => path.extname(e.entryName).toLowerCase() === ".pdf");

          const results = [];
          let processed = 0;

          for (const pdf of pdfEntries) {
            const pdfBuffer = pdf.getData();
            const result = await processGradesPDF(pdfBuffer);
            results.push({ fileName: pdf.entryName, ...result });
            processed++;

            // 🌀 Update progress every loop
            const progress = Math.round((processed / pdfEntries.length) * 100);
            await setJob(jobId, "processing", {
              progress,
              message: `Processed ${processed}/${pdfEntries.length} files`,
            });
          }

          finalResult = { totalFiles: results.length, results };
        }
        // --- Invalid file type ---
        else {
          await setJob(jobId, "failed", {
            message: "Invalid file type. Only PDF or ZIP supported.",
          });
          return;
        }

        // ✅ Job complete
        await setJob(jobId, "completed", {
          progress: 100,
          message: "Processing complete.",
          result: finalResult,
        });
      } catch (err) {
        console.error("❌ extractGradesController background error:", err);
        await setJob(jobId, "failed", {
          message: "Error processing file.",
          details: err.message,
        });
      }
    });
  } catch (err) {
    console.error("❌ extractGradesController error:", err);
    res
      .status(500)
      .json({ error: "Failed to initialize job", details: err.message });
  }
};

const uploadGradeFileController = async (req, res) => {
  const jobId = uuidv4(); // Generate unique job ID
  try {
    if (!req.file) {
      await setJob(jobId, "failed", { message: "No file uploaded" });
      return res.status(400).json({ error: "No file uploaded", jobId });
    }

    const bucketId = process.env.B2_BUCKET_ID;
    const bucketName = process.env.B2_BUCKET_NAME;

    if (!bucketId || !bucketName) {
      await setJob(jobId, "failed", {
        message: "Backblaze B2 configuration is missing.",
      });
      return res.status(500).json({
        error: "Backblaze B2 configuration is missing.",
        jobId,
      });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    const renewalId = req.body.renewal_id ? String(req.body.renewal_id) : null;

    // Optional: organize by folder (e.g., renewal_id/filename)
    const pathPrefix = renewalId ? `${renewalId}/` : "";
    const fileName = `${pathPrefix}${Date.now()}_${originalName}`;

    // 🟡 Step 1: Mark job as "uploading"
    await setJob(jobId, "uploading", {
      message: "File upload in progress...",
      fileName,
      renewalId,
    });

    // 🆙 Step 2: Upload to Backblaze
    const result = await uploadBuffer(fileBuffer, fileName, bucketId);

    // Build public URL
    const fileURL = `https://f002.backblazeb2.com/file/${bucketName}/${encodeURIComponent(
      result.fileName || fileName
    )}`;

    console.log(`✅ Uploaded grade file: ${fileName}`);

    // 🟢 Step 3: Mark job as completed
    await setJob(jobId, "completed", {
      message: "Grade file uploaded successfully.",
      fileName,
      fileURL,
      renewalId,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
    });

    // Step 4: Respond with job info
    res.status(200).json({
      message: "Grade file uploaded successfully",
      jobId,
      fileName,
      fileURL,
    });
  } catch (err) {
    console.error("❌ uploadGradeFileController error:", err);

    // 🔴 Step 5: Mark job as failed
    await setJob(jobId, "failed", {
      message: "Failed to upload grade file",
      error: err.message,
    });

    res.status(500).json({
      message: "Failed to upload grade file",
      jobId,
      error: err.message,
    });
  }
};
module.exports = {
  extractDocumentController,
  uploadFileController,
  downloadFile,
  extractGradesController,
  uploadGradeFileController,
};
