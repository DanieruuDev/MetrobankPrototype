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

module.exports = { getSchoolYear, getYearLevel };
