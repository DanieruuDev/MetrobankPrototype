const pool = require("../database/dbConnect.js");

const updateRenewalProcess = async (req, res) => {
  const { sy_code, semester_code, stage_name, action, user_id } = req.body;

  console.log("🟦 updateRenewalProcess called with:", req.body);

  // 1️⃣ Validate input
  if (!sy_code || !semester_code || !stage_name || !action || !user_id) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  console.log("🔹 Processing renewal stage update...");

  const client = await pool.connect();
  try {
    // 2️⃣ Find process ID
    const processRes = await client.query(
      `
      SELECT process_id 
      FROM disbursement_process 
      WHERE sy_code = $1 AND semester_code = $2
      `,
      [sy_code, semester_code]
    );

    if (processRes.rows.length === 0) {
      return res.status(404).json({
        message:
          "No disbursement process found for the given school year and semester.",
      });
    }

    const processId = processRes.rows[0].process_id;
    const normalizedAction = action.toLowerCase();

    let newStatus;
    let newProcessStage;
    let remarksNote;

    // 3️⃣ Determine action type
    if (normalizedAction === "complete") {
      newStatus = "Completed";
      newProcessStage = "Approval";
      remarksNote = `[Marked as Completed by user ${user_id} at ${new Date().toISOString()}]`;
    } else if (
      normalizedAction === "rollback" ||
      normalizedAction === "revert"
    ) {
      newStatus = "In Progress";
      newProcessStage = "Renewal";
      remarksNote = `[Rolled back to In Progress by user ${user_id} at ${new Date().toISOString()}]`;
    } else {
      return res.status(400).json({
        message: "Invalid action. Use 'complete' or 'rollback'.",
      });
    }

    // 4️⃣ Update stage
    const updateStageRes = await client.query(
      `
      UPDATE disbursement_process_stage
      SET
        status = $3::varchar,
        updated_by = $4::integer,
        completed_at = CASE WHEN $3 = 'Completed' THEN NOW() ELSE NULL END,
        started_at = CASE WHEN $3 = 'In Progress' THEN NOW() ELSE started_at END,
       remarks = $5::text
      WHERE process_id = $1
        AND stage_name = $2
      RETURNING stage_id, stage_name, status, updated_by, completed_at;
      `,
      [processId, stage_name, newStatus, user_id, remarksNote]
    );

    if (updateStageRes.rowCount === 0) {
      return res.status(404).json({
        message: `Stage '${stage_name}' not found for process_id ${processId}.`,
      });
    }

    const updatedStage = updateStageRes.rows[0];
    console.log("✅ Stage updated successfully:", updatedStage);

    // 5️⃣ Update parent process current stage
    await client.query(
      `
      UPDATE disbursement_process
      SET
        current_stage = $2,
        last_updated_at = NOW()
      WHERE process_id = $1
      `,
      [processId, newProcessStage]
    );

    console.log(
      `🔄 disbursement_process.current_stage set to '${newProcessStage}'`
    );

    // 6️⃣ Return success response
    return res.status(200).json({
      message: `Stage '${updatedStage.stage_name}' successfully updated to '${updatedStage.status}'. Process current_stage is now '${newProcessStage}'.`,
      data: updatedStage,
    });
  } catch (error) {
    console.error("❌ Error updating renewal process:", error);
    return res.status(500).json({
      message: "Internal server error while updating renewal process.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const getProcess = async (req, res) => {
  const { sy_code, semester_code } = req.params;

  console.log("🟦 getProcess called with:", req.params);

  // 1️⃣ Validate input
  if (!sy_code || !semester_code) {
    return res.status(400).json({
      message: "Missing required parameters: sy_code or semester_code.",
    });
  }

  const client = await pool.connect();
  try {
    // 2️⃣ Fetch process record
    const query = `
      SELECT process_id, current_stage
      FROM disbursement_process
      WHERE sy_code = $1 AND semester_code = $2
    `;
    const response = await client.query(query, [sy_code, semester_code]);

    // 4️⃣ Success
    console.log("✅ Process fetched successfully:", response.rows[0]);
    return res.status(200).json({
      message: "Process retrieved successfully.",
      data: response.rows[0],
    });
  } catch (error) {
    console.error("❌ Error fetching disbursement process:", error);
    return res.status(500).json({
      message: "Internal server error while fetching disbursement process.",
      error: error.message,
    });
  } finally {
    // 5️⃣ Always release connection
    client.release();
  }
};

module.exports = { updateRenewalProcess, getProcess };
