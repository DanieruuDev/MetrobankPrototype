const pool = require("../database/dbConnect.js");

async function getAutocompleteAccounts() {
  try {
    console.log(
      "🔍 Accounts available for autocomplete in AddApprover component:\n"
    );

    // Get all admin accounts with their roles for autocomplete
    const accounts = await pool.query(`
      SELECT 
        a.admin_id,
        a.admin_name,
        a.admin_email,
        r.role_name,
        r.role_id
      FROM administration_adminaccounts a
      LEFT JOIN roles r ON a.role_id = r.role_id
      WHERE a.deletiondate IS NULL
      ORDER BY a.admin_name;
    `);

    console.log(`📊 Found ${accounts.rows.length} active admin accounts:\n`);

    // Group by role for better organization
    const accountsByRole = {};
    accounts.rows.forEach((account) => {
      const roleName = account.role_name || "No Role Assigned";
      if (!accountsByRole[roleName]) {
        accountsByRole[roleName] = [];
      }
      accountsByRole[roleName].push(account);
    });

    // Display accounts grouped by role
    Object.keys(accountsByRole)
      .sort()
      .forEach((roleName) => {
        console.log(`🎭 ${roleName}:`);
        accountsByRole[roleName].forEach((account) => {
          console.log(
            `   📧 ${account.admin_email} - ${account.admin_name} (ID: ${account.admin_id})`
          );
        });
        console.log("");
      });

    console.log("=".repeat(80) + "\n");

    // Show some example searches that would work with the autocomplete
    console.log("💡 Example autocomplete searches:\n");

    const exampleSearches = [
      "kyle",
      "admin",
      "test",
      "lar",
      "mb",
      "sti",
      "panelist",
    ];

    for (const searchTerm of exampleSearches) {
      console.log(`🔍 Searching for "${searchTerm}":`);
      const results = await pool.query(
        `
        SELECT 
          a.admin_email,
          r.role_name
        FROM administration_adminaccounts a
        LEFT JOIN roles r ON a.role_id = r.role_id
        WHERE a.admin_email ILIKE $1
        AND a.deletiondate IS NULL
        ORDER BY a.admin_email
        LIMIT 5
      `,
        [`%${searchTerm}%`]
      );

      if (results.rows.length > 0) {
        results.rows.forEach((result) => {
          console.log(`   ✅ ${result.admin_email} (${result.role_name})`);
        });
      } else {
        console.log(`   ❌ No matches found`);
      }
      console.log("");
    }

    console.log("=".repeat(80) + "\n");

    // Show the API endpoint that would be called
    console.log("🌐 API Endpoint for autocomplete:\n");
    console.log("   GET /api/workflow/search-email-role/{query}");
    console.log("   Example: GET /api/workflow/search-email-role/kyle");
    console.log("   Returns: Array of { email, role } objects\n");

    // Test the actual API endpoint logic
    console.log('🧪 Testing API endpoint logic with "kyle":\n');
    const testResults = await pool.query(
      `
      SELECT a.admin_email, r.role_name 
      FROM administration_adminaccounts a 
      JOIN roles r ON a.role_id = r.role_id 
      WHERE a.admin_email ILIKE $1 
      AND a.deletiondate IS NULL
      ORDER BY a.admin_email 
      LIMIT 10
    `,
      ["%kyle%"]
    );

    const apiResponse = testResults.rows.map((row) => ({
      email: row.admin_email,
      role: row.role_name,
    }));

    console.log("   API Response:");
    console.log(JSON.stringify(apiResponse, null, 2));
  } catch (error) {
    console.error("❌ Error getting autocomplete accounts:", error.message);
  } finally {
    await pool.end();
  }
}

// Run the check
getAutocompleteAccounts();
