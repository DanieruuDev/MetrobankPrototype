const pool = require("../database/dbConnect.js");
const { uploadBuffer } = require("../utils/b2");
const { v4: uuidv4 } = require("uuid");

//Eligible for disbursement
const fetchEligibleScholar = async (req, res) => {
  const { schoolYear, semester } = req.params;
  const { branch, disbursement_type_id } = req.query;

  let baseQuery = `
    SELECT * FROM vw_combined_eligible_scholar_invoice
    WHERE school_year = $1
      AND semester = $2
  `;

  const params = [schoolYear, semester];
  let paramIndex = 3;

  if (branch && branch !== "null" && branch !== "undefined") {
    baseQuery += ` AND campus = $${paramIndex++}`;
    params.push(branch);
  }

  if (disbursement_type_id) {
    baseQuery += ` AND disbursement_type_id = $${paramIndex++}`;
    params.push(disbursement_type_id);
  }
  console.log("branch", branch);

  const result = await pool.query(baseQuery, params);
  res.json(result.rows);
};

//tuition-invoice only
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

const uploadSemestralAllowance = async (req, res) => {
  const { data } = req.body; // expecting array of { disb_detail_id, disbursement_amount }

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request must include a non-empty array of allowance data.",
    });
  }

  const client = await pool.connect();

  // Split valid vs invalid entries
  const validItems = data.filter(
    (item) =>
      item.disb_detail_id &&
      typeof item.disbursement_amount === "number" &&
      item.disbursement_amount >= 0 &&
      item.disbursement_amount <= 1000000
  );

  const skippedItems = data.filter(
    (item) =>
      !item.disb_detail_id ||
      typeof item.disbursement_amount !== "number" ||
      item.disbursement_amount < 0 ||
      item.disbursement_amount > 1000000
  );

  if (validItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No valid records found to update.",
      skippedCount: skippedItems.length,
    });
  }

  try {
    await client.query("BEGIN");

    for (const { disb_detail_id, disbursement_amount } of validItems) {
      const result = await client.query(
        `
        UPDATE disbursement_detail
        SET disbursement_amount = $1
        WHERE disb_detail_id = $2
        RETURNING disb_detail_id;
        `,
        [disbursement_amount, disb_detail_id]
      );

      // Optional: if no record found, log it (don’t fail the whole batch)
      if (result.rowCount === 0) {
        console.warn(
          `⚠️ No record found for disb_detail_id: ${disb_detail_id}`
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Semestral allowances updated successfully.",
      updatedCount: validItems.length,
      skippedCount: skippedItems.length,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating allowances:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating allowances.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// Update thesis fee amounts without file upload
const updateThesisFeeAmounts = async (req, res) => {
  const { data } = req.body; // expecting array of { disb_detail_id, disbursement_amount }
  const client = await pool.connect();

  try {
    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "No disbursement data provided." });
    }

    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid data format." });
    }

    await client.query("BEGIN");

    let updatedCount = 0;

    for (const { disb_detail_id, disbursement_amount } of parsedData) {
      await client.query(
        `
        UPDATE disbursement_detail
        SET disbursement_amount = $1
        WHERE disb_detail_id = $2
        `,
        [disbursement_amount, disb_detail_id]
      );
      updatedCount++;
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Thesis Fee amounts updated successfully.",
      updatedCount,
    });
  } catch (error) {
    console.error("❌ updateThesisFeeAmounts error:", error);
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Failed to update thesis fee amounts.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const uploadThesisFee = async (req, res) => {
  const file = req.file;
  const { data } = req.body; // expecting array of { disb_detail_id, disbursement_amount }
  const client = await pool.connect();
  const fileType = file.mimetype?.includes("spreadsheet")
    ? "application/vnd.ms-excel"
    : file.mimetype?.slice(0, 50) || "application/octet-stream";
  console.log(fileType);
  try {
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No Excel file uploaded." });
    }

    if (!data) {
      return res
        .status(400)
        .json({ success: false, message: "No disbursement data provided." });
    }

    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Disbursement data must be a non-empty array.",
      });
    }

    await client.query("BEGIN");

    // === 1️⃣ Prepare filename with automatic (1), (2), (3) ===
    const bucketId = process.env.B2_BUCKET_ID;
    const bucketName = process.env.B2_BUCKET_NAME;

    const originalExt = file.originalname.split(".").pop();
    const baseName = file.originalname.replace(/\.[^/.]+$/, "");
    let safeFileName = file.originalname;
    let counter = 1;

    // Check DB for existing files with same name
    while (true) {
      const { rows } = await client.query(
        `SELECT 1 FROM disbursement_file WHERE file_name = $1 LIMIT 1`,
        [safeFileName]
      );
      if (rows.length === 0) break; // name is unique

      safeFileName = `${baseName} (${counter}).${originalExt}`;
      counter++;

      if (safeFileName.length > 50) {
        safeFileName = safeFileName.slice(0, 47) + ".xlsx";
        break; // avoid overflow
      }
    }

    // === 2️⃣ Upload file to Backblaze ===
    await uploadBuffer(file.buffer, safeFileName, bucketId);
    const fileUrl = `https://f002.backblazeb2.com/file/${bucketName}/${safeFileName}`;

    // === 3️⃣ Insert Excel file reference ===
    const { rows: insertedExcel } = await client.query(
      `
      INSERT INTO disbursement_file (disb_detail_id, file_name, file_type, size, upload_at, file_url)
      VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING file_id
      `,
      [parsedData[0].disb_detail_id, safeFileName, fileType, file.size, fileUrl]
    );

    const excelFileId = insertedExcel[0].file_id;

    // === 4️⃣ Update all affected students ===
    let updatedCount = 0;

    for (const { disb_detail_id, disbursement_amount } of parsedData) {
      await client.query(
        `
        UPDATE disbursement_detail
        SET disbursement_amount = $1
        WHERE disb_detail_id = $2
        `,
        [disbursement_amount, disb_detail_id]
      );

      await client.query(
        `
        INSERT INTO disbursement_file (disb_detail_id, file_name, file_type, size, upload_at, file_url)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        ON CONFLICT (disb_detail_id, file_name)
        DO NOTHING
        `,
        [disb_detail_id, safeFileName, fileType, file.size, fileUrl]
      );

      updatedCount++;
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message:
        "Thesis Fee Excel uploaded and disbursement details updated successfully.",
      updatedCount,
      file: {
        file_id: excelFileId,
        file_name: safeFileName,
        file_url: fileUrl,
      },
    });
  } catch (error) {
    console.error("❌ uploadThesisFee error:", error);
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Failed to upload thesis fee and update students.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const fetchAcademicAwardEligible = async (req, res) => {
  try {
    const { school_year, campus_name } = req.query;

    if (!school_year) {
      return res
        .status(400)
        .json({ message: "school_year parameter is required" });
    }

    // 🧩 Build base query dynamically (no ORDER BY yet)
    let query = `
      SELECT DISTINCT ON (combined.disbursement_id)
        renewal_id,
        student_id,
        scholar_name,
        campus,
        program,
        year_level,
        semester,
        school_year,
        disbursement_id,
        disbursement_type_id,
        disbursement_label,
        disbursement_status,
        disbursement_amount,

        -- 🧩 Check if scholar already has Academic Award
        EXISTS (
          SELECT 1
          FROM disbursement_detail dd
          WHERE dd.disbursement_id = combined.disbursement_id
            AND dd.disbursement_type_id = 5
        ) AS has_academic_award,

        CASE
          WHEN disbursement_amount IS NULL OR disbursement_amount = 0 THEN false
          ELSE true
        END AS is_amount_set

      FROM public.vw_combined_eligible_scholar_invoice AS combined
      WHERE year_level = $1
        AND semester = $2
        AND school_year = $3
    `;

    const values = ["4th Year", "1st Semester", school_year];

    // ✅ If campus_name is provided, add it before ORDER BY
    if (campus_name && campus_name.trim() !== "") {
      query += ` AND campus = $4 `;
      values.push(campus_name.trim());
    }

    // ✅ Now safely add ORDER BY at the very end
    query += ` ORDER BY combined.disbursement_id;`;

    const { rows } = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("❌ Error fetching academic award eligible scholars:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching eligible scholars",
    });
  }
};

