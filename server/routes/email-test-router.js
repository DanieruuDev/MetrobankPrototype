const express = require("express");
const {
  testAllEmailTemplates,
  testModuleEmails,
  getAvailableEmailTemplates,
  testDelistedScholarsEmail,
} = require("../controllers/email-test-controller.js");

const emailTestRouter = express.Router();

// Test all email templates
emailTestRouter.post("/test-all", testAllEmailTemplates);

// Test specific module email
emailTestRouter.post("/test-module", testModuleEmails);

// Test delisted scholars email
emailTestRouter.post("/test-delisted-scholars", testDelistedScholarsEmail);

// Get available email templates
emailTestRouter.get("/templates", getAvailableEmailTemplates);

module.exports = emailTestRouter;
