const pool = require("../database/dbConnect.js");

const {
  createSchedule,
  updateDisbursementDetails,
  updateSchedule,
} = require("../services/disbursementService");

//Important: Change the semester, yr lvl, and school year into one or valid sy and sem

// Add how many scholar has been added to schedule and how many scholar is remaining in scholarship renewal, all the unstarted I mean
const createDisbursementSchedule = async (req, res) => {
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
    required_hours,
    quantity,
  } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (
      !disbursement_type_id ||
      !yr_lvl_code ||
      !sy_code ||
      !semester_code ||
      !branch ||
      !created_by ||
      !quantity
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (quantity < 1) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "No scholars found to schedule for this disbursement.",
      });
    }

    const disb_sched_id = await createSchedule(client, {
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
    });
    console.log(disb_sched_id);
    const scheduledCount = await updateDisbursementDetails(client, {
      disbursement_type_id,
      yr_lvl_code,
      sy_code,
      semester_code,
      required_hours: disbursement_type_id === 4 ? required_hours : null,
      disb_sched_id,
    });
    console.log(scheduledCount);

    await client.query("COMMIT");

    return res.status(200).json({
      message: "New disbursement schedule created and scholars updated.",
      disb_sched_id,
      scheduledCount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Schedule Error:", error);
    return res.status(500).json({ message: "Internal Server Error." });
  } finally {
    client.release();
  }
};

