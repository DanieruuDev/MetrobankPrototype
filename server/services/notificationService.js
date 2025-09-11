const pool = require("../database/dbConnect.js");

// CREATE TYPE notification_type AS ENUM (
//   'WORKFLOW_REQUESTED',
//   'WORKFLOW_PARTICIPATION',
//   'WORKFLOW_APPROVER_TURN',
//   'WORKFLOW_APPROVED',
//   'WORKFLOW_REJECTED',
//   'WORKFLOW_COMPLETED',
//   'DISBURSEMENT_SUGGESTION',
//   'DISBURSEMENT_CREATED',
//   'DISBURSEMENT_NEAR',
//   'DISBURSEMENT_MISSED',
//   'DISBURSEMENT_COMPLETED'
// );

// CREATE TYPE notification_action_type AS ENUM (
//   'VIEW_ONLY',
//   'VISIT_PAGE',
//   'APPROVE',
//   'REJECT',
//   'ACCEPT_SUGGESTION',
//   'DECLINE_SUGGESTION'
// );

// Create a notification event and assign recipients
const createNotification = async ({
  type,
  title,
  message,
  relatedId = null,
  actorId = null,
  actionRequired = false,
  actionType = null,
  actionPayload = null,
  recipients = [],
}) => {
  const client = await pool.connect();
  console.log(recipients);
  console.log("Change approver");
  try {
    await client.query("BEGIN");

    const eventQuery = `
      INSERT INTO notification_events 
        (type, title, message, related_id, actor_id, action_required, action_type, action_payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const eventValues = [
      type, // must match ENUM (e.g. 'WORKFLOW_APPROVER_TURN')
      title,
      message,
      relatedId,
      actorId,
      actionRequired,
      actionType, // must match ENUM (e.g. 'APPROVE')
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
