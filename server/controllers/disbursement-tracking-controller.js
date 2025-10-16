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
  console.log(updates);
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

    // 1️⃣ Mark the event schedule as completed
    const eventResult = await client.query(
      `
      UPDATE event_schedule
      SET schedule_status = 'Completed', edit_at = NOW()
      WHERE sched_id = $1
      RETURNING sched_id, schedule_status, edit_at;
      `,
      [schedIdNum]
    );

    if (eventResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Event schedule not found." });
    }

    // 2️⃣ Fetch all related disbursement details for this schedule
    const disbQuery = `
      SELECT dd.disb_detail_id, dd.disbursement_id, dd.disbursement_amount,
             rs.student_id, rs.renewal_id, ds.disbursement_type_id
      FROM disbursement_detail dd
      JOIN disbursement_schedule ds ON ds.disb_detail_id = dd.disb_detail_id
      JOIN disbursement_tracking dt ON dt.disbursement_id = dd.disbursement_id
      JOIN renewal_scholar rs ON rs.renewal_id = dt.renewal_id
      WHERE ds.sched_id = $1
    `;
    const disbResult = await client.query(disbQuery, [schedIdNum]);
    const relatedDetails = disbResult.rows;

    if (relatedDetails.length === 0) {
      await client.query("COMMIT");
      return res.status(200).json({
        message: "Schedule completed. No disbursement details found.",
        updated_event: eventResult.rows[0],
      });
    }

    // 3️⃣ Map incoming updates by disb_detail_id for fast lookup
    const updateMap = new Map(
      updates.map((u) => [Number(u.disb_detail_id), Number(u.amount)])
    );

    // 4️⃣ Filter valid detail IDs that exist in DB and in payload
    // 4️⃣ Filter valid detail IDs that exist in DB and in payload
    const validDetailIds = relatedDetails
      .map((d) => d.disb_detail_id)
      .filter((id) => updateMap.has(id));

    if (validDetailIds.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "No matching disbursement details found to update.",
      });
    }
    let updatedCount = 0;
    // 5️⃣ Update disbursement_amount per record using prepared statements
    for (const [disb_detail_id, amount] of updateMap) {
      // Only update if the detail ID exists in this schedule
      if (validDetailIds.includes(disb_detail_id)) {
        await client.query(
          `
        UPDATE disbursement_detail
        SET disbursement_amount = $1::numeric,
            disbursement_status = 'Completed',
            completed_at = NOW()
        WHERE disb_detail_id = $2
      `,
          [amount, disb_detail_id]
        );
        updatedCount++;
      }
    }

    // 6️⃣ Retrieve related workflow document
    const docResult = await client.query(
      `
    SELECT d.doc_name, d.path, d.doc_id 
    FROM wf_document d
    JOIN workflow w ON w.document_id = d.doc_id
    WHERE w.workflow_id = $1
  `,
      [workflow_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "✅ Schedule and disbursements successfully completed.",
      updated_event: eventResult.rows[0],
      updated_count: updatedCount,
      documents_found: docResult.rows.length > 0,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Transaction failed:", err);
    return res.status(500).json({
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
