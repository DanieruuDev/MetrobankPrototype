const pool = require("../database/dbConnect.js");

async function checkAllAccounts() {
  try {
    console.log("🔍 Checking all accounts in the system...\n");

    // First, let's see what tables exist
    console.log("📋 Available tables:");
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    console.log("\n" + "=".repeat(60) + "\n");

    // Check if administration_adminaccounts table exists
    const adminTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'administration_adminaccounts'
      );
    `);

    if (adminTableCheck.rows[0].exists) {
      console.log("👥 Administration Admin Accounts:");
      const adminAccounts = await pool.query(`
        SELECT 
          a.admin_id,
          a.admin_name,
          a.admin_email,
          r.role_name,
          r.role_id
        FROM administration_adminaccounts a
        LEFT JOIN roles r ON a.role_id = r.role_id
        ORDER BY a.admin_name;
      `);

      if (adminAccounts.rows.length > 0) {
        console.log(`Found ${adminAccounts.rows.length} admin accounts:\n`);
        adminAccounts.rows.forEach((account) => {
          console.log(`  📧 ${account.admin_email}`);
          console.log(`     Name: ${account.admin_name}`);
          console.log(
            `     Role: ${account.role_name || "No role assigned"} (ID: ${account.role_id || "N/A"})`
          );
          console.log(`     ID: ${account.admin_id}`);
          console.log("");
        });
      } else {
        console.log("  No admin accounts found.");
      }
    } else {
      console.log("❌ administration_adminaccounts table does not exist");
    }

    console.log("=".repeat(60) + "\n");

    // Check if roles table exists
    const rolesTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'roles'
      );
    `);

    if (rolesTableCheck.rows[0].exists) {
      console.log("🎭 Available Roles:");
      const roles = await pool.query(`
        SELECT role_id, role_name 
        FROM roles 
        ORDER BY role_name;
      `);

      if (roles.rows.length > 0) {
        console.log(`Found ${roles.rows.length} roles:\n`);
        roles.rows.forEach((role) => {
          console.log(`  🏷️  ${role.role_name} (ID: ${role.role_id})`);
        });
      } else {
        console.log("  No roles found.");
      }
    } else {
      console.log("❌ roles table does not exist");
    }

    console.log("\n" + "=".repeat(60) + "\n");

    // Check for any other user-related tables
    console.log("🔍 Checking for other user-related tables...");
    const userTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%user%' OR table_name LIKE '%admin%' OR table_name LIKE '%account%')
      ORDER BY table_name;
    `);

    if (userTables.rows.length > 0) {
      console.log("Found user-related tables:");
      for (const table of userTables.rows) {
        console.log(`\n📊 Table: ${table.table_name}`);
        try {
          const countResult = await pool.query(
            `SELECT COUNT(*) as count FROM ${table.table_name}`
          );
          console.log(`   Records: ${countResult.rows[0].count}`);

          // Get column info
          const columnsResult = await pool.query(
            `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1 
            ORDER BY ordinal_position;
          `,
            [table.table_name]
          );

          console.log("   Columns:");
          columnsResult.rows.forEach((col) => {
            console.log(`     - ${col.column_name} (${col.data_type})`);
          });
        } catch (error) {
          console.log(`   Error querying table: ${error.message}`);
        }
      }
    } else {
      console.log("No user-related tables found.");
    }
  } catch (error) {
    console.error("❌ Error checking accounts:", error.message);
  } finally {
    await pool.end();
  }
}

// Run the check
checkAllAccounts();
