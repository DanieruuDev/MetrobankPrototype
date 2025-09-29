const pool = require("../database/dbConnect.js");
const ExcelJS = require("exceljs");

//MASS UPLOAD INITIAL LIST AFTER IDENTIFYING SCHOLAR APPLICANTS
//Functionality to update masterlist scholarship

//Upload new renewal
const uploadScholarRenewals = async (req, res) => {
  const { school_year, year_level, semester, user_id } = req.body;

  console.log(school_year, semester);
  if (!school_year || !year_level || !semester) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let previousSemester = semester === 1 ? 2 : 1;
  let previousYearLevel = year_level;
  let previousSY = school_year;

  if (semester === 1) {
    const [startYear, endYear] = school_year.split("-").map(Number);
    previousSY = `${startYear - 1}-${endYear - 1}`;
    previousYearLevel = year_level - 1;
  }

  let previousSchoolYear = previousSY.replace("-", "");
  previousSchoolYear = parseInt(previousSchoolYear);

  let currentSchoolYear = school_year.replace("-", "");
  currentSchoolYear = parseInt(currentSchoolYear, 10);

  if (previousYearLevel < 1 || previousSemester < 1) {
    return res
      .status(400)
      .json({ message: "Invalid previous year level or semester." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentSY = await client.query(
      "SELECT sy_code FROM maintenance_sy WHERE sy_code = $1",
      [currentSchoolYear]
    );
    const prevSY = await client.query(
      "SELECT sy_code FROM maintenance_sy WHERE sy_code = $1",
      [previousSchoolYear]
    );
    console.log(currentSchoolYear, previousSchoolYear);

    const studentsResult = await client.query(
      "SELECT student_id, scholar_name, yr_lvl_code, school_year_code, semester_code, batch_code, course, campus FROM masterlist WHERE yr_lvl_code = $1 AND semester_code =$2 AND school_year_code = $3 AND scholarship_status != 'Delisted'",
      [previousYearLevel, previousSemester, previousSchoolYear]
    );

    if (studentsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "No students eligible for renewal." });
    }

    const existingRenewalsQuery = `
    SELECT student_id FROM renewal_scholar
    WHERE yr_lvl = $1 AND semester = $2 AND school_year = $3
  `;
    const existingRenewalsResult = await client.query(existingRenewalsQuery, [
      year_level,
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
    const insertRenewalQuery = `
  INSERT INTO renewal_scholar (
    student_id,
    batch_id,
    campus_name,
    campus_code,
    renewal_yr_lvl_basis,
    renewal_sem_basis,
    renewal_school_year_basis,
    yr_lvl,
    semester,
    school_year,
    initialized_by
  )
  SELECT
    s.student_id,
    s.batch_code,
    s.campus,
    m.campus_id,
    s.yr_lvl_code,
    s.semester_code,
    s.school_year_code,
    $1::int,  -- year_level
    $2::int,  -- semester
    $3::int,  -- currentSY
    $4::int   -- initialized_by
  FROM (
    SELECT
      unnest($5::int[]) AS student_id,
      unnest($6::text[]) AS campus,
      unnest($7::int[]) AS yr_lvl_code,
      unnest($8::int[]) AS semester_code,
      unnest($9::int[]) AS school_year_code,
      unnest($10::int[]) AS batch_code
  ) s
  JOIN maintenance_campus m ON m.campus_name = s.campus
  RETURNING renewal_id, campus_code, campus_name
`;

    const values = [
      year_level,
      semester,
      currentSY.rows[0].sy_code,
      user_id, // <-- pass initialized_by here
      newStudents.map((s) => s.student_id),
      newStudents.map((s) => s.campus),
      newStudents.map((s) => s.yr_lvl_code),
      newStudents.map((s) => s.semester_code),
      newStudents.map((s) => s.school_year_code),
      newStudents.map((s) => s.batch_code),
    ];

    const renewalResult = await client.query(insertRenewalQuery, values);
    if (renewalResult.rowCount !== newStudents.length) {
      await client.query("ROLLBACK");
      return res.status(500).json({
        message: "Partial insert detected. All actions rolled back.",
      });
    }
    console.log(renewalResult.rows);
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
    console.log("Renewal Campus", renewalResult.rows[0]);
    for (let i = 0; i < renewalResult.rows.length; i++) {
      const renewal = renewalResult.rows[i];
      const validationIdRes = await client.query(
        `SELECT validation_id FROM renewal_validation WHERE renewal_id = $1`,
        [renewal.renewal_id]
      );
      console.log("ValidationIdRes  Result", validationIdRes.rows);
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
          null,
          admin.admin_id,
          null,
        ]);
      }

      validatorInserts.push([
        validationId,
        7,
        renewal.campus_code,
        null,
        user_id,
        null,
      ]);
    }

    if (validatorInserts.length > 0) {
      const insertValidatorResult = await client.query(
        `
    INSERT INTO renewal_validator (validation_id, role_id, branch_code, is_validated, user_id, completed_at)
    SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[], $4::bool[], $5::int[], $6::timestamptz[])
  `,
        [
          validatorInserts.map((v) => v[0]),
          validatorInserts.map((v) => v[1]),
          validatorInserts.map((v) => v[2]),
          validatorInserts.map((v) => v[3]),
          validatorInserts.map((v) => v[4]),
          validatorInserts.map((v) => v[5]),
        ]
      );

      if (insertValidatorResult.rowCount !== validatorInserts.length) {
        throw new Error("Some validators were not inserted correctly.");
      }
    }

    //Email function??
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
    console.log(school_year, year_level, semester, campus);
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
    console.log(values);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching renewal records found." });
    }
    console.log(result.rows);
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
  console.log(student_id, renewal_id);
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
    console.log(studentResult.rows[0]);

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
  console.log("Upate here", updates);
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
      const { renewal_id, validator_id, changedFields } = row;

      if (
        !renewal_id ||
        !changedFields ||
        Object.keys(changedFields).length === 0
      ) {
        continue;
      }

      // ✅ STEP 1: Renewal validation fields
      let validationFields = { ...changedFields };
      delete validationFields.renewal_date; // leave date for renewal_scholar
      delete validationFields.branch_code;
      delete validationFields.is_validated;
      delete validationFields.completed_at;

      // If validator_id provided → filter by role responsibilities
      if (validator_id) {
        const { rows: validatorRows } = await client.query(
          `SELECT role_id FROM renewal_validator WHERE validator_id = $1`,
          [validator_id]
        );

        if (validatorRows.length > 0) {
          const role_id = validatorRows[0].role_id;

          const { rows: respRows } = await client.query(
            `SELECT responsibilities FROM validation_responsibility WHERE role_id = $1`,
            [role_id]
          );

          if (respRows.length > 0) {
            const allowed = respRows[0].responsibilities;

            // If role has "All", allow everything
            if (!allowed.includes("All")) {
              validationFields = Object.fromEntries(
                Object.entries(validationFields).filter(([key]) =>
                  allowed.includes(key)
                )
              );
            }
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

        if (result.rowCount > 0) updatedRows.add(renewal_id);
      }

      // ✅ STEP 2: Renewal scholar (renewal_date only)
      if (changedFields.renewal_date !== undefined) {
        const result = await client.query(
          `UPDATE renewal_scholar SET renewal_date = $1 WHERE renewal_id = $2`,
          [changedFields.renewal_date, renewal_id]
        );
        if (result.rowCount > 0) updatedRows.add(renewal_id);
      }

      // ✅ STEP 3: Renewal validator fields
      if (validator_id) {
        const validatorFields = {};
        const allowedValidatorFields = [
          "branch_code",
          "is_validated",
          "completed_at",
        ];
        for (const key of allowedValidatorFields) {
          if (changedFields[key] !== undefined) {
            validatorFields[key] = changedFields[key];
          }
        }

        if (Object.keys(validatorFields).length > 0) {
          const setClauses = Object.keys(validatorFields)
            .map((key, idx) => `"${key}" = $${idx + 1}`)
            .join(", ");
          const values = Object.values(validatorFields);

          const query = `UPDATE renewal_validator SET ${setClauses} WHERE validator_id = $${values.length + 1}`;
          const result = await client.query(query, [...values, validator_id]);

          if (result.rowCount > 0) updatedRows.add(renewal_id);
        }
      }
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: "Updated successfully",
      updatedRows: Array.from(updatedRows),
      totalUpdated: updatedRows.size,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
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
    console.log(yr_lvl, school_year, semester);
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

//Delete scholar renewal

module.exports = {
  uploadScholarRenewals,
  fetchAllScholarRenewal,
  getScholarRenewal,
  updateScholarRenewal,
  getExcelRenewalReport,
  filteredScholarRenewal,
  updateScholarRenewalV2,
};
