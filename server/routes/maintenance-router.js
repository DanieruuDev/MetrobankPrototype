const express = require("express");

const {
  getSchoolYear,
  getYearLevel,
  getBranch,
} = require("../controllers/maintenance-controller.js");

const maintenance = express.Router();

maintenance.get("/school-year", getSchoolYear);
maintenance.get("/year-level", getYearLevel);
maintenance.get("/branch", getBranch);

module.exports = maintenance;
