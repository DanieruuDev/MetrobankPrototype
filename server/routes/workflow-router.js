const express = require("express");
const multer = require("multer");
const {
  uploadFile,
  createApproval,
  EditApprovalByID,
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
  getApprovals,
  handleRequesterResponse,
  archiveApproval,
  getDataToEdit,
} = require("../controllers/workflow-controller.js");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth.js");

const upload = multer({ dest: "uploads/" }); // temporary storage

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     return cb(null, "./public/images");
//   },
//   filename: function (req, file, cb) {
//     return cb(null, `${Date.now()}_${file.originalname}`);
//   },
// });

const workflowRouter = express.Router();

workflowRouter.post("/upload", upload.single("file"), uploadFile);

workflowRouter.get("/get-workflows/:user_id", getApprovals);

workflowRouter.get("/get-workflow/:user_id/:workflow_id", getApproval);
workflowRouter.get("/get-edit-workflow/:workflow_id", getDataToEdit);

workflowRouter.post("/create-workflow", upload.single("file"), createApproval);
workflowRouter.put(
  "/edit-workflow/:workflow_id",
  upload.single("file"),
  EditApprovalByID
);
workflowRouter.delete(
  "/delete-workflow/:requester_id/:workflow_id",
  deleteApproval
);
workflowRouter.put(
  "/archive-workflow/:requester_id/:workflow_id",
  archiveApproval
);

workflowRouter.get("/get-specific-request/:approver_id", fetchApproverApproval);
workflowRouter.get("/get-request/:user_id", fetchApproverApprovalList);

workflowRouter.get("/download/:file_path", downloadFile);
workflowRouter.get("/search-approvers/:query", emailFinder);
workflowRouter.get("/find-email/:email", emailFinderWithRole);
workflowRouter.get("/fetch-email/:role", fetchEmailUsingRole);

workflowRouter.put("/approve-approval", approveApproval);
workflowRouter.put("/change-approval/:requester_id", changeApprover);
workflowRouter.post(
  "/requester-response",
  upload.single("file"),
  handleRequesterResponse
);

module.exports = workflowRouter;
