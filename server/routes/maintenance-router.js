const express = require("express");

const {
  getSchoolYear,
  getYearLevel,
  getBranch,
  getSemester,
  getValidSYSem,
  getWfRequestType,
  getSYSemProgress,
} = require("../controllers/maintenance-controller.js");

const maintenance = express.Router();

maintenance.get("/school-year", getSchoolYear);
maintenance.get("/year-level", getYearLevel);
maintenance.get("/branch", getBranch);
maintenance.get("/semester", getSemester);
maintenance.get("/valid_sy_semester", getValidSYSem);
maintenance.get("/wf_request", getWfRequestType);
maintenance.get("/sysem-process", getSYSemProgress);
module.exports = maintenance;
