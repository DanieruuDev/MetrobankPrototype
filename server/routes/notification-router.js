const express = require("express");

const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notification-controller.js");

const notificationRouter = express.Router();

notificationRouter.get("/:user_id", getUserNotifications);
notificationRouter.put("/:notification_id/read/:user_id", markAsRead);
notificationRouter.put("/read_all/:user_id", markAllAsRead);

module.exports = notificationRouter;
