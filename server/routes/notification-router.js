// routes/notification-router.js
const express = require("express");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notification-controller.js");
const { authenticateToken } = require("../utils/authMiddleware.js");

const router = express.Router();

// Route to get all notifications for the authenticated user
// The authenticateToken middleware will ensure only a logged-in user can access this.
router.get("/my-notifications", authenticateToken, getNotifications);

// Route to mark a specific notification as read
// It expects a 'notificationId' in the request body.
router.post("/mark-as-read", authenticateToken, markAsRead);

module.exports = router;
