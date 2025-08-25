const pool = require("../database/dbConnect.js");
const fs = require("fs");
const path = require("path");
const {
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
  sendWorkflowCompletedEmail,
  sendWorkflowRejectedEmail,
  // Assuming you might add a sendWorkflowSubmittedEmail function later
  // sendWorkflowSubmittedEmail,
} = require("../utils/emailing"); // Ensure this path is correct
const {
  checkWorkflowExists,
  insertDocument,
  insertWorkflow,
  insertApprovers,
  fetchRequester,
} = require("../utils/workflow.utils.js");

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
    } // Parse query params

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit; // Query paginated data

    const dataQuery = await pool.query(
      "SELECT * FROM vw_workflow_display WHERE requester_id = $1 LIMIT $2 OFFSET $3",
      [user_id, limit, offset]
    ); // Query total count

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

const getApprovalsWithStatus = async (req, res) => {
  try {
    const { user_id, status } = req.params;
    let { page, limit } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "Invalid Admin ID" });
    }
    console.log(status);
    // Parse query params
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    let dataQuery, countQuery;

    if (status && status !== "All") {
      dataQuery = await pool.query(
        `SELECT * 
         FROM vw_workflow_display 
         WHERE requester_id = $1 AND status = $2 
         LIMIT $3 OFFSET $4`,
        [user_id, status, limit, offset]
      );

      countQuery = await pool.query(
        `SELECT COUNT(*) 
         FROM vw_workflow_display 
         WHERE requester_id = $1 AND status = $2`,
        [user_id, status]
      );
    } else {
      dataQuery = await pool.query(
        `SELECT * 
         FROM vw_workflow_display 
         WHERE requester_id = $1 
         LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
      );

      countQuery = await pool.query(
        `SELECT COUNT(*) 
         FROM vw_workflow_display 
         WHERE requester_id = $1`,
        [user_id]
      );
    }

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
    const { workflow_id, old_approver_id, new_approver_id, reason } = req.body; // Find new approver id and email by email

    const getNewApproverId = await pool.query(
      `SELECT admin_id, admin_email FROM administration_adminaccounts WHERE admin_email = $1`,
      [new_approver_id]
    );
    if (getNewApproverId.rowCount === 0) {
      return res.status(404).json({ message: "New approver not found." });
    } // Check workflow exists and get author

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
    } // Get old approver data including is_current and order

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
    const oldIsCurrent = oldApprover.is_current; // Update old approver: status to 'Replaced' and is_current to false if it was true

    await pool.query(
      `UPDATE wf_approver
       SET status = 'Replaced', is_current = CASE WHEN is_current THEN false ELSE is_current END
       WHERE approver_id = $1 AND workflow_id = $2`,
      [old_approver_id, workflow_id]
    ); // Insert new approver with copied is_current and status 'Pending'

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
    ); // Get the newly inserted approver_id
    const newApproverResult = await pool.query(
      `SELECT approver_id FROM wf_approver
   WHERE user_id = $1 AND workflow_id = $2 AND approver_order = $3
   ORDER BY approver_id DESC LIMIT 1`,
      [getNewApproverId.rows[0].admin_id, workflow_id, approverOrder]
    );

    const newApproverId = newApproverResult.rows[0].approver_id; // Insert into approver_response with status Pending

    await pool.query(
      `INSERT INTO approver_response (approver_id, response)
   VALUES ($1, 'Pending')`,
      [newApproverId]
    ); // Log reassignment

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
//Done with modular
//create approval
//Done with modular
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
      approvers,
    } = req.body; // Validate required fields

    if (
      !request_title ||
      !requester_id ||
      !file ||
      !req_type_id ||
      !description ||
      !due_date ||
      !school_year ||
      !approvers
    ) {
      deleteFile();
      return res.status(400).json({ message: "All fields are required" });
    }

    let appr;
    try {
      appr = JSON.parse(approvers);
    } catch (err) {
      deleteFile();
      return res.status(400).json({ message: "Invalid approvers format" });
    }

    await client.query("BEGIN");

    let IsWorkflowExist = await checkWorkflowExists(
      client,
      req_type_id,
      school_year
    );

    if (IsWorkflowExist) {
      deleteFile();
      return res.status(400).json({ message: "Workflow already exists" });
    }

    const docId = await insertDocument(client, file);

    const workflowId = await insertWorkflow(client, {
      docId,
      req_type_id,
      requester_id,
      due_date,
      school_year,
      description,
      request_title,
    });

    // Fetch requester name and email for the email notifications
    const { admin_name, admin_email } = await fetchRequester(
      client,
      requester_id
    );

    const workflowDetailsForEmail = {
      request_title: request_title,
      requester_name: admin_name,
      due_date: due_date,
      rq_description: description,
      workflow_id: workflowId,
    };

    console.log(approvers);
    const approverQueries = await insertApprovers(
      client,
      appr,
      workflowId,
      workflowDetailsForEmail
    );

    if (approverQueries.length > 0) {
      await client.query(
        "UPDATE wf_approver SET is_current = true WHERE approver_id = $1",
        [approverQueries[0].approvers.approver_id]
      );
      await sendItsYourTurnEmail(
        approverQueries[0].approvers.user_email,
        workflowDetailsForEmail
      );
    }

    const getRequestTitleQuery = await client.query(
      `SELECT rq_title FROM wf_request_type_maintenance WHERE rq_type_id = $1`,
      [req_type_id]
    );

    //put a function that save the workflow log
    const saveLog = await client.query(
      "INSERT INTO workflow_log (workflow_id, actor_id, actor_type,action, comments) VALUES ($1, $2, $3, $4, $5)",
      [
        workflowId,
        requester_id,
        "Requester",
        "Created",
        `Created workflow for ${school_year}`,
      ]
    );

    await client.query("COMMIT");

    const rq_title =
      getRequestTitleQuery.rows.length > 0
        ? getRequestTitleQuery.rows[0].rq_title
        : "Unknown Request";

    return res.status(201).json({
      message: "Approval workflow created successfully!",
      workflowList: {
        workflow_id: workflowId,
        rq_title: rq_title,
        due_date: due_date,
        status: "Pending",
        doc_name: file.originalname,
        current_approver:
          approverQueries.length > 0
            ? approverQueries[0].approvers.user_email
            : "N/A",
        school_details: `${school_year}`,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    deleteFile();

    return res
      .status(500)
      .json({ message: error.message || "File upload failed" });
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
   WHERE workflow_id IN (
     SELECT workflow_id FROM wf_approver WHERE user_id = $1
   )
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

    // Fetch workflow_id, approver_order, and requester_id for the current approver
    const currentApproverDataQuery = await client.query(
      `SELECT wa.workflow_id, wa.approver_order, w.requester_id
         FROM wf_approver wa
         JOIN workflow w ON wa.workflow_id = w.workflow_id
         WHERE wa.approver_id = $1`,
      [approver_id]
    );
    const currentApproverData = currentApproverDataQuery.rows[0];

    if (!currentApproverData) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Current approver data not found." });
    }

    const workflow_id = currentApproverData.workflow_id;
    const currentApproverOrder = currentApproverData.approver_order;
    const requester_id = currentApproverData.requester_id; // Step 1: Update approver response

    // --- Add Backend Security Check ---
    // Verify that the user making the request is the current approver
    // This check was commented out in a previous version, adding it back but keeping commented for now
    /*
    const isCurrentUserCheck = await client.query(
        `SELECT is_current FROM wf_approver WHERE approver_id = $1`,
        [approver_id]
    );

    // If the approver step is not found or the approver is not the current one
    if (isCurrentUserCheck.rows.length === 0 || isCurrentUserCheck.rows[0].is_current !== true) {
        await client.query("ROLLBACK");
        // Return a 403 Forbidden status here for better semantics
        return res.status(403).json({
            message: "Unauthorized. You are not the current approver for this step.",
        });
    }
    */
    // --- END Backend Security Check ---

    await client.query(
      `
      UPDATE approver_response
      SET response = $1, comment = $2, updated_at = NOW()
      WHERE approver_id = $3
      `,
      [response, comment, approver_id]
    ); // Step 2: Update approver status to Completed

    await client.query(
      `
      UPDATE wf_approver
      SET status = 'Completed'
      WHERE approver_id = $1
      `,
      [approver_id]
    ); // Step 3: Set current approver's is_current to FALSE

    await client.query(
      `
      UPDATE wf_approver
      SET is_current = false
      WHERE workflow_id = $1 AND approver_id = $2
      `,
      [workflow_id, approver_id] // Use workflow_id from currentApproverData
    );

    // Fetch requester email and workflow details needed for requester notifications
    // Also fetch request_title from the workflow table
    const requesterAndWorkflowDetailsQuery = await client.query(
      `SELECT aa.admin_email, aa.admin_name, w.rq_type_id, w.due_date, w.description, w.workflow_id, w.rq_title
         FROM administration_adminaccounts aa
         JOIN workflow w ON aa.admin_id = w.requester_id
         WHERE w.workflow_id = $1 AND aa.admin_id = $2`,
      [workflow_id, requester_id]
    );
    const requesterEmail =
      requesterAndWorkflowDetailsQuery.rows[0]?.admin_email ||
      "requester@example.com"; // Fallback
    const requesterName =
      requesterAndWorkflowDetailsQuery.rows[0]?.admin_name ||
      "Unknown Requester";
    const workflowDetailsForEmail = {
      request_title:
        requesterAndWorkflowDetailsQuery.rows[0]?.rq_title ||
        "Unknown Request Type", // Use rq_title from workflow table
      requester_name: requesterName,
      due_date: requesterAndWorkflowDetailsQuery.rows[0]?.due_date,
      rq_description: requesterAndWorkflowDetailsQuery.rows[0]?.description,
      workflow_id: workflow_id,
    }; // Step 4: Move to next approver or mark workflow as completed/rejected

    if (response === "Approved") {
      // Only move to next if Approved
      const nextApproverQuery = await client.query(
        `
        SELECT approver_id, user_email FROM wf_approver
        WHERE workflow_id = $1
        AND status = 'Pending'
        AND approver_order > $2
        ORDER BY approver_order
        LIMIT 1
        `,
        [workflow_id, currentApproverOrder] // Use workflow_id and currentApproverOrder from initial fetch
      );

      if (nextApproverQuery.rows.length > 0) {
        const nextApproverId = nextApproverQuery.rows[0].approver_id;
        const nextApproverEmail = nextApproverQuery.rows[0].user_email; // Get email
        console.log("Next approver set to:", nextApproverId);
        await client.query(
          `
          UPDATE wf_approver
          SET is_current = true
          WHERE approver_id = $1
          `,
          [nextApproverId]
        );

        // Send "Its Your Turn" email to the next approver
        // workflowDetailsForEmail is already fetched
        await sendItsYourTurnEmail(nextApproverEmail, workflowDetailsForEmail);
      } else {
        console.log(
          "No next approver found. Checking for workflow completion."
        );
        // If no next pending approver, check if workflow is completed
        const pendingCheckQuery = `
            SELECT COUNT(*) AS pending_count
            FROM wf_approver
            WHERE workflow_id = $1
            AND status NOT IN ('Completed', 'Missed', 'Replaced')
        `;
        const pendingResult = await client.query(pendingCheckQuery, [
          workflow_id,
        ]);
        const pendingCount = parseInt(pendingResult.rows[0].pending_count);

        // If no more pending approvers, mark workflow as completed
        if (pendingCount === 0) {
          const updateWorkflowQuery = `
                UPDATE workflow
                SET status = 'Completed', completed_at = NOW()
                WHERE workflow_id = $1
            `;
          await client.query(updateWorkflowQuery, [workflow_id]);
          console.log("Workflow marked as completed.");

          // Send Workflow Completed email to the requester
          // workflowDetailsForEmail is already fetched
          await sendWorkflowCompletedEmail(
            requesterEmail,
            workflowDetailsForEmail
          );
        }
      }
    } else if (response === "Reject") {
      // If rejected, mark the workflow as rejected immediately
      const updateWorkflowQuery = `
            UPDATE workflow
            SET status = 'Rejected', completed_at = NOW()
            WHERE workflow_id = $1
        `;
      await client.query(updateWorkflowQuery, [workflow_id]);
      console.log("Workflow marked as rejected.");

      // Send Workflow Rejected email to the requester
      // workflowDetailsForEmail is already fetched
      // Pass the comment from the rejecting approver
      await sendWorkflowRejectedEmail(
        requesterEmail,
        workflowDetailsForEmail,
        comment
      );
    }

    await client.query("COMMIT"); // Step 5: Fetch and return essential data for frontend refresh
    // This query now selects fields needed by the frontend after approval.

    const detailedQuery = `
      SELECT workflow_status, approver_response, approver_comment, approver_status, is_current
      FROM vw_approver_detailed
      WHERE approver_id = $1;
    `;
    const result = await client.query(detailedQuery, [approver_id]); // Return updated status and response for frontend refresh

    if (result.rows.length > 0) {
      const {
        workflow_status,
        approver_response,
        approver_comment,
        approver_status,
        is_current,
      } = result.rows[0];
      res.status(200).json({
        message: "Approval recorded successfully",
        workflow_status, // Overall workflow status
        approver_response, // Specific approver's response
        approver_comment, // Specific approver's comment
        approver_status, // Specific approver's status (should be 'Completed')
        is_current, // Specific approver's is_current (should be false)
      });
    } else {
      // This case indicates an issue fetching details immediately after the update
      res
        .status(404)
        .json({ message: "Approver details not found after update" });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error approving:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error during approval" });
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

const emailFinderWithRole = async (req, res) => {
  try {
    const { email } = req.params;
    console.log("Looking up email:", email);

    const result = await pool.query(
      "SELECT * FROM administration_adminaccounts WHERE admin_email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Account not found." });
    }

    const user = result.rows[0];

    return res.status(200).json({
      message: "Account found.",
      data: user,
    });
  } catch (error) {
    console.error("Error in emailFinderWithRole:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

const fetchEmailUsingRole = async (req, res) => {
  try {
    const { role } = req.params;
    const search = req.query.search || "";

    let query = `
      SELECT admin_email
      FROM administration_adminaccounts
      WHERE role_id = $1
    `;
    let params = [role];

    if (search.trim() !== "") {
      query += " AND admin_email ILIKE $2";
      params.push(`%${search}%`);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      // If search term exists, check if email exists in a different role
      if (search.trim() !== "") {
        const diffRoleCheck = await pool.query(
          "SELECT role_id FROM administration_adminaccounts WHERE admin_email ILIKE $1",
          [`%${search}%`]
        );

        if (diffRoleCheck.rows.length > 0) {
          return res.status(400).json({
            errorType: "wrongRole",
            message: "Email exists but is assigned to a different role.",
            data: [],
          });
        }
      }

      return res.status(404).json({
        errorType: "notFound",
        message: "No accounts found for this role.",
        data: [],
      });
    }

    const emails = result.rows.map((row) => row.admin_email);
    return res.status(200).json({
      message: `Accounts found with role: ${role}`,
      data: emails,
    });
  } catch (error) {
    console.error("Error in fetchEmailUsingRole:", error);
    return res.status(500).json({ message: "Server error." });
  }
}; //currently use in createapproval

module.exports = {
  uploadFile,
  changeApprover,
  createApproval,
  getApproval,
  deleteApproval,
  fetchApproverApprovalList,
  fetchApproverApproval,
  downloadFile,
  approveApproval,
  emailFinder,
  emailFinderWithRole,
  fetchEmailUsingRole,
  getApprovalsWithStatus,
};
