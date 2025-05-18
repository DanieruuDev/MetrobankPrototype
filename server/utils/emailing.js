// Ensure you have installed the resend SDK: npm install resend
const { Resend } = require("resend");

// Initialize Resend with your API key (make sure to load from env variables)
const resend = new Resend(process.env.RESEND_API_KEY);

// Replace with your verified sender email in Resend
const SENDER_EMAIL = "onboarding@resend.dev"; // <-- Change this for production!

// Send email when added as an approver
const sendApproverAddedEmail = async (approverEmail, workflowDetails) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Metrobank STRONG Workflow Approvals <${SENDER_EMAIL}>`,
      // For testing, temporarily sending to a test address
      to: "delivered@resend.dev", // Change to approverEmail in production
      subject: `You have been added as an approver for "${workflowDetails.request_title}"`,
      text: `Dear Approver,

This is a test email sent to delivered@resend.dev.

You have been added as an approver for the following workflow:

Request Title: ${workflowDetails.request_title}
Requester: ${workflowDetails.requester_name}
Due Date: ${workflowDetails.due_date}
Description: ${workflowDetails.rq_description || "N/A"}

Please log in to the application to view the details and take action when it's your turn.
`,
      html: `
        <p>Dear Approver,</p>
        <p>This is a test email sent to delivered@resend.dev.</p>
        <p>You have been added as an approver for the following workflow:</p>
        <ul>
          <li><strong>Request Title:</strong> ${workflowDetails.request_title}</li>
          <li><strong>Requester:</strong> ${workflowDetails.requester_name}</li>
          <li><strong>Due Date:</strong> ${workflowDetails.due_date}</li>
          <li><strong>Description:</strong> ${workflowDetails.rq_description || "N/A"}</li>
        </ul>
        <p>Please log in to the application to view the details and take action when it's your turn.</p>
      `,
    });

    if (error) {
      console.error("Error sending Approver Added Email:", error);
    } else {
      console.log("Approver Added Email sent:", data);
    }
  } catch (error) {
    console.error("Unexpected error sending Approver Added Email:", error);
  }
};

// Send email when it's approver's turn
const sendItsYourTurnEmail = async (approverEmail, workflowDetails) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Metrobank STRONG Workflow Approvals <${SENDER_EMAIL}>`,
      to: "delivered@resend.dev", // Change to approverEmail in production
      subject: `Action Required: Your turn to approve "${workflowDetails.request_title}"`,
      text: `Dear Approver,

This is a test email sent to delivered@resend.dev.

It is now your turn to review and take action on the following workflow:

Request Title: ${workflowDetails.request_title}
Requester: ${workflowDetails.requester_name}
Due Date: ${workflowDetails.due_date}
Description: ${workflowDetails.rq_description || "N/A"}

Please log in to the application to view the details and approve or reject the request.
`,
      html: `
        <p>Dear Approver,</p>
        <p>This is a test email sent to delivered@resend.dev.</p>
        <p>It is now your turn to review and take action on the following workflow:</p>
        <ul>
          <li><strong>Request Title:</strong> ${workflowDetails.request_title}</li>
          <li><strong>Requester:</strong> ${workflowDetails.requester_name}</li>
          <li><strong>Due Date:</strong> ${workflowDetails.due_date}</li>
          <li><strong>Description:</strong> ${workflowDetails.rq_description || "N/A"}</li>
        </ul>
        <p>Please log in to the application to view the details and approve or reject the request.</p>
      `,
    });

    if (error) {
      console.error("Error sending Its Your Turn Email:", error);
    } else {
      console.log("Its Your Turn Email sent:", data);
    }
  } catch (error) {
    console.error("Unexpected error sending Its Your Turn Email:", error);
  }
};

// Send email when workflow is completed
const sendWorkflowCompletedEmail = async (requesterEmail, workflowDetails) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Metrobank STRONG Workflow Approvals <${SENDER_EMAIL}>`,
      to: "delivered@resend.dev", // Change to requesterEmail in production
      subject: `Workflow Completed: "${workflowDetails.request_title}"`,
      text: `Dear ${workflowDetails.requester_name},

This is a test email sent to delivered@resend.dev.

Your workflow request "${workflowDetails.request_title}" has been fully completed and approved.

Request Title: ${workflowDetails.request_title}
Due Date: ${workflowDetails.due_date}
Description: ${workflowDetails.rq_description || "N/A"}

You can view the final status and details by logging into the application.
`,
      html: `
        <p>Dear ${workflowDetails.requester_name},</p>
        <p>This is a test email sent to delivered@resend.dev.</p>
        <p>Your workflow request "<strong>${workflowDetails.request_title}</strong>" has been fully completed and approved.</p>
        <ul>
          <li><strong>Request Title:</strong> ${workflowDetails.request_title}</li>
          <li><strong>Due Date:</strong> ${workflowDetails.due_date}</li>
          <li><strong>Description:</strong> ${workflowDetails.rq_description || "N/A"}</li>
        </ul>
        <p>You can view the final status and details by logging into the application.</p>
      `,
    });

    if (error) {
      console.error("Error sending Workflow Completed Email:", error);
    } else {
      console.log("Workflow Completed Email sent:", data);
    }
  } catch (error) {
    console.error("Unexpected error sending Workflow Completed Email:", error);
  }
};

// Send email when workflow is rejected
const sendWorkflowRejectedEmail = async (
  requesterEmail,
  workflowDetails,
  rejectingApproverComment
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Metrobank STRONG Workflow Approvals <${SENDER_EMAIL}>`,
      to: "delivered@resend.dev", // Change to requesterEmail in production
      subject: `Workflow Rejected: "${workflowDetails.request_title}"`,
      text: `Dear ${workflowDetails.requester_name},

This is a test email sent to delivered@resend.dev.

Your workflow request "${workflowDetails.request_title}" has been rejected.

Request Title: ${workflowDetails.request_title}
Due Date: ${workflowDetails.due_date}
Description: ${workflowDetails.rq_description || "N/A"}
Rejection Comment: ${rejectingApproverComment || "No comment provided."}

You can view the status and details by logging into the application.
`,
      html: `
        <p>Dear ${workflowDetails.requester_name},</p>
        <p>This is a test email sent to delivered@resend.dev.</p>
        <p>Your workflow request "<strong>${workflowDetails.request_title}</strong>" has been rejected.</p>
        <ul>
          <li><strong>Request Title:</strong> ${workflowDetails.request_title}</li>
          <li><strong>Due Date:</strong> ${workflowDetails.due_date}</li>
          <li><strong>Description:</strong> ${workflowDetails.rq_description || "N/A"}</li>
        </ul>
        <p><strong>Rejection Comment:</strong> ${rejectingApproverComment || "No comment provided."}</p>
        <p>You can view the status and details by logging into the application.</p>
      `,
    });

    if (error) {
      console.error("Error sending Workflow Rejected Email:", error);
    } else {
      console.log("Workflow Rejected Email sent:", data);
    }
  } catch (error) {
    console.error("Unexpected error sending Workflow Rejected Email:", error);
  }
};

module.exports = {
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
  sendWorkflowCompletedEmail,
  sendWorkflowRejectedEmail,
};
