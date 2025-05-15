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
  fetchApproverApprovalList,
  fetchApproverApproval,
  downloadFile,
  approveApproval,
} = require("../controllers/approval.js");
const {
  uploadScholarRenewals,
  fetchAllScholarRenewal,
  getScholarRenewal,
  updateScholarRenewal,
  getExcelRenewalReport,
  filteredScholarRenewal,
} = require("../controllers/renewal-scholar-controller.js");
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
userAdminRouter.get(
  "/get-specific-request/:approver_id",
  fetchApproverApproval
);
userAdminRouter.get("/get-request/:user_id", fetchApproverApprovalList);

userAdminRouter.get("/download/:file_path", downloadFile);

userAdminRouter.put("/approve-approval", approveApproval);
userAdminRouter.put("/change-approval/:requester_id", changeApprover);
//renewals

userAdminRouter.post("/generate-renewal", uploadScholarRenewals);

userAdminRouter.get("/fetch-renewals", fetchAllScholarRenewal);
userAdminRouter.get("/get-renewal/:student_id/:renewal_id", getScholarRenewal);
userAdminRouter.put("/update-renewal", updateScholarRenewal);

userAdminRouter.get(
  "/get-renewal-report/:yr_lvl/:school_year/:semester",
  getExcelRenewalReport
);

userAdminRouter.get("/get-filter-renewal", filteredScholarRenewal);
module.exports = userAdminRouter;
