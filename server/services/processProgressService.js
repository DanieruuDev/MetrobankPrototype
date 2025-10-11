const pool = require("../database/dbConnect.js");

async function startProcess(sy_code, semester_code) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Check if process already exists
    const existing = await client.query(
      `SELECT 1 FROM disbursement_process WHERE sy_code = $1 AND semester_code = $2`,
      [sy_code, semester_code]
    );

    if (existing.rowCount > 0) {
      throw new Error(
        "A disbursement process for this school year and semester already exists."
      );
    }

    // 2️⃣ Call stored procedure (atomic initialization)
    await client.query("CALL sp_start_disbursement_process($1, $2)", [
      sy_code,
      semester_code,
    ]);

    await client.query("COMMIT");

    return {
      success: true,
      message: `Disbursement process started successfully for SY ${sy_code}, Semester ${semester_code}.`,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.message.includes("already exists")) {
      throw new Error(
        "Process already exists for that school year and semester."
      );
    }

    throw new Error(`Failed to start disbursement process: ${error.message}`);
  } finally {
    client.release();
  }
}

module.exports = { startProcess };
