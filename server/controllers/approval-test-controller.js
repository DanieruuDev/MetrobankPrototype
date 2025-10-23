const pool = require("../database/dbConnect.js");
const {
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
  sendDeadlineReminder,
  sendWorkflowRejectedEmail,
  sendWorkflowCompletedEmail,
  sendWorkflowMovedForward,
  sendApproverReplacedEmail,
  sendWorkflowCreatedEmail,
} = require("../utils/emailing.js");
const emailQueue = require("../utils/email-queue.js");

// Test approval workflow email functionality
const testApprovalWorkflowEmails = async (req, res) => {
  try {
    console.log("🧪 Testing approval workflow emails...");

    // Test data - simulating workflow creation
    const workflowDetails = {
      rq_title: "Test Approval Workflow - Scholarship Processing",
      rq_description:
        "This is a test workflow to verify email functionality for the approval system.",
      requester_name: "adminlastname@example.com",
      due_date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(), // 7 days from now
      request_title: "Test Approval Workflow - Scholarship Processing",
    };

    // Get the requester details
    const { rows: requester } = await pool.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_email = $1`,
      ["adminlastname@example.com"]
    );

    if (requester.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Requester not found. Please ensure adminlastname@example.com exists in the database.",
      });
    }

    // Get approver details
    const approverEmails = [
      "aliarawnd13@gmail.com",
      "aguilar.286826@ortigas-cainta.sti.edu.ph",
    ];

    const { rows: approvers } = await pool.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_email = ANY($1)`,
      [approverEmails]
    );

    if (approvers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No approvers found. Please ensure the approver emails exist in the database.",
      });
    }

    console.log(`📧 Found ${approvers.length} approvers to notify`);

    // Send emails to each approver
    const emailResults = [];

    for (let i = 0; i < approvers.length; i++) {
      const approver = approvers[i];

      try {
        // Send "You have been added as an approver" email
        await sendApproverAddedEmail(approver.admin_email, workflowDetails);

        // If this is the first approver, also send "It's your turn" email
        if (i === 0) {
          await sendItsYourTurnEmail(approver.admin_email, workflowDetails);
        }

        emailResults.push({
          approver: approver.admin_name,
          email: approver.admin_email,
          status: "sent",
          emails:
            i === 0 ? ["approver_added", "its_your_turn"] : ["approver_added"],
        });

        console.log(
          `✅ Emails sent to ${approver.admin_name} (${approver.admin_email})`
        );
      } catch (error) {
        console.error(
          `❌ Failed to send emails to ${approver.admin_name}:`,
          error
        );
        emailResults.push({
          approver: approver.admin_name,
          email: approver.admin_email,
          status: "failed",
          error: error.message,
        });
      }
    }

    // Send workflow created email to requester
    try {
      await sendWorkflowCreatedEmail(requester[0].admin_email, workflowDetails);
      console.log(
        `✅ Workflow created email sent to requester: ${requester[0].admin_name}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to send workflow created email to requester:`,
        error
      );
    }

    res.status(200).json({
      success: true,
      message:
        "Approval workflow emails tested successfully. Check your Resend dashboard for delivered emails.",
      workflowDetails: {
        title: workflowDetails.rq_title,
        requester: requester[0].admin_name,
        requesterEmail: requester[0].admin_email,
        approvers: approvers.length,
        dueDate: workflowDetails.due_date,
      },
      emailResults,
      note: "This was a test - no actual workflow was created in the database.",
    });
  } catch (error) {
    console.error("❌ Error testing approval workflow emails:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test approval workflow emails.",
      error: error.message,
    });
  }
};

// Test individual approval email types
const testApprovalEmailType = async (req, res) => {
  try {
    const { emailType, approverEmail } = req.body;

    if (!emailType || !approverEmail) {
      return res.status(400).json({
        success: false,
        message: "Email type and approver email are required.",
      });
    }

    const workflowDetails = {
      rq_title: "Test Approval Email",
      rq_description:
        "This is a test email to verify the approval system functionality.",
      requester_name: "adminlastname@example.com",
      due_date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      request_title: "Test Approval Email",
      last_approver_name: "Test Approver",
      next_approver_name: "Next Approver",
    };

    console.log(`🧪 Testing ${emailType} email to ${approverEmail}...`);

    let emailSent = false;
    let emailFunction = null;

    switch (emailType) {
      case "approver_added":
        emailFunction = sendApproverAddedEmail;
        break;
      case "its_your_turn":
        emailFunction = sendItsYourTurnEmail;
        break;
      case "deadline_reminder":
        emailFunction = sendDeadlineReminder;
        break;
      case "workflow_rejected":
        emailFunction = sendWorkflowRejectedEmail;
        break;
      case "workflow_completed":
        emailFunction = sendWorkflowCompletedEmail;
        break;
      case "workflow_moved_forward":
        emailFunction = sendWorkflowMovedForward;
        break;
      case "approver_replaced":
        emailFunction = sendApproverReplacedEmail;
        break;
      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid email type. Available types: approver_added, its_your_turn, deadline_reminder, workflow_rejected, workflow_completed, workflow_moved_forward, approver_replaced",
        });
    }

    try {
      await emailFunction(approverEmail, workflowDetails);
      emailSent = true;
      console.log(
        `✅ ${emailType} email sent successfully to ${approverEmail}`
      );
    } catch (error) {
      console.error(`❌ Failed to send ${emailType} email:`, error);
      throw error;
    }

    res.status(200).json({
      success: true,
      message: `${emailType} email sent successfully. Check your Resend dashboard.`,
      emailType,
      recipient: approverEmail,
      workflowDetails,
    });
  } catch (error) {
    console.error("❌ Error testing approval email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test approval email.",
      error: error.message,
    });
  }
};

