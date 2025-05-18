const express = require("express");

const {
  registerUser,
  loginUser,
  fetchUserInfo,
} = require("../controllers/admin-user-controller.js");

const { authenticateToken, authorizeRoles } = require("../middlewares/auth.js");

const userAdminRouter = express.Router();

userAdminRouter.post("/registration", registerUser);
userAdminRouter.post("/login", loginUser);
userAdminRouter.get("/user-info", authenticateToken, fetchUserInfo);

module.exports = userAdminRouter;
