const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

// Debug logs
console.log("DEBUG: GMAIL_USER =", process.env.GMAIL_USER);
console.log(
  "DEBUG: GMAIL_PASS =",
  process.env.GMAIL_PASS ? "Loaded" : "Missing"
);

// Configure transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Generic sendEmail function to be used by all other functions
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: `"STRONG Notifier" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };
    let info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

// -----------------------------------------------------------
// 1. You have been added as an approver (but not active yet)
// -----------------------------------------------------------
async function sendApproverAddedEmail(to, workflowDetails) {
  // CORRECTED: changed workflowDetails.request_title to workflowDetails.rq_title
  const subject = `You have been added as an approver for "${workflowDetails.rq_title}"`;
  const htmlTemplate = `
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
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// 2. It is now your turn to act as an approver
// -----------------------------------------------------------
async function sendItsYourTurnEmail(to, workflowDetails) {
  // CORRECTED: changed workflowDetails.request_title to workflowDetails.rq_title
  const subject = `Action Required: Your approval is needed for "${workflowDetails.rq_title}"`;
  const htmlTemplate = `
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
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// 3. Deadline is close (for approver and requester)
// -----------------------------------------------------------
async function sendDeadlineReminder(to, workflowDetails, userRole) {
  // CORRECTED: changed workflowDetails.request_title to workflowDetails.rq_title
  const subject = `Reminder: Deadline is approaching for "${workflowDetails.rq_title}"`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #bf360c;">Deadline Reminder</h2>
      <p>This is a reminder that the deadline for the following workflow is approaching:</p>
      <div style="background-color: #fce4ec; padding: 15px; border-radius: 8px; border-left: 5px solid #d84315;">
        <h3 style="color: #bf360c;">${workflowDetails.rq_title}</h3>
        <p><strong>Requester:</strong> ${workflowDetails.requester_name}</p>
        <p><strong>Due Date:</strong> ${workflowDetails.due_date}</p>
        ${userRole === "approver" ? "<p>Please complete your review before the due date to avoid delays.</p>" : ""}
        ${userRole === "requester" ? "<p>Please follow up with the approver to ensure the request is completed on time.</p>" : ""}
      </div>
      <p style="margin-top: 20px;">Thank you,</p>
      <p>The STRONG System Team</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// 4. Workflow has been rejected
// -----------------------------------------------------------
async function sendWorkflowRejectedEmail(to, workflowDetails, rejectComment) {
  // CORRECTED: changed workflowDetails.request_title to workflowDetails.rq_title
  const subject = `Workflow Rejected: "${workflowDetails.rq_title}"`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #b71c1c;">Your workflow has been rejected.</h2>
      <p>We regret to inform you that your request has been rejected.</p>
      <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; border-left: 5px solid #c62828;">
        <h3 style="color: #b71c1c;">${workflowDetails.rq_title}</h3>
        <p><strong>Rejected by:</strong> ${workflowDetails.last_approver_name}</p>
        <p><strong>Reason:</strong> ${rejectComment}</p>
      </div>
      <p style="margin-top: 20px;">Please check the system for more details.</p>
      <p>The STRONG System Team</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// 5. Workflow has been completed
// -----------------------------------------------------------
async function sendWorkflowCompletedEmail(to, workflowDetails) {
  // CORRECTED: changed workflowDetails.request_title to workflowDetails.rq_title
  const subject = `Workflow Completed: "${workflowDetails.rq_title}"`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2e7d32;">Your workflow has been completed!</h2>
      <p>Congratulations! Your request has been successfully approved by all required approvers.</p>
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 5px solid #388e3c;">
        <h3 style="color: #2e7d32;">${workflowDetails.rq_title}</h3>
        <p><strong>Requester:</strong> ${workflowDetails.requester_name}</p>
        <p><strong>Status:</strong> Completed</p>
      </div>
      <p style="margin-top: 20px;">You can now view the final document in the system.</p>
      <p>The STRONG System Team</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// 6. Workflow has moved forward
// -----------------------------------------------------------
async function sendWorkflowMovedForward(to, workflowDetails) {
  // CORRECTED: changed workflowDetails.request_title to workflowDetails.rq_title
  const subject = `Workflow Update: "${workflowDetails.rq_title}" has moved forward`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #1a237e;">Workflow Update</h2>
      <p>This is to inform you that your request has been approved by an approver and has moved to the next step.</p>
      <div style="background-color: #e8eaf6; padding: 15px; border-radius: 8px; border-left: 5px solid #3949ab;">
        <h3 style="color: #1a237e;">${workflowDetails.rq_title}</h3>
        <p><strong>Current Status:</strong> Pending next approval</p>
        <p><strong>Next Approver:</strong> ${workflowDetails.next_approver_name}</p>
      </div>
      <p style="margin-top: 20px;">You can check the progress on your dashboard.</p>
      <p>The STRONG System Team</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// 7. You have been replaced as an approver
// -----------------------------------------------------------
async function sendApproverReplacedEmail(to, workflowDetails) {
  // CORRECTED: changed workflowDetails.request_title to workflowDetails.rq_title
  const subject = `Workflow Update: You have been replaced as an approver for "${workflowDetails.rq_title}"`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6a1b9a;">Approver Update</h2>
      <p>This is to inform you that you have been replaced as an approver for the following workflow. Your approval is no longer required.</p>
      <div style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 5px solid #8e24aa;">
        <h3 style="color: #6a1b9a;">${workflowDetails.rq_title}</h3>
        <p><strong>Requester:</strong> ${workflowDetails.requester_name}</p>
      </div>
      <p style="margin-top: 20px;">Thank you for your time.</p>
      <p>The STRONG System Team</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

module.exports = {
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
  sendDeadlineReminder,
  sendWorkflowRejectedEmail,
  sendWorkflowCompletedEmail,
  sendWorkflowMovedForward,
  sendApproverReplacedEmail,
};
