const { sendApproverAddedEmail } = require("./emailing");
const checkWorkflowExists = async (
  client,
  req_type_id,
  school_year,
  semester,
  scholar_level
) => {
  const res = await client.query(
    "SELECT * FROM workflow WHERE rq_type_id = $1 AND school_year = $2 AND semester = $3 AND scholar_level = $4",
    [req_type_id, school_year, semester, scholar_level]
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
    req_type_id,
    requester_id,
    due_date,
    school_year,
    semester,
    scholar_level,
    description,
    request_title,
  } = details;

  const res = await client.query(
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
  const approverQueries = [];

  for (const approver of approverList) {
    const findId = await client.query(
      `SELECT admin_id FROM administration_adminaccounts WHERE admin_email = $1`,
      [approver.email]
    );

    if (findId.rows.length === 0) {
      throw new Error(`Approver with email ${approver.email} not found`);
    }

    const userId = findId.rows[0].admin_id;
    console.log(findId.rows[0]);
    const existingApprover = await client.query(
      "SELECT 1 FROM wf_approver WHERE workflow_id = $1 AND user_id = $2",
      [workflowId, userId]
    );

    if (existingApprover.rows.length > 0) {
      throw new Error(`Duplicate approver: ${approver.email}`);
    }

    const approvalRes = await client.query(
      "INSERT INTO wf_approver (workflow_id, user_id, user_email, approver_order, status, due_date, is_reassigned) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        workflowId,
        userId,
        approver.email,
        approver.order,
        "Pending",
        approver.date,
        false,
      ] // Use lowercase false
    );

    const responseRes = await client.query(
      "INSERT INTO approver_response (approver_id) VALUES ($1) RETURNING *",
      [approvalRes.rows[0].approver_id]
    );

    approverQueries.push({
      approvers: approvalRes.rows[0],
      approval_response: responseRes.rows[0],
    });

    await sendApproverAddedEmail(approver.email, workflowDetails);
  }

  return approverQueries;
};

module.exports = {
  checkWorkflowExists,
  insertDocument,
  insertWorkflow,
  fetchRequester,
  insertApprovers,
};
