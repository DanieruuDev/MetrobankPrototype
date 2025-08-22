// controllers/notification-controller.js
const pool = require("../database/dbConnect.js");

const getNotifications = async (req, res) => {
  // We get the user ID from the auth middleware
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated." });
  }

  try {
    // Query notifications for the current user, joining with the notifications table
    const { rows } = await pool.query(
      `SELECT
                n.id,
                n.type,
                n.title,
                n.message,
                n.related_id,
                nr.is_read,
                nr.created_at AS received_at
            FROM notification_recipients nr
            JOIN notifications n ON nr.notification_id = n.id
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