const addAcademicAwardStudent = async (req, res) => {
  try {
    const { scholars } = req.body; // Expecting array of disbursement_id
    console.log(scholars);
    if (!Array.isArray(scholars) || scholars.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No scholars provided.",
      });
    }

    // Step 1️⃣ — Check for existing disbursement entries of type_id 5
    const checkQuery = `
      SELECT disbursement_id
      FROM disbursement_detail
      WHERE disbursement_type_id = 5
        AND disbursement_id = ANY($1)
    `;
    const checkResult = await pool.query(checkQuery, [scholars]);

    if (checkResult.rows.length > 0) {
      const existingIds = checkResult.rows.map((r) => r.disbursement_id);
      return res.status(409).json({
        success: false,
        message: `Some scholars already have Academic Award disbursement entries.`,
        duplicates: existingIds,
      });
    }

    // Step 2️⃣ — Safe insert (no conflicts possible now)
    const values = scholars.map((id) => `(${id}, 5, 'Not Started')`).join(", ");
    const insertQuery = `
      INSERT INTO disbursement_detail (disbursement_id, disbursement_type_id, disbursement_status)
      VALUES ${values}
      RETURNING disb_detail_id, disbursement_id;
    `;

    const insertResult = await pool.query(insertQuery);

    return res.status(200).json({
      success: true,
      insertedCount: insertResult.rowCount,
      message: `${insertResult.rowCount} scholar(s) successfully added for Academic Excellence Award.`,
      data: insertResult.rows,
    });
  } catch (error) {
    console.error("❌ Error adding academic award scholars:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding academic award scholars.",
    });
  }
};

