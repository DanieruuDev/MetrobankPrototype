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
            ms.semester AS semester_text,
            w.sy_code,
            sy.school_year AS school_year_text,
            rt.disbursement_type_id,
            rt.rq_title AS request_type_text
        FROM
            workflow w
        INNER JOIN 
            wf_request_type_maintenance rt 
            ON w.rq_type_id = rt.rq_type_id 
        INNER JOIN 
            maintenance_semester ms 
            ON w.semester_code = ms.semester_code
        INNER JOIN 
            maintenance_sy sy 
            ON w.sy_code = sy.sy_code
        WHERE
            w.status = 'Completed'
            AND w.is_archived = false
            AND NOT EXISTS (
              SELECT 1
              FROM event_schedule es
              WHERE es.workflow_id = w.workflow_id
            )
            AND NOT EXISTS (
              SELECT 1
              FROM event_schedule es
              JOIN disbursement_schedule ds ON ds.sched_id = es.sched_id
              WHERE es.sy_code = w.sy_code
                AND es.semester_code = w.semester_code
                AND ds.disbursement_type_id = rt.disbursement_type_id
                AND es.schedule_status = 'Completed'
            );
    `;
  try {
    // Execute the query using your database connection
    const result = await db.query(query);

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      semester_code: row.semester_code,
      semester_text: row.semester_text,
      sy_code: row.sy_code,
      school_year_text: row.school_year_text,
      disbursement_type_id: row.disbursement_type_id,
      request_type_text: row.request_type_text,
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
