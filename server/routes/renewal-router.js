const express = require("express");
const {
  uploadScholarRenewals,
  fetchAllScholarRenewal,
  getScholarRenewal,
  updateScholarRenewal,
  getExcelRenewalReport,
  filteredScholarRenewal,
  updateScholarRenewalV2,
  getInitialRenewalInfo,
  getRenewalAuditLog,
} = require("../controllers/renewal-scholar-controller");

const renewalRouter = express.Router();

renewalRouter.post("/generate-renewal", uploadScholarRenewals);

renewalRouter.get("/fetch-renewals", fetchAllScholarRenewal);
renewalRouter.get("/get-renewal/:student_id/:renewal_id", getScholarRenewal);
renewalRouter.put("/update-renewal", updateScholarRenewal);
renewalRouter.put("/update-renewalV2", updateScholarRenewalV2);
renewalRouter.get(
  "/get-renewal-report/:yr_lvl/:school_year/:semester",
  getExcelRenewalReport
);
renewalRouter.get("/count-renewal", getInitialRenewalInfo);

renewalRouter.get("/get-filter-renewal", filteredScholarRenewal);

renewalRouter.get("/audit-log", getRenewalAuditLog);

module.exports = renewalRouter;
