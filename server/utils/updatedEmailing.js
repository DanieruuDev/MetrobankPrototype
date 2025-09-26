// test-email.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

console.log("DEBUG: GMAIL_USER =", process.env.GMAIL_USER);
console.log(
  "DEBUG: GMAIL_PASS =",
  process.env.GMAIL_PASS ? "Loaded" : "Missing"
);

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendTestEmail() {
  try {
    let info = await transporter.sendMail({
      from: `"Metrobank STRONG Notifier" <${process.env.GMAIL_USER}>`,
      to: "aguilar.286826@ortigas-cainta.sti.edu.ph",
      subject: "Test Email",
      text: "This is a test email from Node.js using Nodemailer for the Student Project: STRONG Web App.",
    });
    console.log("Email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendTestEmail();
