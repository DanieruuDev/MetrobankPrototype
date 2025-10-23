/**
 * Email Queue System
 *
 * This module handles email queuing with rate limiting to avoid
 * hitting Resend's API rate limits (2 requests per second).
 */

const { Resend } = require("resend");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_SENDER =
  process.env.EMAIL_SENDER || "STRONG Notifier <onboarding@yourdomain.com>";

// Direct email sending function to avoid circular dependency
async function sendEmailDirect(to, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_SENDER,
      to: [to],
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

class EmailQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 1000; // 1 second delay between emails
  }

  /**
   * Add email to queue
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {string} type - Email type for logging
   * @param {Object} metadata - Additional metadata
   */
  addToQueue(to, subject, html, type = "unknown", metadata = {}) {
    const emailJob = {
      id: Date.now() + Math.random(),
      to,
      subject,
      html,
      type,
      metadata,
      createdAt: new Date(),
      status: "queued",
    };

    this.queue.push(emailJob);
    console.log(
      `📧 Email queued: ${type} to ${to} (Queue size: ${this.queue.length})`
    );

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return emailJob.id;
  }

  /**
   * Process the email queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing email queue (${this.queue.length} emails)...`);

    while (this.queue.length > 0) {
      const emailJob = this.queue.shift();

      try {
        console.log(`📤 Sending email: ${emailJob.type} to ${emailJob.to}`);
        emailJob.status = "sending";

        await sendEmailDirect(emailJob.to, emailJob.subject, emailJob.html);

        emailJob.status = "sent";
        emailJob.sentAt = new Date();
        console.log(
          `✅ Email sent successfully: ${emailJob.type} to ${emailJob.to}`
        );
      } catch (error) {
        emailJob.status = "failed";
        emailJob.error = error.message;
        emailJob.failedAt = new Date();
        console.error(
          `❌ Email failed: ${emailJob.type} to ${emailJob.to}`,
          error.message
        );

        // If it's a rate limit error, add back to queue with delay
        if (error.statusCode === 429) {
          console.log(`⏳ Rate limited - adding back to queue with delay`);
          emailJob.status = "queued";
          emailJob.retryCount = (emailJob.retryCount || 0) + 1;

          if (emailJob.retryCount < 3) {
            this.queue.unshift(emailJob); // Add back to front of queue
            await this.delay(this.rateLimitDelay * 2); // Longer delay for retries
          } else {
            console.error(
              `❌ Max retries exceeded for ${emailJob.type} to ${emailJob.to}`
            );
          }
        }
      }

      // Rate limiting delay between emails
      if (this.queue.length > 0) {
        await this.delay(this.rateLimitDelay);
      }
    }

    this.isProcessing = false;
    console.log(`✅ Email queue processing completed`);
  }

  /**
   * Add delay between email sends
   * @param {number} ms - Delay in milliseconds
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      queuedEmails: this.queue.map((job) => ({
        id: job.id,
        to: job.to,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
      })),
    };
  }

  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue = [];
    console.log("🗑️ Email queue cleared");
  }
}

// Create singleton instance
const emailQueue = new EmailQueue();

module.exports = emailQueue;
