const { time } = require("console");
const pool = require("../database/dbConnect.js");
const fs = require("fs");
const path = require("path");

//get specific approval
const getApproval = async (req, res) => {};

//get alll approvals
const getApprovals = async (req, res) => {};

//create approval
const createApproval = async (req, res) => {
  const file = req.file;
  try {
    const { author_id, due_date } = req.body;

    const { approvers } = req.body;
    let appr;
    try {
      appr = JSON.parse(approvers);
    } catch (err) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ message: "Invalid approvers format" });
    }
    //validations
    const checkID = await pool.query(
      "SELECT * FROM admin WHERE admin_id = $1",
      [author_id]
    );
    if (!checkID) {
      return res.status(400).json({ message: "User not valid" });
    }
    if (!author_id || !file || !due_date) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({ message: "All fields are required" });
    }

    //file
    const allowedFileTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel", // .xls
      "application/pdf", // .pdf
    ];

    const allowedExtensions = [".docx", ".xls", ".pdf"];

    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (
      !file ||
      !allowedFileTypes.includes(file.mimetype) ||
      !allowedExtensions.includes(fileExtension)
    ) {
      if (file) fs.unlinkSync(file.path);
      return res.status(400).json({
        message: "Invalid file type. Only .docx, .xls, and .pdf are allowed.",
      });
    }

    //validations

    //query
    const insertDocumentQuery = await pool.query(
      "INSERT INTO document(document_name, path, size, doc_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [file.originalname, file.path, file.size, file.mimetype]
    );
    const docId = insertDocumentQuery.rows[0].document_id;

    const insertApprovalWorkflowQuery = await pool.query(
      "INSERT INTO approval_workflow(document_id, author_id, due_date) VALUES ($1, $2, $3) RETURNING *",
      [docId, author_id, due_date]
    );

    const workflowID = insertApprovalWorkflowQuery.rows[0].workflow_id;

    const approverQueries = await Promise.all(
      appr.map(async (approval) => {
        const approvalList = await pool.query(
          "INSERT INTO approvers (workflow_id, approver_id, approver_order) VALUES ($1, $2, $3) RETURNING *",
          [workflowID, approval.id, approval.order]
        );
        const approverID = approvalList.rows[0].approver_record_id;

        const approvalTime = await pool.query(
          "INSERT INTO approvers_timeline (approver_record_id, apr_due_date) VALUES ($1, $2) RETURNING *",
          [approverID, approval.date]
        );

        return {
          approver: approvalList.rows[0],
          timeline: approvalTime.rows[0],
        };
      })
    );
    //query

    return res.status(201).json({
      message: "File uploaded successfully!",
      workflow: insertApprovalWorkflowQuery.rows[0],
      document: insertDocumentQuery.rows[0],
      approverQueries: approverQueries,
    });
  } catch (error) {
    console.error(error);
    if (file) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }
    return res
      .status(400)
      .json({ error: error.message || "File upload failed" });
  }
};

//edit approval
const editApproval = async (req, res) => {};

//deleting approval
const deleteApproval = async (req, res) => {};

//When approving the approval
const approveApproval = async (req, res) => {};

const uploadFile = async (req, res) => {
  try {
    console.log(req.body); // Logs other form data (if any)
    console.log(req.file); // Logs file details

    res.json({ message: "File uploaded successfully!", file: req.file });
  } catch (error) {
    res.status(500).json({ error: "File upload failed" });
  }
};

module.exports = { uploadFile, createApproval };
