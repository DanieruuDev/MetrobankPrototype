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

      // 2. Get disbursement details that will be updated
      const getDisbursementDetailsQuery = `
        SELECT dd.disb_detail_id, dd.disbursement_id, dd.disbursement_amount, 
               rs.student_id, rs.renewal_id
        FROM disbursement_detail dd
        JOIN disbursement_schedule ds ON ds.disb_detail_id = dd.disb_detail_id
        JOIN disbursement_tracking dt ON dt.disbursement_id = dd.disbursement_id
        JOIN renewal_scholar rs ON rs.renewal_id = dt.renewal_id
        WHERE ds.sched_id = $1
      `;
      const disbursementDetails = await client.query(
        getDisbursementDetailsQuery,
        [sched_id]
      );

      // 3. Create disbursement_tracking records for each student if they don't exist
      const trackingRecords = [];
      for (const detail of disbursementDetails.rows) {
        // Check if disbursement_tracking already exists for this renewal_id
        const existingTracking = await client.query(
          `SELECT disbursement_id FROM disbursement_tracking WHERE renewal_id = $1`,
          [detail.renewal_id]
        );

        let disbursementId = detail.disbursement_id;

        if (existingTracking.rowCount === 0) {
          // Create new disbursement_tracking record
          const createTrackingQuery = `
            INSERT INTO disbursement_tracking (renewal_id)
            VALUES ($1)
            RETURNING disbursement_id
          `;
          const trackingResult = await client.query(createTrackingQuery, [
            detail.renewal_id,
          ]);
          disbursementId = trackingResult.rows[0].disbursement_id;
          trackingRecords.push(disbursementId);
        }

        // Update disbursement_detail to link to the correct disbursement_id
        await client.query(
          `UPDATE disbursement_detail SET disbursement_id = $1 WHERE disb_detail_id = $2`,
          [disbursementId, detail.disb_detail_id]
        );
      }

      // 4. Update disbursement_detail status
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
        created_tracking_records: trackingRecords.length,
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
