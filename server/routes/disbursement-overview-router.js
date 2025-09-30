const express = require("express");
const {
  getScholarDisbursementSummary,
  getDisbursementHistoryByStudentId,
  getDisbursementTotalPerSy,
  getSemesterScholarDisbursement,
  getCompletedDisbursementTotals,
  getTotalDisbursedAmount,
  getStudentBasicInfo,
} = require("../controllers/disbursement-overview-controller.js");

const disbursementOverview = express.Router();

disbursementOverview.get("/scholar-list", getScholarDisbursementSummary);

disbursementOverview.get("/history/:id", getDisbursementHistoryByStudentId);

disbursementOverview.get("/total/:sy_code", getDisbursementTotalPerSy);

disbursementOverview.get(
  "/completed-totals/:sy_code",
  getCompletedDisbursementTotals
);

disbursementOverview.get("/semester-scholars", getSemesterScholarDisbursement);

disbursementOverview.get("/total-disbursed", getTotalDisbursedAmount);

disbursementOverview.get("/student-info/:id", getStudentBasicInfo);

module.exports = disbursementOverview;
