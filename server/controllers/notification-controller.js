// controllers/notificationController.js

const pool = require("../database/dbConnect.js");

const getNotifications = async (req, res) => {
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    // Change the table name in the JOIN clause
    const { rows } = await pool.query(
      `SELECT
                ne.id,
                ne.type,
                ne.title,
                ne.message,
                ne.related_id,
                nr.is_read,
                nr.created_at AS received_at
            FROM notification_recipients nr
            JOIN notification_events ne ON nr.notification_id = ne.id
            WHERE nr.user_id = $1
            ORDER BY nr.created_at DESC`,
      [userId]
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const markAsRead = async (req, res) => {
  // ... no changes needed here ...
  const userId = req.user?.user_id;
  const { notificationId } = req.body;

  if (!userId || !notificationId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    await pool.query(
      `UPDATE notification_recipients
            SET is_read = TRUE, read_at = NOW()
            WHERE user_id = $1 AND notification_id = $2`,
      [userId, notificationId]
    );

    return res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { getNotifications, markAsRead };
