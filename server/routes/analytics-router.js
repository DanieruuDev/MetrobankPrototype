const express = require("express");
const router = express.Router();
const { getROIAnalyticsData } = require("../controllers/analytics-controller");

// Get ROI Analytics Data
router.get("/roi-analytics", getROIAnalyticsData);

module.exports = router;
