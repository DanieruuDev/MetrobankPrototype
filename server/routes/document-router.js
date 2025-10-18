const express = require("express");
const { upload } = require("../middlewares/uploadMiddleware");
const {
  extractDocumentController,
  uploadFileController,
  downloadFile,
  extractGradesController,
  uploadGradeFileController,
} = require("../controllers/document-controller");

const router = express.Router();

router.post("/extract", upload.single("file"), extractDocumentController);
router.post("/upload", upload.single("file"), uploadFileController);
router.get("/download/:fileName", downloadFile);
router.post("/extract-grades", upload.single("file"), extractGradesController);
router.post(
  "/upload-grade-file",
  upload.single("file"),
  uploadGradeFileController
);

module.exports = router;
