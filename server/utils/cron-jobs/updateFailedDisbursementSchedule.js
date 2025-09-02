const pool = require("../../database/dbConnect.js");

const updateFailedDisbursementSchedule = async () => {
  try {
    console.log("This play");

    // Update event schedules to Missed
    const result = await pool.query(`
      UPDATE event_schedule
      SET schedule_status = 'Missed'
      WHERE schedule_due < CURRENT_DATE
        AND schedule_status NOT IN ('Completed', 'Missed')
      RETURNING sched_id;
    `);

    // Update related disbursement details to Missed
    if (result.rows.length > 0) {
      const schedIds = result.rows.map((row) => row.sched_id);

      const detailUpdate = await pool.query(
        `
        UPDATE disbursement_detail dd
        SET disbursement_status = 'Missed'
        WHERE dd.disb_detail_id IN (
          SELECT ds.disb_detail_id
          FROM disbursement_schedule ds
          WHERE ds.sched_id = ANY($1)
        )
          AND dd.disbursement_status NOT IN ('Completed', 'Missed');
        `,
        [schedIds]
      );

      console.log(
        `[CRON] disbursement detail updated to missed: ${detailUpdate.rowCount} row(s)`
      );
    }

    console.log(
      `[CRON] event_schedule updated to missed: ${result.rowCount} row(s)`
    );
  } catch (error) {
    console.error("[CRON] Error updating missed disbursements:", error);
  }
};

module.exports = updateFailedDisbursementSchedule;
