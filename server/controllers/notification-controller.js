const pool = require("../database/dbConnect.js");

// Get all notifications for a user (with actor info)
const getUserNotifications = async (req, res) => {
  const { user_id } = req.params;
  console.log(user_id);
  try {
    const query = `
      SELECT 
        ne.id,
        ne.type,
        ne.title,
        ne.message,
        ne.related_id,
        ne.action_required,
        ne.action_type,
        ne.action_payload,
        ne.created_at,
        a.admin_name AS actor_name,
        nr.is_read,
        nr.read_at,
        nr.notification_id
      FROM notification_events ne
      JOIN notification_recipients nr 
        ON ne.id = nr.notification_id
      LEFT JOIN administration_adminaccounts a 
        ON ne.actor_id = a.admin_id
      WHERE nr.user_id = $1
      ORDER BY ne.created_at DESC;
    `;

    const { rows } = await pool.query(query, [user_id]);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Failed to fetch notifications." });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  const { notification_id, user_id } = req.params;
  console.log("Update ko lang ", notification_id, user_id);
  try {
    const query = `
      UPDATE notification_recipients
      SET is_read = true, read_at = NOW()
      WHERE notification_id = $1 AND user_id = $2
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [notification_id, user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Notification not found." });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res
      .status(500)
      .json({ message: "Failed to mark notification as read." });
  }
};
const markAllAsRead = async (req, res) => {
  try {
    const { user_id } = req.params;
    const query = `
      UPDATE notification_recipients
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [user_id]);
    return res.status(200).json({
      message: `${rows.length} notifications marked as read.`,
      notifications: rows,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      message: "Failed to mark all notifications as read.",
    });
  }
};
module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