// Get available approval email types
const getApprovalEmailTypes = async (req, res) => {
  try {
    const emailTypes = [
      {
        type: "approver_added",
        description: "You have been added as an approver (but not active yet)",
        function: "sendApproverAddedEmail",
      },
      {
        type: "its_your_turn",
        description: "It is now your turn to act as an approver",
        function: "sendItsYourTurnEmail",
      },
      {
        type: "deadline_reminder",
        description: "Deadline is close (for approver and requester)",
        function: "sendDeadlineReminder",
      },
      {
        type: "workflow_rejected",
        description: "Workflow has been rejected",
        function: "sendWorkflowRejectedEmail",
      },
      {
        type: "workflow_completed",
        description: "Workflow has been completed",
        function: "sendWorkflowCompletedEmail",
      },
      {
        type: "workflow_moved_forward",
        description: "Workflow has moved forward",
        function: "sendWorkflowMovedForward",
      },
      {
        type: "approver_replaced",
        description: "You have been replaced as an approver",
        function: "sendApproverReplacedEmail",
      },
    ];

    res.status(200).json({
      success: true,
      message: "Available approval email types retrieved successfully.",
      emailTypes,
    });
  } catch (error) {
    console.error("❌ Error getting approval email types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get approval email types.",
      error: error.message,
    });
  }
};

