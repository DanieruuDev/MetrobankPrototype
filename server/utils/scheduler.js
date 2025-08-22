const cron = require("node-cron");
const updateMissedWorkflows = require("./cron-jobs/updateMissedWorkflow");
const updateFailedDisbursement = require("./cron-jobs/updateFailedDisbursementSchedule");

cron.schedule("0 0 * * *", async () => {
  updateMissedWorkflows();
  updateFailedDisbursement();
});
