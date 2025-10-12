const pool = require("../database/dbConnect.js");
const { uploadBuffer } = require("../utils/b2");
const { v4: uuidv4 } = require("uuid");

const fetchScholarForInvoice = async (req, res) => {
  const { schoolYear, semester } = req.params;
  const { branch } = req.query; // ✅ optional branch filter
  console.log("branch here", branch);
  if (!schoolYear || !semester) {
    return res
      .status(400)
      .json({ error: "School year and semester are required" });
  }

  try {
    // ✅ Use a flexible WHERE condition:
    // - Filters by branch only if it’s provided.
    // - Otherwise, shows all.
    const query = `
      SELECT *
      FROM vw_combined_eligible_scholar_invoice
      WHERE semester = $1
        AND school_year = $2
        AND ($3::varchar IS NULL OR campus = $3)
      ORDER BY scholar_name ASC
    `;

    const { rows } = await pool.query(query, [
      semester,
      schoolYear,
      branch || null,
    ]);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching renewed scholars:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const uploadFileToDB = async (req, res) => {
  console.log("Call this");
  const client = await pool.connect();
  console.log("Upload to db: ", req.body, req.file);
  try {
    // ✅ Access form-data fields
    const { disb_detail_id, disbursement_amount } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!disb_detail_id) {
      return res.status(400).json({ error: "Missing disb_detail_id" });
    }

    const bucketId = process.env.B2_BUCKET_ID;
    const bucketName = process.env.B2_BUCKET_NAME;
    const fileName = `${uuidv4()}_${file.originalname}`;

    await client.query("BEGIN");

    // ✅ Upload to B2
    await uploadBuffer(file.buffer, fileName, bucketId);
    const fileUrl = `https://f002.backblazeb2.com/file/${bucketName}/${fileName}`;

    // ✅ Update disbursement amount
    if (disbursement_amount != null) {
      await client.query(
        `
          UPDATE disbursement_detail 
          SET disbursement_amount = $1 
          WHERE disb_detail_id = $2
          `,
        [disbursement_amount, disb_detail_id]
      );
    }

    // ✅ Insert file metadata into DB
    const insertResult = await client.query(
      `
        INSERT INTO disbursement_file (
          disb_detail_id, file_name, file_type, size, upload_at, file_url
        )
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING file_id
        `,
      [
        disb_detail_id,
        fileName,
        file.mimetype || "application/pdf",
        file.size,
        fileUrl,
      ]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "File uploaded and saved successfully",
      file: {
        file_id: insertResult.rows[0].file_id,
        file_name: fileName,
        file_type: file.mimetype,
        size: file.size,
        upload_at: new Date(),
        file_url: fileUrl,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Upload error:", error);
    res.status(500).json({
      message: "Failed to upload and save data",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  fetchScholarForInvoice,
  uploadFileToDB,
};
