const express = require("express");

const {
  registerUser,
  loginUser,
  fetchUserInfo,
  refreshToken,
  logout,
} = require("../controllers/admin-user-controller.js");

const { authenticateToken, authorizeRoles } = require("../middlewares/auth.js");

const userAdminRouter = express.Router();

userAdminRouter.post("/registration", registerUser);
userAdminRouter.post("/login", loginUser);
userAdminRouter.post("/logout", logout);
userAdminRouter.get("/refresh-token", refreshToken);
userAdminRouter.get("/user-info", authenticateToken, fetchUserInfo);

module.exports = userAdminRouter;
