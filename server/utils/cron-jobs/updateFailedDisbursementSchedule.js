const pool = require("../../database/dbConnect.js");

const updateFailedDisbursementSchedule = async () => {
  try {
    const result = await pool.query(`
      UPDATE disbursement_schedule
      SET status = 'Failed'
      WHERE disbursement_date < CURRENT_DATE
        AND status NOT IN ('Completed', 'Failed');
    `);
    console.log(
      `[CRON] disbursement schedule updated status to failed: ${result.rowCount} row(s)`
    );
  } catch (error) {
    console.error("[CRON] Error updating disbursement schedule:", error);
  }
};

module.exports = updateFailedDisbursementSchedule;
