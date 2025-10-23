const express = require("express");
const router = express.Router();
const {
  uploadStatus,
  completeStatus,
  fetchUploadStatus,
  createInternshipUpload,
  fetchUploadSummary,
  completeInternshipStatus,
} = require("../controllers/upload-status-controller");

router.post("/upload", uploadStatus);
router.put("/completed", completeStatus);
router.put("/completed-intern", completeInternshipStatus);
router.get("/list", fetchUploadStatus);
router.get("/summary", fetchUploadSummary);
router.post("/internship-upload", createInternshipUpload);

module.exports = router;
