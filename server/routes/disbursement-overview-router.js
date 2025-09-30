const express = require("express");
const {
  getScholarDisbursementSummary,
  getDisbursementHistoryByStudentId,
  getDisbursementTotalPerSy,
  getSemesterScholarDisbursement,
} = require("../controllers/disbursement-overview-controller.js");

const disbursementOverview = express.Router();

disbursementOverview.get("/scholar-list", getScholarDisbursementSummary);

disbursementOverview.get("/history/:id", getDisbursementHistoryByStudentId);

disbursementOverview.get("/total/:sy_code", getDisbursementTotalPerSy);

disbursementOverview.get("/semester-scholars", getSemesterScholarDisbursement);

module.exports = disbursementOverview;
