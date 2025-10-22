const pool = require("../database/dbConnect.js");

const getTrackingSummary = async (req, res) => {
  const { sy_code, semester_code } = req.params;

  // Optional: Validate inputs
  if (!sy_code || !semester_code) {
    return res
      .status(400)
      .json({ error: "Missing sy_code or semester_code in query params." });
  }
  // change to only get completed
  try {
    const result = await pool.query(
      `SELECT * FROM vw_tracking_summary 
         WHERE sy_code = $1 AND semester_code = $2`,
      [sy_code, semester_code]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching disbursement summary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTrackingDetailed = async (req, res) => {
  const { sched_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM vw_tracking_detailed WHERE sched_id = $1`,
      [sched_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching disbursement detailed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markCompleteSchedule = async (req, res) => {
  const { sched_id } = req.params;
  const { workflow_id, updates } = req.body;
  const client = await pool.connect();

  if (!workflow_id) {
    return res.status(400).json({ message: "Invalid workflow_id." });
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return res
      .status(400)
      .json({ message: "No disbursement updates provided." });
  }

  try {
    const schedIdNum = parseInt(sched_id);
    if (isNaN(schedIdNum)) {
      return res.status(400).json({ message: "Invalid schedule ID." });
    }

    await client.query("BEGIN");

    // ✅ 1. Mark the event schedule as completed
    const eventResult = await client.query(
      `
      UPDATE event_schedule
      SET schedule_status = 'Completed',
          edit_at = NOW()
      WHERE sched_id = $1
      RETURNING sched_id, schedule_status, edit_at;
      `,
      [schedIdNum]
    );

    if (eventResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Event schedule not found." });
    }

    // ✅ 2. Update related disbursement details to Completed
    // Map for easy lookup of disb_detail_ids from frontend
    const validDetailIds = updates
      .map((u) => Number(u.disb_detail_id))
      .filter(Boolean);

    if (validDetailIds.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "No valid disbursement detail IDs provided.",
      });
    }

    // ✅ 3. Bulk update: mark all provided disb_detail_ids as completed
    const updateQuery = `
      UPDATE disbursement_detail
      SET disbursement_status = 'Completed',
          completed_at = NOW()
      WHERE disb_detail_id = ANY($1::int[])
    `;
    await client.query(updateQuery, [validDetailIds]);

    // ✅ 4. Commit the transaction
    await client.query("COMMIT");

    res.status(200).json({
      message:
        "✅ Schedule and disbursements successfully marked as completed.",
      updated_event: eventResult.rows[0],
      updated_count: validDetailIds.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed:", err);
    res.status(500).json({
      message: "Transaction failed.",
      error: err.message,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getTrackingSummary,
  getTrackingDetailed,
  markCompleteSchedule,
};
