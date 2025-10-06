const pool = require("../database/dbConnect.js");
const fs = require("fs");
const path = require("path");
const {
  uploadFile,
  getDownloadStream,
  uploadBuffer,
} = require("../utils/b2.js");
const { sendItsYourTurnEmail } = require("../utils/emailing"); // Ensure this path is correct
const {
  checkWorkflowExists,
  insertDocument,
  insertWorkflow,
  insertApprovers,
  fetchRequester,
  insertWorkflowLog,
  updateApproverAndResponse,
  getRequesterAndWorkflowDetails,
  handleApprovedCase,
  handleRejectCase,
  handleReturnedCase,
} = require("../utils/workflow.utils.js");
const { createNotification } = require("../services/notificationService.js");

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

const getApprovals = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "Invalid Admin ID" });
    }

    const result = await pool.query(
      `SELECT * 
         FROM vw_workflow_display 
         WHERE requester_id = $1`,
      [user_id]
    );

    return res.status(200).json({
      data: result.rows,
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
    await insertWorkflowLog(
      pool, // client or pool
      workflow_id,
      oldApprover.user_id,
      "Approver", // actor_type
      "Reassigned", // action
      oldApprover.status, // old_status
      "Reassigned", // new_status
      reason // comments
    );

    // Notify old approver
    console.log("old approver id:", oldApprover.user_id);
    await createNotification({
      type: "WORKFLOW_PARTICIPATION",
      title: "You have been replaced as approver",
      message: `You have been replaced as an approver for workflow "${workflow_id}".`,
      relatedId: workflow_id,
      actorId: requester_id,
      actionRequired: false,
      recipients: [{ approvers: { user_id: oldApprover.user_id } }],
    });

    // After inserting new approver
    await insertWorkflowLog(
      pool,
      workflow_id,
      getNewApproverId.rows[0].admin_id,
      "Approver",
      "Reassigned",
      null,
      "Pending",
      `Approver ${oldApprover.user_id} has been replaced by ${getNewApproverId.rows[0].admin_id}`
    );

    // Notify new approver
    await createNotification({
      type: "WORKFLOW_APPROVER_TURN",
      title: "You have been assigned as approver",
      message: `You have been assigned as an approver for workflow "${workflow_id}".`,
      relatedId: workflow_id,
      actorId: requester_id,
      actionRequired: true, // requires action
      recipients: [
        { approvers: { user_id: getNewApproverId.rows[0].admin_id } },
      ],
    });

    return res.status(200).json({ message: "Approver successfully changed." });
  } catch (error) {
    console.error("Error changing approver:", error);
    return res.status(500).json({ message: "Server error. Try again later." });
  }
};

