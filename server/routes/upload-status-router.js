const express = require("express");
const router = express.Router();
const {
  uploadStatus,
  completeStatus,
  fetchUploadStatus,
  fetchUploadSummary,
} = require("../controllers/upload-status-controller");

router.post("/upload", uploadStatus);
router.put("/completed", completeStatus);
router.get("/list", fetchUploadStatus);
router.get("/summary", fetchUploadSummary);

module.exports = router;
