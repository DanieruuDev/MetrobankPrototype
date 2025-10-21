const express = require("express");
const multer = require("multer");
const {
  fetchEligibleScholar,
  uploadFileToDB,
  uploadSemestralAllowance,
  uploadThesisFee,
  fetchAcademicAwardEligible,
  addAcademicAwardStudent,
  removeAcademicAwardStudent,
  uploadAcademicAward,
  addInternshipAllowance,
  deleteInternshipAllowance,
  fetchEligibleInternshipAllowance,
  fetchCoveredDate,
  uploadInternshipAllowance,
} = require("../controllers/invoice-controller");
const upload = multer({ storage: multer.memoryStorage() });

const invoiceRouter = express.Router();

invoiceRouter.get("/list/:schoolYear/:semester", fetchEligibleScholar);
invoiceRouter.get("/list/academic-award", fetchAcademicAwardEligible);
invoiceRouter.post("/save-updates", upload.single("file"), uploadFileToDB);
invoiceRouter.put("/upload-semestral", uploadSemestralAllowance);
invoiceRouter.post(
  "/upload-thesis-fee",
  upload.single("file"),
  uploadThesisFee
);
invoiceRouter.post("/add-academic-award", addAcademicAwardStudent);
invoiceRouter.delete("/remove-academic-award", removeAcademicAwardStudent);
invoiceRouter.post(
  "/upload-academic-award",
  upload.array("files[]"),
  uploadAcademicAward
);

invoiceRouter.post("/add-internship-allowance", addInternshipAllowance);
invoiceRouter.delete("/delete-internship-allowance", deleteInternshipAllowance);
invoiceRouter.get("/internship/list", fetchEligibleInternshipAllowance);
invoiceRouter.get("/internship-covered-date", fetchCoveredDate);
invoiceRouter.post(
  "/upload-internship-allowance",
  upload.single("file"),
  uploadInternshipAllowance
);

module.exports = invoiceRouter;
