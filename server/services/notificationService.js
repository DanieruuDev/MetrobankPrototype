// services/notificationService.js

const pool = require("../database/dbConnect.js");

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

    // 1. Change the table name here
    const notifResult = await client.query(
      `INSERT INTO public.notification_events
            (type, title, message, related_id)
            VALUES ($1, $2, $3, $4) RETURNING id`,
      [type, title, message, relatedId]
    );

    const notificationId = notifResult.rows[0].id;

    // 2. The recipient query stays the same as it references notification_id
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
