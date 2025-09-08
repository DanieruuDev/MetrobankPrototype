const express = require("express");
const {
  getTrackingSummary,
  getTrackingDetailed,
  markCompleteSchedule,
} = require("../controllers/disbursement-tracking-controller.js");

const disbursementTracking = express.Router();

disbursementTracking.get("/:sy_code/:semester_code", getTrackingSummary);
disbursementTracking.get("/:sched_id", getTrackingDetailed);
disbursementTracking.put("/complete/:disb_sched_id", markCompleteSchedule);

module.exports = disbursementTracking;
