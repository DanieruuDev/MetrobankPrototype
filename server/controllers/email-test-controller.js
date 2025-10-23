const pool = require("../database/dbConnect.js");
const { sendTestEmailToHR } = require("../utils/emailing.js");

// Test endpoint to send all email templates
const testAllEmailTemplates = async (req, res) => {
  try {
    console.log("🧪 Testing all email templates...");

    // Test Scholarship Renewal emails
    await sendTestEmailToHR("SCHOLARSHIP_RENEWAL", "initialized", {
      initiatorName: "Test HR User",
      schoolYear: "2024-2025",
      semester: 1,
    });

    await sendTestEmailToHR("SCHOLARSHIP_RENEWAL", "validation_complete", {
      schoolYear: "2024-2025",
      semester: 1,
      yearLevel: "3rd Year",
      branchName: "STI Ortigas-Cainta",
    });

    // Test Invoice Upload emails
    await sendTestEmailToHR("INVOICE_UPLOAD", "tuition_finalized", {
      schoolYear: "2024-2025",
      semester: "1st Semester",
      processedBy: "Test HR User",
    });

    await sendTestEmailToHR("INVOICE_UPLOAD", "academic_award_finalized", {
      schoolYear: "2024-2025",
      semester: "1st Semester",
      processedBy: "Test HR User",
    });

    await sendTestEmailToHR("INVOICE_UPLOAD", "thesis_upload", {
      processedBy: "Test HR User",
    });

    // Test Disbursement emails
    await sendTestEmailToHR("DISBURSEMENT_OVERVIEW", "schedule_created", {
      title: "1st Semester Disbursement 2024-2025",
      dueDate: "2024-02-15",
      amount: 50000,
      studentCount: 150,
      createdBy: "Test HR User",
    });

    await sendTestEmailToHR("DISBURSEMENT_TRACKING", "status_update", {
      studentName: "John Doe",
      status: "Completed",
      amount: 25000,
      updatedBy: "Test HR User",
    });

    // Test Analytics emails
    await sendTestEmailToHR("SCHOLARSHIP_ANALYTICS", "report_generated", {
      reportType: "ROI Analysis Report",
      generatedBy: "Test HR User",
      dateRange: "January 2024 - December 2024",
    });

    res.status(200).json({
      success: true,
      message:
        "All email templates tested successfully. Check your Resend dashboard for delivered emails.",
      testedModules: [
        "SCHOLARSHIP_RENEWAL",
        "INVOICE_UPLOAD",
        "DISBURSEMENT_OVERVIEW",
        "DISBURSEMENT_TRACKING",
        "SCHOLARSHIP_ANALYTICS",
      ],
    });
  } catch (error) {
    console.error("❌ Error testing email templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test email templates.",
      error: error.message,
    });
  }
};

// Test specific module emails
const testModuleEmails = async (req, res) => {
  try {
    const { module, action, details } = req.body;

    if (!module || !action) {
      return res.status(400).json({
        success: false,
        message: "Module and action are required.",
      });
    }

    console.log(`🧪 Testing ${module} - ${action} email template...`);

    await sendTestEmailToHR(module, action, details || {});

    res.status(200).json({
      success: true,
      message: `Email template tested successfully for ${module} - ${action}. Check your Resend dashboard.`,
      module,
      action,
      details,
    });
  } catch (error) {
    console.error("❌ Error testing module email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test module email template.",
      error: error.message,
    });
  }
};

// Get available email templates
const getAvailableEmailTemplates = async (req, res) => {
  try {
    const templates = {
      SCHOLARSHIP_RENEWAL: {
        module: "Scholarship Renewal",
        actions: [
          {
            action: "initialized",
            description: "Renewal process initialized",
            requiredDetails: ["initiatorName", "schoolYear", "semester"],
          },
          {
            action: "validation_complete",
            description: "Branch validation completed",
            requiredDetails: [
              "schoolYear",
              "semester",
              "yearLevel",
              "branchName",
            ],
          },
        ],
      },
      INVOICE_UPLOAD: {
        module: "Invoice Upload",
        actions: [
          {
            action: "tuition_finalized",
            description: "Tuition fee process finalized",
            requiredDetails: ["schoolYear", "semester", "processedBy"],
          },
          {
            action: "academic_award_finalized",
            description: "Academic award process finalized",
            requiredDetails: ["schoolYear", "semester", "processedBy"],
          },
          {
            action: "thesis_upload",
            description: "Thesis fee upload completed",
            requiredDetails: ["processedBy"],
          },
        ],
      },
      DISBURSEMENT_OVERVIEW: {
        module: "Disbursement Overview",
        actions: [
          {
            action: "schedule_created",
            description: "Disbursement schedule created",
            requiredDetails: [
              "title",
              "dueDate",
              "amount",
              "studentCount",
              "createdBy",
            ],
          },
        ],
      },
      DISBURSEMENT_TRACKING: {
        module: "Disbursement Tracking",
        actions: [
          {
            action: "status_update",
            description: "Disbursement status updated",
            requiredDetails: ["studentName", "status", "amount", "updatedBy"],
          },
        ],
      },
      SCHOLARSHIP_ANALYTICS: {
        module: "Scholarship Analytics",
        actions: [
          {
            action: "report_generated",
            description: "Analytics report generated",
            requiredDetails: ["reportType", "generatedBy", "dateRange"],
          },
        ],
      },
    };

    res.status(200).json({
      success: true,
      message: "Available email templates retrieved successfully.",
      templates,
    });
  } catch (error) {
    console.error("❌ Error getting email templates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get email templates.",
      error: error.message,
    });
  }
};

// Test delisted scholars email
const testDelistedScholarsEmail = async (req, res) => {
  try {
    const {
      scholarEmail = "scholar@example.com",
      scholarName = "John Doe",
      studentId = "2023-001",
      campusName = "Main Campus",
      yearLevel = "2nd Year",
      course = "Computer Science",
      schoolYear = "2024-2025",
      semester = 1,
      delistingReasons = [
        "Failed to maintain required GPA of 2.0",
        "Incomplete submission of required documents",
        "Violation of scholarship terms and conditions",
      ],
    } = req.body;

    const scholarDetails = {
      scholar_name: scholarName,
      student_id: studentId,
      campus_name: campusName,
      year_level: yearLevel,
      course: course,
      school_year: schoolYear,
      semester: semester,
    };

    console.log(`📧 Testing delisted scholars email for: ${scholarName}`);

    // Import the delisted scholars email function
    const { sendDelistedScholarsEmail } = require("../utils/emailing.js");

    // Send the email
    await sendDelistedScholarsEmail(
      scholarEmail,
      scholarDetails,
      delistingReasons
    );

    res.status(200).json({
      success: true,
      message: "Delisted scholars email sent successfully.",
      recipient: {
        name: scholarName,
        email: scholarEmail,
      },
      scholarDetails: scholarDetails,
      delistingReasons: delistingReasons,
      note: "This was a test - no actual delisting occurred.",
    });
  } catch (error) {
    console.error("❌ Error testing delisted scholars email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test delisted scholars email.",
      error: error.message,
    });
  }
};

module.exports = {
  testAllEmailTemplates,
  testModuleEmails,
  getAvailableEmailTemplates,
  testDelistedScholarsEmail,
};
