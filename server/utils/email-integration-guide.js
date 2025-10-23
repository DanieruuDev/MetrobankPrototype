/**
 * Email Integration Guide for Metrobank Scholarship System
 *
 * This file provides examples of how to integrate the new email templates
 * with the existing notification system.
 */

const {
  sendRenewalInitializedEmail,
  sendBranchValidationCompleteEmail,
  sendNewRenewalProcessEmail,
  sendTuitionFeeProcessFinalizedEmail,
  sendAcademicAwardProcessFinalizedEmail,
  sendThesisFeeUploadCompleteEmail,
  sendDisbursementScheduleCreatedEmail,
  sendDisbursementStatusUpdateEmail,
  sendAnalyticsReportGeneratedEmail,
  sendTestEmailToHR,
} = require("./emailing.js");

/**
 * Example: How to integrate email templates in controllers
 */
class EmailIntegrationExamples {
  /**
   * Example 1: Scholarship Renewal - Process Initialized
   * Use this in renewal-scholar-controller.js
   */
  static async handleRenewalInitialized(
    initiatorName,
    schoolYear,
    semester,
    hrEmail
  ) {
    try {
      await sendRenewalInitializedEmail(
        hrEmail,
        initiatorName,
        schoolYear,
        semester
      );
      console.log("✅ Renewal initialized email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send renewal initialized email:", error);
    }
  }

  /**
   * Example 2: Invoice Upload - Tuition Fee Finalized
   * Use this in invoice-controller.js or notification-controller.js
   */
  static async handleTuitionFeeFinalized(
    schoolYear,
    semester,
    processedBy,
    hrEmail
  ) {
    try {
      await sendTuitionFeeProcessFinalizedEmail(
        hrEmail,
        schoolYear,
        semester,
        processedBy
      );
      console.log("✅ Tuition fee finalized email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send tuition fee finalized email:", error);
    }
  }

  /**
   * Example 3: Disbursement - Schedule Created
   * Use this in disbursement-overview-controller.js
   */
  static async handleDisbursementScheduleCreated(scheduleData, hrEmail) {
    try {
      await sendDisbursementScheduleCreatedEmail(
        hrEmail,
        scheduleData.title,
        scheduleData.dueDate,
        scheduleData.amount,
        scheduleData.studentCount,
        scheduleData.createdBy
      );
      console.log("✅ Disbursement schedule created email sent successfully");
    } catch (error) {
      console.error("❌ Failed to send disbursement schedule email:", error);
    }
  }

  /**
   * Example 4: Testing All Email Templates
   * Use this for testing purposes
   */
  static async testAllEmailTemplates() {
    try {
      // Test Scholarship Renewal
      await sendTestEmailToHR("SCHOLARSHIP_RENEWAL", "initialized", {
        initiatorName: "Test HR User",
        schoolYear: "2024-2025",
        semester: 1,
      });

      // Test Invoice Upload
      await sendTestEmailToHR("INVOICE_UPLOAD", "tuition_finalized", {
        schoolYear: "2024-2025",
        semester: "1st Semester",
        processedBy: "Test HR User",
      });

      // Test Disbursement
      await sendTestEmailToHR("DISBURSEMENT_OVERVIEW", "schedule_created", {
        title: "Test Disbursement Schedule",
        dueDate: "2024-02-15",
        amount: 50000,
        studentCount: 100,
        createdBy: "Test HR User",
      });

      console.log("✅ All email templates tested successfully");
    } catch (error) {
      console.error("❌ Failed to test email templates:", error);
    }
  }
}

/**
 * Integration Checklist for Controllers
 */
const integrationChecklist = {
  "renewal-scholar-controller.js": [
    "✅ sendRenewalInitializedEmail - Process initialization",
    "✅ sendBranchValidationCompleteEmail - Validation complete",
    "✅ sendNewRenewalProcessEmail - DO/Registrar notifications",
  ],
  "notification-controller.js": [
    "✅ sendTuitionFeeProcessFinalizedEmail - Tuition fee finalized",
    "✅ sendAcademicAwardProcessFinalizedEmail - Academic award finalized",
    "✅ sendThesisFeeUploadCompleteEmail - Thesis fee upload",
  ],
  "disbursement-overview-controller.js": [
    "⏳ sendDisbursementScheduleCreatedEmail - Schedule creation",
    "⏳ sendDisbursementStatusUpdateEmail - Status updates",
  ],
  "analytics-controller.js": [
    "⏳ sendAnalyticsReportGeneratedEmail - Report generation",
  ],
};

/**
 * Testing Endpoints Available
 */
const testingEndpoints = {
  "Test All Templates": "POST /api/email-test/test-all",
  "Test Specific Module": "POST /api/email-test/test-module",
  "Get Available Templates": "GET /api/email-test/templates",
};

/**
 * Environment Variables Required
 */
const requiredEnvVars = {
  RESEND_API_KEY: "Your Resend API key",
  EMAIL_SENDER:
    "Verified sender email (e.g., 'Metrobank System <noreply@yourdomain.com>')",
};

module.exports = {
  EmailIntegrationExamples,
  integrationChecklist,
  testingEndpoints,
  requiredEnvVars,
};
