const express = require("express");
const { upload } = require("../middlewares/uploadMiddleware");
const {
  extractDocumentController,
  uploadFileController,
  downloadFile,
} = require("../controllers/document-controller");

const router = express.Router();

router.post("/extract", upload.single("file"), extractDocumentController);
router.post("/upload", upload.single("file"), uploadFileController);
router.get("/download/:fileName", downloadFile);

module.exports = router;
