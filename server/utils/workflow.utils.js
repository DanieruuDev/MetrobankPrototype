const { createNotification } = require("../services/notificationService");
const {
  sendApproverAddedEmail,
  sendItsYourTurnEmail,
  sendWorkflowCompletedEmail,
} = require("../utils/emailing");
const checkWorkflowExists = async (
  client,
  approval_req_type,
  sy_code,
  semester_code
) => {
  const res = await client.query(
    "SELECT * FROM workflow WHERE approval_req_type = $1 AND sy_code = $2 AND semester_code = $3 AND is_archived = FALSE",
    [approval_req_type, sy_code, semester_code]
  );

  return res.rows.length > 0;
};

const insertDocument = async (client, fileMeta) => {
  const res = await client.query(
    "INSERT INTO wf_document(doc_name, path, size, doc_type) VALUES ($1, $2, $3, $4) RETURNING *",
    [fileMeta.doc_name, fileMeta.path, fileMeta.size, fileMeta.doc_type]
  );

  return res.rows[0].doc_id;
};

const insertWorkflow = async (client, details) => {
  const {
    docId,
    approval_req_type,
    requester_id,
    due_date,
    sy_code,
    semester_code,
    description,
    rq_title,
  } = details;

  const res = await client.query(
    "INSERT INTO workflow(document_id, approval_req_type, requester_id, due_date, sy_code, semester_code, description, rq_title) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [
      docId,
      approval_req_type,
      requester_id,
      due_date,
      sy_code,
      semester_code,
      description,
      rq_title,
    ]
  );

  return res.rows[0].workflow_id;
};

const fetchRequester = async (client, requester_id) => {
  const res = await client.query(
    `SELECT admin_name, admin_email FROM administration_adminaccounts WHERE admin_id = $1`,
    [requester_id]
  );
  return (
    res.rows[0] || { admin_name: "Unknown", admin_email: "unknown@example.com" }
  );
};

const insertApprovers = async (
  client,
  approverList,
  workflowId,
  workflowDetails
) => {
  const approverQueries = await Promise.all(
    approverList.map(async (approver) => {
      const findId = await client.query(
        `SELECT admin_id FROM administration_adminaccounts WHERE admin_email = $1`,
        [approver.email]
      );
      if (findId.rows.length === 0) {
        throw new Error(`Approver with email ${approver.email} not found`);
      }
      const userId = findId.rows[0].admin_id;

      const approvalRes = await client.query(
        `INSERT INTO wf_approver (workflow_id, user_id, user_email, approver_order, status, due_date, is_reassigned, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7, $8) RETURNING *`,
        [
          workflowId,
          userId,
          approver.email,
          approver.order,
          "Pending",
          approver.date,
          false,
          approver.role,
        ]
      );

      const responseRes = await client.query(
        `INSERT INTO approver_response (approver_id) VALUES ($1) RETURNING *`,
        [approvalRes.rows[0].approver_id]
      );

      return {
        approvers: approvalRes.rows[0],
        approval_response: responseRes.rows[0],
      };
    })
  );

  return approverQueries;
};

const insertWorkflowLog = async (
  client,
  workflow_id,
  actor_id,
  actor_type,
  action,
  old_status,
  new_status,
  comments = null
) => {
  const query = `
    INSERT INTO workflow_log (workflow_id, actor_id, actor_type, action, old_status, new_status, comments, change_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
  `;
  await client.query(query, [
    workflow_id,
    actor_id, // approver_id or requester_id
    actor_type, // 'Approver' or 'Requester'
    action, // 'Approved' / 'Rejected'
    old_status,
    new_status,
    comments,
  ]);
};

