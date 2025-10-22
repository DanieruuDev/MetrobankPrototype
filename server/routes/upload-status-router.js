const express = require("express");
const router = express.Router();
const {
  uploadStatus,
  completeStatus,
  fetchUploadStatus,
} = require("../controllers/upload-status-controller");

router.post("/upload", uploadStatus);
router.put("/completed", completeStatus);
router.get("/list", fetchUploadStatus);

module.exports = router;
