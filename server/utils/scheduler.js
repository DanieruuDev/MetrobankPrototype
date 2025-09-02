const cron = require("node-cron");
const updateMissedWorkflows = require("./cron-jobs/updateMissedWorkflow");
const updateFailedDisbursementSchedule = require("./cron-jobs/updateFailedDisbursementSchedule");
const UpdateStartingSchedStatus = require("./cron-jobs/updateStartingSchedule");

cron.schedule(
  "* * * * *",
  async () => {
    try {
      await updateMissedWorkflows();
      await updateFailedDisbursementSchedule();
      await UpdateStartingSchedStatus();
    } catch (err) {
      console.error("❌ Cron job failed:", err);
    }
  },
  {
    timezone: "Asia/Manila",
  }
);