const checkReject = async (client, workflowId, workflowDetailsForEmail) => {
  try {
    const rejectResult = await client.query("SELECT * FROM check_reject($1)", [
      workflowId,
    ]);

    const rejector = rejectResult.rows[0];
    if (!rejector) return []; // no rejection found

    console.log(rejector);
    // Log the system cancellation
    await insertWorkflowLog(
      client,
      workflowId,
      rejector.user_id,
      "System",
      "Canceled",
      "Pending",
      "Canceled",
      "Workflow has been canceled"
    );

    // 2️⃣ Get all canceled approvers for this workflow
    const canceledResult = await client.query(
      `SELECT user_id, user_email
       FROM wf_approver
       WHERE workflow_id = $1
         AND status = 'Canceled'`,
      [workflowId]
    );

    for (const canceled of canceledResult.rows) {
      await createNotification({
        type: "WORKFLOW_REJECTED",
        title: "Workflow Canceled",
        message: `Approval for "${workflowDetailsForEmail.request_title}" has been canceled due to a rejection.`,
        relatedId: workflowId,
        actorId: rejector.user_id, // the approver who rejected
        actionRequired: false,
        recipients: [{ approvers: { user_id: canceled.user_id } }],
      });
    }

    return canceledResult.rows;
  } catch (error) {
    console.error("Error in checkReject:", error);
    throw error;
  }
};

const updateApproverAndResponse = async (
  client,
  approver_id,
  response,
  comment
) => {
  await client.query(
    `
    UPDATE approver_response
    SET response = $1, comment = $2, updated_at = NOW()
    WHERE approver_id = $3
    `,
    [response, comment, approver_id]
  );

  await client.query(
    `
    UPDATE wf_approver
    SET status = 'Completed'
    WHERE approver_id = $1
    `,
    [approver_id]
  );

  await client.query(
    `
    UPDATE wf_approver
    SET is_current = false
    WHERE workflow_id = (SELECT workflow_id FROM wf_approver WHERE approver_id = $1)
      AND approver_id = $1
    `,
    [approver_id]
  );
};
const getRequesterAndWorkflowDetails = async (
  client,
  workflow_id,
  requester_id
) => {
  const query = await client.query(
    `SELECT aa.admin_email, aa.admin_name, w.rq_type_id, w.due_date, w.description, w.workflow_id, w.rq_title
     FROM administration_adminaccounts aa
     JOIN workflow w ON aa.admin_id = w.requester_id
     WHERE w.workflow_id = $1 AND aa.admin_id = $2`,
    [workflow_id, requester_id]
  );

  if (!query.rows.length) return null;

  return {
    requesterEmail: query.rows[0].admin_email,
    requesterName: query.rows[0].admin_name,
    workflowDetailsForEmail: {
      request_title: query.rows[0].rq_title,
      requester_name: query.rows[0].admin_name,
      due_date: query.rows[0].due_date,
      rq_description: query.rows[0].description,
      workflow_id: query.rows[0].workflow_id,
    },
  };
};

