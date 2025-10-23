const createEventSchedule = async (client, data) => {
  const {
    event_type,
    sched_title,
    schedule_due,
    sy_code,
    semester_code,
    requester,
    description,
    disbursement_type_id,
    workflow_id,
    covered_date, // ✅ added
  } = data;

  // ✅ Existing disbursement lookup (add covered_date logic)
  const baseQuery = `
    SELECT ds.disb_sched_id, w.covered_date
    FROM disbursement_schedule ds
    JOIN event_schedule es ON ds.sched_id = es.sched_id
    JOIN workflow w ON ds.workflow_id = w.workflow_id
    WHERE es.sy_code = $1
      AND es.semester_code = $2
      AND ds.disbursement_type_id = $3
  `;

  const { rows: existingDisb } = await client.query(baseQuery, [
    sy_code,
    semester_code,
    disbursement_type_id,
  ]);

  // ✅ Prevent duplicate internship schedules for same covered_date
  if (disbursement_type_id === 4 && existingDisb.length > 0) {
    const hasSameCoveredDate = existingDisb.some(
      (row) => row.covered_date === covered_date
    );
    if (hasSameCoveredDate) {
      throw new Error(
        `An internship disbursement already exists for ${covered_date}.`
      );
    }
  } else if (disbursement_type_id !== 4 && existingDisb.length > 0) {
    throw new Error(
      `A disbursement schedule already exists for SY ${sy_code}, Semester ${semester_code}, and Disbursement Type ${disbursement_type_id}.`
    );
  }

  // ✅ Avoid duplicate event per workflow
  const { rows: workflowCheck } = await client.query(
    "SELECT COUNT(*) FROM event_schedule WHERE workflow_id = $1",
    [workflow_id]
  );

  if (workflowCheck[0].count > 0) {
    throw new Error("An event schedule already exists for this workflow.");
  }

  // ✅ Proceed with normal insert
  const result = await client.query(
    `
    INSERT INTO event_schedule (
      event_type, sched_title, schedule_due,
      sy_code, semester_code, requester, description, schedule_status, workflow_id
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING sched_id
    `,
    [
      event_type,
      sched_title,
      schedule_due,
      sy_code,
      semester_code,
      requester,
      description,
      "In Progress",
      workflow_id,
    ]
  );

  return result.rows[0].sched_id;
};

const createDisbursementSched = async (client, data) => {
  let { sched_id, sy_code, semester_code, disbursement_type_id, covered_date } =
    data;

  // 🔁 Format SY code (e.g., 20252026 → 2025-2026)
  if (sy_code) {
    const syString = String(sy_code);
    if (/^\d{8}$/.test(syString)) {
      sy_code = `${syString.slice(0, 4)}-${syString.slice(4)}`;
    }
  }

  // 🔁 Convert semester code to readable format
  let semesterReadable;
  switch (String(semester_code)) {
    case "1":
      semesterReadable = "1st Semester";
      break;
    case "2":
      semesterReadable = "2nd Semester";
      break;
    case "3":
      semesterReadable = "Midyear";
      break;
    default:
      semesterReadable = semester_code;
  }

  // ✅ Base query for eligible scholars
  let query = `
    SELECT
      disb_detail_id,
      campus AS branch_name
    FROM public.vw_combined_eligible_scholar_invoice
    WHERE semester = $1
      AND school_year = $2
      AND disbursement_type_id = $3
  `;
  const params = [semesterReadable, sy_code, disbursement_type_id];

  // ✅ Filter internship (disbursement_type_id = 4) by covered_date
  if (disbursement_type_id === 4) {
    if (!covered_date) {
      throw new Error(
        "Internship allowance disbursement requires a covered_date."
      );
    }
    query += ` AND covered_date = $4`;
    params.push(covered_date);
  }

  const { rows: disbDetails } = await client.query(query, params);

  if (!disbDetails.length) {
    throw new Error(
      `No eligible scholars found for SY ${sy_code}, ${semesterReadable}, type ${disbursement_type_id}${covered_date ? ` (${covered_date})` : ""}.`
    );
  }

  const insertedIds = [];

  for (const { disb_detail_id, branch_name } of disbDetails) {
    const { rows: campusRows } = await client.query(
      `SELECT campus_id FROM maintenance_campus WHERE campus_name = $1 LIMIT 1`,
      [branch_name]
    );

    if (!campusRows.length) {
      console.warn(`⚠️ Skipping unknown campus: ${branch_name}`);
      continue;
    }

    const branch_code = campusRows[0].campus_id;

    const { rows } = await client.query(
      `
      INSERT INTO disbursement_schedule (
        sched_id, disb_detail_id, branch_code, disbursement_type_id, workflow_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING disb_sched_id
      `,
      [
        sched_id,
        disb_detail_id,
        branch_code,
        disbursement_type_id,
        data.workflow_id,
      ]
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
