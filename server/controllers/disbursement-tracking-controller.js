const pool = require("../database/dbConnect.js");
const { UploadFileToDisbursement } = require("../services/ExcelFileReader.js");

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
  const { workflow_id } = req.body;
  const client = await pool.connect();

  if (!workflow_id) {
    return res.status(400).json({ message: "Invalid workflow_id." });
  }

  try {
    if (!sched_id || isNaN(parseInt(sched_id))) {
      return res.status(400).json({ message: "Invalid schedule ID." });
    }

    const schedIdNum = parseInt(sched_id);

    try {
      await client.query("BEGIN");

      // 1. Update event_schedule (unchanged, single query)
      const updateEventQuery = `
        UPDATE event_schedule
        SET schedule_status = 'Completed', edit_at = NOW()
        WHERE sched_id = $1
        RETURNING sched_id, schedule_status, edit_at;
      `;
      const eventResult = await client.query(updateEventQuery, [schedIdNum]);

      if (eventResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Event schedule not found." });
      }

      // 2. Get disbursement details (unchanged, but fetch unique renewal_ids for batching)
      const getDisbursementDetailsQuery = `
        SELECT dd.disb_detail_id, dd.disbursement_id, dd.disbursement_amount, 
               rs.student_id, rs.renewal_id, ds.disbursement_type_id
        FROM disbursement_detail dd
        JOIN disbursement_schedule ds ON ds.disb_detail_id = dd.disb_detail_id
        JOIN disbursement_tracking dt ON dt.disbursement_id = dd.disbursement_id
        JOIN renewal_scholar rs ON rs.renewal_id = dt.renewal_id
        WHERE ds.sched_id = $1
      `;
      const disbursementDetailsResult = await client.query(
        getDisbursementDetailsQuery,
        [schedIdNum]
      );
      const disbursementDetails = disbursementDetailsResult.rows;

      if (disbursementDetails.length === 0) {
        await client.query("COMMIT"); // No details to process, but commit anyway
        return res.status(200).json({
          message:
            "Schedule marked as completed. No disbursement details found.",
          updated_event: eventResult.rows[0],
        });
      }

      // 3. Batch: Check existing tracking for ALL renewal_ids at once
      const uniqueRenewalIds = [
        ...new Set(disbursementDetails.map((d) => d.renewal_id)),
      ];
      const existingTrackingQuery = `
        SELECT renewal_id, disbursement_id 
        FROM disbursement_tracking 
        WHERE renewal_id = ANY($1)
      `;
      const existingTrackingResult = await client.query(existingTrackingQuery, [
        uniqueRenewalIds,
      ]);
      const existingTrackingMap = new Map(
        existingTrackingResult.rows.map((row) => [
          row.renewal_id,
          row.disbursement_id,
        ])
      );

      // 4. Batch: Insert missing tracking records (multi-row INSERT)
      const missingRenewalIds = uniqueRenewalIds.filter(
        (id) => !existingTrackingMap.has(id)
      );
      let newTrackingMap = new Map(existingTrackingMap); // Copy existing
      const newTrackingIds = [];
      if (missingRenewalIds.length > 0) {
        const placeholders = missingRenewalIds
          .map((_, i) => `($${i + 1})`)
          .join(", ");
        const insertTrackingQuery = `
          INSERT INTO disbursement_tracking (renewal_id)
          VALUES ${placeholders}
          RETURNING renewal_id, disbursement_id
        `;
        const values = missingRenewalIds;
        const newTrackingResult = await client.query(
          insertTrackingQuery,
          values
        );
        newTrackingResult.rows.forEach((row) => {
          newTrackingMap.set(row.renewal_id, row.disbursement_id);
          newTrackingIds.push(row.disbursement_id);
        });
      }

      // 5. Batch: Update ALL disbursement_details with correct disbursement_id in one query
      // Use a CASE or separate updates, but for efficiency, loop with prepared statement (still faster than before)
      // For true batch, use a temp table or UNNEST
      const updateDetailsValues = disbursementDetails.map((detail) => [
        newTrackingMap.get(detail.renewal_id), // Correct disbursement_id
        detail.disb_detail_id,
      ]);
      // Since pg doesn't support multi-row UPDATE easily, use a loop but with fewer round-trips
      for (const [correctDisbId, disbDetailId] of updateDetailsValues) {
        await client.query(
          `UPDATE disbursement_detail SET disbursement_id = $1 WHERE disb_detail_id = $2`,
          [correctDisbId, disbDetailId]
        );
      }

      // 6. Batch Update: Set status to 'Completed' for ALL details in one query (unchanged, already batched)
      const updateDetailQuery = `
        UPDATE disbursement_detail
        SET disbursement_status = 'Completed', completed_at = NOW()
        WHERE disb_detail_id IN (
          SELECT disb_detail_id FROM disbursement_schedule WHERE sched_id = $1
        )
        RETURNING disb_detail_id, disbursement_status, completed_at;
      `;
      const detailResult = await client.query(updateDetailQuery, [schedIdNum]);

      // 7. Fetch documents (unchanged)
      const docResult = await client.query(
        `SELECT d.doc_name, d.path, d.doc_id 
         FROM wf_document d
         JOIN workflow w ON w.document_id = d.doc_id
         WHERE w.workflow_id = $1`,
        [workflow_id]
      );

      await client.query("COMMIT");

      if (docResult.rows.length > 0) {
        const { doc_name, doc_id } = docResult.rows[0];
        // Fire-and-forget: Don't await, log errors separately
        UploadFileToDisbursement(doc_name, doc_id)
          .then(() =>
            console.log(`File processing completed for doc_id: ${doc_id}`)
          )
          .catch((err) =>
            console.error(`File processing failed for doc_id ${doc_id}:`, err)
          );
      }

      return res.status(200).json({
        message: "Schedule and related disbursements marked as completed.",
        updated_event: eventResult.rows[0],
        updated_details: detailResult.rows,
        created_tracking_records: newTrackingIds.length,
        missing_renewals_processed: missingRenewalIds.length,
        documents_found: docResult.rows.length > 0,
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
