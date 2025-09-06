const pool = require("../database/dbConnect.js");

const {
  createEventSchedule,
  createDisbursementSched,
  updateDisbursementDetails,
  updateSchedule,
} = require("../services/disbursementService");

//Important: Change the semester, yr lvl, and school year into one or valid sy and sem

//currentky working
const createDisbursementSchedule = async (req, res) => {
  const {
    event_type,
    disbursement_type_id,
    sched_title,
    schedule_due,
    starting_date,
    sy_code,
    semester_code,
    branch_code,
    requester,
    required_hours,
    description,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (
      !event_type ||
      !disbursement_type_id ||
      !sched_title ||
      !schedule_due ||
      !starting_date ||
      !sy_code ||
      !semester_code ||
      !branch_code ||
      !requester ||
      !description
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }
    console.log("pass validation");

    let scheduledCount, disb_sched_id;
    console.log("Branch", branch_code);
    const sched_id = await createEventSchedule(client, {
      event_type,
      starting_date,
      sched_title,
      schedule_due,
      sy_code,
      semester_code,
      requester,
      description,
      branch_code,
      disbursement_type_id,
    });

    if (!sched_id) {
      throw new Error("Failed to create event schedule.");
    }

    if (event_type === 1) {
      disb_sched_id = await createDisbursementSched(client, {
        sched_id,
        sy_code,
        semester_code,
        branch_code,
        disbursement_type_id,
      });

      if (!disb_sched_id || disb_sched_id.length === 0) {
        throw new Error("No disbursement schedules were created.");
      }

      scheduledCount = await updateDisbursementDetails(client, {
        disbursement_type_id,
        required_hours: disbursement_type_id === 4 ? required_hours : null,
        disb_sched_id,
      });

      if (!scheduledCount || scheduledCount === 0) {
        throw new Error("No scholars were updated in disbursement details.");
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      message: "New disbursement schedule created and scholars updated.",
      disb_sched_id,
      scheduledCount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Schedule Error:", error.message || error);
    return res
      .status(500)
      .json({ message: error.message || "Internal Server Error." });
  } finally {
    client.release();
  }
};

const getEligibleScholarCount = async (req, res) => {
  try {
    const { yr_lvl_code, semester_code, sy_code } = req.params;
    const { disbursement_type, disbursement_id, branch } = req.query;

    console.log(yr_lvl_code, semester_code, sy_code, disbursement_id, branch);
    if (!yr_lvl_code || !semester_code || !sy_code || !branch) {
      return res.status(400).json({ message: "Missing required parameters." });
    }
    if (!disbursement_type && !disbursement_id) {
      return res
        .status(400)
        .json({ message: "Missing disbursement_type or disbursement_id." });
    }

    console.log(
      yr_lvl_code,
      semester_code,
      sy_code,
      disbursement_type,
      disbursement_id,
      branch
    );

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
        AND rs.campus_name = $5
    `;

    const values = [yr_lvl_code, semester_code, sy_code];

    if (disbursement_type) {
      query += ` AND dty.disbursement_label = $4`;
      values.push(disbursement_type);
    } else if (disbursement_id) {
      query += ` AND dd.disbursement_type_id = $4`;
      values.push(disbursement_id);
    }

    values.push(branch); // always $5

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
        FROM vw_disb_calendar_sched WHERE schedule_due BETWEEN $1 AND $2;
      `,
      [start.toISOString(), end.toISOString()]
    );
    console.log(result.rows);
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
      WHERE schedule_due BETWEEN $1 AND $2
      ORDER BY schedule_due ASC
    `;

    const result = await pool.query(query, [start, end]);
    console.log("Two weeks query result:", result.rows.length, "rows");

    // Map the database fields to match frontend interface
    const mappedRows = result.rows.map((row) => ({
      sched_id: row.sched_id,
      sched_title: row.sched_title,
      event_type: 1, // Default event type
      schedule_due: row.schedule_due,
      schedule_status: row.schedule_status,
      disbursement_label: row.disbursement_label,
    }));

    console.log("Mapped rows for sidebar:", mappedRows.length, "rows");
    res.status(200).json(mappedRows);
  } catch (error) {
    console.error("Error fetching two weeks of disbursement schedules:", error);
    res.status(500).json({ message: "Server error fetching schedules" });
  }
};

const fetchDetailSchedule = async (req, res) => {
  const { sched_id } = req.params;
  console.log("fetch detailed");
  if (!sched_id) {
    return res
      .status(400)
      .json({ message: "Missing sched_id or user_id in query parameters." });
  }

  try {
    const result = await pool.query(
      `
        SELECT * 
        FROM vw_schedule_edit_data 
        WHERE sched_id = $1
      `,
      [sched_id]
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
    const baseDate = req.params.week ? new Date(req.params.week) : new Date();

    const start = new Date(baseDate);
    const end = new Date(baseDate);

    const dayOfWeek = start.getDay();
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
      FROM vw_disb_calendar_sched
      WHERE schedule_due BETWEEN $1 AND $2
      ORDER BY schedule_due ASC
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
  const { sched_id, requester } = req.params;
  const client = await pool.connect();

  console.log(sched_id, requester);
  try {
    await client.query("BEGIN");

    // Step 0: Check ownership
    const authCheck = await client.query(
      `SELECT requester FROM event_schedule WHERE sched_id = $1`,
      [sched_id]
    );

    if (authCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Disbursement schedule not found." });
    }

    const creatorId = authCheck.rows[0].requester;
    if (creatorId !== Number(requester)) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this schedule." });
    }

    // Step 1: Get all disb_detail_ids linked to this sched_id
    const disbDetails = await client.query(
      `SELECT disb_detail_id 
       FROM disbursement_schedule 
       WHERE sched_id = $1`,
      [sched_id]
    );

    if (disbDetails.rowCount > 0) {
      const ids = disbDetails.rows.map((r) => r.disb_detail_id);
      await client.query(
        `UPDATE disbursement_detail 
         SET disbursement_status = 'Not Started', completed_at = NULL
         WHERE disb_detail_id = ANY($1::int[])`,
        [ids]
      );
    }

    // Step 3: Delete the event_schedule (cascades into disbursement_schedule)
    await client.query(`DELETE FROM event_schedule WHERE sched_id = $1`, [
      sched_id,
    ]);

    await client.query("COMMIT");

    return res
      .status(200)
      .json({ message: "Disbursement schedule deleted and statuses reset." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Transaction Error (deleteDisbursementSchedule):", error);
    return res.status(500).json({ message: "Internal Server Error." });
  } finally {
    client.release();
  }
};

const updateDisbursementSchedule = async (req, res) => {
  const { sched_id } = req.params;
  const { sched_title, schedule_due, description, event_type } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Update event_schedule directly
    const { rows: updatedSchedule } = await client.query(
      `UPDATE event_schedule
       SET schedule_due = $1,
           description = $2,
           sched_title = $3,
           edit_at = NOW()
       WHERE sched_id = $4
       RETURNING *`,
      [schedule_due, description, sched_title, sched_id]
    );
    console.log("✅ Event schedule updated:", updatedSchedule[0]);
    //title, description, due and start

    await client.query("COMMIT");
    res.status(200).json({ message: "Schedule updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating disbursement schedule:", error);
    res.status(500).json({ message: "Internal server error" });
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