const getEligibleScholarCount = async (req, res) => {
  try {
    const { yr_lvl_code, semester_code, sy_code } = req.params;
    const { disbursement_type, disbursement_id } = req.query;

    // Ensure all parameters are present
    if (!yr_lvl_code || !semester_code || !sy_code) {
      return res.status(400).json({ message: "Missing required parameters." });
    }
    if (!disbursement_type && !disbursement_id) {
      return res
        .status(400)
        .json({ message: "Missing disbursement_type or disbursement_id." });
    }

    console.log(yr_lvl_code, semester_code, sy_code, disbursement_type);

    //change the basis into the actual year
    let query = `
      SELECT COUNT(*) 
      FROM disbursement_detail dd
      JOIN disbursement_tracking dt ON dd.disbursement_id = dt.disbursement_id
      JOIN renewal_scholar rs ON dt.renewal_id = rs.renewal_id
      JOIN disbursement_type dty ON dd.disbursement_type_id = dty.disbursement_type_id
      WHERE rs.yr_lvl = $1
        AND rs.semester = $2
        AND rs.school_year = $3
        AND dd.disb_sched_id IS NULL
    `;

    const values = [yr_lvl_code, semester_code, sy_code];

    if (disbursement_type) {
      query += ` AND dty.disbursement_label = $4`;
      values.push(disbursement_type);
    } else if (disbursement_id) {
      query += ` AND dd.disbursement_type_id = $4`;
      values.push(disbursement_id);
    }

    const result = await pool.query(query, values);
    console.log(result.rows[0]);
    if (result.rows.length > 0) {
      return res.status(200).json({ count: result.rows[0] });
    } else {
      return res.status(200).json({ count: 0 });
    }
  } catch (error) {
    console.error("Error fetching scholar count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const fetchDisbursementSchedules = async (req, res) => {
  const client = await pool.connect();
  console.log("disburse");
  const { year, month } = req.params;
  if (!year || !month) {
    return res.status(400).json({ error: "Year and month are required" });
  }
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
        SELECT 
          *
        FROM vw_disb_calendar_sched WHERE date BETWEEN $1 AND $2;
      `,
      [start.toISOString(), end.toISOString()]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching disbursement schedules:", error);
    res.status(500).json({ message: "Error fetching disbursement schedules" });
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
};

const getTwoWeeksDisbursementSchedules = async (req, res) => {
  try {
    const today = new Date();

    const weekStart = new Date(today);
    const weekEnd = new Date(today);
    const dayOfWeek = today.getDay();

    weekStart.setDate(today.getDate() - dayOfWeek);
    weekEnd.setDate(today.getDate() + (6 - dayOfWeek));

    const nextWeekStart = new Date(weekStart);
    const nextWeekEnd = new Date(weekEnd);

    nextWeekStart.setDate(weekStart.getDate() + 7);
    nextWeekEnd.setDate(weekEnd.getDate() + 7);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const start = formatDate(weekStart);
    const end = formatDate(nextWeekEnd);

    const query = `
      SELECT * 
      FROM vw_disb_sched_summary 
      WHERE disbursement_date BETWEEN $1 AND $2
      ORDER BY disbursement_date ASC
    `;

    const result = await pool.query(query, [start, end]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching two weeks of disbursement schedules:", error);
    res.status(500).json({ message: "Server error fetching schedules" });
  }
};

const fetchDetailSchedule = async (req, res) => {
  const { disb_sched_id, user_id } = req.params;

  if (!disb_sched_id || !user_id) {
    return res
      .status(400)
      .json({ message: "Missing sched_id or user_id in query parameters." });
  }

  try {
    const result = await pool.query(
      `
        SELECT * 
        FROM vw_disbursement_schedule_detailed 
        WHERE disb_sched_id = $1 AND created_by_id = $2
      `,
      [disb_sched_id, user_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Schedule not found or access denied." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching schedule details:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching schedule detail." });
  }
};

const fetchWeeklyDisbursementSchedules = async (req, res) => {
  try {
    console.log("Received date:", req.params.date);
    const baseDate = req.params.week ? new Date(req.params.week) : new Date();
    console.log("Parsed date:", baseDate);

    const start = new Date(baseDate);
    const end = new Date(baseDate);

    const dayOfWeek = start.getDay(); // 0 (Sun) - 6 (Sat)
    start.setDate(start.getDate() - dayOfWeek);
    end.setDate(start.getDate() + 6);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const query = `
      SELECT * 
      FROM vw_disbursement_schedule_detailed 
      WHERE disbursement_date BETWEEN $1 AND $2
      ORDER BY disbursement_date ASC
    `;

    const result = await pool.query(query, [
      formatDate(start),
      formatDate(end),
    ]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching weekly schedules:", error);
    res.status(500).json({ message: "Server error fetching schedules" });
  }
};

const deleteDisbursementSchedule = async (req, res) => {
  const { user_id, disb_sched_id } = req.params;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Step 0: Check if user is the creator of the schedule
    const authCheck = await client.query(
      `SELECT created_by FROM disbursement_schedule WHERE disb_sched_id = $1`,
      [disb_sched_id]
    );

    if (authCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Disbursement schedule not found." });
    }

    const creatorId = authCheck.rows[0].created_by;
    if (creatorId !== Number(user_id)) {
      console.log(typeof creatorId, typeof user_id);
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this schedule." });
    }

    // Step 1: Reset disbursement_detail
    const updateResult = await client.query(
      `
      UPDATE disbursement_detail
      SET 
        disb_sched_id = NULL,
        disbursement_status = 'Not Started',
        completed_at = NULL
      WHERE disb_sched_id = $1
      `,
      [disb_sched_id]
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "No related disbursement details found for this schedule.",
      });
    }

    // Step 2: Delete the disbursement_schedule
    const deleteResult = await client.query(
      `DELETE FROM disbursement_schedule WHERE disb_sched_id = $1 RETURNING *`,
      [disb_sched_id]
    );

    if (deleteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Disbursement schedule not found." });
    }

    await client.query("COMMIT");

    return res
      .status(200)
      .json({ message: "Disbursement schedule deleted successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction Error (deleteDisbursementSchedule):", error);
    return res.status(500).json({ message: "Internal Server Error." });
  } finally {
    client.release();
  }
};

//Note: Create cahngeDisbursement Detail and make it the update disbursement
//Make sure to properly fix the logic, if disb sched id change the type then make sure to update
const updateDisbursementSchedule = async (req, res) => {
  const { id } = req.params; // disb_sched_id to update
  const {
    disbursement_date,
    title,
    branch,
    semester,
    yr_lvl,
    school_year,
    total_scholar,
    disbursement_type,
    amount,
  } = req.body;

  console.log(req.body);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: typeRows } = await client.query(
      `SELECT disbursement_type_id FROM disbursement_type WHERE disbursement_label = $1`,
      [disbursement_type]
    );

    if (typeRows.length === 0) {
      throw new Error("Invalid disbursement label provided.");
    }

    const newTypeId = typeRows[0].disbursement_type_id;

    const { rows: currentRows } = await client.query(
      `SELECT disbursement_type_id FROM disbursement_schedule WHERE disb_sched_id = $1`,
      [id]
    );

    if (currentRows.length === 0) {
      throw new Error("Disbursement schedule not found.");
    }

    const currentTypeId = currentRows[0].disbursement_type_id;

    const updatedSchedule = await client.query(
      `
        UPDATE disbursement_schedule
        SET disbursement_date = $1,
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
        RETURNING *
      `,
      [
        disbursement_date,
        title,
        branch,
        semester,
        yr_lvl,
        school_year,
        total_scholar,
        newTypeId,
        amount,
        id,
      ]
    );
    console.log(currentTypeId, newTypeId);

    //change the renewal basis to be the actual yr lvl, semester,
    if (currentTypeId !== newTypeId) {
      await client.query(
        `
        UPDATE disbursement_detail dd
        SET disbursement_status = 'Not Started',
            disb_sched_id = NULL
        FROM disbursement_tracking dt
        JOIN renewal_scholar rs ON rs.renewal_id = dt.renewal_id
        WHERE dd.disbursement_id = dt.disbursement_id
          AND dd.disbursement_type_id = $1
          AND dd.disb_sched_id = $2
          AND rs.yr_lvl = $3
          AND rs.semester = $4
          AND rs.school_year = $5
        `,
        [currentTypeId, id, yr_lvl, semester, school_year]
      );

      await client.query(
        `
        UPDATE disbursement_detail dd
        SET disbursement_status = 'In Progress',
            disb_sched_id = $1
        FROM disbursement_tracking dt
        JOIN renewal_scholar rs ON rs.renewal_id = dt.renewal_id
        WHERE dd.disbursement_id = dt.disbursement_id
          AND dd.disbursement_type_id = $2
          AND dd.disb_sched_id IS NULL
          AND rs.yr_lvl = $3
          AND rs.semester = $4
          AND rs.school_year = $5
        `,
        [id, newTypeId, yr_lvl, semester, school_year]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Event updated successfully",
      updatedSchedule: updatedSchedule.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating disbursement schedule:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  createDisbursementSchedule,
  fetchDisbursementSchedules,
  getTwoWeeksDisbursementSchedules,
  fetchDetailSchedule,
  fetchWeeklyDisbursementSchedules,
  deleteDisbursementSchedule,
  getEligibleScholarCount,
  updateDisbursementSchedule,
};
