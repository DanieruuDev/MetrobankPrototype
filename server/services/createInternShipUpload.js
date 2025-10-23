// services/internshipUploadService.js
// services/internshipUploadService.js
const createInternshipUpload = async (client, { process_id, covered_date }) => {
  if (!process_id) throw new Error("process_id is required.");
  if (!covered_date) throw new Error("covered_date is required.");

  console.log(
    `📦 Creating Internship Upload Record for Process ID: ${process_id}`
  );

  // 1️⃣ Check if process exists
  const process = await client.query(
    `
    SELECT sy_code, semester_code
    FROM disbursement_process
    WHERE process_id = $1
    `,
    [process_id]
  );

  if (process.rows.length === 0) {
    throw new Error(`Process ID ${process_id} not found.`);
  }

  // ✅ Convert sy_code to string safely
  const { sy_code } = process.rows[0];
  const syString = String(sy_code); // <— convert number → string
  const schoolYear =
    syString.length === 8
      ? `${syString.slice(0, 4)}-${syString.slice(4)}`
      : syString; // fallback if malformed

  // 2️⃣ Define Internship Upload Info
  const program_source = "METROBANK";
  const branch_name = "-";
  const disbursement_type_id = 4;

  // 3️⃣ Check if record already exists (with same covered_date)
  const { rowCount: exists } = await client.query(
    `
    SELECT 1 FROM upload_status
    WHERE program_source = $1
      AND branch_name = $2
      AND process_id = $3
      AND disbursement_type_id = $4
      AND covered_date = $5
    `,
    [
      program_source,
      branch_name,
      process_id,
      disbursement_type_id,
      covered_date,
    ]
  );

  if (exists > 0) {
    throw new Error(
      `Internship upload already exists for process_id ${process_id} and covered_date ${covered_date}`
    );
  }

  // 4️⃣ Insert new Internship upload record
  const insertQuery = `
    INSERT INTO upload_status (
      program_source,
      branch_name,
      process_id,
      disbursement_type_id,
      is_completed,
      completed_at,
      updated_at,
      covered_date
    )
    VALUES ($1, $2, $3, $4, FALSE, NULL, NOW(), $5)
    RETURNING program_source, disbursement_type_id, covered_date, process_id;
  `;

  const { rows: inserted } = await client.query(insertQuery, [
    program_source,
    branch_name,
    process_id,
    disbursement_type_id,
    covered_date,
  ]);

  console.log(`✅ Internship Upload Created for Process ID: ${process_id}`);

  return {
    created: inserted[0],
    schoolYear, // ✅ now properly formatted
  };
};

module.exports = {
  createInternshipUpload,
};
