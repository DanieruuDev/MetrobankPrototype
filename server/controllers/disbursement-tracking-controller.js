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
  const client = await pool.connect();
  try {
    if (!sched_id || isNaN(sched_id)) {
      return res.status(400).json({ message: "Invalid schedule ID." });
    }

    try {
      await client.query("BEGIN");
      2;

      // 1. Update event_schedule
      const updateEventQuery = `
        UPDATE event_schedule
        SET schedule_status = 'Completed', edit_at = NOW()
        WHERE sched_id = $1
        RETURNING sched_id, schedule_status, edit_at;
      `;
      const eventResult = await client.query(updateEventQuery, [sched_id]);

      if (eventResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Event schedule not found." });
      }

      const updateDetailQuery = `
  UPDATE disbursement_detail
  SET disbursement_status = 'Completed', completed_at = NOW()
  WHERE disb_detail_id IN (
    SELECT disb_detail_id FROM disbursement_schedule WHERE sched_id = $1
  )
  RETURNING disb_detail_id, disbursement_status, completed_at;
`;
      const detailResult = await client.query(updateDetailQuery, [sched_id]);

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Schedule and related disbursements marked as completed.",
        updated_event: eventResult.rows[0],
        updated_details: detailResult.rows,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Transaction failed:", err);
      return res
        .status(500)
        .json({ message: "Transaction failed.", error: err.message });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

module.exports = {
  getTrackingSummary,
  getTrackingDetailed,
  markCompleteSchedule,
};
