const pool = require("../database/dbConnect.js");

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
//Edit soon to also get previous scholar renewals;
const getScholarRenewals = async (req, res) => {
  const { school_year, year_level, semester } = req.params;
  console.log(year_level);

  if (!school_year || !year_level || !semester) {
    return res.status(400).json({ message: "All fields are required." });
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT *
      FROM vw_renewal_details
      WHERE school_year = $1
      AND year_level = $2
      AND semester = $3
    `;

    const result = await client.query(query, [
      school_year,
      year_level,
      semester,
    ]);

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

const getScholarRenewal = (req, res) => {
  try {
  } catch (error) {}
};

//Update certain scholar renewal

//Delete scholar renewal

module.exports = {
  uploadScholarRenewals,
  getScholarRenewals,
  fetchAllScholarRenewal,
};
