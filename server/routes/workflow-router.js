const express = require("express");
const multer = require("multer");
const {
  uploadFile,
  createApproval,

  getApproval,
  deleteApproval,
  changeApprover,
  fetchApproverApprovalList,
  fetchApproverApproval,
  downloadFile,
  approveApproval,
  emailFinder,
  emailFinderWithRole,
  fetchEmailUsingRole,
  getApprovalsWithStatus,
} = require("../controllers/workflow-controller.js");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth.js");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

const workflowRouter = express.Router();

workflowRouter.post("/upload", upload.single("file"), uploadFile);

workflowRouter.get("/get-workflows/:user_id/:status", getApprovalsWithStatus);

workflowRouter.get("/get-workflow/:user_id/:workflow_id", getApproval);

workflowRouter.post("/create-workflow", upload.single("file"), createApproval);
workflowRouter.delete("/delete-workflow/:user_id/:workflow_id", deleteApproval);

workflowRouter.get("/get-specific-request/:approver_id", fetchApproverApproval);
workflowRouter.get("/get-request/:user_id", fetchApproverApprovalList);

workflowRouter.get("/download/:file_path", downloadFile);
workflowRouter.get("/search-approvers/:query", emailFinder);
workflowRouter.get("/find-email/:email", emailFinderWithRole);
workflowRouter.get("/fetch-email/:role", fetchEmailUsingRole);

workflowRouter.put("/approve-approval", approveApproval);
workflowRouter.put("/change-approval/:requester_id", changeApprover);

module.exports = workflowRouter;
