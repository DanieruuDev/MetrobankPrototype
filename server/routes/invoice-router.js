const express = require("express");
const multer = require("multer");
const {
  fetchEligibleScholar,
  uploadFileToDB,
} = require("../controllers/invoice-controller");
const upload = multer({ storage: multer.memoryStorage() });

const invoiceRouter = express.Router();

invoiceRouter.get("/list/:schoolYear/:semester", fetchEligibleScholar);
invoiceRouter.post("/save-updates", upload.single("file"), uploadFileToDB);

module.exports = invoiceRouter;