//create approval
//Done with modular
//done with adding notification
const createApproval = async (req, res) => {
  const file = req.file;
  const client = await pool.connect();

  try {
    const {
      rq_title,
      requester_id,
      approval_req_type,
      description,
      due_date,
      sy_code,
      semester_code,
      approvers,
      rq_type_id,
    } = req.body;

    if (
      !rq_title ||
      !rq_type_id ||
      !requester_id ||
      !file ||
      !description ||
      !due_date ||
      !sy_code ||
      !semester_code ||
      !approvers
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let appr;
    try {
      appr = JSON.parse(approvers);
    } catch {
      return res.status(400).json({ message: "Invalid approvers format" });
    }

    await client.query("BEGIN");

    if (
      await checkWorkflowExists(
        client,
        approval_req_type,
        sy_code,
        semester_code
      )
    ) {
      return res.status(400).json({ message: "Workflow already exists" });
    }

    // ✅ Upload the in-memory buffer directly
    const fileName = `${Date.now()}_${file.originalname}`;
    const b2Result = await uploadBuffer(
      file.buffer,
      fileName,
      process.env.B2_BUCKET_ID
    );

    if (!b2Result || !b2Result.fileName) {
      throw new Error("Upload to B2 failed");
    }

    // ✅ Save document metadata
    const docId = await insertDocument(client, {
      doc_name: b2Result.fileName,
      path: `${process.env.B2_BUCKET_ID}/${b2Result.fileName}`,
      size: file.size,
      doc_type: file.mimetype,
    });

    const workflowId = await insertWorkflow(client, {
      docId,
      approval_req_type,
      requester_id,
      due_date,
      sy_code,
      semester_code,
      description,
      rq_title,
      rq_type_id,
    });

    // Fetch requester info
    const { admin_name, admin_email } = await fetchRequester(
      client,
      requester_id
    );

    const workflowDetailsForEmail = {
      rq_title,
      requester_name: admin_name,
      due_date,
      rq_description: description,
      workflow_id: workflowId,
    };

    // Insert approvers
    const approverQueries = await insertApprovers(
      client,
      appr,
      workflowId,
      workflowDetailsForEmail
    );

    if (approverQueries.length > 0) {
      await createNotification({
        type: "WORKFLOW_PARTICIPATION",
        title: "You are part of a workflow",
        message: `Added you as an approver for workflow "${rq_title}".`,
        relatedId: workflowId,
        actorId: requester_id,
        actionRequired: false,
        recipients: [approverQueries],
      });

      await client.query(
        "UPDATE wf_approver SET is_current = true WHERE approver_id = $1",
        [approverQueries[0].approvers.approver_id]
      );

      const firstApprover = approverQueries[0].approvers;

      await createNotification({
        type: "WORKFLOW_APPROVER_TURN",
        title: "Approval Required",
        message: `It’s your turn to review and approve workflow "${rq_title}".`,
        relatedId: workflowId,
        actorId: requester_id,
        actionRequired: true,
        actionType: "VISIT_PAGE",
        actionPayload: { workflowId, approverId: firstApprover.approver_id },
        recipients: [{ approvers: { user_id: firstApprover.user_id } }],
      });
    }

    await createNotification({
      type: "WORKFLOW_REQUESTED",
      title: "Workflow Created",
      message: `Workflow "${rq_title}" has been submitted and is pending approval.`,
      relatedId: workflowId,
      actorId: requester_id,
      actionRequired: false,
      recipients: [{ approvers: { user_id: requester_id } }],
    });

    await client.query(
      "INSERT INTO workflow_log (workflow_id, actor_id, actor_type, action, comments) VALUES ($1, $2, $3, $4, $5)",
      [
        workflowId,
        requester_id,
        "Requester",
        "Created",
        `Created workflow for ${rq_title} ${semester_code}`,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Approval workflow created successfully!",
      workflowList: {
        workflow_id: workflowId,
        rq_title,
        due_date,
        status: "Pending",
        doc_name: b2Result.fileName,
        current_approver:
          approverQueries.length > 0
            ? approverQueries[0].approvers.user_email
            : "N/A",
        school_details: `${rq_title} - ${semester_code}`,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error:", error);
    res.status(500).json({ message: error.message || "File upload failed" });
  } finally {
    client.release();
  }
};

//Note: Add notification for this and the wokrflow log
const EditApprovalByID = async (req, res) => {
  const file = req.file; // only if new file uploaded
  const {
    rq_title,
    requester_id,
    approval_req_type,
    description,
    due_date,
    sy_code,
    semester_code,
    approvers,
    rq_type_id,
  } = req.body;

  const workflow_id = req.params.workflow_id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log(workflow_id);
    console.log(parseInt(workflow_id));
    // --- Validate requester ownership ---
    const { rows: workflowRows } = await client.query(
      "SELECT requester_id FROM workflow WHERE workflow_id = $1",
      [parseInt(workflow_id)]
    );

    if (workflowRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Workflow not found" });
    }

    const currentRequesterId = workflowRows[0].requester_id;
    if (Number(requester_id) !== currentRequesterId) {
      console.log(requester_id, currentRequesterId);
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "You are not allowed to update this workflow" });
    }

    // --- Prepare dynamic fields for workflow update ---
    const fields = [];
    const values = [];
    let idx = 1;

    if (rq_title) {
      fields.push(`rq_title = $${idx++}`);
      values.push(rq_title);
    }
    if (approval_req_type) {
      fields.push(`approval_req_type = $${idx++}`);
      values.push(approval_req_type);
    }
    if (description) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (due_date) {
      fields.push(`due_date = $${idx++}`);
      values.push(due_date);
    }
    if (sy_code) {
      fields.push(`sy_code = $${idx++}`);
      values.push(sy_code);
    }
    if (semester_code) {
      fields.push(`semester_code = $${idx++}`);
      values.push(semester_code);
    }
    if (rq_type_id) {
      fields.push(`rq_type_id = $${idx++}`);
      values.push(rq_type_id);
    }

    // --- Handle file upload properly ---
    if (file) {
      // Insert into wf_document first
      const { rows: docRows } = await client.query(
        `INSERT INTO wf_document (doc_name, doc_type, path, size)
         VALUES ($1, $2, $3, $4) RETURNING doc_id`,
        [file.originalname, file.mimetype, file.path, file.size]
      );
      const newDocId = docRows[0].doc_id;

      fields.push(`document_id = $${idx++}`);
      values.push(newDocId);
    }

    // --- Update workflow table if there are changes ---
    if (fields.length > 0) {
      values.push(workflow_id);
      const updateQuery = `
        UPDATE workflow
        SET ${fields.join(", ")}
        WHERE workflow_id = $${idx}
      `;
      await client.query(updateQuery, values);
    }

    // --- Handle approvers separately ---
    if (approvers) {
      const parsedApprovers = JSON.parse(approvers);
      if (parsedApprovers.length > 0) {
        // 1. Fetch existing approvers
        const { rows: existingRows } = await client.query(
          "SELECT * FROM wf_approver WHERE workflow_id = $1",
          [workflow_id]
        );

        for (const a of parsedApprovers) {
          // Find user_id from email
          const userRes = await client.query(
            "SELECT admin_id FROM administration_adminaccounts WHERE admin_email = $1",
            [a.email]
          );
          if (userRes.rows.length === 0) {
            throw new Error(`User with email ${a.email} not found`);
          }
          const user_id = userRes.rows[0].admin_id;

          // Check if approver exists
          const existing = existingRows.find((r) => r.user_id === user_id);

          if (existing) {
            // Update only if any field changed
            const updates = [];
            const values = [];
            let idx = 1;

            if (existing.role !== a.role) {
              updates.push(`role = $${idx++}`);
              values.push(a.role);
            }
            if (existing.approver_order !== a.order) {
              updates.push(`approver_order = $${idx++}`);
              values.push(a.order);
            }
            if (existing.due_date?.toISOString().split("T")[0] !== a.date) {
              updates.push(`due_date = $${idx++}`);
              values.push(a.date);
            }

            if (updates.length > 0) {
              values.push(existing.approver_id); // WHERE id
              const updateQuery = `UPDATE wf_approver SET ${updates.join(
                ", "
              )} WHERE approver_id = $${idx}`;
              await client.query(updateQuery, values);
            }
          } else {
            // Insert new approver
            await client.query(
              `INSERT INTO wf_approver (workflow_id, user_id, user_email, role, approver_order, due_date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
              [workflow_id, user_id, a.email, a.role, a.order, a.date]
            );
          }
        }

        // Optional: Mark removed approvers as canceled
        const incomingUserIds = parsedApprovers
          .map((a) => {
            const user = existingRows.find((r) => r.user_email === a.email);
            return user ? user.user_id : null;
          })
          .filter((id) => id !== null);

        const removed = existingRows.filter(
          (r) => !incomingUserIds.includes(r.user_id)
        );

        for (const r of removed) {
          await client.query(
            `UPDATE wf_approver SET status = 'Canceled' WHERE approver_id = $1`,
            [r.approver_id]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Workflow updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to update workflow" });
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
      SELECT *
      FROM vw_approver_workflows
      WHERE (approver->>'user_id')::int = $1
      ORDER BY workflow_id;
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

    // Get return conversation data
    const returnConversationQuery = `
      SELECT 
        rf.return_id,
        rf.reason,
        rf.created_by,
        rf.created_at,
        rf.requester_take_action,
        u.first_name || ' ' || u.last_name as created_by_name,
        u.email as created_by_email
      FROM return_feedback rf
      LEFT JOIN "user" u ON rf.created_by = u.user_id
      WHERE rf.approver_id = $1
      ORDER BY rf.created_at DESC
    `;

    const returnConversationResult = await pool.query(returnConversationQuery, [
      approver_id,
    ]);

    // Get requester responses for each return
    const returnConversation = await Promise.all(
      returnConversationResult.rows.map(async (returnItem) => {
        const requesterResponsesQuery = `
          SELECT 
            rr.req_response_id,
            rr.message,
            rr.file_name,
            rr.file_type,
            rr.file_size,
            rr.responded_at,
            u.first_name || ' ' || u.last_name as requester_name
          FROM requester_response rr
          LEFT JOIN "user" u ON rr.requester_id = u.user_id
          WHERE rr.response_id = $1
          ORDER BY rr.responded_at ASC
        `;

        const requesterResponses = await pool.query(requesterResponsesQuery, [
          returnItem.response_id,
        ]);

        return {
          ...returnItem,
          requester_responses: requesterResponses.rows,
        };
      })
    );

    const result = {
      ...rows[0],
      return_conversation: returnConversation,
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
//When approving the approval
//added notification
const approveApproval = async (req, res) => {
  const {
    approver_id,
    response,
    comment,
    response_id,
    workflow_id,
    approver_order,
    requester_id,
    user_id,
  } = req.body;

  const requiredFields = {
    approver_id,
    response,
    response_id,
    workflow_id,
    approver_order,
    requester_id,
    user_id,
  };

  for (const [key, value] of Object.entries(requiredFields)) {
    if (value === undefined || value === null || value === "") {
      return res
        .status(400)
        .json({ message: `${key} is required and cannot be empty` });
    }
  }
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requesterAndWorkflowDetails = await getRequesterAndWorkflowDetails(
      client,
      workflow_id,
      requester_id
    );

    const workflowDetailsForEmail =
      requesterAndWorkflowDetails.workflowDetailsForEmail;
    console.log("Details for email: ", workflowDetailsForEmail);
    console.log("Details for email: ", requesterAndWorkflowDetails.rows);
    if (response === "Approved") {
      await handleApprovedCase(
        client,
        workflow_id,
        approver_order,
        user_id,
        comment,
        workflowDetailsForEmail,
        requester_id,
        approver_id
      );
      await updateApproverAndResponse(client, approver_id, response, comment);
    } else if (response === "Reject") {
      await handleRejectCase(
        client,
        workflow_id,
        user_id,
        comment,
        workflowDetailsForEmail,
        requester_id
      );
      await updateApproverAndResponse(client, approver_id, response, comment);
    } else if (response === "Return") {
      try {
        await client.query("BEGIN");

        await handleReturnedCase(
          client,
          response_id,
          comment,
          user_id,
          workflow_id,
          requester_id,
          approver_id
        );

        // Update only the response; do not overwrite approver comments with return reasons
        await client.query(
          `
      UPDATE approver_response
      SET response = $1, updated_at = NOW()
      WHERE approver_id = $2
      `,
          ["Returned", approver_id]
        );

        console.log("Before update of wf_approver and workflow");
        await client.query(
          `
      UPDATE wf_approver
      SET status = 'Returned'
      WHERE approver_id = $1
      `,
          [approver_id]
        );

        await client.query(
          `
      UPDATE workflow
      SET status = 'Returned'
      WHERE workflow_id = $1
      `,
          [workflow_id]
        );
        console.log("After update of wf_approver and workflow");
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("🚨 Error in Returned flow:", err);
        throw err; // just bubble it up
      }
    }

    await client.query("COMMIT");

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
        workflow_status,
        approver_response,
        approver_comment,
        approver_status,
        is_current,
      });
    } else {
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
  const fileName = decodeURIComponent(req.params.file_path); // use same param
  if (!fileName) {
    return res.status(400).send("Invalid file name");
  }

  try {
    console.log("Downloading file from B2:", fileName);

    // Get the file stream from B2
    const fileStream = await getDownloadStream(fileName);

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Pipe the B2 stream directly to the response
    fileStream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end("Error reading file stream");
    });

    fileStream.pipe(res);
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).send("Error downloading file");
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
};

const handleRequesterResponse = async (req, res) => {
  const { return_id, comment, requester_id, workflow_id, response_id } =
    req.body;
  const file = req.file;
  console.log(file);
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
    await client.query("BEGIN");

    let fileName = null;
    let fileType = null;
    let fileSize = null;
    if (file) {
      const bucketId = process.env.B2_BUCKET_ID;
      const uniqueFileName = `${Date.now()}_${file.originalname}`;

      await uploadFile(file.path, uniqueFileName, bucketId);

      fileName = uniqueFileName;
      fileType = file.mimetype;
      fileSize = file.size;

      deleteFile();
    }
    const insertRes = await client.query(
      `
      INSERT INTO requester_response (
        response_id,
        requester_id,
        message,
        file_name,
        file_type,
        file_size
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING req_response_id
      `,
      [return_id, requester_id, comment, fileName, fileType, fileSize]
    );

    const reqResponseId = insertRes.rows[0].req_response_id;
    console.log(reqResponseId);

    await client.query(
      `UPDATE approver_response SET response = $1 WHERE response_id = $2`,
      ["Pending", response_id]
    );

    await client.query(
      `UPDATE return_feedback SET requester_take_action = $1 WHERE return_id = $2`,
      [true, return_id]
    );
    console.log("Return feedback udpate done");
    await client.query(
      `UPDATE workflow SET status = 'In Progress' WHERE workflow_id = $1`,
      [workflow_id]
    );
    console.log("workflow udpate done");
    await client.query(
      `UPDATE wf_approver
       SET status = 'Pending'
       WHERE workflow_id = $1
         AND status = 'Returned'`,
      [workflow_id]
    );
    console.log(" wf_approver udpate done");
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Requester response submitted and workflow resumed",
      responseId: reqResponseId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error handling requester response:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save requester response",
      error: err.message,
    });
  } finally {
    client.release();
  }
};

const archiveApproval = async (req, res) => {
  const { requester_id, workflow_id } = req.params;

  if (!requester_id || !workflow_id) {
    return res
      .status(400)
      .json({ message: "Missing requester_id or workflow_id" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE workflow SET is_archived = true WHERE requester_id = $1 AND workflow_id = $2 RETURNING *",
      [requester_id, workflow_id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "No workflow found with given requester_id and workflow_id",
      });
    }

    const archivedWorkflow = result.rows[0];

    // ✅ Fetch approvers correctly
    const approversRes = await client.query(
      `
      SELECT a.admin_id AS user_id, a.admin_name
      FROM wf_approver wa
      JOIN administration_adminaccounts a 
        ON wa.user_id = a.admin_id
      WHERE wa.workflow_id = $1
      `,
      [workflow_id]
    );

    const approvers = approversRes.rows;

    if (approvers.length > 0) {
      const wrappedApprovers = approvers.map((a) => ({
        approvers: { user_id: a.user_id },
      }));

      console.log("Recipients:", wrappedApprovers);

      await createNotification({
        type: "WORKFLOW_PARTICIPATION",
        title: "Workflow Archived",
        message: `The workflow "${archivedWorkflow.rq_title}" has been archived.`,
        relatedId: workflow_id,
        actorId: requester_id,
        actionRequired: false,
        actionType: "VIEW_ONLY",
        recipients: wrappedApprovers,
      });
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Workflow archived successfully and approvers notified",
      workflow: archivedWorkflow,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error archiving workflow:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

const getDataToEdit = async (req, res) => {
  const { workflow_id } = req.params;
  console.log(workflow_id);
  if (!workflow_id) {
    return res.status(404).json({ message: "Workflow ID is missing." });
  }
  try {
    const result = await pool.query(
      "SELECT * FROM vw_workflow_edit_data WHERE workflow_id = $1",
      [workflow_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No approval found" });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: `Error occurred while getting workflow data with id ${workflow_id}`,
      error: error.message,
    });
  }
};

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
  getApprovals,
  handleRequesterResponse,
  archiveApproval,
  getDataToEdit,
  EditApprovalByID,
};
