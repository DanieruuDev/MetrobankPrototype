const pool = require("./database/dbConnect.js");

async function checkDisbursementData() {
  try {
    console.log(
      "\n=== Checking Total Disbursement Data (All School Years) ===\n"
    );

    const allDataQuery = `
      SELECT 
        dt.disbursement_label AS category,
        COUNT(DISTINCT m.student_id) AS total_students,
        SUM(dd.disbursement_amount) AS total_amount
      FROM disbursement_detail dd
      JOIN disbursement_tracking dtr ON dd.disbursement_id = dtr.disbursement_id
      JOIN renewal_scholar rs ON dtr.renewal_id = rs.renewal_id
      JOIN masterlist m ON rs.student_id = m.student_id
      JOIN disbursement_type dt ON dd.disbursement_type_id = dt.disbursement_type_id
      WHERE dd.disbursement_status = 'Completed'
        AND m.scholarship_status = 'Active'
      GROUP BY dt.disbursement_label
      ORDER BY total_amount DESC
    `;

    const allDataResult = await pool.query(allDataQuery);

    if (allDataResult.rows.length === 0) {
      console.log("❌ NO DISBURSEMENT DATA FOUND IN DATABASE");
      console.log(
        "The 12.8M is likely MOCK DATA still cached in the browser!\n"
      );
    } else {
      console.log("✅ Found actual disbursement data:\n");
      console.log(JSON.stringify(allDataResult.rows, null, 2));

      const grandTotal = allDataResult.rows.reduce(
        (sum, row) => sum + parseFloat(row.total_amount || 0),
        0
      );
      console.log(
        `\n📊 GRAND TOTAL (All School Years): ₱${grandTotal.toLocaleString()}\n`
      );
    }

    // Check what school years exist
    console.log("\n=== Available School Years ===\n");
    const syQuery = `SELECT sy_code, school_year FROM sy_maintenance ORDER BY sy_code DESC LIMIT 5`;
    const syResult = await pool.query(syQuery);
    console.log(JSON.stringify(syResult.rows, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    pool.end();
  }
}

checkDisbursementData();