// Test approval workflow emails with queuing
const testApprovalWorkflowEmailsWithQueue = async (req, res) => {
  try {
    console.log("🧪 Testing approval workflow emails with queuing...");

    // Test data - simulating workflow creation
    const workflowDetails = {
      rq_title: "Test Approval Workflow - Scholarship Processing (Queued)",
      rq_description:
        "This is a test workflow to verify email functionality with queuing system.",
      requester_name: "adminlastname@example.com",
      due_date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(), // 7 days from now
      request_title: "Test Approval Workflow - Scholarship Processing (Queued)",
    };

    // Get the requester details
    const { rows: requester } = await pool.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_email = $1`,
      ["adminlastname@example.com"]
    );

    if (requester.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Requester not found. Please ensure adminlastname@example.com exists in the database.",
      });
    }

    // Get approver details
    const approverEmails = [
      "aliarawnd13@gmail.com",
      "aguilar.286826@ortigas-cainta.sti.edu.ph",
    ];

    const { rows: approvers } = await pool.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_email = ANY($1)`,
      [approverEmails]
    );

    if (approvers.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No approvers found. Please ensure the approver emails exist in the database.",
      });
    }

    console.log(`📧 Queuing emails for ${approvers.length} approvers`);

    // Queue emails for each approver
    const queuedEmails = [];

    for (let i = 0; i < approvers.length; i++) {
      const approver = approvers[i];

      try {
        // Queue "You have been added as an approver" email
        const approverAddedId = emailQueue.addToQueue(
          approver.admin_email,
          `[APPROVAL] You have been added as an approver for "${workflowDetails.rq_title}"`,
          `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #004d40;">You've been added to a workflow!</h2>
              <p>This is to inform you that you have been added as an approver for the following request:</p>
              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px;">
                <h3 style="color: #00695c;">${workflowDetails.rq_title}</h3>
                <p><strong>Requester:</strong> ${workflowDetails.requester_name}</p>
                <p><strong>Description:</strong> ${workflowDetails.rq_description}</p>
                <p>Your approval is not required yet. We will notify you when it's your turn to act.</p>
              </div>
              <p style="margin-top: 20px;">Thank you,</p>
              <p>The STRONG System Team</p>
            </div>
          `,
          "approver_added",
          {
            approverName: approver.admin_name,
            workflowTitle: workflowDetails.rq_title,
          }
        );

        // If this is the first approver, also queue "It's your turn" email
        if (i === 0) {
          const itsYourTurnId = emailQueue.addToQueue(
            approver.admin_email,
            `[APPROVAL] Action Required: Your approval is needed for "${workflowDetails.rq_title}"`,
            `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #e65100;">It's your turn to act!</h2>
                <p>This is to inform you that your approval is now required for the following workflow:</p>
                <div style="background-color: #f9fbe7; padding: 15px; border-radius: 8px; border-left: 5px solid #ffab00;">
                  <h3 style="color: #e65100;">${workflowDetails.rq_title}</h3>
                  <p><strong>Requester:</strong> ${workflowDetails.requester_name}</p>
                  <p><strong>Due Date:</strong> ${workflowDetails.due_date}</p>
                  <p>Please log in to the system to review the request and take action.</p>
                </div>
                <p style="margin-top: 20px;">Thank you,</p>
                <p>The STRONG System Team</p>
              </div>
            `,
            "its_your_turn",
            {
              approverName: approver.admin_name,
              workflowTitle: workflowDetails.rq_title,
            }
          );

          queuedEmails.push({
            approver: approver.admin_name,
            email: approver.admin_email,
            queuedEmails: [approverAddedId, itsYourTurnId],
            status: "queued",
          });
        } else {
          queuedEmails.push({
            approver: approver.admin_name,
            email: approver.admin_email,
            queuedEmails: [approverAddedId],
            status: "queued",
          });
        }

        console.log(
          `📧 Emails queued for ${approver.admin_name} (${approver.admin_email})`
        );
      } catch (error) {
        console.error(
          `❌ Failed to queue emails for ${approver.admin_name}:`,
          error
        );
        queuedEmails.push({
          approver: approver.admin_name,
          email: approver.admin_email,
          status: "failed",
          error: error.message,
        });
      }
    }

    // Queue workflow created email to requester
    try {
      const workflowCreatedId = emailQueue.addToQueue(
        requester[0].admin_email,
        `[APPROVAL] Workflow Created: "${workflowDetails.rq_title}"`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">Your workflow has been created!</h2>
            <p>Your approval workflow has been successfully created and is now in the system.</p>
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 5px solid #4caf50;">
              <h3 style="color: #2e7d32;">${workflowDetails.rq_title}</h3>
              <p><strong>Description:</strong> ${workflowDetails.rq_description}</p>
              <p><strong>Due Date:</strong> ${workflowDetails.due_date}</p>
              <p><strong>Status:</strong> Pending Approval</p>
            </div>
            <p style="margin-top: 20px;">You can track the progress of your workflow in the system.</p>
            <p>The STRONG System Team</p>
          </div>
        `,
        "workflow_created",
        {
          requesterName: requester[0].admin_name,
          workflowTitle: workflowDetails.rq_title,
        }
      );

      console.log(
        `📧 Workflow created email queued for requester: ${requester[0].admin_name}`
      );
    } catch (error) {
      console.error(`❌ Failed to queue workflow created email:`, error);
    }

    // Get queue status
    const queueStatus = emailQueue.getStatus();

    res.status(200).json({
      success: true,
      message:
        "Approval workflow emails queued successfully. Emails will be sent with rate limiting to avoid API limits.",
      workflowDetails: {
        title: workflowDetails.rq_title,
        requester: requester[0].admin_name,
        requesterEmail: requester[0].admin_email,
        approvers: approvers.length,
        dueDate: workflowDetails.due_date,
      },
      queuedEmails,
      queueStatus: {
        queueSize: queueStatus.queueSize,
        isProcessing: queueStatus.isProcessing,
        totalQueued: queueStatus.queuedEmails.length,
      },
      note: "This was a test - no actual workflow was created in the database. Emails are queued and will be sent with 1-second delays to respect rate limits.",
    });
  } catch (error) {
    console.error(
      "❌ Error testing approval workflow emails with queue:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to test approval workflow emails with queue.",
      error: error.message,
    });
  }
};

// Get email queue status
const getEmailQueueStatus = async (req, res) => {
  try {
    const queueStatus = emailQueue.getStatus();

    res.status(200).json({
      success: true,
      message: "Email queue status retrieved successfully.",
      queueStatus,
    });
  } catch (error) {
    console.error("❌ Error getting email queue status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get email queue status.",
      error: error.message,
    });
  }
};

// Clear email queue
const clearEmailQueue = async (req, res) => {
  try {
    emailQueue.clearQueue();

    res.status(200).json({
      success: true,
      message: "Email queue cleared successfully.",
    });
  } catch (error) {
    console.error("❌ Error clearing email queue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear email queue.",
      error: error.message,
    });
  }
};

module.exports = {
  testApprovalWorkflowEmails,
  testApprovalWorkflowEmailsWithQueue,
  testApprovalEmailType,
  getApprovalEmailTypes,
  getEmailQueueStatus,
  clearEmailQueue,
};
