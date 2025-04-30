const express = require("express");
const {
  createDisbursementSchedule,
  fetchDisbursementSchedules,
  getTwoWeeksDisbursementSchedules,
  fetchDetailSchedule,
  fetchWeeklyDisbursementSchedules,
  deleteDisbursementSchedule,
  getEligibleScholarCount,
  updateDisbursementSchedule,
} = require("../controllers/disbursement-schedule-controller.js");

const disbursementRouter = express.Router();

disbursementRouter.post("/schedule", createDisbursementSchedule);
disbursementRouter.get("/schedule/:year/:month", fetchDisbursementSchedules);
disbursementRouter.get("/schedule/weeks", getTwoWeeksDisbursementSchedules);
disbursementRouter.get(
  "/schedule/detailed/:user_id/:disb_sched_id",
  fetchDetailSchedule
);
disbursementRouter.delete(
  "/schedule/:user_id/:disb_sched_id",
  deleteDisbursementSchedule
);
disbursementRouter.get("/schedule/:week", fetchWeeklyDisbursementSchedules);
disbursementRouter.get(
  "/scholar/:yr_lvl_code/:sy_code/:semester_code",
  getEligibleScholarCount
);

disbursementRouter.put("/schedule/:id", updateDisbursementSchedule);

module.exports = disbursementRouter;
