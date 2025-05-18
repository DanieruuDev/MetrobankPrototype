// Ensure you have installed the resend SDK: npm install resend
const { Resend } = require("resend");

// Initialize Resend with your API key
// IMPORTANT: Use environment variables for your API key in production!
// Make sure you have a .env file with RESEND_API_KEY=YOUR_RESEND_API_KEY
// and are loading it in your main server file (e.g., index.js) using 'dotenv'
const resend = new Resend(process.env.RESEND_API_KEY);

// Replace with your verified sender email in Resend
// 'onboarding@resend.dev' is a valid test sender email provided by Resend
// For production, you MUST use an email address on a domain you have verified in Resend.
const SENDER_EMAIL = "onboarding@resend.dev"; // <-- !!! REPLACE THIS FOR PRODUCTION !!!

// Function to send email when added as an approver
const sendApproverAddedEmail = async (approverEmail, workflowDetails) => {
  try {
    const { data, error } = await resend.emails.send({
      // Using the specified sender name and the sender email
      from: `Metrobank STRONG Workflow Approvals <${SENDER_EMAIL}>`,
      // Send to the actual approver email in production
      // For testing delivery, you can temporarily change this to 'delivered@resend.dev'
      to: "delivered@resend.dev", // Change this back to 'delivered@resend.dev' for testing delivery
      subject: `You have been added as an approver for "${workflowDetails.request_title}"`, // Subject line
      text: `Dear Approver,

You have been added as an approver for the following workflow:

Request Title: ${workflowDetails.request_title}
Requester: ${workflowDetails.requester_name}
Due Date: ${workflowDetails.due_date}
Description: ${workflowDetails.rq_description || "N/A"}

Please log in to the application to view the details and take action when it's your turn.
`,
      html: `
            <p>Dear Approver,</p>
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
      // Decide how to handle email sending failures (e.g., log, retry, notify admin)
    } else {
      console.log("Approver Added Email sent:", data);
    }
  } catch (error) {
    console.error("Unexpected error sending Approver Added Email:", error);
  }
};

// Function to send email when it's their turn to approve
const sendItsYourTurnEmail = async (approverEmail, workflowDetails) => {
  try {
    const { data, error } = await resend.emails.send({
      // Using the specified sender name and the sender email
      from: `Metrobank STRONG Workflow Approvals <${SENDER_EMAIL}>`,
      // Send to the actual approver email in production
      // For testing delivery, you can temporarily change this to 'delivered@resend.dev'
      to: "delivered@resend.dev", // Change this back to 'delivered@resend.dev' for testing delivery
      subject: `Action Required: Your turn to approve "${workflowDetails.request_title}"`, // Subject line
      text: `Dear Approver,

It is now your turn to review and take action on the following workflow:

Request Title: ${workflowDetails.request_title}
Requester: ${workflowDetails.requester_name}
Due Date: ${workflowDetails.due_date}
Description: ${workflowDetails.rq_description || "N/A"}

Please log in to the application to view the details and approve or reject the request.
`,
      html: `
            <p>Dear Approver,</p>
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
      // Decide how to handle email sending failures
    } else {
      console.log("Its Your Turn Email sent:", data);
    }
  } catch (error) {
    console.error("Unexpected error sending Its Your Turn Email:", error);
  }
};

module.exports = {
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
};
