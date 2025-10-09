const express = require("express");
const { upload } = require("../middlewares/uploadMiddleware");
const { uploadDocument } = require("../controllers/document-controller");

const router = express.Router();

router.post("/upload", upload.single("file"), uploadDocument);

module.exports = router;
