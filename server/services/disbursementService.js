const pool = require("../database/dbConnect.js");

const createSchedule = async (client, data) => {
  const {
    disbursement_type_id,
    disb_title,
    disbursement_date,
    amount,
    yr_lvl_code,
    sy_code,
    semester_code,
    branch,
    created_by,
    quantity,
  } = data;

  const result = await client.query(
    `
    INSERT INTO disbursement_schedule (
      disbursement_type_id, disb_title, disbursement_date, amount,
      yr_lvl_code, sy_code, semester_code, branch, created_by, quantity
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING disb_sched_id
    `,
    [
      disbursement_type_id,
      disb_title,
      disbursement_date,
      amount,
      yr_lvl_code,
      sy_code,
      semester_code,
      branch,
      created_by,
      quantity,
    ]
  );

  return result.rows[0].disb_sched_id;
};

const updateDisbursementDetails = async (client, payload) => {
  const {
    disbursement_type_id,
    yr_lvl_code,
    sy_code,
    semester_code,
    required_hours = null,
    disb_sched_id, // new param
  } = payload;
  console.log(
    disbursement_type_id,
    yr_lvl_code,
    sy_code,
    semester_code,
    required_hours,
    disb_sched_id
  );
  let query = `
    UPDATE disbursement_detail dd
    SET 
      disbursement_status = $1,
      disb_sched_id = $6${
        disbursement_type_id === 4
          ? ", required_hours = $7"
          : ", required_hours = NULL"
      }
    FROM disbursement_tracking dt
    JOIN renewal_scholar rs ON rs.renewal_id = dt.renewal_id
    WHERE 
      dd.disbursement_id = dt.disbursement_id AND
      dd.disbursement_type_id = $2 AND
      rs.yr_lvl = $3 AND
      rs.school_year = $4 AND
      rs.semester = $5
  `;

  const params =
    disbursement_type_id === 4
      ? [
          "In Progress",
          disbursement_type_id,
          yr_lvl_code,
          sy_code,
          semester_code,
          disb_sched_id,
          required_hours,
        ]
      : [
          "In Progress",
          disbursement_type_id,
          yr_lvl_code,
          sy_code,
          semester_code,
          disb_sched_id,
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
  createSchedule,
  updateDisbursementDetails,
  updateSchedule,
};
