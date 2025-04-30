const pool = require("../database/dbConnect.js");
const fs = require("fs");
const path = require("path");

//get specific approval (author id/ workflow id)
const getApproval = async (req, res) => {
  try {
    const { user_id, workflow_id } = req.params;

    if (!user_id || !workflow_id) {
      return res
        .status(400)
        .json({ message: "user ID and Workflow ID are required" });
    }
    const approvalsQuery = await pool.query(
      `SELECT * FROM vw_wf_full_detail WHERE requester_id = $1 AND workflow_id = $2`,
      [user_id, workflow_id]
    );

    if (approvalsQuery.rows.length === 0) {
      return res.status(404).json({ message: "No approval found" });
    }

    return res.status(200).json(approvalsQuery.rows);
  } catch (error) {
    console.error("Error fetching approval details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//get all approvals (with author id)
const getApprovals = async (req, res) => {
  try {
    const { user_id } = req.params;
    let { page, limit } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "Invalid Admin ID" });
    }

    // Convert query params to numbers, set defaults if not provided
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const offset = (page - 1) * limit; // Calculate offset for pagination

    const approvalsQuery = await pool.query(
      "SELECT * FROM vw_workflow_display WHERE requester_id = $1 LIMIT $2 OFFSET $3",
      [user_id, limit, offset]
    );

    if (approvalsQuery.rows.length === 0) {
      return res.status(200).json([]); // Return empty array instead of error message
    }

    return res.status(200).json(approvalsQuery.rows);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//deleting approval
const deleteApproval = async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, workflow_id } = req.params;
    if (!user_id || !workflow_id) {
      return res
        .status(400)
        .json({ message: "Admin ID and Workflow ID are required" });
    }
    await client.query("BEGIN");
    const approvalsQuery = await client.query(
      "SELECT * FROM workflow WHERE requester_id = $1 AND workflow_id = $2",
      [user_id, workflow_id]
    );

    if (approvalsQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Workflow not found or unauthorized" });
    }
    await pool.query("DELETE FROM document WHERE doc_id = $1", [
      approvalsQuery.rows[0].document_id,
    ]);

    await client.query("COMMIT");
    console.log(approvalsQuery.rows[0].document_id);
    return res.status(200).json({
      message: "Approval Workflow deleted successfully",
      delete: approvalsQuery.rows[0].document_id,
    });
  } catch (error) {
    console.error("Error deleting approvals:", error);
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

//change approver
const changeApprover = async (req, res) => {
  try {
    const { requester_id } = req.params;
    const { workflow_id, old_approver_id, new_approver_id, reason } = req.body;

    // Check if workflow exists and verify requester (author)
    const getNewApproverId = await pool.query(
      `SELECT user_id, email FROM "user" WHERE email = $1`,
      [new_approver_id]
    );
    console.log(getNewApproverId.rows[0], new_approver_id);
    if (getNewApproverId.rowCount === 0) {
      return res.status(404).json({ message: "New approver not found." });
    }

    const workflowCheck = await pool.query(
      "SELECT requester_id FROM workflow WHERE workflow_id = $1",
      [workflow_id]
    );

    if (workflowCheck.rowCount === 0) {
      return res.status(404).json({ message: "Workflow not found." });
    }

    const authorId = workflowCheck.rows[0].requester_id;

    // Ensure the requester is the author
    if (authorId !== Number(requester_id)) {
      return res.status(403).json({
        message: "Unauthorized. Only the requester can change the approver.",
      });
    }

    // Check if old approver exists in the workflow
    const oldApproverCheck = await pool.query(
      "SELECT * FROM wf_approver WHERE approver_id = $1 AND workflow_id = $2",
      [old_approver_id, workflow_id]
    );

    if (oldApproverCheck.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Old approver not found in this workflow." });
    }

    // Get the old approver's order
    const approverOrder = oldApproverCheck.rows[0].approver_order;

    // Step 1: Update old approver's status to "replaced"
    await pool.query(
      `UPDATE wf_approver 
      SET status = 'replaced'
      WHERE approver_id = $1 AND workflow_id = $2`,
      [old_approver_id, workflow_id]
    );

    // Step 2: Insert new approver with same order
    await pool.query(
      `INSERT INTO wf_approver (user_id, user_email, workflow_id, approver_order, status, due_date, is_reassigned)
      VALUES ($1, $2, $3, $4, 'current', NOW() + INTERVAL '7 days', TRUE)`,
      [
        getNewApproverId.rows[0].user_id,
        getNewApproverId.rows[0].email,
        workflow_id,
        approverOrder,
      ]
    );

    // Step 3: Log reassignment in `reassignment_log`
    await pool.query(
      `INSERT INTO reassignment_log (workflow_id, old_approver_id, new_approver_id, reason)
      VALUES ($1, $2, $3, $4)`,
      [workflow_id, old_approver_id, getNewApproverId.rows[0].user_id, reason]
    );

    return res.status(200).json({ message: "Approver successfully changed." });
  } catch (error) {
    console.error("Error changing approver:", error);
    return res.status(500).json({ message: "Server error. Try again later." });
  }
};

//create approval
const createApproval = async (req, res) => {
  const file = req.file;
  const deleteFile = () => {
    if (file) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }
  };

  const client = await pool.connect();

  try {
    const {
      requester_id,
      req_type_id,
      description,
      due_date,
      school_year,
      semester,
      scholar_level,
      approvers,
    } = req.body;
    console.log(
      requester_id,
      req_type_id,
      description,
      due_date,
      school_year,
      semester,
      scholar_level,
      approvers
    );
    // Validate required fields
    if (
      !requester_id ||
      !file ||
      !req_type_id ||
      !description ||
      !due_date ||
      !school_year ||
      !semester ||
      !scholar_level ||
      !approvers
    ) {
      deleteFile();
      return res.status(400).json({ message: "All fields are required" });
    }

    // Parse approvers safely
    let appr;
    try {
      appr = JSON.parse(approvers);
    } catch (err) {
      deleteFile();
      return res.status(400).json({ message: "Invalid approvers format" });
    }

    await client.query("BEGIN");

    const insertDocumentQuery = await client.query(
      "INSERT INTO document(doc_name, path, size, doc_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [file.originalname, file.path, file.size, file.mimetype]
    );
    const docId = insertDocumentQuery.rows[0].doc_id;

    const insertWorkflowQuery = await client.query(
      "INSERT INTO workflow(document_id, rq_type_id, requester_id, due_date, school_year, semester, scholar_level, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        docId,
        req_type_id,
        requester_id,
        due_date,
        school_year,
        semester,
        scholar_level,
        description,
      ]
    );
    const workflowID = insertWorkflowQuery.rows[0].workflow_id;

    // Insert approvers
    const approverQueries = [];

    for (const approval of appr) {
      const findId = await client.query(
        `SELECT user_id FROM "user" WHERE email = $1`,
        [approval.email]
      );

      if (findId.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: `Approver with email ${approval.email} not found` });
      }

      const userId = findId.rows[0].user_id;

      const existingApprover = await client.query(
        "SELECT 1 FROM wf_approver WHERE workflow_id = $1 AND user_id = $2",
        [workflowID, userId]
      );

      if (existingApprover.rows.length > 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: `Duplicate approver: ${approval.email}` });
      }

      // Insert into wf_approver
      const approvalList = await client.query(
        "INSERT INTO wf_approver (workflow_id, user_id, user_email, approver_order, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [workflowID, userId, approval.email, approval.order, approval.date]
      );

      const initializeResponse = await client.query(
        "INSERT INTO approver_response (approver_id) VALUES ($1) RETURNING *",
        [approvalList.rows[0].approver_id]
      );

      approverQueries.push({
        approvers: approvalList.rows[0],
        approval_response: initializeResponse.rows[0],
      });
    }

    if (approverQueries.length > 0) {
      await client.query(
        "UPDATE wf_approver SET is_current = true WHERE approver_id = $1",
        [approverQueries[0].approvers.approver_id]
      );
    }
    const getRequestTitleQuery = await client.query(
      `SELECT rq_title FROM request_type_maintenance WHERE rq_type_id = $1`,
      [req_type_id]
    );
    await client.query("COMMIT");

    const rq_title =
      getRequestTitleQuery.rows.length > 0
        ? getRequestTitleQuery.rows[0].rq_title
        : "Unknown Request";

    return res.status(201).json({
      message: "Approval workflow created successfully!",
      workflowList: {
        workflow_id: insertWorkflowQuery.rows[0].workflow_id,
        rq_title: rq_title,
        due_date: due_date,
        status: "Pending",
        doc_name: file.originalname,
        current_approver:
          approverQueries.length > 0
            ? approverQueries[0].approvers.user_email
            : "N/A",
        school_details: `${school_year} - ${semester} (${scholar_level})`,
      },
    });
  } catch (error) {
    console.error("Error creating approval:", error);
    await client.query("ROLLBACK");
    deleteFile();
    return res
      .status(500)
      .json({ error: error.message || "File upload failed" });
  } finally {
    client.release();
  }
};

