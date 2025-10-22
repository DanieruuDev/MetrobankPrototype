const { Pool } = require("pg");

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "metrobank_scholarship",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
});

async function checkUserEmails() {
  const client = await pool.connect();

  try {
    console.log("🔍 Checking user emails for notification system...\n");

    // Define the users we're checking
    const users = [
      { id: 7, name: "HR User", role: "HR" },
      { id: 21, name: "Regular Registrar", role: "Registrar" },
      {
        id: 22,
        name: "STI Sta Mesa Registrar",
        role: "STI Sta Mesa Registrar",
      },
      { id: 23, name: "Regular DO", role: "Discipline Office" },
      { id: 24, name: "STI Sta Mesa DO", role: "STI Sta Mesa DO" },
    ];

    console.log("📧 User Email Addresses:");
    console.log("=".repeat(60));

    for (const user of users) {
      const { rows } = await client.query(
        `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_id = $1`,
        [user.id]
      );

      if (rows.length > 0) {
        const userData = rows[0];
        console.log(`👤 ${user.name} (ID: ${userData.admin_id})`);
        console.log(`   Name: ${userData.admin_name}`);
        console.log(`   Email: ${userData.admin_email}`);
        console.log(`   Role: ${user.role}`);
        console.log("");
      } else {
        console.log(`❌ ${user.name} (ID: ${user.id}) - NOT FOUND`);
        console.log("");
      }
    }

    // Also check for any other admin users
    console.log("🔍 All Admin Users in System:");
    console.log("=".repeat(60));

    const { rows: allUsers } = await client.query(
      `SELECT admin_id, admin_name, admin_email, role_id FROM administration_adminaccounts ORDER BY admin_id`
    );

    allUsers.forEach((user) => {
      console.log(
        `ID: ${user.admin_id} | Name: ${user.admin_name} | Email: ${user.admin_email} | Role ID: ${user.role_id}`
      );
    });
  } catch (error) {
    console.error("❌ Error checking user emails:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
checkUserEmails();
