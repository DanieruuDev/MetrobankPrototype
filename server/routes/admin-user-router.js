const express = require("express");
const multer = require("multer");
const {
  registerAdmin,
  loginAdmin,
} = require("../controllers/admin-user-controller.js");
const { uploadFile, createApproval } = require("../controllers/approval.js");
const userAdminRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/image");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

userAdminRouter.post("/registration", registerAdmin);
userAdminRouter.post("/login", loginAdmin);
userAdminRouter.post("/upload", upload.single("file"), uploadFile);
userAdminRouter.post("/create-approval", upload.single("file"), createApproval);
module.exports = { userAdminRouter };
