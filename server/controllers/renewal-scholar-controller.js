const pool = require("../database/dbConnect.js");
const ExcelJS = require("exceljs");

//MASS UPLOAD INITIAL LIST AFTER IDENTIFYING SCHOLAR APPLICANTS
//Functionality to update masterlist scholarship

//Upload new renewal
const uploadScholarRenewals = async (req, res) => {
  const { school_year, year_level, semester } = req.body;
  console.log(typeof school_year);
  if (!school_year || !year_level || !semester) {
    return res.status(400).json({ message: "All fields are required" });
  }
  console.log(school_year, year_level, semester);
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
  console.log(previousYearLevel, previousSemester, previousSchoolYear);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentSY = await client.query(
      "SELECT sy_code FROM sy_maintenance WHERE sy_code = $1",
      [currentSchoolYear]
    );
    const prevSY = await client.query(
      "SELECT sy_code FROM sy_maintenance WHERE sy_code = $1",
      [previousSchoolYear]
    );
    console.log(previousSchoolYear, currentSchoolYear);

    console.log(
      "This is query result: ",
      currentSY.rows[0].sy_code,
      prevSY.rows[0].sy_code
    );

    console.log("Postman Iput: ", school_year, year_level, semester);
    console.log(
      "previousYearLevel:",
      previousYearLevel,
      typeof previousYearLevel
    );
    console.log("previousSemester:", previousSemester, typeof previousSemester);
    console.log(
      "prevSY.rows[0].sy_code:",
      prevSY.rows[0].sy_code,
      typeof prevSY.rows[0].sy_code
    );

    console.log(
      "Eligible Student Query: ",
      previousYearLevel,
      previousSemester,
      prevSY.rows[0].sy_code
    );
    const studentsResult = await client.query(
      "SELECT student_id, scholar_name, yr_lvl_code, school_year_code, semester_code, batch_code, course, campus FROM masterlist WHERE yr_lvl_code = $1 AND semester_code =$2 AND school_year_code = $3 AND scholarship_status != 'DELISTED'",
      [previousYearLevel, previousSemester, prevSY.rows[0].sy_code]
    );
    console.log(studentsResult.rows[0]);

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

    //edit campus code to be reference on campus maintenance
    const insertRenewalQuery = `
    INSERT INTO renewal_scholar (
      student_id, batch_code, campus_code, 
      renewal_yr_lvl_basis, renewal_sem_basis, renewal_school_year_basis, 
      yr_lvl, semester, school_year
    )
    SELECT * FROM UNNEST (
      $1::int[], $2::int[], $3::text[], 
      $4::int[], $5::int[], $6::int[], 
      $7::int[], $8::int[], $9::int[]
    )
    RETURNING renewal_id
  `;
    const values = [
      newStudents.map((s) => s.student_id),
      newStudents.map((s) => s.batch_code),
      newStudents.map((s) => s.campus),
      newStudents.map((s) => s.yr_lvl_code),
      newStudents.map((s) => s.semester_code),
      newStudents.map((s) => s.school_year_code),
      Array(newStudents.length).fill(year_level),
      Array(newStudents.length).fill(semester),
      Array(newStudents.length).fill(currentSY.rows[0].sy_code),
    ];

    const renewalResult = await client.query(insertRenewalQuery, values);
    if (renewalResult.rowCount !== newStudents.length) {
      await client.query("ROLLBACK");
      return res.status(500).json({
        message: "Partial insert detected. All actions rolled back.",
      });
    }
    const renewalIds = renewalResult.rows.map((row) => row.renewal_id);
    const insertValidationQuery = `
      INSERT INTO renewal_validation (renewal_id) 
      SELECT * FROM UNNEST ($1::int[])
    `;
    await client.query(insertValidationQuery, [renewalIds]);

    //Soon to add notification function
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

//fetching renewals

const fetchAllScholarRenewal = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT *
      FROM vw_renewal_details
    `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No renewal records found." });
    }

    res.status(200).json({
      message: "Renewal records retrieved successfully.",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching renewal data:", error);
    res.status(500).json({ message: "Internal Server Error." });
  } finally {
    client.release();
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
    const studentQuery = `
      SELECT * FROM scholarship_summary
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
      FROM scholarship_summary
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
    const updateMasterlistQuery = `
      UPDATE masterlist
      SET scholarship_status = $1, 
          delistment_date = $2, 
          delistment_reason = $3
      WHERE student_id = (SELECT student_id FROM renewal_scholar WHERE renewal_id = $4);
    `;

    await client.query(updateMasterlistQuery, [
      validation_scholarship_status === "Delisted" ? "DELISTED" : "ACTIVE",
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
};
