const { Resend } = require("resend"); // 👈 NEW: Import Resend
const path = require("path");
const emailQueue = require("./email-queue.js");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

// ⚠️ IMPORTANT: Set this environment variable in your .env file
// RESEND_API_KEY="re_xxxxxxxxxxxxxxx"
// EMAIL_SENDER="Verified Sender Name <onboarding@yourdomain.com>"

// ❌ REMOVED: Nodemailer and Gmail related setup/debugging

// Configure Resend client
const resend = new Resend(process.env.RESEND_API_KEY); // 👈 NEW: Initialize Resend

// Define sender email from environment variable (Must be a verified domain in Resend)
const EMAIL_SENDER =
  process.env.EMAIL_SENDER || "STRONG Notifier <onboarding@yourdomain.com>";

// Generic sendEmail function to be used by all other functions
async function sendEmail(to, subject, html) {
  try {
    // 👈 NEW: Use Resend client to send email
    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: [to], // Resend expects an array for 'to'
      subject: subject,
      html: html,
    });

    if (error) {
      throw error;
    }

    console.log("✅ Email sent:", data.id);
    return data;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
}

// -----------------------------------------------------------
// 1. You have been added as an approver (but not active yet)
// -----------------------------------------------------------
async function sendApproverAddedEmail(to, workflowDetails) {
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

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(to, subject, htmlTemplate, "approver_added", {
    workflowTitle: workflowDetails.rq_title,
    requesterName: workflowDetails.requester_name,
  });
}

// -----------------------------------------------------------
// 2. It is now your turn to act as an approver
// -----------------------------------------------------------
async function sendItsYourTurnEmail(to, workflowDetails) {
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

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(to, subject, htmlTemplate, "its_your_turn", {
    workflowTitle: workflowDetails.rq_title,
    requesterName: workflowDetails.requester_name,
    dueDate: workflowDetails.due_date,
  });
}

// -----------------------------------------------------------
// 3. Deadline is close (for approver and requester)
// -----------------------------------------------------------
async function sendDeadlineReminder(to, workflowDetails, userRole) {
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

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(to, subject, htmlTemplate, "deadline_reminder", {
    workflowTitle: workflowDetails.rq_title,
    requesterName: workflowDetails.requester_name,
    dueDate: workflowDetails.due_date,
    userRole: userRole,
  });
}

// -----------------------------------------------------------
// 4. Workflow has been rejected
// -----------------------------------------------------------
async function sendWorkflowRejectedEmail(to, workflowDetails, rejectComment) {
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

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(to, subject, htmlTemplate, "workflow_rejected", {
    workflowTitle: workflowDetails.rq_title,
    rejectedBy: workflowDetails.last_approver_name,
    reason: rejectComment,
  });
}

// -----------------------------------------------------------
// 5. Workflow has been completed
// -----------------------------------------------------------
async function sendWorkflowCompletedEmail(to, workflowDetails) {
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

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(
    to,
    subject,
    htmlTemplate,
    "workflow_completed",
    {
      workflowTitle: workflowDetails.rq_title,
      requesterName: workflowDetails.requester_name,
    }
  );
}

// -----------------------------------------------------------
// 6. Workflow has moved forward
// -----------------------------------------------------------
async function sendWorkflowMovedForward(to, workflowDetails) {
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

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(
    to,
    subject,
    htmlTemplate,
    "workflow_moved_forward",
    {
      workflowTitle: workflowDetails.rq_title,
      nextApprover: workflowDetails.next_approver_name,
    }
  );
}

// -----------------------------------------------------------
// 7. You have been replaced as an approver
// -----------------------------------------------------------
async function sendApproverReplacedEmail(to, workflowDetails) {
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

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(to, subject, htmlTemplate, "approver_replaced", {
    workflowTitle: workflowDetails.rq_title,
    requesterName: workflowDetails.requester_name,
  });
}

// -----------------------------------------------------------
// SCHOLARSHIP RENEWAL MODULE EMAIL TEMPLATES
// -----------------------------------------------------------

