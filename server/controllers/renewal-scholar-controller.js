const pool = require("../database/dbConnect.js");
const ExcelJS = require("exceljs");
const { uploadBuffer, getUniqueFileName } = require("../utils/b2.js");

const { startProcess } = require("../services/processProgressService.js");
const { computeScholarshipStatus } = require("../services/renewalService.js");
const { createNotification } = require("../services/notificationService.js");
const {
  sendEmail,
  sendRenewalInitializedEmail,
  sendBranchValidationCompleteEmail,
  sendNewRenewalProcessEmail,
} = require("../utils/emailing.js");

//MASS UPLOAD INITIAL LIST AFTER IDENTIFYING SCHOLAR APPLICANTS
//Functionality to update masterlist scholarship

//Upload new renewal
const uploadScholarRenewals = async (req, res) => {
  const { school_year, semester, user_id, renewal_date } = req.body;

  if (!school_year || !semester) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let previousSemester = semester === 1 ? 2 : 1;
  let previousSY = school_year;

  if (semester === 1) {
    const [startYear, endYear] = school_year.split("-").map(Number);
    previousSY = `${startYear - 1}-${endYear - 1}`;
  }

  let previousSchoolYear = previousSY.replace("-", "");
  previousSchoolYear = parseInt(previousSchoolYear);

  let currentSchoolYear = school_year.replace("-", "");
  currentSchoolYear = parseInt(currentSchoolYear, 10);

  if (previousSemester < 1) {
    return res.status(400).json({ message: "Invalid previous semester." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const currentSY = await client.query(
      "SELECT sy_code FROM maintenance_sy WHERE sy_code = $1",
      [currentSchoolYear]
    );

    const studentsResult = await client.query(
      `SELECT student_id, scholar_name, yr_lvl_code, school_year_code, semester_code, batch_code, course, campus
   FROM masterlist
   WHERE semester_code = $1
   AND school_year_code = $2
   AND scholarship_status != 'Delisted'`,
      [previousSemester, previousSchoolYear]
    );

    if (studentsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "No students eligible for renewal." });
    }

    const existingRenewalsQuery = `
  SELECT student_id FROM renewal_scholar
  WHERE semester = $1 AND school_year = $2
`;
    const existingRenewalsResult = await client.query(existingRenewalsQuery, [
      semester,
      currentSY.rows[0].sy_code,
    ]);

    const existingStudentIds = new Set(
      existingRenewalsResult.rows.map((row) => row.student_id)
    );
    const newStudents = studentsResult.rows.filter(
      (student) => !existingStudentIds.has(student.student_id)
    );

    if (newStudents.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message:
          "Error: All students for this year level, school year, and semester are already generated. No duplication allowed.",
      });
    }

    // ✅ Adjust year level progression logic
    const adjustedStudents = newStudents.map((student) => {
      let nextYearLevel = student.yr_lvl_code;

      // if we're initializing for semester 1, year level increases by 1
      if (semester === 1) {
        nextYearLevel = student.yr_lvl_code + 1;
      }

      return {
        ...student,
        next_yr_lvl_code: nextYearLevel, // store the adjusted level for insertion
      };
    });

    const insertRenewalQuery = `
  INSERT INTO renewal_scholar (
    student_id,
    batch_id,
    campus_name,
    campus_code,
    yr_lvl,                      -- ✅ next year level (adjusted if semester=1)
    renewal_yr_lvl_basis,        -- ✅ always previous (original) level
    renewal_sem_basis,
    renewal_school_year_basis,
    semester,
    school_year,
    initialized_by,
    renewal_date
  )
  SELECT
    s.student_id,
    s.batch_code,
    s.campus,
    m.campus_id,
    s.next_yr_lvl_code,          -- ✅ adjusted next level
    s.yr_lvl_code,               -- ✅ original level (now available)
    s.semester_code,
    s.school_year_code,
    $1::int,
    $2::int,
    $3::int,
    $4::timestamptz
  FROM (
    SELECT
      unnest($5::int[]) AS student_id,
      unnest($6::text[]) AS campus,
      unnest($7::int[]) AS next_yr_lvl_code,  -- ✅ $7: adjusted next level
      unnest($8::int[]) AS yr_lvl_code,       -- ✅ NEW: $8: original level
      unnest($9::int[]) AS semester_code,
      unnest($10::int[]) AS school_year_code,
      unnest($11::int[]) AS batch_code
  ) s
  JOIN maintenance_campus m ON m.campus_name = s.campus
  RETURNING renewal_id, campus_code, campus_name
`;

    const values = [
      semester,
      currentSY.rows[0].sy_code,
      user_id,
      renewal_date,
      adjustedStudents.map((s) => s.student_id),
      adjustedStudents.map((s) => s.campus),
      adjustedStudents.map((s) => s.next_yr_lvl_code), // ✅ $7: use adjusted next level
      adjustedStudents.map((s) => s.yr_lvl_code), // ✅ $8: original level
      adjustedStudents.map((s) => s.semester_code),
      adjustedStudents.map((s) => s.school_year_code),
      adjustedStudents.map((s) => s.batch_code),
    ];

    const renewalResult = await client.query(insertRenewalQuery, values);
    if (renewalResult.rowCount !== newStudents.length) {
      await client.query("ROLLBACK");
      return res.status(500).json({
        message: "Partial insert detected. All actions rolled back.",
      });
    }

    const renewalIds = renewalResult.rows.map((r) => r.renewal_id);

    const insertValidationQuery = `INSERT INTO renewal_validation (renewal_id) SELECT * FROM UNNEST ($1::int[])`;
    await client.query(insertValidationQuery, [renewalIds]);
    // 5. Assign validators (DO, Registrar)

    const branchAdminsRes = await client.query(`
  SELECT a.admin_id, a.role_id, b.branch_id
  FROM administration_adminaccounts a
  JOIN administration_brancheads b ON a.admin_id = b.admin_id
  WHERE a.role_id IN (3, 9)
`);

    const validatorInserts = [];

    for (let i = 0; i < renewalResult.rows.length; i++) {
      const renewal = renewalResult.rows[i];
      const validationIdRes = await client.query(
        `SELECT validation_id FROM renewal_validation WHERE renewal_id = $1`,
        [renewal.renewal_id]
      );

      if (!validationIdRes.rows[0]) {
        throw new Error(
          `No validation record found for renewal_id ${renewal.renewal_id}`
        );
      }

      const validationId = validationIdRes.rows[0].validation_id;

      const branchAdmins = branchAdminsRes.rows.filter(
        (a) => a.branch_id === renewal.campus_code
      );

      if (branchAdmins.length === 0) {
        throw new Error(
          `No branch admins found for campus_code ${renewal.campus_code}`
        );
      }

      for (const admin of branchAdmins) {
        validatorInserts.push([
          validationId,
          admin.role_id,
          admin.branch_id,
          admin.admin_id,
          null,
        ]);
      }

      validatorInserts.push([
        validationId,
        7,
        renewal.campus_code,
        user_id,
        null,
      ]);
    }

    if (validatorInserts.length > 0) {
      const insertValidatorResult = await client.query(
        `
    INSERT INTO renewal_validator (validation_id, role_id, branch_code, user_id, completed_at)
    SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[],  $4::int[], $5::timestamptz[])
  `,
        [
          validatorInserts.map((v) => v[0]),
          validatorInserts.map((v) => v[1]),
          validatorInserts.map((v) => v[2]),
          validatorInserts.map((v) => v[3]),
          validatorInserts.map((v) => v[4]),
        ]
      );

      if (insertValidatorResult.rowCount !== validatorInserts.length) {
        throw new Error("Some validators were not inserted correctly.");
      }
    }

    // Notify about renewal initialization
    const io = req.io;
    console.log("🔌 Socket.io instance:", io ? "Available" : "Not available");
    await notifyRenewalInitialization(
      client,
      io,
      school_year,
      semester,
      user_id
    );

    // Send real-time updates to Registrar and DO
    if (io) {
      const renewalIds = renewalResult.rows.map((r) => r.renewal_id);
      io.to("renewal_updates").emit("renewal_updated", {
        renewalIds: renewalIds,
        totalUpdated: renewalResult.rowCount,
        triggeredBy: user_id,
        timestamp: new Date().toISOString(),
      });
      console.log("📡 Real-time update sent to Registrar and DO");
    }
    const result = await startProcess(
      client,
      currentSY.rows[0].sy_code,
      semester
    );
    if (result.success === false) {
      return res.status(400).json({ message: "Starting process failed" });
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Renewal Processed Successfully.",
      insertedRenewals: renewalResult.rows,
      totalInserted: renewalResult.rowCount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during renewal upload:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error. All actions rolled back." });
  } finally {
    client.release();
  }
};

