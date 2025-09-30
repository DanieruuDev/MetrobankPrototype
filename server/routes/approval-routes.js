// server/routes/approval-routes.js
const express = require("express");
const router = express.Router();
const approvalController = require("../controllers/approval-controller");

// Define the new GET endpoint
router.get(
  "/ready-for-scheduling",
  approvalController.getWorkflowsForScheduling
);

module.exports = router;
