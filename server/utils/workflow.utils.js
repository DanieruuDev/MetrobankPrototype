const { sendApproverAddedEmail } = require("./emailing");
const { createNotification } = require("../services/notificationService");
const checkWorkflowExists = async (
  client,
  approval_req_type,
  sy_code,
  semester_code
) => {
  const res = await client.query(
    "SELECT * FROM workflow WHERE approval_req_type = $1 AND sy_code = $2 AND semester_code = $3",
    [approval_req_type, sy_code, semester_code]
  );

  return res.rows.length > 0;
};

const insertDocument = async (client, file) => {
  const res = await client.query(
    "INSERT INTO wf_document(doc_name, path, size, doc_type) VALUES ($1, $2, $3, $4) RETURNING *",
    [file.originalname, file.path, file.size, file.mimetype]
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
    // 1️⃣ Get the rejector (existing function)
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

module.exports = {
  checkWorkflowExists,
  insertDocument,
  insertWorkflow,
  fetchRequester,
  insertApprovers,
  insertWorkflowLog,
  checkReject,
};
