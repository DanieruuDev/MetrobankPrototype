const pool = require("../database/dbConnect.js");
const fs = require("fs");
const { request } = require("http");
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

    // Parse query params
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    // Query paginated data
    const dataQuery = await pool.query(
      "SELECT * FROM vw_workflow_display WHERE requester_id = $1 LIMIT $2 OFFSET $3",
      [user_id, limit, offset]
    );

    // Query total count
    const countQuery = await pool.query(
      "SELECT COUNT(*) FROM vw_workflow_display WHERE requester_id = $1",
      [user_id]
    );

    const totalCount = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      data: dataQuery.rows,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//deleting approval
const deleteApproval = async (req, res) => {
  const client = await pool.connect();
  const { user_id, workflow_id } = req.params;

  console.log(user_id, workflow_id);
  try {
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
    await pool.query("DELETE FROM wf_document WHERE doc_id = $1", [
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

    // Find new approver id and email by email
    const getNewApproverId = await pool.query(
      `SELECT admin_id, admin_email FROM administration_adminaccounts WHERE admin_email = $1`,
      [new_approver_id]
    );
    if (getNewApproverId.rowCount === 0) {
      return res.status(404).json({ message: "New approver not found." });
    }

    // Check workflow exists and get author
    const workflowCheck = await pool.query(
      "SELECT requester_id FROM workflow WHERE workflow_id = $1",
      [workflow_id]
    );
    if (workflowCheck.rowCount === 0) {
      return res.status(404).json({ message: "Workflow not found." });
    }
    const authorId = workflowCheck.rows[0].requester_id;

    if (authorId !== Number(requester_id)) {
      return res.status(403).json({
        message: "Unauthorized. Only the requester can change the approver.",
      });
    }

    // Get old approver data including is_current and order
    const oldApproverCheck = await pool.query(
      "SELECT * FROM wf_approver WHERE approver_id = $1 AND workflow_id = $2",
      [old_approver_id, workflow_id]
    );
    if (oldApproverCheck.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Old approver not found in this workflow." });
    }

    const oldApprover = oldApproverCheck.rows[0];
    const approverOrder = oldApprover.approver_order;
    const oldIsCurrent = oldApprover.is_current;

    // Update old approver: status to 'Replaced' and is_current to false if it was true
    await pool.query(
      `UPDATE wf_approver
       SET status = 'Replaced', is_current = CASE WHEN is_current THEN false ELSE is_current END
       WHERE approver_id = $1 AND workflow_id = $2`,
      [old_approver_id, workflow_id]
    );

    // Insert new approver with copied is_current and status 'Pending'
    await pool.query(
      `INSERT INTO wf_approver (user_id, user_email, workflow_id, approver_order, status, due_date, is_reassigned, is_current)
       VALUES ($1, $2, $3, $4, 'Pending', NOW() + INTERVAL '7 days', TRUE, $5)`,
      [
        getNewApproverId.rows[0].admin_id,
        getNewApproverId.rows[0].admin_email,
        workflow_id,
        approverOrder,
        oldIsCurrent,
      ]
    );
    // Get the newly inserted approver_id
    const newApproverResult = await pool.query(
      `SELECT approver_id FROM wf_approver
   WHERE user_id = $1 AND workflow_id = $2 AND approver_order = $3
   ORDER BY approver_id DESC LIMIT 1`,
      [getNewApproverId.rows[0].admin_id, workflow_id, approverOrder]
    );

    const newApproverId = newApproverResult.rows[0].approver_id;

    // Insert into approver_response with status Pending
    await pool.query(
      `INSERT INTO approver_response (approver_id, response)
   VALUES ($1, 'Pending')`,
      [newApproverId]
    );

    // Log reassignment
    await pool.query(
      `INSERT INTO reassignment_log (workflow_id, old_approver_id, new_approver_id, reason)
       VALUES ($1, $2, $3, $4)`,
      [workflow_id, old_approver_id, getNewApproverId.rows[0].admin_id, reason]
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
      request_title,
      requester_id,
      req_type_id,
      description,
      due_date,
      school_year,
      semester,
      scholar_level,
      approvers,
    } = req.body;

    // Validate required fields
    if (
      !request_title ||
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
      "INSERT INTO wf_document(doc_name, path, size, doc_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [file.originalname, file.path, file.size, file.mimetype]
    );
    const docId = insertDocumentQuery.rows[0].doc_id;

    const insertWorkflowQuery = await client.query(
      "INSERT INTO workflow(document_id, rq_type_id, requester_id, due_date, school_year, semester, scholar_level, description, rq_title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        docId,
        req_type_id,
        requester_id,
        due_date,
        school_year,
        semester,
        scholar_level,
        description,
        request_title,
      ]
    );
    const workflowID = insertWorkflowQuery.rows[0].workflow_id;

    // Insert approvers
    const approverQueries = [];

    for (const approval of appr) {
      const findId = await client.query(
        `SELECT admin_id FROM administration_adminaccounts WHERE admin_email = $1`,
        [approval.email]
      );

      if (findId.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ message: `Approver with email ${approval.email} not found` });
      }

      const userId = findId.rows[0].admin_id;
      console.log(findId.rows[0]);
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
      `SELECT rq_title FROM wf_request_type_maintenance WHERE rq_type_id = $1`,
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

  console.log("Approver ID:", approver_id, "Response:", response);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Step 1: Update approver response
    await client.query(
      `
      UPDATE approver_response 
      SET response = $1, comment = $2, updated_at = NOW() 
      WHERE approver_id = $3
      `,
      [response, comment, approver_id]
    );

    // Step 2: Update approver status
    await client.query(
      `
      UPDATE wf_approver 
      SET status = 'Completed' 
      WHERE approver_id = $1
      `,
      [approver_id]
    );

    // Step 3: Set current approver to FALSE
    await client.query(
      `
      UPDATE wf_approver 
      SET is_current = FALSE 
      WHERE workflow_id = (
        SELECT workflow_id FROM wf_approver WHERE approver_id = $1
      )
      AND is_current = TRUE
      `,
      [approver_id]
    );

    // Step 4: Move to next approver, if applicable
    if (response === "Approved" || response === "Reject") {
      const nextApproverQuery = await client.query(
        `
        SELECT approver_id FROM wf_approver 
        WHERE workflow_id = (
          SELECT workflow_id FROM wf_approver WHERE approver_id = $1
        )
        AND status = 'Pending'
        AND approver_order > (
          SELECT approver_order FROM wf_approver WHERE approver_id = $1
        )
        ORDER BY approver_order
        LIMIT 1
        `,
        [approver_id]
      );

      if (nextApproverQuery.rows.length > 0) {
        const nextApproverId = nextApproverQuery.rows[0].approver_id;
        console.log("Next approver set to:", nextApproverId);

        await client.query(
          `
          UPDATE wf_approver 
          SET is_current = TRUE 
          WHERE approver_id = $1
          `,
          [nextApproverId]
        );
      } else {
        console.log("No next approver found.");
      }
    }

    // Step 5: Check if workflow should be marked as completed
    const workflowQuery = `
      SELECT workflow_id FROM wf_approver WHERE approver_id = $1
    `;
    const { rows } = await client.query(workflowQuery, [approver_id]);
    const workflow_id = rows[0]?.workflow_id;
    if (!workflow_id) throw new Error("Workflow not found");

    const pendingCheckQuery = `
      SELECT COUNT(*) AS pending_count 
      FROM wf_approver 
      WHERE workflow_id = $1 
      AND status NOT IN ('Completed', 'Missed', 'Replaced')
    `;
    const pendingResult = await client.query(pendingCheckQuery, [workflow_id]);
    const pendingCount = parseInt(pendingResult.rows[0].pending_count);

    if (pendingCount === 0) {
      const updateWorkflowQuery = `
        UPDATE workflow
        SET status = 'Completed', completed_at = NOW()
        WHERE workflow_id = $1
      `;
      await client.query(updateWorkflowQuery, [workflow_id]);
      console.log("Workflow marked as completed.");
    }

    await client.query("COMMIT");

    // Step 6: Fetch and return approver's detailed status
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
    console.error("Error approving:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

const emailFinder = async (req, res) => {
  try {
    const { query } = req.params;
    console.log(query);
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query string is required." });
    }

    const result = await pool.query(
      `SELECT admin_email FROM administration_adminaccounts WHERE admin_email ILIKE $1 LIMIT 10`,
      [`%${query}%`]
    );

    const emails = result.rows.map((row) => row.admin_email);
    res.json(emails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
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
  emailFinder,
};
