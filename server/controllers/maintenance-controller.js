const pool = require("../database/dbConnect.js");

const getSchoolYear = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM maintenance_sy ORDER BY school_year DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching school years:", err);
    res.status(500).json({ error: "Failed to fetch school years" });
  }
};

const getYearLevel = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM maintenance_yr_lvl ORDER BY yr_lvl"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching year levels:", err);
    res.status(500).json({ error: "Failed to fetch year levels" });
  }
};
const getSemester = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM maintenance_semester ORDER by semester"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching semester:", err);
    res.status(500).json({ error: "Failed to fetch semester" });
  }
};
const getBranch = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT campus_id, school_id, campus_name, campus_address, scholar_limit
       FROM maintenance_campus
       ORDER BY campus_name ASC`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch branches",
      error: error.message,
    });
  }
};
const getValidSYSem = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.label, v.sy_code, v.semester_code,
             sy.school_year, sem.semester
      FROM valid_sy_semester v
      JOIN maintenance_sy sy ON v.sy_code = sy.sy_code
      JOIN maintenance_semester sem ON v.semester_code = sem.semester_code
      -- start year DESC (e.g., 2025 > 2024), then 2nd (2) before 1st (1)
      ORDER BY COALESCE(substring(sy.school_year FROM '^[0-9]{4}')::int, 0) DESC,
               v.semester_code DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching SY-Semester:", error);
    res.status(500).json({ error: "Failed to fetch SY-Semester" });
  }
};

module.exports = {
  getSchoolYear,
  getYearLevel,
  getBranch,
  getSemester,
  getValidSYSem,
};
