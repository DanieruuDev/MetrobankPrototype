const express = require("express");
const multer = require("multer");

const {
  registerUser,
  loginUser,
} = require("../controllers/admin-user-controller.js");
const {
  uploadFile,
  createApproval,
  getApprovals,
  getApproval,
  deleteApproval,
  changeApprover,
} = require("../controllers/approval.js");
const userAdminRouter = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

userAdminRouter.post("/registration", registerUser);
userAdminRouter.post("/login", loginUser);

userAdminRouter.post("/upload", upload.single("file"), uploadFile);
userAdminRouter.get("/get-approvals/:user_id", getApprovals);
userAdminRouter.get("/get-approval/:user_id/:workflow_id", getApproval);
userAdminRouter.post("/create-approval", upload.single("file"), createApproval);
userAdminRouter.delete(
  "/delete-approval/:user_id/:workflow_id",
  deleteApproval
);
userAdminRouter.put("/change-approval/:requester_id", changeApprover);

module.exports = userAdminRouter;