const removeAcademicAwardStudent = async (req, res) => {
  const { disb_detail_id } = req.body;

  try {
    if (!disb_detail_id) {
      return res
        .status(400)
        .json({ message: "Missing disbursement detail ID." });
    }

    const existing = await pool.query(
      `SELECT * FROM disbursement_detail WHERE disb_detail_id = $1`,
      [disb_detail_id]
    );

    if (existing.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Disbursement record not found." });
    }

    await pool.query(
      `DELETE FROM disbursement_detail WHERE disb_detail_id = $1`,
      [disb_detail_id]
    );

    res
      .status(200)
      .json({ success: true, message: "Academic award removed successfully." });
  } catch (error) {
    console.error("Error removing academic award:", error);
    res
      .status(500)
      .json({ message: "Internal server error while removing award." });
  }
};
const uploadAcademicAward = async (req, res) => {
  const client = await pool.connect();

  try {
    const { disb_detail_ids = [], amounts = [] } = req.body;
    const files = req.files || [];
    const bucketId = process.env.B2_BUCKET_ID;

    console.log("🧾 Body:", req.body);
    console.log("📂 Files:", files);

    if (!disb_detail_ids.length) {
      return res.status(400).json({
        message: "No records received.",
      });
    }

    const uploadedRecords = [];

    // Loop through each record
    for (let i = 0; i < disb_detail_ids.length; i++) {
      const disb_detail_id = Number(disb_detail_ids[i]);
      const amount = Number(amounts[i]);
      const file = files[i];

      if (!file) continue;

      // 🧩 Use the original file name (optionally add timestamp to prevent collision)
      const fileName = `${Date.now()}_${file.originalname}`;

      // 🆙 Upload to Backblaze B2
      const uploadResult = await uploadBuffer(file.buffer, fileName, bucketId);

      // Construct the public file URL
      const fileUrl = `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;

      // 🧩 Update the student’s disbursement record
      await client.query(
        `
        UPDATE disbursement_detail
        SET disbursement_amount = $1
        WHERE disb_detail_id = $2
      `,
        [amount, disb_detail_id]
      );

      // 🧩 Insert uploaded file metadata into disbursement_file
      await client.query(
        `
        INSERT INTO disbursement_file (disb_detail_id, file_name, file_type, size, upload_at)
        VALUES ($1, $2, $3, $4, NOW())
      `,
        [disb_detail_id, fileName, file.mimetype, file.size]
      );

      uploadedRecords.push({
        disb_detail_id,
        amount,
        file_name: fileName,
        file_url: fileUrl,
      });
    }

    res.status(200).json({
      message: "✅ Academic awards successfully uploaded.",
      uploadedRecords,
    });
  } catch (err) {
    console.error("❌ uploadAcademicAward error:", err);
    res.status(500).json({
      message: "Server error while uploading academic awards.",
      error: err.message,
    });
  } finally {
    client.release();
  }
};

const addInternshipAllowance = async (req, res) => {
  const { coveredDate, schoolYear } = req.body;
  const client = await pool.connect();

  try {
    // 🧩 Validate input first
    if (!coveredDate || !schoolYear) {
      return res.status(400).json({
        message: "Missing required fields: coveredDate or schoolYear",
      });
    }

    console.log("🟢 Adding internship allowance for:", {
      coveredDate,
      schoolYear,
    });

    // 1️⃣ Fetch eligible disbursement IDs
    const query = `
      SELECT DISTINCT ON (combined.disbursement_id)
        combined.disbursement_id
      FROM public.vw_combined_eligible_scholar_invoice AS combined
      WHERE year_level = $1
        AND semester = $2
        AND school_year = $3
      ORDER BY combined.disbursement_id;
    `;

    const findEligible = await client.query(query, [
      "4th Year",
      "1st Semester",
      schoolYear,
    ]);

    const ids = findEligible.rows;

    // 🛑 If no eligible scholars found, stop right away
    if (ids.length === 0) {
      console.warn("⚠️ No eligible disbursement IDs found.");
      return res.status(404).json({
        message:
          "No eligible students found for internship allowance generation.",
        total_inserted: 0,
      });
    }
    console.log(ids);

    const insertedRows = [];

    // 2️⃣ Insert only if record doesn’t exist
    for (const { disbursement_id } of ids) {
      const exists = await client.query(
        `
        SELECT 1 FROM disbursement_detail 
        WHERE disbursement_id = $1 
          AND disbursement_type_id = 4 
          AND covered_date = $2
        LIMIT 1;
        `,
        [disbursement_id, coveredDate]
      );
      console.log(disbursement_id);
      if (exists.rowCount === 0) {
        const insertResult = await client.query(
          `
          INSERT INTO disbursement_detail 
            (disbursement_id, disbursement_type_id, covered_date)
          VALUES ($1, 4, $2)
          RETURNING disb_detail_id, disbursement_id, covered_date;
          `,
          [disbursement_id, coveredDate]
        );

        insertedRows.push(insertResult.rows[0]);
      }
    }

    // 🛑 If none were inserted (already existing or no valid ones)
    if (insertedRows.length === 0) {
      console.warn("⚠️ No new internship allowance records were inserted.");
      return res.status(409).json({
        message:
          "No new records were added. All eligible students already have entries for this covered date.",
        total_inserted: 0,
      });
    }

    // ✅ Success
    return res.status(200).json({
      message: "Internship Allowance entries added successfully.",
      total_inserted: insertedRows.length,
      details: insertedRows,
    });
  } catch (error) {
    console.error("❌ Error adding internship allowance:", error);
    return res.status(500).json({ message: "Server error", error });
  } finally {
    client.release();
  }
};

const deleteInternshipAllowance = async (req, res) => {
  const { coveredDate } = req.body; // expects array of disb_detail_id values
  console.log(coveredDate);
  const client = await pool.connect();

  try {
    if (!coveredDate) {
      return res.status(400).json({ message: "No coveredDate provided." });
    }

    // Delete only internship allowance entries (type_id = 4)
    const deleteQuery = `
      DELETE FROM disbursement_detail
      WHERE covered_date = $1
      AND disbursement_type_id = 4
      RETURNING disb_detail_id, disbursement_id, covered_date;
    `;

    const result = await client.query(deleteQuery, [coveredDate]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: result.rows,
      });
    }

    return res.status(200).json({
      message: "Internship allowance entries deleted successfully.",
      total_deleted: result.rows.length,
      deleted_details: result.rows,
    });
  } catch (error) {
    console.error("Error deleting internship allowance:", error);
    return res.status(500).json({ message: "Server error", error });
  } finally {
    client.release();
  }
};

const fetchEligibleInternshipAllowance = async (req, res) => {
  const { school_year, coveredDate } = req.query;

  try {
    if (!school_year || !coveredDate) {
      return res
        .status(400)
        .json({ message: "Missing school_year or coveredDate." });
    }

    const query = `
    SELECT * 
FROM vw_internship_disbursement_eligible
WHERE school_year = $1
          AND yr_lvl = 4
          AND semester = 1
          AND disbursement_type_id = 4
          AND covered_date = $2;  
    `;

    const { rows } = await pool.query(query, [school_year, coveredDate]);

    // ✅ Always return 200, even if empty
    return res.status(200).json({
      message: "Eligible internship allowance records fetched successfully.",
      total: rows.length,
      data: rows, // empty array if nothing found
    });
  } catch (error) {
    console.error("Error fetching internship allowance records:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const fetchCoveredDate = async (req, res) => {
  const { school_year } = req.query;

  try {
    if (!school_year) {
      return res.status(400).json({ message: "Missing school_year." });
    }

    const query = `
  SELECT covered_date
  FROM (
    SELECT DISTINCT dd.covered_date
    FROM renewal_scholar rs
    JOIN disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
    JOIN disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
    JOIN masterlist m ON m.student_id = rs.student_id
    WHERE 
        rs.school_year = $1
        AND rs.yr_lvl = '4'
        AND rs.semester = 1
        AND dd.disbursement_type_id = 4
        AND dd.covered_date IS NOT NULL
  ) AS sub
  ORDER BY
    to_date(
      regexp_replace(sub.covered_date, '^([A-Za-z]{3}) ([0-9]{1,2}).*, ([0-9]{4})$', '\\1 \\2, \\3'),
      'Mon DD, YYYY'
    ) DESC;
`;

    const { rows } = await pool.query(query, [school_year]);

    return res.status(200).json({
      message: "Covered dates fetched successfully.",
      total: rows.length,
      data: rows.map((r) => r.covered_date),
    });
  } catch (error) {
    console.error("Error fetching covered dates:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

const uploadInternshipAllowance = async (req, res) => {
  const file = req.file;
  const { data } = req.body; // expecting array [{ disb_detail_id, covered_date, amount }]
  const client = await pool.connect();

  try {
    if (!file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });

    if (!data)
      return res
        .status(400)
        .json({ success: false, message: "No internship data provided." });

    const parsedData = JSON.parse(data);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Internship data must be a non-empty array.",
      });
    }

    await client.query("BEGIN");

    // === 1️⃣ Determine File Type ===
    const fileType = file.mimetype?.includes("spreadsheet")
      ? "application/vnd.ms-excel"
      : file.mimetype?.slice(0, 50) || "application/octet-stream";

    // === 2️⃣ Generate Safe Filename (avoid duplicates) ===
    const bucketId = process.env.B2_BUCKET_ID;
    const bucketName = process.env.B2_BUCKET_NAME;
    const originalExt = file.originalname.split(".").pop();
    const baseName = file.originalname.replace(/\.[^/.]+$/, "");
    let safeFileName = file.originalname;
    let counter = 1;

    // Check DB for existing file name conflict
    while (true) {
      const { rows } = await client.query(
        `SELECT 1 FROM disbursement_file WHERE file_name = $1 LIMIT 1`,
        [safeFileName]
      );
      if (rows.length === 0) break; // unique name
      safeFileName = `${baseName} (${counter}).${originalExt}`;
      counter++;
      if (safeFileName.length > 80) {
        safeFileName = safeFileName.slice(0, 77) + ".xlsx";
        break;
      }
    }

    // === 3️⃣ Upload to Backblaze ===
    await uploadBuffer(file.buffer, safeFileName, bucketId);
    const fileUrl = `https://f002.backblazeb2.com/file/${bucketName}/${safeFileName}`;

    // === 4️⃣ Insert File Record & Update Disbursement ===
    let updatedCount = 0;
    let insertedFileId = null;

    for (const { disb_detail_id, amount } of parsedData) {
      // Update disbursement amount
      await client.query(
        `
        UPDATE disbursement_detail
        SET disbursement_amount = $1
        WHERE disb_detail_id = $2
        `,
        [amount, disb_detail_id]
      );

      // Insert or ignore duplicate file
      const { rows } = await client.query(
        `
        INSERT INTO disbursement_file (disb_detail_id, file_name, file_type, size, upload_at, file_url)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        ON CONFLICT (disb_detail_id, file_name) DO NOTHING
        RETURNING file_id
        `,
        [disb_detail_id, safeFileName, fileType, file.size, fileUrl]
      );

      if (rows.length > 0) insertedFileId = rows[0].file_id;

      updatedCount++;
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Internship allowance file uploaded successfully.",
      updatedCount,
      file: {
        file_id: insertedFileId,
        file_name: safeFileName,
        file_url: fileUrl,
      },
    });
  } catch (error) {
    console.error("❌ uploadInternshipAllowance error:", error);
    await client.query("ROLLBACK");
    return res.status(500).json({
      success: false,
      message: "Failed to upload internship allowance file.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  fetchEligibleScholar,
  uploadFileToDB,
  uploadSemestralAllowance,
  updateThesisFeeAmounts,
  uploadThesisFee,
  fetchAcademicAwardEligible,
  addAcademicAwardStudent,
  removeAcademicAwardStudent,
  uploadAcademicAward,
  addInternshipAllowance,
  deleteInternshipAllowance,
  fetchEligibleInternshipAllowance,
  fetchCoveredDate,
  uploadInternshipAllowance,
};
