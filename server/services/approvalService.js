// server/services/approvalService.js

// Assuming you have a connection setup file, e.g., in server/database/db.js
const db = require("../database/dbConnect");

/**
 * Fetches all 'Completed' workflows that have NOT yet been scheduled for disbursement.
 * Assumes:
 * - Workflow table name is 'workflow' with status column 'status' and PK 'workflow_id'.
 * - Schedule table is 'disbursement_schedule' with FK 'workflow_id'.
 * - Workflow request_type_id '1' corresponds to a disbursement-type request.
 */
const fetchUnscheduledWorkflows = async () => {
  const query = `
        SELECT
            w.workflow_id AS id,
            w.rq_title AS title,
            w.semester_code,
            w.sy_code,
            rt.disbursement_type_id 
        FROM
            workflow w
        INNER JOIN 
            wf_request_type_maintenance rt 
            ON w.rq_type_id = rt.rq_type_id 
        LEFT JOIN
            disbursement_schedule ds 
            ON w.workflow_id = ds.workflow_id 
        WHERE
            w.status = 'Completed' 
            AND ds.workflow_id IS NULL; 
    `;
  try {
    // Execute the query using your database connection
    const result = await db.query(query);

    // Return the rows, mapped to the structure the frontend expects
    return result.rows.map((row) => ({
      id: row.workflow_id,
      title: row.title,
      semester_code: row.semester_code,
      sy_code: row.sy_code,
      disbursement_type_id: row.disbursement_type_id,
    }));
  } catch (error) {
    // Log the full error and throw a simplified one for the controller
    console.error("Database error in fetchUnscheduledWorkflows:", error);
    throw new Error("Failed to fetch unscheduled workflows.");
  }
};

module.exports = {
  fetchUnscheduledWorkflows,
};
