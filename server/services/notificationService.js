const pool = require("../database/dbConnect.js");

// CREATE TYPE notification_type AS ENUM (
// 'SCHOLARSHIP_RENEWAL',
// 'INVOICE_UPLOAD',
// 'CALENDAR',
// 'DISBURSEMENT_OVERVIEW',
// 'SCHOLARSHIP_ANALYTICS'
// );

// CREATE TYPE notification_action_type AS ENUM (
// 'VIEW',
// 'VISIT',
// 'SUGGESTION'
// );

// Create a notification event and assign recipients
const createNotification = async (
  {
    type,
    title,
    message,
    relatedId = null,
    actorId = null,
    actionRequired = false,
    actionType = null,
    actionPayload = null,
    recipients = [],
  },
  io
) => {
  const client = await pool.connect();
  console.log(recipients);

  try {
    await client.query("BEGIN");

    const eventQuery = `
      INSERT INTO notification_events 
        (type, title, message, related_id, actor_id, action_required, action_type, action_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const eventValues = [
      type,
      title,
      message,
      relatedId,
      actorId,
      actionRequired,
      actionType,
      actionPayload ? JSON.stringify(actionPayload) : null,
    ];
    const { rows } = await client.query(eventQuery, eventValues);
    const event = rows[0];

    // Insert recipients (avoid duplicates)
    const recipientQuery = `
      INSERT INTO notification_recipients (notification_id, user_id, notif_event_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (notification_id, user_id) DO NOTHING;
    `;
    // If recipients is [[...], 23, 7], take the first element
    const cleanRecipients = Array.isArray(recipients[0])
      ? recipients[0]
      : recipients;

    for (const recipient of cleanRecipients) {
      const userId = recipient.approvers?.user_id;

      if (!userId) continue; // skip if undefined

      console.log("User ID:", userId);

      await client.query(recipientQuery, [event.id, userId, event.id]);

      if (io) {
        io.to(`user_${userId}`).emit("new_notification", {
          id: event.id,
          title: event.title,
          message: event.message,
          type: event.type,
          created_at: new Date(),
        });
        console.log(`📡 Emitted new_notification to user_${userId}`);
      }
    }

    await client.query("COMMIT");
    return event;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createNotification,
};
