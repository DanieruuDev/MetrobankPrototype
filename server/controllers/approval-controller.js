// server/controllers/approval-controller.js
const approvalService = require("../services/approvalService");

exports.getWorkflowsForScheduling = async (req, res) => {
  try {
    const workflows = await approvalService.fetchUnscheduledWorkflows();
    res.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows for scheduling:", error.message);
    res.status(500).json({
      message: "Internal server error: Could not fetch approved workflows.",
      detail: error.message,
    });
  }
};