const handleApprovedCase = async (
  client,
  workflow_id,
  currentApproverOrder,
  user_id,
  comment,
  workflowDetailsForEmail,
  requester_id
) => {
  let nextApproverFound = false;
  let nextApproverEmail = null;
  let nextUserId = null;
  let workflowCompleted = false;

  try {
    await client.query("BEGIN");

    let curRes = await client.query(
      `
      SELECT approver_id, approver_order, status, is_current, user_id
      FROM wf_approver
      WHERE workflow_id = $1 AND user_id = $2 AND is_current = true
      FOR UPDATE
      `,
      [workflow_id, user_id]
    );

    if (curRes.rows.length === 0) {
      curRes = await client.query(
        `
        SELECT approver_id, approver_order, status, is_current, user_id
        FROM wf_approver
        WHERE workflow_id = $1 AND approver_order = $2
        FOR UPDATE
        `,
        [workflow_id, currentApproverOrder]
      );
    }

    if (curRes.rows.length === 0) {
      throw new Error(
        `Could not locate current approver row for workflow_id=${workflow_id}, user_id=${user_id}, order=${currentApproverOrder}`
      );
    }

    const currentApproverId = curRes.rows[0].approver_id;

    const updCur = await client.query(
      `
      UPDATE wf_approver
      SET status = 'Completed', is_current = false
      WHERE approver_id = $1
      `,
      [currentApproverId]
    );
    if (updCur.rowCount !== 1) {
      throw new Error(
        `Failed to update current approver (approver_id=${currentApproverId}) to Completed. rowCount=${updCur.rowCount}`
      );
    }
    await insertWorkflowLog(
      client,
      workflow_id,
      user_id,
      "Approver",
      "Approved",
      "Pending",
      "Completed",
      comment
    );
    const nextRes = await client.query(
      `
      SELECT approver_id, user_email, user_id, approver_order
      FROM wf_approver
      WHERE workflow_id = $1
        AND status = 'Pending'
        AND approver_order > $2
      ORDER BY approver_order
      LIMIT 1
      FOR UPDATE
      `,
      [workflow_id, currentApproverOrder]
    );

    if (nextRes.rows.length > 0) {
      // Next approver exists — activate them
      const nextRow = nextRes.rows[0];
      const nextApproverId = nextRow.approver_id;
      nextUserId = nextRow.user_id;
      nextApproverEmail = nextRow.user_email;

      const updNext = await client.query(
        `UPDATE wf_approver SET is_current = true WHERE approver_id = $1`,
        [nextApproverId]
      );
      if (updNext.rowCount !== 1) {
        throw new Error(
          `Failed to set next approver (approver_id=${nextApproverId}) as current. rowCount=${updNext.rowCount}`
        );
      }

      await insertWorkflowLog(
        client,
        workflow_id,
        nextUserId,
        "Approver",
        "Updated",
        "Pending",
        "Current",
        null
      );

      nextApproverFound = true;
    } else {
      await insertWorkflowLog(
        client,
        workflow_id,
        user_id,
        "System",
        "Completed",
        "Pending",
        "Completed",
        null
      );
      const pendingResult = await client.query(
        `
        SELECT COUNT(*) AS pending_count
        FROM wf_approver
        WHERE workflow_id = $1
          AND status NOT IN ('Completed', 'Missed', 'Replaced')
        `,
        [workflow_id]
      );

      if (parseInt(pendingResult.rows[0].pending_count, 10) === 0) {
        await client.query(
          `
          UPDATE workflow
          SET status = 'Completed', completed_at = NOW()
          WHERE workflow_id = $1
          `,
          [workflow_id]
        );

        workflowCompleted = true;
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in handleApprovedCase (transaction rolled back):", {
      workflow_id,
      user_id,
      currentApproverOrder,
      message: err.message,
      stack: err.stack,
    });
    throw err; // re-throw so callers can handle HTTP response / retries
  }

  // ========== Side effects (run after commit so emails/notifs don't rollback DB) ==========
  // If we moved to next approver -> send email & notifications (non-fatal if fail)
  if (nextApproverFound) {
    try {
      await sendItsYourTurnEmail(nextApproverEmail, workflowDetailsForEmail);
    } catch (err) {
      console.error("sendItsYourTurnEmail failed:", {
        nextUserId,
        nextApproverEmail,
        err,
      });
    }

    try {
      await createNotification({
        type: "WORKFLOW_APPROVER_TURN",
        title: "It's Your Turn to Approve",
        message: `Your turn to approve "${workflowDetailsForEmail.request_title}".`,
        relatedId: workflow_id,
        actorId: requester_id,
        actionRequired: true,
        actionType: "APPROVE",
        recipients: [{ approvers: { user_id: nextUserId } }],
      });
    } catch (err) {
      console.error("createNotification (approver turn) failed:", {
        workflow_id,
        nextUserId,
        err,
      });
    }

    try {
      await createNotification({
        type: "WORKFLOW_PARTICIPATION",
        title: "Workflow Progressed",
        message: `Request "${workflowDetailsForEmail.request_title}" has been moved to the next approver.`,
        relatedId: workflow_id,
        actorId: user_id,
        actionRequired: false,
        recipients: [{ approvers: { user_id: requester_id } }],
      });
    } catch (err) {
      console.error("createNotification (participation) failed:", {
        workflow_id,
        requester_id,
        err,
      });
    }
  }

  // If workflow completed -> notify requester and email
  if (workflowCompleted) {
    try {
      await createNotification({
        type: "WORKFLOW_COMPLETED",
        title: "Workflow is Completed",
        message: `Request "${workflowDetailsForEmail.request_title}" has been completed successfully.`,
        relatedId: workflow_id,
        actorId: null,
        actionRequired: false,
        recipients: [{ approvers: { user_id: requester_id } }],
      });
    } catch (err) {
      console.error("createNotification (completed) failed:", {
        workflow_id,
        requester_id,
        err,
      });
    }

    try {
      await sendWorkflowCompletedEmail(
        workflowDetailsForEmail.requesterEmail,
        workflowDetailsForEmail
      );
    } catch (err) {
      console.error("sendWorkflowCompletedEmail failed:", {
        workflow_id,
        requester_id,
        err,
      });
    }
  }

  // success
  return {
    movedToNext: nextApproverFound,
    nextUserId,
    completed: workflowCompleted,
  };
};

