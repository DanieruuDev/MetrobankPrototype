const pool = require("./database/dbConnect.js");

async function checkStudentDisbursementTypes() {
  try {
    console.log("\n=== Checking Disbursement Types per Student ===\n");

    const query = `
      SELECT 
        m.scholar_name,
        m.student_id,
        dt.disbursement_label,
        dd.disbursement_amount,
        dd.disbursement_status,
        rs.school_year,
        rs.semester
      FROM disbursement_detail dd
      JOIN disbursement_tracking dtr ON dd.disbursement_id = dtr.disbursement_id
      JOIN renewal_scholar rs ON dtr.renewal_id = rs.renewal_id
      JOIN masterlist m ON rs.student_id = m.student_id
      JOIN disbursement_type dt ON dd.disbursement_type_id = dt.disbursement_type_id
      WHERE m.scholarship_status = 'Active'
        AND dd.disbursement_status = 'Completed'
      ORDER BY m.scholar_name, dt.disbursement_label
    `;

    const result = await pool.query(query);

    console.log(`✅ Found ${result.rows.length} disbursement records:\n`);

    // Group by student
    const studentMap = new Map();

    result.rows.forEach((row) => {
      if (!studentMap.has(row.student_id)) {
        studentMap.set(row.student_id, {
          name: row.scholar_name,
          id: row.student_id,
          disbursements: [],
          total: 0,
        });
      }

      const student = studentMap.get(row.student_id);
      student.disbursements.push({
        type: row.disbursement_label,
        amount: parseFloat(row.disbursement_amount || 0),
        status: row.disbursement_status,
        sy: row.school_year,
        sem: row.semester,
      });
      student.total += parseFloat(row.disbursement_amount || 0);
    });

    // Display results
    studentMap.forEach((student, id) => {
      console.log(`\n📚 ${student.name} (ID: ${id})`);
      console.log(`   Total Received: ₱${student.total.toLocaleString()}`);
      console.log(`   Disbursements:`);
      student.disbursements.forEach((d) => {
        console.log(
          `   - ${d.type}: ₱${d.amount.toLocaleString()} (${d.sy} - Sem ${d.sem})`
        );
      });
    });

    // Summary by disbursement type
    console.log("\n\n=== Summary by Disbursement Type ===\n");
    const typeMap = new Map();

    result.rows.forEach((row) => {
      const type = row.disbursement_label;
      if (!typeMap.has(type)) {
        typeMap.set(type, {
          count: 0,
          total: 0,
          students: new Set(),
        });
      }

      const typeData = typeMap.get(type);
      typeData.count++;
      typeData.total += parseFloat(row.disbursement_amount || 0);
      typeData.students.add(row.student_id);
    });

    typeMap.forEach((data, type) => {
      console.log(`${type}:`);
      console.log(`  - ${data.students.size} students`);
      console.log(`  - ${data.count} disbursements`);
      console.log(`  - Total: ₱${data.total.toLocaleString()}\n`);
    });
  } catch (error) {
    console.error("Error:", error.message);
    console.error(error.stack);
  } finally {
    pool.end();
  }
}

checkStudentDisbursementTypes();

