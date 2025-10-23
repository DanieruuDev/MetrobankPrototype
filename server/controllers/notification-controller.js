const pool = require("../database/dbConnect.js");
const { createNotification } = require("../services/notificationService.js");

// Get all notifications for a user (with actor info)
const getUserNotifications = async (req, res) => {
  const { user_id } = req.params;

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
// Create a notification
const createNotificationAPI = async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      recipient_role,
      sender_role,
      sender_branch,
      school_year,
      semester,
      disbursement_type,
      action_required,
      priority,
    } = req.body;

    // Get Socket.io instance from request
    const io = req.io;
    console.log(`🔌 Socket.io available: ${io ? "Yes" : "No"}`);

    // Get specific HR user (ID: 7) instead of all HR users
    const hrQuery = `
      SELECT admin_id, admin_name, admin_email 
      FROM administration_adminaccounts 
      WHERE admin_id = 7
    `;
    const { rows: hrUsers } = await pool.query(hrQuery);

    console.log(`🔍 Looking for specific HR user (ID: 7)`);
    console.log(`🔍 Found ${hrUsers.length} HR users:`, hrUsers);

    if (hrUsers.length === 0) {
      console.log("❌ HR user with ID 7 not found.");
      return res.status(404).json({
        success: false,
        message: "HR user not found.",
      });
    }

    // Create notification for each HR user
    const notifications = [];
    for (const hrUser of hrUsers) {
      try {
        console.log(
          `📤 Creating notification for HR user: ${hrUser.admin_name} (ID: ${hrUser.admin_id})`
        );

        // Enhanced Socket.io logging
        if (io) {
          console.log(`🔌 Socket.io instance available for real-time updates`);
          console.log(`📡 Will emit to room: user_${hrUser.admin_id}`);
        } else {
          console.log(
            `❌ Socket.io instance not available - notifications will be database-only`
          );
        }

        const notification = await createNotification(
          {
            type: type || "INVOICE_UPLOAD",
            title: title || "Thesis Fee Upload",
            message: message || "A thesis fee upload has been completed.",
            actorId: null, // We don't have the sender's user_id in this context
            actionRequired: action_required || false,
            recipients: [{ approvers: { user_id: hrUser.admin_id } }],
          },
          io // Pass Socket.io instance for real-time updates
        );
        console.log(
          `✅ Notification created successfully for ${hrUser.admin_name}:`,
          notification
        );
        notifications.push(notification);
      } catch (error) {
        console.error(
          `Failed to create notification for HR user ${hrUser.admin_id}:`,
          error
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Notifications sent to ${notifications.length} HR users.`,
      notifications: notifications,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create notification.",
    });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  createNotificationAPI,
};
