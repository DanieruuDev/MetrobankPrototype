const pool = require("./database/dbConnect.js");

async function fixDatabase() {
  const client = await pool.connect();
  try {
    console.log("🔧 Fixing database schema...");

    // 1. Check if disbursement_status_enum exists
    const enumCheck = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname = 'disbursement_status_enum'
    `);

    if (enumCheck.rows.length === 0) {
      console.log("📝 Creating disbursement_status_enum...");
      await client.query(`
        CREATE TYPE disbursement_status_enum AS ENUM ('Not Started', 'In Progress', 'Completed', 'Failed')
      `);
      console.log("✅ disbursement_status_enum created!");
    } else {
      console.log("✅ disbursement_status_enum already exists");
    }

    // 2. Check if event_schedule table exists
    const eventTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'event_schedule'
    `);

    if (eventTableCheck.rows.length === 0) {
      console.log("📝 Creating event_schedule table...");
      await client.query(`
        CREATE TABLE event_schedule (
          sched_id SERIAL PRIMARY KEY,
          event_type INTEGER NOT NULL,
          sched_title VARCHAR(255) NOT NULL,
          schedule_due DATE NOT NULL,
          starting_date DATE,
          sy_code INTEGER REFERENCES sy_maintenance(sy_code),
          semester_code INTEGER REFERENCES semester_maintenance(semester_code),
          requester INTEGER REFERENCES "user"(user_id),
          description TEXT,
          schedule_status VARCHAR(20) DEFAULT 'Not Started' CHECK (schedule_status IN ('Not Started', 'In Progress', 'Completed', 'Failed')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          edit_at TIMESTAMP
        )
      `);
      console.log("✅ event_schedule table created!");
    } else {
      console.log("✅ event_schedule table already exists");
    }

    // 3. Check if disbursement_detail has disb_sched_id column
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'disbursement_detail' 
      AND column_name = 'disb_sched_id'
    `);

    if (columnCheck.rows.length === 0) {
      console.log("📝 Adding disb_sched_id column to disbursement_detail...");
      await client.query(`
        ALTER TABLE disbursement_detail 
        ADD COLUMN disb_sched_id INTEGER REFERENCES disbursement_schedule(disb_sched_id)
      `);
      console.log("✅ disb_sched_id column added!");
    } else {
      console.log("✅ disb_sched_id column already exists");
    }

    // 4. Check if disbursement_schedule has sched_id column
    const schedIdCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'disbursement_schedule' 
      AND column_name = 'sched_id'
    `);

    if (schedIdCheck.rows.length === 0) {
      console.log("📝 Adding sched_id column to disbursement_schedule...");
      await client.query(`
        ALTER TABLE disbursement_schedule 
        ADD COLUMN sched_id INTEGER REFERENCES event_schedule(sched_id) ON DELETE CASCADE
      `);
      console.log("✅ sched_id column added!");
    } else {
      console.log("✅ sched_id column already exists");
    }

    // 5. Update disbursement_detail to use the enum type
    try {
      console.log("📝 Updating disbursement_detail to use enum type...");
      await client.query(`
        ALTER TABLE disbursement_detail 
        ALTER COLUMN disbursement_status TYPE disbursement_status_enum 
        USING disbursement_status::disbursement_status_enum
      `);
      console.log("✅ disbursement_detail updated to use enum!");
    } catch (error) {
      console.log(
        "⚠️ Could not update disbursement_status to enum (might already be correct)"
      );
    }

    // 6. Update disbursement_schedule to use the enum type
    try {
      console.log("📝 Updating disbursement_schedule to use enum type...");
      await client.query(`
        ALTER TABLE disbursement_schedule 
        ALTER COLUMN status TYPE disbursement_status_enum 
        USING status::disbursement_status_enum
      `);
      console.log("✅ disbursement_schedule updated to use enum!");
    } catch (error) {
      console.log(
        "⚠️ Could not update status to enum (might already be correct)"
      );
    }

    console.log("🎉 Database schema fix completed successfully!");
  } catch (error) {
    console.error("❌ Error fixing database schema:", error);
  } finally {
    client.release();
  }
}

fixDatabase()
  .then(() => {
    console.log("✅ Database fix script completed");
    process.exit(0);
  })
  .catch(console.error);
