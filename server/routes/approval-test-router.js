const express = require("express");
const {
  testApprovalWorkflowEmails,
  testApprovalWorkflowEmailsWithQueue,
  testApprovalEmailType,
  getApprovalEmailTypes,
  getEmailQueueStatus,
  clearEmailQueue,
} = require("../controllers/approval-test-controller.js");

const approvalTestRouter = express.Router();

// Test complete approval workflow emails
approvalTestRouter.post("/test-workflow", testApprovalWorkflowEmails);

// Test approval workflow emails with queuing (recommended)
approvalTestRouter.post(
  "/test-workflow-queue",
  testApprovalWorkflowEmailsWithQueue
);

// Test specific approval email type
approvalTestRouter.post("/test-email-type", testApprovalEmailType);

// Get available approval email types
approvalTestRouter.get("/email-types", getApprovalEmailTypes);

// Get email queue status
approvalTestRouter.get("/queue-status", getEmailQueueStatus);

// Clear email queue
approvalTestRouter.delete("/queue", clearEmailQueue);

module.exports = approvalTestRouter;
