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

// POST create schedule
disbursementRouter.post("/schedule", createDisbursementSchedule);

// More specific GET routes first
disbursementRouter.get(
  "/schedule/detailed/:disb_sched_id",
  fetchDetailSchedule
);
disbursementRouter.get("/schedule/weeks", getTwoWeeksDisbursementSchedules);

// Then routes with params, from more specific to less specific
disbursementRouter.get("/schedule/:year/:month", fetchDisbursementSchedules);
disbursementRouter.get("/schedule/:week", fetchWeeklyDisbursementSchedules);

// DELETE and PUT routes with params
disbursementRouter.delete(
  "/schedule/:disb_sched_id/:created_by_id",
  deleteDisbursementSchedule
);
disbursementRouter.put("/schedule/:id", updateDisbursementSchedule);

// Other routes
disbursementRouter.get(
  "/scholar/:yr_lvl_code/:sy_code/:semester_code",
  getEligibleScholarCount
);

module.exports = disbursementRouter;
