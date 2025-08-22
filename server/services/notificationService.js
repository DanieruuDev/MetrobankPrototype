// services/notificationService.js

const pool = require("../database/dbConnect.js");

/**
 * Creates a new notification and associates it with recipients.
 * @param {string} type - The notification type (e.g., 'comment', 'like', 'follow').
 * @param {string} title - The notification title.
 * @param {string} message - The full notification message.
 * @param {number} relatedId - The ID of the related entity (e.g., post ID, user ID).
 * @param {number[]} recipientIds - An array of user IDs to notify.
 */
const createNotification = async (
  type,
  title,
  message,
  relatedId,
  recipientIds
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Insert the notification event
    const notifResult = await client.query(
      `INSERT INTO public.notifications
            (type, title, message, related_id)
            VALUES ($1, $2, $3, $4) RETURNING id`,
      [type, title, message, relatedId]
    );

    const notificationId = notifResult.rows[0].id;

    // 2. Insert the recipient records
    const recipientInserts = recipientIds.map(
      (userId) =>
        `INSERT INTO public.notification_recipients (notification_id, user_id) VALUES (${notificationId}, ${userId})`
    );

    await client.query(recipientInserts.join("; "));

    await client.query("COMMIT");
    console.log(`Notification created for ${recipientIds.length} recipients.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating notification:", error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { createNotification };