const handleRejectCase = async (
  client,
  workflow_id,
  user_id,
  comment,
  workflowDetailsForEmail,
  requester_id
) => {
  try {
    await client.query("BEGIN");

    try {
      await insertWorkflowLog(
        client,
        workflow_id,
        user_id,
        "Approver",
        "Rejected",
        "Pending",
        "Rejected",
        comment
      );
    } catch (err) {
      console.error("❌ Failed to insert workflow log (Reject):", err);
      throw err;
    }

    try {
      await client.query(
        `
        UPDATE workflow
        SET status = 'Failed', completed_at = NOW()
        WHERE workflow_id = $1
        `,
        [workflow_id]
      );
    } catch (err) {
      console.error("❌ Failed to update workflow status to Failed:", err);
      throw err;
    }

    try {
      await createNotification({
        type: "WORKFLOW_REJECTED",
        title: "Workflow was Rejected",
        message: `Request "${workflowDetailsForEmail.request_title}" was rejected by ${user_id}.`,
        relatedId: workflow_id,
        actorId: user_id,
        actionRequired: false,
        recipients: [{ approvers: { user_id: requester_id } }],
      });
    } catch (err) {
      console.error("❌ Failed to create rejection notification:", err);
      throw err;
    }

    try {
      await checkReject(client, workflow_id, workflowDetailsForEmail);
    } catch (err) {
      console.error("❌ Failed in checkReject function:", err);
      throw err;
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🚨 Error in handleRejectCase:", err);
    throw err; // rethrow so caller can handle
  }
};

const handleReturnedCase = async (
  client,
  response_id,
  comment,
  created_by,
  workflow_id,
  requester_id,
  approver_id
) => {
  try {
    console.log("appr", approver_id);
    await client.query("BEGIN");
    const feedbackRes = await client.query(
      `INSERT INTO return_feedback (response_id, reason, created_by, approver_id, created_at) 
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING return_id`,
      [response_id, comment, created_by, approver_id]
    );

    const return_id = feedbackRes.rows[0].return_id;
    await insertWorkflowLog(
      client,
      workflow_id,
      created_by,
      "Approver",
      "Returned",
      "Pending",
      "Returned",
      comment
    );

    // 3. Notification
    await createNotification({
      type: "WORKFLOW_RETURNED",
      title: "Workflow Returned",
      message: `Your workflow has been returned. Reason: ${comment}`,
      relatedId: workflow_id,
      actorId: created_by,
      actionRequired: true,
      actionType: "RETURNED",
      actionPayload: { return_id, response_id },
      recipients: [{ approvers: { user_id: requester_id } }],
    });
    console.log("Handle returned works");
    await client.query("COMMIT");
    return return_id;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
};

module.exports = {
  checkWorkflowExists,
  insertDocument,
  insertWorkflow,
  fetchRequester,
  insertApprovers,
  insertWorkflowLog,
  checkReject,
  updateApproverAndResponse,
  getRequesterAndWorkflowDetails,
  handleApprovedCase,
  handleRejectCase,
  handleReturnedCase,
};
