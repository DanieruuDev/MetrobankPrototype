const pool = require("../../database/dbConnect.js");

const updateMissedWorkflows = async () => {
  try {
    const result = await pool.query(`
      UPDATE workflow
      SET status = 'Missed'
      WHERE due_date < CURRENT_DATE
        AND completed_at IS NULL
        AND status NOT IN ('Completed', 'Missed', 'Failed');
    `);
    console.log(`[CRON] Missed workflows updated: ${result.rowCount} row(s)`);
  } catch (error) {
    console.error("[CRON] Error updating workflows:", error);
  }
};

module.exports = updateMissedWorkflows;
