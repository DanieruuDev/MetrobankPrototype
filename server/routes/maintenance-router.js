const express = require("express");

const {
  getSchoolYear,
  getYearLevel,
} = require("../controllers/maintenance-controller.js");

const maintenance = express.Router();

maintenance.get("/school-year", getSchoolYear);
maintenance.get("/year-level", getYearLevel);

module.exports = maintenance;
