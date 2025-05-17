const express = require("express");

const {
  registerUser,
  loginUser,
} = require("../controllers/admin-user-controller.js");

const userAdminRouter = express.Router();

userAdminRouter.post("/registration", registerUser);
userAdminRouter.post("/login", loginUser);

module.exports = userAdminRouter;
