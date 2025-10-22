const pool = require("../database/dbConnect.js");

const uploadStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { process_id } = req.body;

    if (!process_id) {
      return res.status(400).json({ error: "process_id is required." });
    }

    await client.query("BEGIN");

    console.log("id", process_id);
    // 1️⃣ Get process details (school_year, semester)
    const process = await client.query(
      `
        SELECT sy_code, semester_code
        FROM disbursement_process dp
        WHERE process_id = $1
      `,
      [process_id]
    );

    console.log("rows", process.rows[0]);
    if (process.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: `Process ID ${process_id} not found.` });
    }
    const formatSchoolYear = (syCode) => {
      const syString = syCode.toString(); // Convert to string if not already
      if (syString.length !== 8) {
        return syString; // Return as-is if not 8 digits
      }
      const startYear = syString.slice(0, 4); // First 4 digits
      const endYear = syString.slice(4); // Last 4 digits
      return `${startYear}-${endYear}`; // Join with hyphen
    };
    const { sy_code, semester_code } = process.rows[0];
    console.log(sy_code, semester_code);
    // 2️⃣ Get all STI branches for this SY/Sem

    const { rows: stiBranches } = await client.query(
      `
        SELECT DISTINCT rs.campus_name AS branch_name
        FROM renewal_scholar rs
        WHERE rs.school_year = $1
          AND rs.semester = $2
      `,
      [sy_code, semester_code]
    );
    console.log(stiBranches);

    // 3️⃣ Define disbursement types
    const stiDisbursementTypes = [1, 3, 5];
    const metrobankDisbursementTypes = [2, 4];

    const created = [];
    const skipped = [];

    // 4️⃣ Handle STI records
    for (const disbursement_type_id of stiDisbursementTypes) {
      for (const { branch_name } of stiBranches) {
        const { rowCount: exists } = await client.query(
          `
            SELECT 1 FROM upload_status
            WHERE program_source = 'STI'
              AND branch_name = $1
              AND process_id = $2
              AND disbursement_type_id = $3
          `,
          [branch_name, process_id, disbursement_type_id]
        );

        if (exists > 0) {
          skipped.push({
            program_source: "STI",
            branch_name,
            disbursement_type_id,
          });
          continue;
        }

        await client.query(
          `
            INSERT INTO upload_status (
              program_source,
              branch_name,
              process_id,
              disbursement_type_id,
              is_completed,
              completed_at,
              updated_at
            )
            VALUES ('STI', $1, $2, $3, FALSE, NULL, NOW())
          `,
          [branch_name, process_id, disbursement_type_id]
        );

        created.push({
          program_source: "STI",
          branch_name,
          disbursement_type_id,
        });
      }
    }

    // 5️⃣ Handle METROBANK records
    for (const disbursement_type_id of metrobankDisbursementTypes) {
      const { rowCount: exists } = await client.query(
        `
          SELECT 1 FROM upload_status
          WHERE program_source = 'METROBANK'
            AND branch_name = '-'
            AND process_id = $1
            AND disbursement_type_id = $2
        `,
        [process_id, disbursement_type_id]
      );

      if (exists > 0) {
        skipped.push({
          program_source: "METROBANK",
          branch_name: "-",
          disbursement_type_id,
        });
        continue;
      }

      await client.query(
        `
          INSERT INTO upload_status (
            program_source,
            branch_name,
            process_id,
            disbursement_type_id,
            is_completed,
            completed_at,
            updated_at
          )
          VALUES ('METROBANK', '-', $1, $2, FALSE, NULL, NOW())
        `,
        [process_id, disbursement_type_id]
      );

      created.push({
        program_source: "METROBANK",
        branch_name: "-",
        disbursement_type_id,
      });
    }

    await client.query("COMMIT");

    console.log(
      `✅ Upload status check completed for process_id: ${process_id}`
    );
    res.status(200).json({
      message: `Upload status process completed for process_id: ${process_id}`,
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error in uploadStatus controller:", error);
    res.status(500).json({
      error: "An error occurred while creating upload status.",
      details: error.message,
    });
  } finally {
    client.release();
  }
};
const completeStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { program_source, branch_name, process_id, disbursement_type_id } =
      req.body;

    // 🧩 Validation
    if (!program_source || !process_id || !disbursement_type_id) {
      return res.status(400).json({
        error:
          "Missing required fields: program_source, process_id, or disbursement_type_id",
      });
    }

    // 🧩 Auto-handle METROBANK branch name
    const effectiveBranchName =
      program_source === "METROBANK" ? "-" : branch_name;

    if (!effectiveBranchName) {
      return res.status(400).json({
        error: "branch_name is required for STI records.",
      });
    }

    console.log(
      `🔹 Completing upload status for: ${program_source} | ${effectiveBranchName} | ${process_id} | ${disbursement_type_id}`
    );

    await client.query("BEGIN");

    // ✅ Update existing record to completed
    const result = await client.query(
      `
      UPDATE upload_status
      SET is_completed = TRUE,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE program_source = $1
        AND branch_name = $2
        AND process_id = $3
        AND disbursement_type_id = $4
      RETURNING *;
      `,
      [program_source, effectiveBranchName, process_id, disbursement_type_id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      console.warn("⚠️ No matching record found to complete.");
      return res.status(404).json({
        error: "No matching upload status found for provided details.",
        details: {
          program_source,
          branch_name,
          process_id,
          disbursement_type_id,
        },
      });
    }

    await client.query("COMMIT");

    console.log("✅ Upload status marked as completed:", result.rows[0]);
    return res.status(200).json({
      message: "Upload status successfully marked as completed.",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error completing upload status:", error);
    return res.status(500).json({
      error: "Failed to mark upload status as completed.",
      details: error.message,
    });
  } finally {
    client.release();
  }
};
const fetchUploadStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { program_source, branch_name, process_id, disbursement_type_id } =
      req.query;

    // 🧩 Validate required field
    if (!process_id) {
      return res.status(400).json({
        error: "process_id is required.",
      });
    }

    // 🧩 Normalize METROBANK branch
    const effectiveBranchName =
      program_source === "METROBANK" ? "-" : branch_name;

    console.log("🔍 Fetching upload_status for:", {
      program_source,
      branch_name: effectiveBranchName,
      process_id,
      disbursement_type_id,
    });

    // 🧩 Base query
    let query = `
      SELECT 
        program_source,
        branch_name,
        process_id,
        disbursement_type_id,
        is_completed,
        completed_at,
        updated_at
      FROM upload_status
      WHERE process_id = $1
    `;
    const params = [process_id];
    let paramIndex = 2;

    // 🧩 Optional filters (only add branch_name if it's NOT "All")
    if (program_source) {
      query += ` AND program_source = $${paramIndex++}`;
      params.push(program_source);
    }

    // ✅ If branch_name is provided and NOT "All"
    if (effectiveBranchName && effectiveBranchName !== "All") {
      query += ` AND branch_name = $${paramIndex++}`;
      params.push(effectiveBranchName);
    }

    if (disbursement_type_id) {
      query += ` AND disbursement_type_id = $${paramIndex++}`;
      params.push(disbursement_type_id);
    }

    query += `
      ORDER BY program_source ASC, branch_name ASC, disbursement_type_id ASC;
    `;

    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      console.warn("⚠️ No upload status found with given filters.");
      return res.status(404).json({
        message: "No upload status found for given criteria.",
        filters: {
          program_source,
          branch_name,
          process_id,
          disbursement_type_id,
        },
      });
    }

    console.log(`✅ Found ${rows.length} matching record(s).`);
    res.status(200).json({
      message: "Upload status fetched successfully.",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("❌ Error fetching upload status:", error);
    res.status(500).json({
      error: "An error occurred while fetching upload status.",
      details: error.message,
    });
  } finally {
    client.release();
  }
};

module.exports = { uploadStatus, completeStatus, fetchUploadStatus };