const fetchApproverApprovalList = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const query = `
      SELECT * FROM vw_approver_workflows
      WHERE user_id = $1
    `;

    const { rows } = await pool.query(query, [user_id]);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching approver approvals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const fetchApproverApproval = async (req, res) => {
  try {
    const { approver_id } = req.params;

    const query = `
        SELECT * FROM vw_approver_detailed
        WHERE approver_id = $1;
    `;

    const { rows } = await pool.query(query, [approver_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Approver not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
//When approving the approval
const approveApproval = async (req, res) => {
  const { approver_id, response, comment } = req.body;

  if (!approver_id || !response) {
    return res
      .status(400)
      .json({ message: "Approver ID and response are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const update_response = await client.query(
      "UPDATE approver_response SET response = $1, comment = $2, updated_at = NOW() WHERE approver_id = $3",
      [response, comment, approver_id]
    );

    await client.query(
      "UPDATE wf_approver SET status = $1 WHERE approver_id = $2",
      ["Completed", approver_id]
    );

    const updateCurrentApprover = await client.query(
      `UPDATE wf_approver 
      SET is_current = FALSE 
      WHERE workflow_id = (SELECT workflow_id FROM wf_approver WHERE approver_id = $1) 
      AND is_current = TRUE`,
      [approver_id]
    );

    if (response === "Approved" || response === "Reject") {
      const nextApproverQuery = await client.query(
        `SELECT approver_id FROM wf_approver 
        WHERE workflow_id = (SELECT workflow_id FROM wf_approver WHERE approver_id = $1) 
        AND status = 'Pending' AND approver_order > 
        (SELECT approver_order FROM wf_approver WHERE approver_id = $1)
        ORDER BY approver_order LIMIT 1`,
        [approver_id]
      );
      if (nextApproverQuery.rows.length > 0) {
        const nextApproverId = nextApproverQuery.rows[0].approver_id;

        await client.query(
          `UPDATE wf_approver SET is_current = TRUE WHERE approver_id = $1`,
          [nextApproverId]
        );
      }
    }

    const workflowQuery = `SELECT workflow_id FROM wf_approver WHERE approver_id = $1`;
    const { rows } = await client.query(workflowQuery, [approver_id]);
    const workflow_id = rows[0]?.workflow_id;
    if (!workflow_id) throw new Error("Workflow not found");

    const pendingCheckQuery = `SELECT COUNT(*) AS pending_count FROM wf_approver WHERE workflow_id = $1 AND status NOT IN ('Completed', 'Missed')`;
    const pendingResult = await client.query(pendingCheckQuery, [workflow_id]);
    const pendingCount = parseInt(pendingResult.rows[0].pending_count);

    if (pendingCount === 0) {
      const updateWorkflowQuery = `
        UPDATE workflow
        SET status = 'Completed', completed_at = NOW()
        WHERE workflow_id = $1;
      `;
      await client.query(updateWorkflowQuery, [workflow_id]);
    }
    await client.query("COMMIT");
    const detailedQuery = `
    SELECT workflow_status, approver_response, approver_comment 
    FROM vw_approver_detailed 
    WHERE approver_id = $1
  `;
    const result = await client.query(detailedQuery, [approver_id]);

    if (result.rows.length > 0) {
      const { workflow_status, approver_response, approver_comment } =
        result.rows[0];
      res.status(200).json({
        message: "Approval recorded successfully",
        workflow_status,
        approver_response,
        approver_comment,
      });
    } else {
      res.status(404).json({ message: "Approver details not found" });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

const downloadFile = async (req, res) => {
  const file_path = decodeURIComponent(req.params.file_path);
  if (!file_path) {
    return res.status(400).send("Invalid file path");
  }
  console.log(file_path);
  const fullPath = path.join(__dirname, "../", file_path);
  console.log("Downloading file from:", fullPath);

  res.download(fullPath, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).send("Error downloading file");
    }
  });
};

const uploadFile = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.file);

    res.json({ message: "File uploaded successfully!", file: req.file });
  } catch (error) {
    res.status(500).json({ error: "File upload failed" });
  }
};

module.exports = {
  uploadFile,
  changeApprover,
  createApproval,
  getApprovals,
  getApproval,
  deleteApproval,
  fetchApproverApprovalList,
  fetchApproverApproval,
  downloadFile,
  approveApproval,
};
