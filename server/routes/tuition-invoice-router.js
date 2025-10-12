const express = require("express");
const multer = require("multer");
const {
  fetchScholarForInvoice,
  uploadFileToDB,
} = require("../controllers/tuition-invoice-controller");
const upload = multer({ storage: multer.memoryStorage() });

const tuitionInvoiceRouter = express.Router();

tuitionInvoiceRouter.get("/list/:schoolYear/:semester", fetchScholarForInvoice);
tuitionInvoiceRouter.post(
  "/save-updates",
  upload.single("file"),
  uploadFileToDB
);

module.exports = tuitionInvoiceRouter;
