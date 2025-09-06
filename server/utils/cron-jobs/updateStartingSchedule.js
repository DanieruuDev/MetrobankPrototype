const pool = require("../../database/dbConnect.js");

const UpdateStartingSchedStatus = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1️⃣ Update event_schedule
    const { rows: updatedEvents } = await client.query(
      `
      UPDATE event_schedule
      SET schedule_status = 'In Progress'
      WHERE starting_date <= CURRENT_DATE
        AND schedule_status NOT IN ('Completed', 'Missed', 'In Progress')
      RETURNING sched_id;
      `
    );

    console.log(
      `[CRON] ${updatedEvents.length} schedules updated to In Progress.`
    );

    if (updatedEvents.length > 0) {
      // 2️⃣ Get disbursement details linked to these sched_ids
      const schedIds = updatedEvents.map((ev) => ev.sched_id);

      const { rows: disbDetails } = await client.query(
        `
        SELECT ds.disb_detail_id
        FROM disbursement_schedule ds
        WHERE ds.sched_id = ANY($1::int[]);
        `,
        [schedIds]
      );

      if (disbDetails.length > 0) {
        const detailIds = disbDetails.map((d) => d.disb_detail_id);

        // 3️⃣ Update disbursement_detail statuses
        const updateRes = await client.query(
          `
          UPDATE disbursement_detail
          SET disbursement_status = 'In Progress'
          WHERE disb_detail_id = ANY($1::int[])
            AND disbursement_status NOT IN ('Completed', 'Missed', 'In Progress');
          `,
          [detailIds]
        );

        console.log(
          `[CRON] ${updateRes.rowCount} disbursement details set to In Progress.`
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[CRON] Error updating schedule statuses:", error);
  } finally {
    client.release();
  }
};

module.exports = UpdateStartingSchedStatus;
