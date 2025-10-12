const pool = require("./database/dbConnect.js");

async function checkOverviewStudents() {
  try {
    console.log("\n=== Checking Disbursement Overview Student Count ===\n");

    // This is the EXACT query used in DisbursementOverview for the summary stats
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT m.student_id) AS total_students,
        COALESCE(SUM(dd.disbursement_amount), 0) AS total_disbursed
      FROM masterlist m
      LEFT JOIN renewal_scholar rs ON rs.student_id = m.student_id
      LEFT JOIN disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
      LEFT JOIN disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
      WHERE m.scholarship_status = 'Active'
        AND dd.disbursement_status = 'Completed'
    `;

    const summaryResult = await pool.query(summaryQuery);
    console.log("📊 Summary Stats (Total Students & Total Disbursed):");
    console.log(JSON.stringify(summaryResult.rows[0], null, 2));

    // This is the query used for the student list table
    console.log(
      "\n=== Student List (from vw_disbursement_overview view) ===\n"
    );

    const listQuery = `
      SELECT
        m.scholar_name AS student_name,
        m.student_id,
        rs.yr_lvl AS student_year_lvl,
        rs.semester AS student_semester,
        rs.school_year AS student_school_year,
        COALESCE(rs.campus_code::varchar, m.campus) AS student_branch,
        COALESCE(SUM(dd.disbursement_amount), 0) AS total_received
      FROM masterlist m
      LEFT JOIN renewal_scholar rs ON rs.student_id = m.student_id
      LEFT JOIN disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
      LEFT JOIN disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
      WHERE m.scholarship_status = 'Active'
        AND dd.disbursement_status = 'Completed'
      GROUP BY m.scholar_name, m.student_id, rs.yr_lvl, rs.semester, 
               rs.school_year, rs.campus_code, m.campus
      ORDER BY m.scholar_name
    `;

    const listResult = await pool.query(listQuery);

    console.log(`✅ Found ${listResult.rows.length} students in the list:\n`);
    console.log(JSON.stringify(listResult.rows, null, 2));

    // Count total active students (with or without disbursements)
    console.log(
      "\n=== Total Active Students (regardless of disbursement) ===\n"
    );
    const activeQuery = `SELECT COUNT(*) as total FROM masterlist WHERE scholarship_status = 'Active'`;
    const activeResult = await pool.query(activeQuery);
    console.log(`Total Active Students: ${activeResult.rows[0].total}`);

    console.log("\n=== CONCLUSION ===");
    console.log(
      `Students with completed disbursements: ${listResult.rows.length}`
    );
    console.log(
      `Total from summary query: ${summaryResult.rows[0].total_students}`
    );
    console.log(
      `Total disbursed: ₱${parseFloat(summaryResult.rows[0].total_disbursed).toLocaleString()}`
    );

    if (listResult.rows.length === 15) {
      console.log(
        "\n✅ The 15 students you see is REAL DATA from the database!"
      );
    } else {
      console.log(
        `\n⚠️ Expected 15 students but found ${listResult.rows.length}`
      );
      console.log("The 15 might be MOCK DATA or cached data in the browser.");
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  } finally {
    pool.end();
  }
}

checkOverviewStudents();
