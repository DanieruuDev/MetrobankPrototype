/**
 * Test script for approval workflow emails
 *
 * This script can be run to test the approval workflow email functionality
 * without creating actual workflows in the database.
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function testApprovalWorkflowEmails() {
  try {
    console.log("🧪 Testing approval workflow emails...");
    console.log("📧 This will send emails to:");
    console.log("   - aliarawnd13@gmail.com");
    console.log("   - aguilar.286826@ortigas-cainta.sti.edu.ph");
    console.log("   - adminlastname@example.com (requester)");
    console.log("");

    const response = await axios.post(
      `${BASE_URL}/api/approval-test/test-workflow`
    );

    if (response.data.success) {
      console.log("✅ Approval workflow emails sent successfully!");
      console.log("📊 Results:", JSON.stringify(response.data, null, 2));
      console.log("");
      console.log(
        "🔍 Check your Resend dashboard to see the delivered emails."
      );
    } else {
      console.log(
        "❌ Failed to send approval workflow emails:",
        response.data.message
      );
    }
  } catch (error) {
    console.error(
      "❌ Error testing approval workflow emails:",
      error.response?.data || error.message
    );
  }
}

async function testIndividualEmailType(emailType, approverEmail) {
  try {
    console.log(`🧪 Testing ${emailType} email to ${approverEmail}...`);

    const response = await axios.post(
      `${BASE_URL}/api/approval-test/test-email-type`,
      {
        emailType,
        approverEmail,
      }
    );

    if (response.data.success) {
      console.log(`✅ ${emailType} email sent successfully!`);
      console.log("📊 Results:", JSON.stringify(response.data, null, 2));
    } else {
      console.log(
        `❌ Failed to send ${emailType} email:`,
        response.data.message
      );
    }
  } catch (error) {
    console.error(
      `❌ Error testing ${emailType} email:`,
      error.response?.data || error.message
    );
  }
}

async function getAvailableEmailTypes() {
  try {
    console.log("📋 Getting available approval email types...");

    const response = await axios.get(
      `${BASE_URL}/api/approval-test/email-types`
    );

    if (response.data.success) {
      console.log("✅ Available email types:");
      response.data.emailTypes.forEach((type, index) => {
        console.log(`   ${index + 1}. ${type.type} - ${type.description}`);
      });
    } else {
      console.log("❌ Failed to get email types:", response.data.message);
    }
  } catch (error) {
    console.error(
      "❌ Error getting email types:",
      error.response?.data || error.message
    );
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("🚀 Running full approval workflow email test...");
    await testApprovalWorkflowEmails();
  } else if (args[0] === "types") {
    await getAvailableEmailTypes();
  } else if (args.length === 2) {
    const [emailType, approverEmail] = args;
    await testIndividualEmailType(emailType, approverEmail);
  } else {
    console.log("Usage:");
    console.log(
      "  node test-approval-emails.js                    # Test full workflow"
    );
    console.log(
      "  node test-approval-emails.js types              # Get available types"
    );
    console.log(
      "  node test-approval-emails.js <type> <email>     # Test specific type"
    );
    console.log("");
    console.log("Example:");
    console.log(
      "  node test-approval-emails.js its_your_turn aliarawnd13@gmail.com"
    );
  }
}

main().catch(console.error);
