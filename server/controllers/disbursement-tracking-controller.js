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
  const { disb_sched_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM vw_tracking_detailed WHERE disb_sched_id = $1`,
      [disb_sched_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching disbursement detailed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markCompleteSchedule = async (req, res) => {
  const { disb_sched_id } = req.params;

  try {
    if (!disb_sched_id || isNaN(disb_sched_id)) {
      return res
        .status(400)
        .json({ message: "Invalid disbursement schedule ID." });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update disbursement_schedule and return only updated fields
      const updateScheduleQuery = `
          UPDATE disbursement_schedule
          SET status = 'Completed', updated_at = NOW()
          WHERE disb_sched_id = $1
          RETURNING disb_sched_id, status, updated_at;
        `;
      const scheduleResult = await client.query(updateScheduleQuery, [
        disb_sched_id,
      ]);

      if (scheduleResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ message: "Disbursement schedule not found." });
      }

      // Update disbursement_detail and return only updated fields
      const updateDetailQuery = `
          UPDATE disbursement_detail
          SET disbursement_status = 'Completed',
              completed_at = NOW()
          WHERE disb_sched_id = $1
          RETURNING disb_detail_id, disbursement_status, completed_at;
        `;
      const detailResult = await client.query(updateDetailQuery, [
        disb_sched_id,
      ]);

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Marked as completed.",
        updated_schedule: scheduleResult.rows[0],
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