// Delisted Scholars Notification Email
async function sendDelistedScholarsEmail(to, scholarDetails, delistingReasons) {
  const subject = `Scholarship Delisting Notification - ${scholarDetails.scholar_name}`;

  // Format the reasons list
  const reasonsList = delistingReasons
    .map(
      (reason, index) =>
        `<li style="margin: 8px 0; padding: 8px; background-color: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
      <strong>${index + 1}.</strong> ${reason}
    </li>`
    )
    .join("");

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f44336; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">⚠️ Scholarship Delisting Notification</h1>
      </div>
      
      <div style="background-color: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #d32f2f; margin-top: 0;">Dear ${scholarDetails.scholar_name},</h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We regret to inform you that your scholarship has been <strong>delisted</strong> for the 
          <strong>${scholarDetails.school_year} - ${scholarDetails.semester === 1 ? "1st" : "2nd"} Semester</strong>.
        </p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #d32f2f; margin-top: 0;">📋 Scholar Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 30%;">Name:</td>
              <td style="padding: 8px;">${scholarDetails.scholar_name}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 8px; font-weight: bold;">Student ID:</td>
              <td style="padding: 8px;">${scholarDetails.student_id || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Campus:</td>
              <td style="padding: 8px;">${scholarDetails.campus_name}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 8px; font-weight: bold;">Year Level:</td>
              <td style="padding: 8px;">${scholarDetails.year_level}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Course:</td>
              <td style="padding: 8px;">${scholarDetails.course || "N/A"}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #f44336;">
          <h3 style="color: #d32f2f; margin-top: 0;">❌ Delisting Reasons</h3>
          <p style="margin-bottom: 15px; font-weight: bold;">Your scholarship has been delisted due to the following reasons:</p>
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            ${reasonsList}
          </ul>
        </div>

        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #2196f3;">
          <h3 style="color: #1976d2; margin-top: 0;">📞 Next Steps</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Please contact the HR department for more information about your delisting</li>
            <li style="margin: 8px 0;">You may appeal this decision within 30 days of receiving this notification</li>
            <li style="margin: 8px 0;">For questions or concerns, please reach out to your campus coordinator</li>
          </ul>
        </div>

        <div style="background-color: #f3e5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #9c27b0;">
          <h3 style="color: #7b1fa2; margin-top: 0;">📅 Important Dates</h3>
          <p style="margin: 8px 0;"><strong>Delisting Date:</strong> ${new Date().toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          )}</p>
          <p style="margin: 8px 0;"><strong>Appeal Deadline:</strong> ${new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
          We understand this may be disappointing news. If you have any questions or would like to discuss 
          your situation further, please don't hesitate to contact us.
        </p>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            <strong>STRONG Scholarship Program</strong><br>
            Metrobank Foundation<br>
            <a href="mailto:scholarship@metrobankfoundation.com" style="color: #1976d2;">scholarship@metrobankfoundation.com</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // Use queue system for reliable delivery
  return emailQueue.addToQueue(to, subject, htmlTemplate, "delisted_scholars", {
    scholarName: scholarDetails.scholar_name,
    studentId: scholarDetails.student_id,
    campus: scholarDetails.campus_name,
    yearLevel: scholarDetails.year_level,
    schoolYear: scholarDetails.school_year,
    semester: scholarDetails.semester,
    reasonsCount: delistingReasons.length,
  });
}

// 1. Renewal Process Initialized
async function sendRenewalInitializedEmail(
  to,
  initiatorName,
  schoolYear,
  semester
) {
  const subject = `[SCHOLARSHIP RENEWAL] Renewal Process Initialized - ${schoolYear} ${semester === 1 ? "1st" : "2nd"} Semester`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1976d2; margin: 0;">📚 Scholarship Renewal Process</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Scholarship Renewal</p>
      </div>
      
      <h3 style="color: #2e7d32;">Renewal Process Initialized</h3>
      <p>Dear HR Team,</p>
      <p><strong>${initiatorName}</strong> has initialized the renewal process for <strong>${schoolYear} - ${semester === 1 ? "1st" : "2nd"} Semester</strong>.</p>
      
      <div style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; border-left: 5px solid #9c27b0;">
        <h4 style="color: #7b1fa2; margin-top: 0;">Process Details:</h4>
        <p><strong>School Year:</strong> ${schoolYear}</p>
        <p><strong>Semester:</strong> ${semester === 1 ? "1st" : "2nd"} Semester</p>
        <p><strong>Initiator:</strong> ${initiatorName}</p>
        <p><strong>Status:</strong> Process Started</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only. In production, this would be sent to all relevant stakeholders.</p>
      </div>
      
      <p>Please log in to the system to monitor the renewal process.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// 2. Branch Validation Complete
async function sendBranchValidationCompleteEmail(
  to,
  schoolYear,
  semester,
  yearLevel,
  branchName
) {
  const subject = `[SCHOLARSHIP RENEWAL] Branch Validation Complete - ${schoolYear} ${semester === 1 ? "1st" : "2nd"} Semester`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2e7d32; margin: 0;">✅ Branch Validation Complete</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Scholarship Renewal</p>
      </div>
      
      <h3 style="color: #2e7d32;">Validation Process Completed</h3>
      <p>Dear HR Team,</p>
      <p>The branch validation process has been completed and records are ready for HR review.</p>
      
      <div style="background-color: #f1f8e9; padding: 15px; border-radius: 8px; border-left: 5px solid #4caf50;">
        <h4 style="color: #388e3c; margin-top: 0;">Validation Details:</h4>
        <p><strong>School Year:</strong> ${schoolYear}</p>
        <p><strong>Semester:</strong> ${semester === 1 ? "1st" : "2nd"} Semester</p>
        <p><strong>Year Level:</strong> ${yearLevel}</p>
        <p><strong>Branch:</strong> ${branchName}</p>
        <p><strong>Status:</strong> Ready for HR Review</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please review the validated records in the system.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// 3. New Renewal Process (for DO and Registrar)
async function sendNewRenewalProcessEmail(
  to,
  initiatorName,
  schoolYear,
  semester,
  recipientRole
) {
  const subject = `[SCHOLARSHIP RENEWAL] New Renewal Process - ${schoolYear} ${semester === 1 ? "1st" : "2nd"} Semester`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1976d2; margin: 0;">🔄 New Renewal Process</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Scholarship Renewal</p>
      </div>
      
      <h3 style="color: #1976d2;">Action Required</h3>
      <p>Dear ${recipientRole} Team,</p>
      <p><strong>${initiatorName}</strong> has initialized a new renewal process for <strong>${schoolYear} - ${semester === 1 ? "1st" : "2nd"} Semester</strong>.</p>
      
      <div style="background-color: #e8eaf6; padding: 15px; border-radius: 8px; border-left: 5px solid #3f51b5;">
        <h4 style="color: #303f9f; margin-top: 0;">Process Information:</h4>
        <p><strong>School Year:</strong> ${schoolYear}</p>
        <p><strong>Semester:</strong> ${semester === 1 ? "1st" : "2nd"} Semester</p>
        <p><strong>Initiator:</strong> ${initiatorName}</p>
        <p><strong>Your Role:</strong> ${recipientRole}</p>
        <p><strong>Next Step:</strong> Please log in to begin your validation process</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please log in to the system to begin your validation process.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// INVOICE UPLOAD MODULE EMAIL TEMPLATES
// -----------------------------------------------------------

// 4. Tuition Fee Process Finalized
async function sendTuitionFeeProcessFinalizedEmail(
  to,
  schoolYear,
  semester,
  processedBy
) {
  const subject = `[INVOICE UPLOAD] Tuition Fee Process Finalized - ${schoolYear} ${semester}`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2e7d32; margin: 0;">💰 Tuition Fee Process Complete</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Invoice Upload</p>
      </div>
      
      <h3 style="color: #2e7d32;">Process Finalized</h3>
      <p>Dear HR Team,</p>
      <p>The tuition fee process has been finalized for <strong>${schoolYear} ${semester}</strong>.</p>
      
      <div style="background-color: #f1f8e9; padding: 15px; border-radius: 8px; border-left: 5px solid #4caf50;">
        <h4 style="color: #388e3c; margin-top: 0;">Process Details:</h4>
        <p><strong>School Year:</strong> ${schoolYear}</p>
        <p><strong>Semester:</strong> ${semester}</p>
        <p><strong>Processed By:</strong> ${processedBy}</p>
        <p><strong>Type:</strong> Tuition Fee Upload</p>
        <p><strong>Status:</strong> Finalized</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please review the finalized tuition fee process in the system.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// 5. Academic Award Process Finalized
async function sendAcademicAwardProcessFinalizedEmail(
  to,
  schoolYear,
  semester,
  processedBy
) {
  const subject = `[INVOICE UPLOAD] Academic Award Process Finalized - ${schoolYear} ${semester}`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #f57c00; margin: 0;">🏆 Academic Award Process Complete</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Invoice Upload</p>
      </div>
      
      <h3 style="color: #f57c00;">Process Finalized</h3>
      <p>Dear HR Team,</p>
      <p>The academic award process has been finalized for <strong>${schoolYear} ${semester}</strong>.</p>
      
      <div style="background-color: #fff8e1; padding: 15px; border-radius: 8px; border-left: 5px solid #ff9800;">
        <h4 style="color: #f57c00; margin-top: 0;">Process Details:</h4>
        <p><strong>School Year:</strong> ${schoolYear}</p>
        <p><strong>Semester:</strong> ${semester}</p>
        <p><strong>Processed By:</strong> ${processedBy}</p>
        <p><strong>Type:</strong> Academic Award Upload</p>
        <p><strong>Status:</strong> Finalized</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please review the finalized academic award process in the system.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// 6. Thesis Fee Upload Complete
async function sendThesisFeeUploadCompleteEmail(to, processedBy) {
  const subject = `[INVOICE UPLOAD] Thesis Fee Upload Completed`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #e1f5fe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #0277bd; margin: 0;">📄 Thesis Fee Upload Complete</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Invoice Upload</p>
      </div>
      
      <h3 style="color: #0277bd;">Upload Completed</h3>
      <p>Dear HR Team,</p>
      <p>A thesis fee upload has been completed successfully.</p>
      
      <div style="background-color: #e0f2f1; padding: 15px; border-radius: 8px; border-left: 5px solid #00bcd4;">
        <h4 style="color: #00695c; margin-top: 0;">Upload Details:</h4>
        <p><strong>Type:</strong> Thesis Fee Upload</p>
        <p><strong>Processed By:</strong> ${processedBy}</p>
        <p><strong>Status:</strong> Completed</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please review the uploaded thesis fee data in the system.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// DISBURSEMENT MODULE EMAIL TEMPLATES
// -----------------------------------------------------------

// 7. Disbursement Schedule Created
async function sendDisbursementScheduleCreatedEmail(
  to,
  scheduleTitle,
  dueDate,
  amount,
  studentCount,
  createdBy
) {
  const subject = `[DISBURSEMENT] New Disbursement Schedule Created - ${scheduleTitle}`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #f3e5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #7b1fa2; margin: 0;">💳 Disbursement Schedule Created</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Disbursement Overview</p>
      </div>
      
      <h3 style="color: #7b1fa2;">New Schedule Created</h3>
      <p>Dear HR Team,</p>
      <p>A new disbursement schedule has been created and is ready for processing.</p>
      
      <div style="background-color: #fce4ec; padding: 15px; border-radius: 8px; border-left: 5px solid #e91e63;">
        <h4 style="color: #ad1457; margin-top: 0;">Schedule Details:</h4>
        <p><strong>Title:</strong> ${scheduleTitle}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p><strong>Amount:</strong> ₱${amount.toLocaleString()}</p>
        <p><strong>Student Count:</strong> ${studentCount}</p>
        <p><strong>Created By:</strong> ${createdBy}</p>
        <p><strong>Status:</strong> Scheduled</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please review the disbursement schedule in the system.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// 8. Disbursement Status Update
async function sendDisbursementStatusUpdateEmail(
  to,
  studentName,
  status,
  amount,
  updatedBy
) {
  const subject = `[DISBURSEMENT] Disbursement Status Update - ${studentName}`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2e7d32; margin: 0;">📊 Disbursement Status Update</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Disbursement Tracking</p>
      </div>
      
      <h3 style="color: #2e7d32;">Status Updated</h3>
      <p>Dear HR Team,</p>
      <p>The disbursement status has been updated for a student.</p>
      
      <div style="background-color: #f1f8e9; padding: 15px; border-radius: 8px; border-left: 5px solid #4caf50;">
        <h4 style="color: #388e3c; margin-top: 0;">Update Details:</h4>
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>New Status:</strong> ${status}</p>
        <p><strong>Amount:</strong> ₱${amount.toLocaleString()}</p>
        <p><strong>Updated By:</strong> ${updatedBy}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please review the updated disbursement status in the system.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// ANALYTICS MODULE EMAIL TEMPLATES
// -----------------------------------------------------------

// 9. Analytics Report Generated
async function sendAnalyticsReportGeneratedEmail(
  to,
  reportType,
  generatedBy,
  dateRange
) {
  const subject = `[ANALYTICS] Analytics Report Generated - ${reportType}`;
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1976d2; margin: 0;">📈 Analytics Report Generated</h2>
        <p style="margin: 5px 0 0 0; color: #666;">Module: Scholarship Analytics</p>
      </div>
      
      <h3 style="color: #1976d2;">Report Ready</h3>
      <p>Dear HR Team,</p>
      <p>A new analytics report has been generated and is available for review.</p>
      
      <div style="background-color: #e8eaf6; padding: 15px; border-radius: 8px; border-left: 5px solid #3f51b5;">
        <h4 style="color: #303f9f; margin-top: 0;">Report Details:</h4>
        <p><strong>Report Type:</strong> ${reportType}</p>
        <p><strong>Date Range:</strong> ${dateRange}</p>
        <p><strong>Generated By:</strong> ${generatedBy}</p>
        <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Status:</strong> Ready for Review</p>
      </div>
      
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #e65100;"><strong>⚠️ Testing Mode:</strong> This email is for testing purposes only.</p>
      </div>
      
      <p>Please access the analytics dashboard to view the report.</p>
      <p style="margin-top: 20px;">Best regards,<br>The Metrobank Scholarship System</p>
    </div>
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// WORKFLOW CREATED EMAIL TEMPLATE
// -----------------------------------------------------------

// Workflow has been created (for requester)
async function sendWorkflowCreatedEmail(to, workflowDetails) {
  const subject = `Workflow Created: "${workflowDetails.rq_title}"`;
  const htmlTemplate = `
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
  `;
  await sendEmail(to, subject, htmlTemplate);
}

// -----------------------------------------------------------
// TESTING EMAIL FUNCTION
// -----------------------------------------------------------

// Function to send test emails to HR users
async function sendTestEmailToHR(module, action, details) {
  try {
    // Get HR user (ID: 7) for testing
    const pool = require("../database/dbConnect.js");
    const { rows: hrUsers } = await pool.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_id = 7`
    );

    if (hrUsers.length === 0) {
      console.log("❌ HR user with ID 7 not found for testing emails.");
      return;
    }

    const hrUser = hrUsers[0];
    console.log(
      `📧 Sending test email to HR: ${hrUser.admin_name} (${hrUser.admin_email})`
    );

    // Send appropriate email based on module and action
    switch (module) {
      case "SCHOLARSHIP_RENEWAL":
        if (action === "initialized") {
          await sendRenewalInitializedEmail(
            hrUser.admin_email,
            details.initiatorName,
            details.schoolYear,
            details.semester
          );
        } else if (action === "validation_complete") {
          await sendBranchValidationCompleteEmail(
            hrUser.admin_email,
            details.schoolYear,
            details.semester,
            details.yearLevel,
            details.branchName
          );
        }
        break;
      case "INVOICE_UPLOAD":
        if (action === "tuition_finalized") {
          await sendTuitionFeeProcessFinalizedEmail(
            hrUser.admin_email,
            details.schoolYear,
            details.semester,
            details.processedBy
          );
        } else if (action === "academic_award_finalized") {
          await sendAcademicAwardProcessFinalizedEmail(
            hrUser.admin_email,
            details.schoolYear,
            details.semester,
            details.processedBy
          );
        } else if (action === "thesis_upload") {
          await sendThesisFeeUploadCompleteEmail(
            hrUser.admin_email,
            details.processedBy
          );
        }
        break;
      case "DISBURSEMENT_OVERVIEW":
        if (action === "schedule_created") {
          await sendDisbursementScheduleCreatedEmail(
            hrUser.admin_email,
            details.title,
            details.dueDate,
            details.amount,
            details.studentCount,
            details.createdBy
          );
        }
        break;
      case "DISBURSEMENT_TRACKING":
        if (action === "status_update") {
          await sendDisbursementStatusUpdateEmail(
            hrUser.admin_email,
            details.studentName,
            details.status,
            details.amount,
            details.updatedBy
          );
        }
        break;
      case "SCHOLARSHIP_ANALYTICS":
        if (action === "report_generated") {
          await sendAnalyticsReportGeneratedEmail(
            hrUser.admin_email,
            details.reportType,
            details.generatedBy,
            details.dateRange
          );
        }
        break;
      default:
        console.log(`❌ Unknown module: ${module}`);
    }

    console.log(
      `✅ Test email sent successfully to HR for ${module} - ${action}`
    );
  } catch (error) {
    console.error("❌ Error sending test email to HR:", error);
  }
}

module.exports = {
  sendEmail,
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
  sendDeadlineReminder,
  sendWorkflowRejectedEmail,
  sendWorkflowCompletedEmail,
  sendWorkflowMovedForward,
  sendApproverReplacedEmail,
  sendWorkflowCreatedEmail,
  // Scholarship Renewal Module
  sendRenewalInitializedEmail,
  sendBranchValidationCompleteEmail,
  sendNewRenewalProcessEmail,
  sendDelistedScholarsEmail,
  // Invoice Upload Module
  sendTuitionFeeProcessFinalizedEmail,
  sendAcademicAwardProcessFinalizedEmail,
  sendThesisFeeUploadCompleteEmail,
  // Disbursement Module
  sendDisbursementScheduleCreatedEmail,
  sendDisbursementStatusUpdateEmail,
  // Analytics Module
  sendAnalyticsReportGeneratedEmail,
  // Testing Function
  sendTestEmailToHR,
};
