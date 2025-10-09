const createEventSchedule = async (client, data) => {
  const {
    event_type,
    starting_date,
    sched_title,
    schedule_due,
    sy_code,
    semester_code,
    requester,
    description,
    branchId,
    disbursement_type_id,
    workflow_id,
  } = data;
  console.log("Branch id to: ", branchId);

  console.log(workflow_id);
  const { rows: existingDisb } = await client.query(
    `
  SELECT ds.disb_sched_id
  FROM disbursement_schedule ds
  JOIN event_schedule es ON ds.sched_id = es.sched_id
  WHERE es.sy_code = $1
    AND es.semester_code = $2
    AND ds.branch_code = $3
    AND ds.disbursement_type_id = $4
  LIMIT 1
  `,
    [sy_code, semester_code, branchId, disbursement_type_id]
  );
  const countEventWithWorkflowID = await client.query(
    "SELECT COUNT(*) FROM event_schedule WHERE workflow_id = $1",
    [workflow_id]
  );

  if (countEventWithWorkflowID.rows[0].count > 0) {
    throw new Error(`A event schedule already exists for this Workflow.`);
  }
  if (existingDisb.length > 0) {
    throw new Error(
      `A disbursement schedule already exists for SY ${sy_code}, Semester ${semester_code}, Branch ${branchId}, and Disbursement Type ${disbursement_type_id}.`
    );
  }

  const { rows: students } = await client.query(
    `
    SELECT 1
    FROM renewal_scholar rs
    JOIN maintenance_campus mc ON rs.campus_name = mc.campus_name
    WHERE rs.school_year = $1
      AND rs.semester = $2
      AND mc.campus_id = $3
    LIMIT 1
    `,
    [sy_code, semester_code, branchId]
  );
  console.log("Branch", branchId);
  if (!students.length) {
    throw new Error(
      `No students found eligible in SY ${sy_code}, Semester ${semester_code}, Branch ${branchId} for this event.`
    );
  }

  console.log("Eligible Student: ", students);
  const today = new Date().toISOString().split("T")[0];
  let schedule_status = "Not Started";
  if (starting_date) {
    const parsed = new Date(starting_date);
    if (!isNaN(parsed)) {
      const startDateStr = parsed.toISOString().split("T")[0];
      if (startDateStr === today) schedule_status = "In Progress";
    }
  }

  const result = await client.query(
    `
    INSERT INTO event_schedule (
      event_type, sched_title, schedule_due, starting_date,
      sy_code, semester_code, requester, description, schedule_status, workflow_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING sched_id
    `,
    [
      event_type,
      sched_title,
      schedule_due,
      starting_date,
      sy_code,
      semester_code,
      requester,
      description,
      schedule_status,
      workflow_id,
    ]
  );

  return result.rows[0].sched_id;
};

const createDisbursementSched = async (client, data) => {
  const { sched_id, sy_code, semester_code, branchId, disbursement_type_id } =
    data;

  const { rows: disbDetails } = await client.query(
    `
  SELECT dd.disb_detail_id
  FROM renewal_scholar rs
  JOIN maintenance_campus mc ON rs.campus_name = mc.campus_name
  JOIN disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
  JOIN disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
  WHERE rs.school_year = $1
    AND rs.semester = $2
    AND mc.campus_id = $3
    AND dd.disbursement_type_id = $4
  `,
    [sy_code, semester_code, branchId, disbursement_type_id]
  );

  if (!disbDetails.length) {
    throw new Error(
      `No students found in SY ${sy_code}, Semester ${semester_code}, Branch ${branchId} for disbursement type ${disbursement_type_id}.`
    );
  }

  const insertedIds = [];

  for (const { disb_detail_id } of disbDetails) {
    const { rows } = await client.query(
      `
    INSERT INTO disbursement_schedule (sched_id, disb_detail_id, branch_code, disbursement_type_id)
    VALUES ($1, $2, $3, $4)
    RETURNING disb_sched_id
    `,
      [sched_id, disb_detail_id, branchId, disbursement_type_id]
    );
    insertedIds.push(rows[0].disb_sched_id);
  }

  return insertedIds;
};

const updateDisbursementDetails = async (client, payload) => {
  const {
    disb_sched_id,
    disbursement_type_id,
    required_hours = null,
  } = payload;

  console.log("inside: ", disb_sched_id);
  if (!disb_sched_id.length) {
    throw new Error("No disbursement schedule IDs provided.");
  }

  const query = `
    UPDATE disbursement_detail dd
SET 
  disbursement_status = es.schedule_status::disbursement_status_enum,
  required_hours = $1
FROM disbursement_schedule ds
JOIN event_schedule es ON ds.sched_id = es.sched_id
WHERE dd.disb_detail_id = ds.disb_detail_id
  AND ds.disb_sched_id = ANY($2)

  `;

  const params = [
    disbursement_type_id === 4 ? required_hours : null, // $1
    disb_sched_id, // $2 (array)
  ];

  const updateResult = await client.query(query, params);
  return updateResult.rowCount;
};

const updateSchedule = async (
  client,
  {
    disb_sched_id,
    disbursement_date,
    disb_title,
    branch,
    semester_code,
    yr_lvl_code,
    sy_code,
    quantity,
    disbursement_type_id,
    amount,
  }
) => {
  const scheduleUpdateQuery = `
    UPDATE disbursement_schedule
    SET 
      disbursement_date = $1,
      disb_title = $2,
      branch = $3,
      semester_code = $4,
      yr_lvl_code = $5,
      sy_code = $6,
      quantity = $7,
      disbursement_type_id = $8,
      amount = $9,
      updated_at = NOW()
    WHERE disb_sched_id = $10
    RETURNING *;
  `;
  const scheduleResult = await client.query(scheduleUpdateQuery, [
    disbursement_date,
    disb_title,
    branch,
    semester_code,
    yr_lvl_code,
    sy_code,
    quantity,
    disbursement_type_id,
    amount,
    disb_sched_id,
  ]);

  if (scheduleResult.rows.length === 0) {
    throw new Error("Schedule not found");
  }

  return scheduleResult.rows[0]; // Return the updated schedule
};

module.exports = {
  createEventSchedule,
  updateDisbursementDetails,
  createDisbursementSched,
  updateSchedule,
};