const fetchAllScholarRenewal = async (req, res) => {
  try {
    const { school_year, semester, branch, role_id, user_id } = req.query;
    // Map role_id → correct view
    let viewName;
    if (role_id === "7") {
      viewName = "vw_renewal_details_hr";
    } else if (role_id === "3") {
      viewName = "vw_renewal_details_registrar";
    } else if (role_id === "9") {
      viewName = "vw_renewal_details_do";
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    let baseQuery = `
      FROM ${viewName}
      WHERE school_year = $1 AND semester = $2
    `;

    const values = [school_year, semester];
    let paramIndex = values.length;

    if (role_id === "7") {
      paramIndex++;
      baseQuery += ` AND initialized_by = $${paramIndex}`;
      values.push(user_id);

      if (branch) {
        paramIndex++;
        baseQuery += ` AND campus = $${paramIndex}`;
        values.push(branch);
      }
    } else {
      paramIndex++;
      baseQuery += ` AND user_id = $${paramIndex}`;
      values.push(user_id);
    }

    const dataQuery = await pool.query(`SELECT * ${baseQuery}`, values);
    const totalCount = dataQuery.rows.length;

    res.status(200).json({
      message: "Renewal records retrieved successfully.",
      data: dataQuery.rows,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching renewal data:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

//fetching renewal
const filteredScholarRenewal = async (req, res) => {
  const client = await pool.connect();
  try {
    const { school_year, year_level, semester, campus, scholar_name } =
      req.query;

    let query = `SELECT * FROM vw_renewal_details WHERE 1=1`;
    const values = [];
    let index = 1;

    if (school_year) {
      query += ` AND school_year = $${index++}`;
      values.push(`${school_year.trim()}`);
    }
    if (year_level) {
      query += ` AND year_level = $${index++}`;
      values.push(`${year_level.trim()}`);
    }
    if (semester) {
      query += ` AND semester = $${index++}`;
      values.push(`${semester.trim()}`);
    }
    if (campus) {
      query += ` AND campus ILIKE $${index++}`;
      values.push(`${campus.trim()}`);
    }
    if (scholar_name) {
      query += ` AND scholar_name = $${index++}`;
      values.push(`${scholar_name.trim()}`);
    }

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching renewal records found." });
    }

    res.status(200).json({
      message: "Filtered renewal records retrieved successfully.",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching filtered renewal data:", error);
    res.status(500).json({ message: "Internal Server Error." });
  } finally {
    client.release();
  }
};

const getScholarRenewal = async (req, res) => {
  const { student_id, renewal_id } = req.params;

  const client = await pool.connect();
  try {
    //scholarship_summary LOCALHOST
    const studentQuery = `
      SELECT * FROM vw_scholarship_detailed
      WHERE student_id = $1 AND renewal_id = $2;
    `;
    const studentResult = await client.query(studentQuery, [
      student_id,
      renewal_id,
    ]);

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: "Scholar renewal not found" });
    }

    // Get all previous renewals for the student, excluding the current renewal
    const historyQuery = `
      SELECT renewal_id, renewal_date_history, renewal_year_level, renewal_semester, 
             renewal_school_year, renewal_status, delisting_root_cause
      FROM vw_scholarship_detailed
      WHERE student_id = $1 AND renewal_id != $2;
    `;
    const historyResult = await client.query(historyQuery, [
      student_id,
      renewal_id,
    ]);

    // Construct response
    const response = {
      ...studentResult.rows[0],
      renewal_history: historyResult.rows,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching scholar renewal:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};
//Update certain scholar renewal
//Update validations, status of scholarship and masterlist scholarship status
const updateScholarRenewal = async (req, res) => {
  const {
    validation_id,
    renewal_id,
    gpa,
    gpa_validation_stat,
    no_failing_grd_validation,
    no_other_scholar_validation,
    goodmoral_validation,
    no_police_record_validation,
    full_load_validation,
    withdrawal_change_course_validation,
    enrollment_validation,
    validation_scholarship_status,
    delisted_date,
    delisting_root_cause,

    is_validated,
    validator_id,
    role_id,

    user_id,
  } = req.body;

  // Required Fields Validation
  const requiredFields = {
    validation_id,
    renewal_id,
    gpa,
    gpa_validation_stat,
    no_failing_grd_validation,
    no_other_scholar_validation,
    goodmoral_validation,
    no_police_record_validation,
    full_load_validation,
    withdrawal_change_course_validation,
    enrollment_validation,
    validation_scholarship_status,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(
      ([, value]) => value === undefined || value === null || value === ""
    )
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  if (isNaN(parseFloat(gpa))) {
    return res.status(400).json({
      success: false,
      message: "GPA must be a valid number.",
    });
  }

  // Validation fields must be "Passed" or "Failed"
  const validationStatuses = {
    gpa_validation_stat,
    no_failing_grd_validation,
    no_other_scholar_validation,
    goodmoral_validation,
    no_police_record_validation,
    full_load_validation,
    withdrawal_change_course_validation,
    enrollment_validation,
  };

  const invalidStatuses = Object.entries(validationStatuses)
    .filter(([, value]) => value !== "Passed" && value !== "Failed")
    .map(([key]) => key);

  if (invalidStatuses.length > 0) {
    return res.status(400).json({
      success: false,
      message: `These validation fields must be either "Passed" or "Failed": ${invalidStatuses.join(
        ", "
      )}`,
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if record exists before updating
    const existingValidation = await client.query(
      `SELECT * FROM renewal_validation WHERE renewal_id = $1 AND validation_id = $2`,
      [renewal_id, validation_id]
    );

    if (existingValidation.rowCount === 0) {
      throw new Error("Validation record not found.");
    }

    // Update Renewal Validation
    const updateValidationQuery = `
      UPDATE renewal_validation
      SET gpa = $1, gpa_validation_stat = $2, no_failing_grd_validation = $3,
          no_other_scholar_validation = $4, goodmoral_validation = $5,
          no_police_record_validation = $6, full_load_validation = $7,
          withdrawal_change_course_validation = $8, enrollment_validation = $9,
          scholarship_status = $10, delisted_date = $11, delisting_root_cause = $12
      WHERE renewal_id = $13 AND validation_id = $14
      RETURNING *;
    `;
    //Automatic generation of disbursement details
    const validationResult = await client.query(updateValidationQuery, [
      gpa,
      gpa_validation_stat,
      no_failing_grd_validation,
      no_other_scholar_validation,
      goodmoral_validation,
      no_police_record_validation,
      full_load_validation,
      withdrawal_change_course_validation,
      enrollment_validation,
      validation_scholarship_status,
      delisted_date || null,
      delisting_root_cause || null,
      renewal_id,
      validation_id,
    ]);

    // Update Masterlist only if scholarship status changes
    let updateMasterlistQuery = `
   
  `;
    if (validation_scholarship_status === "Delisted") {
      updateMasterlistQuery = `
    UPDATE masterlist
    SET scholarship_status = $1,
        delistment_date = $2,
        delistment_reason = $3,
        yr_lvl_code = rs.renewal_yr_lvl_basis,
        school_year_code = rs.renewal_school_year_basis,
        semester_code = rs.renewal_sem_basis
    FROM renewal_scholar rs
    WHERE masterlist.student_id = rs.student_id
      AND rs.renewal_id = $4;
  `;
    } else {
      updateMasterlistQuery = `
    UPDATE masterlist
    SET scholarship_status = $1,
        delistment_date = $2,
        delistment_reason = $3,
        yr_lvl_code = rs.yr_lvl,
        school_year_code = rs.school_year,
        semester_code = rs.semester
    FROM renewal_scholar rs
    WHERE masterlist.student_id = rs.student_id
      AND rs.renewal_id = $4;
  `;
    }

    await client.query(updateMasterlistQuery, [
      validation_scholarship_status === "Delisted" ? "Delisted" : "Active",
      delisted_date || null,
      delisting_root_cause || null,
      renewal_id,
    ]);

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Scholar renewal validation updated successfully.",
      data: validationResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the validation record.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};

const updateScholarRenewalV2 = async (req, res) => {
  const updates = req.body; // expects array of { renewal_id, validator_id?, changedFields }

  if (!Array.isArray(updates) || updates.length === 0) {
    return res
      .status(400)
      .json({ message: "At least one row must be provided for update." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const updatedRows = new Set();

    for (const row of updates) {
      const {
        renewal_id,
        validator_id,
        changedFields,
        validation_id,
        user_id,
      } = row;

      if (
        !renewal_id ||
        !changedFields ||
        Object.keys(changedFields).length === 0
      ) {
        continue;
      }

      let updatedSomething = false;
      let role_id = null;

      // ✅ STEP 0: Handle grade uploads (if present)
      if (changedFields.grades && typeof changedFields.grades === "object") {
        const gradePayload = changedFields.grades; // { fileName, fileURL?, gradeList, fileBuffer? }
        let finalGradeData = { ...gradePayload };

        try {
          // If front-end sends file buffer or file base64 (convert it)
          if (gradePayload.fileBuffer || gradePayload.fileBase64) {
            const fileBuffer = gradePayload.fileBuffer
              ? Buffer.from(gradePayload.fileBuffer)
              : Buffer.from(gradePayload.fileBase64, "base64");

            const uniqueFileName = await getUniqueFileName(
              process.env.B2_BUCKET_ID,
              gradePayload.fileName || `grades_${renewal_id}.pdf`
            );

            const uploaded = await uploadBuffer(
              fileBuffer,
              uniqueFileName,
              process.env.B2_BUCKET_ID
            );

            // Construct public URL (Backblaze public format)
            const fileURL = `https://f002.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${uploaded.fileName}`;
            finalGradeData.fileURL = fileURL;

            console.log(
              `✅ Uploaded ${finalGradeData.fileName} for renewal_id ${renewal_id}`
            );
          }

          // Update the renewal_validation.grades JSONB
          await client.query(
            `
      UPDATE renewal_validation
      SET grades = $1
      WHERE renewal_id = $2
      `,
            [JSON.stringify(finalGradeData), renewal_id]
          );

          updatedSomething = true;
        } catch (uploadErr) {
          console.error(
            `❌ Failed to upload grades for renewal_id ${renewal_id}:`,
            uploadErr
          );
        }

        // Remove grades field from other updates so it won’t conflict later
        delete changedFields.grades;
      }

      // ✅ Retrieve role_id if validator_id is provided
      if (validator_id) {
        const { rows: validatorRows } = await client.query(
          `SELECT role_id FROM renewal_validator WHERE validator_id = $1`,
          [validator_id]
        );
        if (validatorRows.length > 0) {
          role_id = validatorRows[0].role_id;
        }
      }

      // ✅ STEP 1: Renewal validation fields (excluding others)
      let validationFields = { ...changedFields };
      delete validationFields.renewal_date;
      delete validationFields.branch_code;
      delete validationFields.is_validated;
      delete validationFields.completed_at;

      // Filter validation fields by role responsibilities
      if (validator_id && role_id) {
        const { rows: respRows } = await client.query(
          `SELECT responsibilities FROM validation_responsibility WHERE role_id = $1`,
          [role_id]
        );

        if (respRows.length > 0) {
          const allowed = respRows[0].responsibilities;
          if (!allowed.includes("All")) {
            validationFields = Object.fromEntries(
              Object.entries(validationFields).filter(([key]) =>
                allowed.includes(key)
              )
            );
          }
        }
      }

      if (Object.keys(validationFields).length > 0) {
        const setClauses = Object.keys(validationFields)
          .map((key, idx) => `"${key}" = $${idx + 1}`)
          .join(", ");
        const values = Object.values(validationFields);

        const query = `UPDATE renewal_validation SET ${setClauses} WHERE renewal_id = $${values.length + 1}`;
        const result = await client.query(query, [...values, renewal_id]);

        if (result.rowCount > 0) {
          const { rows } = await client.query(
            `SELECT * FROM renewal_validation WHERE renewal_id = $1`,
            [renewal_id]
          );

          if (rows.length > 0) {
            const validationRow = rows[0];
            const newStatus = computeScholarshipStatus(validationRow);
            console.log(newStatus);
            let delistingRootCause = null;
            let delistedDate = null;

            if (newStatus === "Delisted") {
              // Map field names to human-readable labels
              const validationLabels = {
                gpa_validation_stat: "GPA Validation",
                no_failing_grd_validation: "No Failing Grades",
                no_other_scholar_validation: "No Other Scholarship",
                goodmoral_validation: "Good Moral",
                no_derogatory_record: "No Derogatory Record",
                full_load_validation: "Full Load",
                withdrawal_change_course_validation:
                  "Withdrawal/Change of Program",
                enrollment_validation: "Enrollment Validation",
              };

              const failedFields = Object.keys(validationRow)
                .filter((k) => validationRow[k] === "Failed")
                .map((k) => validationLabels[k] || k) // Convert to human-readable labels
                .join(", ");

              delistingRootCause = failedFields;
              delistedDate = new Date().toISOString();
            }

            await client.query(
              `
        UPDATE renewal_validation
        SET scholarship_status = $1,
            delisting_root_cause = $2,
            delisted_date = $3
        WHERE renewal_id = $4
        `,
              [newStatus, delistingRootCause, delistedDate, renewal_id]
            );
          }
        }
      }

      // ✅ STEP 2: Renewal scholar (renewal_date only)
      if (changedFields.renewal_date !== undefined) {
        const result = await client.query(
          `UPDATE renewal_scholar SET renewal_date = $1 WHERE renewal_id = $2`,
          [changedFields.renewal_date, renewal_id]
        );

        if (result.rowCount > 0) {
          updatedSomething = true;

          const auditEntries = [
            [
              validation_id,
              "renewal_date",
              changedFields.renewal_date
                ? changedFields.renewal_date.toString()
                : null,
              user_id,
              role_id,
            ],
          ];

          await client.query(
            `INSERT INTO public.field_validation 
              (validation_id, field_name, value, validated_by, role_id, validated_at)
             SELECT unnest($1::int[]), unnest($2::varchar[]), unnest($3::varchar[]),
                    unnest($4::int[]), unnest($5::int[]), NOW()`,
            [
              auditEntries.map((e) => e[0]),
              auditEntries.map((e) => e[1]),
              auditEntries.map((e) => e[2]),
              auditEntries.map((e) => e[3]),
              auditEntries.map((e) => e[4]),
            ]
          );
        }
      }

      // ✅ STEP 3: Renewal validator fields
      if (validator_id) {
        const allowedValidatorFields = [
          "branch_code",
          "is_validated",
          "completed_at",
        ];
        const validatorFields = Object.fromEntries(
          Object.entries(changedFields).filter(([key]) =>
            allowedValidatorFields.includes(key)
          )
        );

        if (Object.keys(validatorFields).length > 0) {
          const setClauses = Object.keys(validatorFields)
            .map((key, idx) => `"${key}" = $${idx + 1}`)
            .join(", ");
          const values = Object.values(validatorFields);

          const query = `UPDATE renewal_validator SET ${setClauses} WHERE validator_id = $${values.length + 1}`;
          const result = await client.query(query, [...values, validator_id]);

          if (result.rowCount > 0) {
            updatedSomething = true;

            const auditEntries = Object.entries(validatorFields).map(
              ([field_name, value]) => [
                validation_id,
                field_name,
                value !== null ? value.toString() : null,
                user_id,
                role_id,
              ]
            );

            if (auditEntries.length > 0) {
              await client.query(
                `INSERT INTO public.field_validation 
                  (validation_id, field_name, value, validated_by, role_id, validated_at)
                 SELECT unnest($1::int[]), unnest($2::varchar[]), unnest($3::varchar[]), 
                        unnest($4::int[]), unnest($5::int[]), NOW()`,
                [
                  auditEntries.map((e) => e[0]),
                  auditEntries.map((e) => e[1]),
                  auditEntries.map((e) => e[2]),
                  auditEntries.map((e) => e[3]),
                  auditEntries.map((e) => e[4]),
                ]
              );
            }
          }
        }
      }

      // ✅ Count once per row (no matter how many updates per table)
      if (updatedSomething) {
        updatedRows.add(renewal_id);
      }
    }

    await client.query("COMMIT");

    // ✅ SOCKET.IO BROADCAST — real-time update notification
    const triggeredBy = updates[0]?.user_id || null;
    const payload = {
      renewalIds: Array.from(updatedRows),
      totalUpdated: updatedRows.size,
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    // 🧩 Notify all connected users EXCEPT the one who made the update
    if (triggeredBy) {
      // 🟢 Send update to everyone EXCEPT the one who triggered it
      req.io
        .except(`user_${triggeredBy}`)
        .to("renewal_updates")
        .emit("renewal_updated", payload);

      console.log(`📢 Update broadcasted (except user_${triggeredBy})`);
    } else {
      // fallback if no user ID
      req.io.emit("renewal_updated", payload);
    }

    // Check if validation is complete for any branch and notify HR
    console.log("🔄 ===== ABOUT TO CHECK VALIDATION COMPLETION =====");
    console.log("🔄 Triggered by user:", triggeredBy);
    console.log("🔄 Calling checkAndNotifyHRValidationComplete...");
    await checkAndNotifyHRValidationComplete(client, req.io, triggeredBy);
    console.log("✅ ===== VALIDATION COMPLETION CHECK FINISHED =====");

    // ✅ Send HTTP response
    res.status(200).json({
      message: "Updated successfully",
      updatedRows: Array.from(updatedRows),
      totalUpdated: updatedRows.size,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Update failed:", error);
    res.status(500).json({ message: "Update failed", error });
  } finally {
    client.release();
  }
};

//Report generation

const getExcelRenewalReport = async (req, res) => {
  try {
    const { yr_lvl, school_year, semester } = req.params;

    if (!yr_lvl || !school_year || !semester) {
      return res.status(400).json({
        error: "Please provide year level, school year, and semester",
      });
    }

    const query = `
      SELECT * FROM vw_renewal_details
      WHERE year_level ILIKE $1
      AND school_year ILIKE $2
      AND semester ILIKE $3
    `;

    const { rows } = await pool.query(query, [
      `${yr_lvl.trim()}`,
      `${school_year.trim()}`,
      `${semester.trim()}`,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    const passedCount = rows.filter(
      (row) =>
        row.scholarship_status &&
        row.scholarship_status.toLowerCase() === "passed"
    ).length;

    const delistedCount = rows.filter(
      (row) =>
        row.scholarship_status &&
        row.scholarship_status.toLowerCase() === "delisted"
    ).length;

    const notStartedCount = rows.filter(
      (row) =>
        row.scholarship_status &&
        row.scholarship_status.toLowerCase() === "not started"
    ).length;

    const countAll = passedCount + delistedCount + notStartedCount;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Renewal Report");

    const columns = Object.keys(rows[0]).map((key) => {
      let width = 15;
      if (key.includes("name") || key.includes("validation")) {
        width = 25;
      } else if (key.includes("date") || key.includes("status")) {
        width = 18;
      } else if (key.includes("id") || key.includes("code")) {
        width = 12;
      }
      return { key, width };
    });

    worksheet.columns = columns;

    worksheet.mergeCells("A1:D1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Renewal Report`;
    titleCell.font = { bold: true, size: 20 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells("A2:D2");
    const subtitleCell = worksheet.getCell("A2");
    subtitleCell.value = `${yr_lvl} - ${semester} - ${school_year}`;
    subtitleCell.font = { bold: true, size: 14, color: { argb: "404040" } };
    subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(2).height = 25;

    worksheet.mergeCells("A3:D3");
    const genDateCell = worksheet.getCell("A3");
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    genDateCell.value = `Generated on: ${formattedDate}`;
    genDateCell.font = { italic: true, size: 11, color: { argb: "666666" } };
    genDateCell.alignment = { horizontal: "center", vertical: "middle" };

    const passedCell = worksheet.getCell("E1");
    passedCell.value = `Passed: ${passedCount}`;
    passedCell.font = { bold: false, size: 12, color: { argb: "006400" } }; // Dark green
    passedCell.alignment = { horizontal: "center" };

    const delistedCell = worksheet.getCell("F1");
    delistedCell.value = `Delisted: ${delistedCount}`;
    delistedCell.font = { bold: false, size: 12, color: { argb: "8B0000" } }; // Dark red
    delistedCell.alignment = { horizontal: "center" };

    const notStartedCell = worksheet.getCell("G1");
    notStartedCell.value = `Not Started: ${notStartedCount}`;
    notStartedCell.font = { bold: false, size: 12 };
    notStartedCell.alignment = { horizontal: "center" };

    const totalCell = worksheet.getCell("H1");
    totalCell.value = `Total: ${countAll}`;
    totalCell.font = { bold: false, size: 12 };
    totalCell.alignment = { horizontal: "center" };

    worksheet.getRow(4).height = 10;

    const headerRow = worksheet.getRow(5);
    Object.keys(rows[0]).forEach((key, index) => {
      const cell = headerRow.getCell(index + 1);

      const formattedHeader = key
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      cell.value = formattedHeader;
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4F81BD" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 20;

    rows.forEach((row, rowIndex) => {
      const dataRow = worksheet.getRow(rowIndex + 6);

      if (rowIndex % 2 === 0) {
        dataRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F5F5F5" },
          };
        });
      }

      Object.keys(row).forEach((key, colIndex) => {
        const cell = dataRow.getCell(colIndex + 1);
        cell.value = row[key];

        // Apply color coding to scholarship status column
        if (key === "scholarship_status") {
          if (row[key] && row[key].toLowerCase() === "passed") {
            cell.font = { color: { argb: "006400" }, bold: true }; // Dark green
          } else if (row[key] && row[key].toLowerCase() === "delisted") {
            cell.font = { color: { argb: "8B0000" }, bold: true }; // Dark red
          } else if (row[key] && row[key].toLowerCase() === "not started") {
            cell.font = { color: { argb: "9C5700" }, bold: true }; // Orange-brown
          }
        }

        // Center-align id, code, and status fields
        if (
          key.includes("id") ||
          key.includes("code") ||
          key.includes("status")
        ) {
          cell.alignment = { horizontal: "center" };
        }

        // Apply specific formatting for date fields
        if (key.includes("date") && row[key]) {
          // If the value is a date, format it consistently
          if (row[key] instanceof Date) {
            cell.value = row[key];
            cell.numFmt = "yyyy-mm-dd";
          }
        }
      });

      // Apply borders to data cells
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      dataRow.commit();
    });

    // Add a footer with page numbers
    worksheet.headerFooter.oddFooter = "&C&P of &N";

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=renewal_report_${yr_lvl}_${semester}_${school_year.replace(
        "/",
        "-"
      )}.xlsx`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error fetching renewal details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getInitialRenewalInfo = async (req, res) => {
  const { school_year, semester, branch } = req.query; // ✅ optional branch filter

  if (!school_year || !semester) {
    return res
      .status(400)
      .json({ message: "Missing School Year and Semester Field" });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        COUNT(*) AS count,
        rs.renewal_school_year_basis,
        sy.school_year AS renewal_school_year_basis_text,
        rs.renewal_sem_basis,
        sem.semester AS renewal_sem_basis_text,
        rs.school_year,
        sy2.school_year AS school_year_text,
        rs.semester,
        sem2.semester AS semester_text,
        MAX(rs.renewal_date) AS renewal_date  -- ✅ added renewal_date (use MAX for grouped result)
      FROM renewal_scholar rs
      LEFT JOIN maintenance_sy sy 
        ON rs.renewal_school_year_basis = sy.sy_code
      LEFT JOIN maintenance_semester sem 
        ON rs.renewal_sem_basis = sem.semester_code
      LEFT JOIN maintenance_sy sy2
        ON rs.school_year = sy2.sy_code
      LEFT JOIN maintenance_semester sem2
        ON rs.semester = sem2.semester_code
      WHERE rs.school_year = $1 
        AND rs.semester = $2
        AND rs.is_initial = false
        AND ($3::int IS NULL OR rs.campus_code = $3)  -- ✅ optional branch filter
      GROUP BY 
        rs.renewal_school_year_basis, sy.school_year,
        rs.renewal_sem_basis, sem.semester,
        rs.school_year, sy2.school_year,
        rs.semester, sem2.semester
      LIMIT 1
      `,
      [school_year, semester, branch || null]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return res.status(200).json({
        message: "Count fetched successfully",
        data: {
          count: Number(row.count),
          renewal_school_year_basis: row.renewal_school_year_basis,
          renewal_school_year_basis_text: row.renewal_school_year_basis_text,
          renewal_sem_basis: row.renewal_sem_basis,
          renewal_sem_basis_text: row.renewal_sem_basis_text,
          school_year: row.school_year,
          school_year_text: row.school_year_text,
          semester: row.semester,
          semester_text: row.semester_text,
          renewal_date: row.renewal_date, // ✅ added to response
        },
      });
    } else {
      return res.status(200).json({
        message: "No records found",
        data: null,
      });
    }
  } catch (error) {
    console.error("getInitialRenewalInfo error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get Audit Log for Renewal
const getRenewalAuditLog = async (req, res) => {
  try {
    const {
      student_id,
      renewal_id,
      validation_id,
      admin_id,
      role_id,
      branch_id,
      change_category,
      start_date,
      end_date,
      limit = 100,
      offset = 0,
    } = req.query;

    let query = `SELECT * FROM vw_renewal_audit_log WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Filter by student_id
    if (student_id) {
      query += ` AND student_id = $${paramIndex++}`;
      values.push(student_id);
    }

    // Filter by renewal_id
    if (renewal_id) {
      query += ` AND renewal_id = $${paramIndex++}`;
      values.push(renewal_id);
    }

    // Filter by validation_id
    if (validation_id) {
      query += ` AND validation_id = $${paramIndex++}`;
      values.push(validation_id);
    }

    // Filter by admin_id (who made the change)
    if (admin_id) {
      query += ` AND admin_id = $${paramIndex++}`;
      values.push(admin_id);
    }

    // Filter by role_id
    if (role_id) {
      query += ` AND role_id = $${paramIndex++}`;
      values.push(role_id);
    }

    // Filter by branch_id
    if (branch_id) {
      query += ` AND branch_id = $${paramIndex++}`;
      values.push(branch_id);
    }

    // Filter by change category
    if (change_category) {
      query += ` AND change_category = $${paramIndex++}`;
      values.push(change_category);
    }

    // Filter by date range
    if (start_date) {
      query += ` AND changed_at >= $${paramIndex++}`;
      values.push(start_date);
    }

    if (end_date) {
      query += ` AND changed_at <= $${paramIndex++}`;
      values.push(end_date);
    }

    // Order by most recent first
    query += ` ORDER BY changed_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM vw_renewal_audit_log WHERE 1=1`;
    const countValues = [];
    let countParamIndex = 1;

    // Build count query with proper parameter indices
    if (student_id) {
      countQuery += ` AND student_id = $${countParamIndex++}`;
      countValues.push(student_id);
    }
    if (renewal_id) {
      countQuery += ` AND renewal_id = $${countParamIndex++}`;
      countValues.push(renewal_id);
    }
    if (validation_id) {
      countQuery += ` AND validation_id = $${countParamIndex++}`;
      countValues.push(validation_id);
    }
    if (admin_id) {
      countQuery += ` AND admin_id = $${countParamIndex++}`;
      countValues.push(admin_id);
    }
    if (role_id) {
      countQuery += ` AND role_id = $${countParamIndex++}`;
      countValues.push(role_id);
    }
    if (branch_id) {
      countQuery += ` AND branch_id = $${countParamIndex++}`;
      countValues.push(branch_id);
    }
    if (change_category) {
      countQuery += ` AND change_category = $${countParamIndex++}`;
      countValues.push(change_category);
    }
    if (start_date) {
      countQuery += ` AND changed_at >= $${countParamIndex++}`;
      countValues.push(start_date);
    }
    if (end_date) {
      countQuery += ` AND changed_at <= $${countParamIndex++}`;
      countValues.push(end_date);
    }

    const countResult = await pool.query(countQuery, countValues);
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      message: "Audit log retrieved successfully",
      data: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
      },
    });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve audit log",
      error: error.message,
    });
  }
};

// Helper function to check and notify HR when both Registrar and DO complete validation for ANY branch
const checkAndNotifyHRValidationComplete = async (client, io, triggeredBy) => {
  try {
    console.log(
      "🔍 ===== CHECKING VALIDATION COMPLETION FOR HR NOTIFICATION ====="
    );
    console.log("🔍 Triggered by user:", triggeredBy);

    // Get current renewal info
    const { rows: currentRenewal } = await client.query(
      `SELECT school_year, semester FROM renewal_scholar LIMIT 1`
    );

    if (currentRenewal.length === 0) {
      console.log("❌ No current renewal found");
      return;
    }

    const { school_year, semester } = currentRenewal[0];
    console.log(
      `📅 Checking validation for ${school_year} - ${semester === 1 ? "1st" : "2nd"} Semester`
    );

    // Get all branches and their validation status
    const { rows: allBranches } = await client.query(
      `
      SELECT
        r.campus_name,
        r.campus_code,
        COUNT(DISTINCT r.renewal_id) as total_students,
        COUNT(CASE WHEN rv.scholarship_status IN ('Passed', 'Delisted') THEN 1 END) as validated_students
      FROM renewal_scholar r
      INNER JOIN renewal_validation rv ON r.renewal_id = rv.renewal_id
      WHERE r.school_year = $1 AND r.semester = $2
      GROUP BY r.campus_name, r.campus_code
      ORDER BY r.campus_name
      `,
      [school_year, semester]
    );

    console.log("🏢 All branches validation status:", allBranches);

    if (allBranches.length === 0) {
      console.log("❌ No branches found for this renewal period");
      return;
    }

    // Check each branch for completion
    for (const branch of allBranches) {
      console.log(`🔍 Checking branch: ${branch.campus_name}`);

      // Skip if branch is not fully validated
      if (branch.validated_students != branch.total_students) {
        console.log(
          `⏳ Branch ${branch.campus_name} is not fully validated yet (${branch.validated_students}/${branch.total_students})`
        );
        continue;
      }

      console.log(
        `✅ Branch ${branch.campus_name} is fully validated! Checking role completion...`
      );

      // Get role completion for this branch
      let roleCompletion = [];

      if (branch.campus_name === "STI Sta Mesa") {
        // For Sta Mesa, check specific admin_id values (22 and 24)
        console.log(`🔍 Debugging Sta Mesa query for: ${branch.campus_name}`);
        console.log(
          `🔍 Query parameters: school_year=${school_year}, semester=${semester}, campus_name=${branch.campus_name}`
        );

        const { rows: staMesaCompletion } = await client.query(
          `
          SELECT 
            rval.user_id as role_id,
            COUNT(DISTINCT rv.renewal_id) as completed_count
          FROM renewal_validation rv
          INNER JOIN renewal_scholar r ON rv.renewal_id = r.renewal_id
          INNER JOIN renewal_validator rval ON rv.validation_id = rval.validation_id
          WHERE r.school_year = $1 
            AND r.semester = $2 
            AND r.campus_name = $3
            AND rv.scholarship_status IN ('Passed', 'Delisted')
            AND rval.is_validated = true
            AND rval.user_id IN (22, 24)
          GROUP BY rval.user_id
          `,
          [school_year, semester, branch.campus_name]
        );

        console.log(`🔍 Sta Mesa completion query result:`, staMesaCompletion);

        // Additional debugging - let's see what validation records exist
        const { rows: debugValidation } = await client.query(
          `
          SELECT 
            rv.renewal_id,
            rv.scholarship_status,
            rval.user_id,
            rval.is_validated,
            rval.role_id,
            r.campus_name
          FROM renewal_validation rv
          INNER JOIN renewal_scholar r ON rv.renewal_id = r.renewal_id
          INNER JOIN renewal_validator rval ON rv.validation_id = rval.validation_id
          WHERE r.school_year = $1 
            AND r.semester = $2 
            AND r.campus_name = $3
          ORDER BY rv.renewal_id, rval.user_id
          `,
          [school_year, semester, branch.campus_name]
        );

        console.log(
          `🔍 All validation records for ${branch.campus_name}:`,
          debugValidation
        );

        // Let's also check if there are any records with user_id 22 or 24
        const { rows: userCheck } = await client.query(
          `
          SELECT 
            rval.user_id,
            COUNT(*) as total_records,
            COUNT(CASE WHEN rval.is_validated = true THEN 1 END) as validated_records
          FROM renewal_validation rv
          INNER JOIN renewal_scholar r ON rv.renewal_id = r.renewal_id
          INNER JOIN renewal_validator rval ON rv.validation_id = rval.validation_id
          WHERE r.school_year = $1 
            AND r.semester = $2 
            AND r.campus_name = $3
            AND rval.user_id IN (22, 24)
          GROUP BY rval.user_id
          `,
          [school_year, semester, branch.campus_name]
        );

        console.log(`🔍 User 22 and 24 records:`, userCheck);
        roleCompletion = staMesaCompletion;
      } else {
        // For other branches, check role_id values (3 and 9)
        const { rows: regularCompletion } = await client.query(
          `
          SELECT 
            rval.role_id,
            COUNT(DISTINCT rv.renewal_id) as completed_count
          FROM renewal_validation rv
          INNER JOIN renewal_scholar r ON rv.renewal_id = r.renewal_id
          INNER JOIN renewal_validator rval ON rv.validation_id = rval.validation_id
          WHERE r.school_year = $1 
            AND r.semester = $2 
            AND r.campus_name = $3
            AND rv.scholarship_status IN ('Passed', 'Delisted')
            AND rval.is_validated = true
          GROUP BY rval.role_id
          `,
          [school_year, semester, branch.campus_name]
        );
        roleCompletion = regularCompletion;
      }

      console.log(
        `📊 Role completion for ${branch.campus_name}:`,
        roleCompletion
      );

      // Check if both required roles have completed validation
      let bothRolesCompleted = false;
      let completionMessage = "";

      // Determine which roles to check based on branch
      if (branch.campus_name === "STI Sta Mesa") {
        // For Sta Mesa, check if both users 22 and 24 completed
        const user22Completion = roleCompletion.find((r) => r.role_id === 22);
        const user24Completion = roleCompletion.find((r) => r.role_id === 24);

        const user22Completed =
          user22Completion &&
          user22Completion.completed_count >= branch.total_students;
        const user24Completed =
          user24Completion &&
          user24Completion.completed_count >= branch.total_students;

        bothRolesCompleted = user22Completed && user24Completed;
        completionMessage = `Sta Mesa users (22 and 24) have completed validation for ${branch.campus_name}`;

        console.log(
          `📋 Sta Mesa User 22 completed: ${user22Completed} (${user22Completion?.completed_count || 0}/${branch.total_students})`
        );
        console.log(
          `📋 Sta Mesa User 24 completed: ${user24Completed} (${user24Completion?.completed_count || 0}/${branch.total_students})`
        );
        console.log(`📋 Role completion data:`, roleCompletion);
      } else {
        // For other branches, check if both Registrar (role_id = 3) and DO (role_id = 9) completed
        const registrarCompletion = roleCompletion.find((r) => r.role_id === 3);
        const doCompletion = roleCompletion.find((r) => r.role_id === 9);

        const registrarCompleted =
          registrarCompletion &&
          registrarCompletion.completed_count >= branch.total_students;
        const doCompleted =
          doCompletion && doCompletion.completed_count >= branch.total_students;

        bothRolesCompleted = registrarCompleted && doCompleted;
        completionMessage = `DO and Registrar have completed validation for ${branch.campus_name}`;

        console.log(
          `📋 Registrar completed: ${registrarCompleted} (${registrarCompletion?.completed_count || 0}/${branch.total_students})`
        );
        console.log(
          `📋 DO completed: ${doCompleted} (${doCompletion?.completed_count || 0}/${branch.total_students})`
        );
        console.log(`📋 Role completion data:`, roleCompletion);
      }

      if (bothRolesCompleted) {
        console.log(`🎉 ${completionMessage}! Notifying HR...`);

        // Get HR user (User 7)
        const { rows: hrUsers } = await client.query(
          `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_id = 7`
        );

        if (hrUsers.length > 0) {
          // Get year level for this branch
          const { rows: yearLevelInfo } = await client.query(
            `SELECT DISTINCT yr_lvl FROM renewal_scholar WHERE school_year = $1 AND semester = $2 AND campus_name = $3 LIMIT 1`,
            [school_year, semester, branch.campus_name]
          );

          const year_level =
            yearLevelInfo.length > 0 ? yearLevelInfo[0].yr_lvl : "Unknown";

          // Create notification message
          const notificationMessage = `${completionMessage} for ${school_year} - ${semester === 1 ? "1st" : "2nd"} Semester, Year Level ${year_level}. Records are ready for HR review.`;

          console.log("📧 Creating notification:", notificationMessage);

          // Create notification
          await createNotification(
            {
              type: "SCHOLARSHIP_RENEWAL",
              title: "Branch Validation Complete",
              message: notificationMessage,
              actorId: triggeredBy,
              recipients: [{ approvers: { user_id: hrUsers[0].admin_id } }],
            },
            io
          );

          // Send email using new template
          try {
            await sendBranchValidationCompleteEmail(
              hrUsers[0].admin_email,
              school_year,
              semester,
              year_level,
              branch.campus_name
            );
          } catch (emailError) {
            console.error("❌ Email sending failed:", emailError);
          }

          // Send real-time update
          if (io) {
            io.to(`user_${hrUsers[0].admin_id}`).emit("renewal_updated", {
              renewalIds: [],
              totalUpdated: 0,
              triggeredBy: triggeredBy,
              timestamp: new Date().toISOString(),
            });
          }

          console.log(`✅ HR notified for ${branch.campus_name} completion`);
        } else {
          console.log("❌ No HR user found to notify");
        }
      } else {
        console.log(
          `⏳ Not all roles have completed validation for ${branch.campus_name} yet`
        );
      }
    }

    console.log("✅ Validation completion check finished for all branches");
  } catch (error) {
    console.error("❌ Error checking validation completion:", error);
  }
};

// Helper function to notify about renewal initialization
const notifyRenewalInitialization = async (
  client,
  io,
  school_year,
  semester,
  user_id
) => {
  try {
    console.log("📢 Notifying about renewal initialization...");
    console.log("🔌 Socket.io available:", io ? "Yes" : "No");

    // Get the user who initialized the renewal
    const { rows: initiator } = await client.query(
      `SELECT admin_name FROM administration_adminaccounts WHERE admin_id = $1`,
      [user_id]
    );
    const initiatorName = initiator.length > 0 ? initiator[0].admin_name : "HR";

    // Get specific HR user by email address
    const { rows: hrUsers } = await client.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_email = $1`,
      ["adminlastname@example.com"]
    );

    if (hrUsers.length > 0) {
      const hrUser = hrUsers[0];

      // Notify HR (only if they're not the one who initialized)
      if (hrUser.admin_id !== user_id) {
        await createNotification(
          {
            type: "SCHOLARSHIP_RENEWAL",
            title: "Renewal Initialized",
            message: `${initiatorName} has initialized the renewal process for ${school_year} - ${semester === 1 ? "1st" : "2nd"} Semester.`,
            actorId: user_id,
            recipients: [{ approvers: { user_id: hrUser.admin_id } }],
          },
          io
        );

        // Send email to HR using new template
        try {
          await sendRenewalInitializedEmail(
            hrUser.admin_email,
            initiatorName,
            school_year,
            semester
          );
        } catch (emailError) {
          console.error("❌ Email sending failed:", emailError);
        }
      }
    }

    // Get specific DO users by email addresses
    const doEmails = [
      "panturasd@gmail.com",
      "caneso.307787@ortigas-cainta.sti.edu.ph",
    ];
    const { rows: doUsers } = await client.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_email = ANY($1)`,
      [doEmails]
    );

    for (const doUser of doUsers) {
      await createNotification(
        {
          type: "SCHOLARSHIP_RENEWAL",
          title: "New Renewal Process",
          message: `${initiatorName} has initialized a new renewal process for ${school_year} - ${semester === 1 ? "1st" : "2nd"} Semester.`,
          actorId: user_id,
          recipients: [{ approvers: { user_id: doUser.admin_id } }],
        },
        io
      );

      // Send email notification to each DO user using new template
      try {
        await sendNewRenewalProcessEmail(
          doUser.admin_email,
          initiatorName,
          school_year,
          semester,
          "DO"
        );
        console.log(
          `✅ Email sent to DO: ${doUser.admin_name} (${doUser.admin_email})`
        );
      } catch (emailError) {
        console.error(
          `❌ Failed to send email to DO ${doUser.admin_name}:`,
          emailError
        );
      }
    }

    // Get specific Registrar users by email addresses
    const registrarEmails = [
      "kylebandola30@gmail.com",
      "aliarawnd13@gmail.com",
    ];
    const { rows: registrarUsers } = await client.query(
      `SELECT admin_id, admin_name, admin_email FROM administration_adminaccounts WHERE admin_email = ANY($1)`,
      [registrarEmails]
    );

    for (const registrarUser of registrarUsers) {
      await createNotification(
        {
          type: "SCHOLARSHIP_RENEWAL",
          title: "New Renewal Process",
          message: `${initiatorName} has initialized a new renewal process for ${school_year} - ${semester === 1 ? "1st" : "2nd"} Semester.`,
          actorId: user_id,
          recipients: [{ approvers: { user_id: registrarUser.admin_id } }],
        },
        io
      );

      // Send email notification to each Registrar user
      try {
        await sendEmail(
          registrarUser.admin_email,
          "New Renewal Process Initialized",
          `Dear ${registrarUser.admin_name},\n\n${initiatorName} has initialized a new renewal process for ${school_year} - ${semester === 1 ? "1st" : "2nd"} Semester.\n\nPlease log in to the system to begin your validation process.\n\nBest regards,\nMetrobank Scholarship System`
        );
        console.log(
          `✅ Email sent to Registrar: ${registrarUser.admin_name} (${registrarUser.admin_email})`
        );
      } catch (emailError) {
        console.error(
          `❌ Failed to send email to Registrar ${registrarUser.admin_name}:`,
          emailError
        );
      }
    }

    console.log("✅ Initialization notifications and emails sent successfully");
  } catch (error) {
    console.error("❌ Error sending initialization notifications:", error);
  }
};

// Get all renewal students with branch information
const checkAllRenewalStudents = async (req, res) => {
  try {
    const { school_year, semester } = req.query;

    if (!school_year || !semester) {
      return res
        .status(400)
        .json({ message: "School year and semester are required" });
    }

    const { rows } = await client.query(
      `
      SELECT 
        r.renewal_id,
        r.student_id,
        r.campus_name,
        r.campus_code,
        rv.scholarship_status,
        CASE 
          WHEN m.scholarship_status = 'Active' THEN 'Active'
          ELSE 'Inactive'
        END as student_status
      FROM renewal_scholar r
      LEFT JOIN renewal_validation rv ON r.renewal_id = rv.renewal_id
      LEFT JOIN masterlist m ON r.student_id = m.student_id
      WHERE r.school_year = $1 AND r.semester = $2
      ORDER BY r.campus_name, r.student_id
      `,
      [school_year, semester]
    );

    res.status(200).json({
      message: "Renewal students retrieved successfully",
      data: rows,
      totalCount: rows.length,
    });
  } catch (error) {
    console.error("Error fetching renewal students:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Delete scholar renewal

module.exports = {
  uploadScholarRenewals,
  fetchAllScholarRenewal,
  getScholarRenewal,
  updateScholarRenewal,
  getExcelRenewalReport,
  filteredScholarRenewal,
  updateScholarRenewalV2,
  getInitialRenewalInfo,
  getRenewalAuditLog,
  checkAllRenewalStudents,
};
