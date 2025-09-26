const express = require("express");
const {
  createDisbursementSchedule,
  fetchDisbursementSchedules,
  getTwoWeeksDisbursementSchedules,
  fetchDetailSchedule,
  fetchWeeklyDisbursementSchedules,
  deleteDisbursementSchedule,
  getEligibleScholarCount,
  getEligibleScholarCountSimple,
  updateDisbursementSchedule,
} = require("../controllers/disbursement-schedule-controller.js");

const disbursementRouter = express.Router();

// POST create schedule
disbursementRouter.post("/schedule", createDisbursementSchedule);

// More specific GET routes first
disbursementRouter.get("/schedule/detailed/:sched_id", fetchDetailSchedule);
disbursementRouter.get("/schedule/weeks", getTwoWeeksDisbursementSchedules);

// Then routes with params, from more specific to less specific
disbursementRouter.get("/schedule/:year/:month", fetchDisbursementSchedules);
disbursementRouter.get("/schedule/:week", fetchWeeklyDisbursementSchedules);

// DELETE and PUT routes with params
disbursementRouter.delete(
  "/schedule/:sched_id/:requester",
  deleteDisbursementSchedule
);
disbursementRouter.put("/schedule/:sched_id", updateDisbursementSchedule);

// Other routes
disbursementRouter.get(
  "/scholar/:yr_lvl_code/:sy_code/:semester_code",
  getEligibleScholarCount
);

// Simple pre-check (no year-level)
disbursementRouter.get("/eligible-count", getEligibleScholarCountSimple);

module.exports = disbursementRouter;
