const pool = require("../database/dbConnect.js");

const getScholarDisbursementSummary = async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT 
          student_name, 
          student_id, 
          student_year_lvl, 
          student_semester, 
          student_school_year, 
          student_branch, 
          total_received
        FROM vw_student_disbursement_summary
      `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Error fetching scholar disbursement summary:",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the disbursement summary.",
      error: error.message,
    });
  }
};

const getDisbursementHistoryByStudentId = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ message: "Student ID is required." });
    }
    const query = `
      SELECT *
      FROM vw_scholar_disbursement_history
      WHERE student_id = $1
      ORDER BY disbursement_date DESC;
    `;

    const { rows } = await pool.query(query, [id]);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching disbursement history:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDisbursementTotalPerSy = async (req, res) => {
  const { sy_code } = req.params;

  try {
    if (!sy_code) {
      return res
        .status(400)
        .json({ message: "School year code (sy_code) is required." });
    }

    const query = `
      SELECT *
      FROM vw_disbursement_totals_per_sy
      WHERE sy_code = $1
    `;
    const result = await pool.query(query, [sy_code]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `No disbursement data found for school year ${sy_code}.`,
      });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching disbursement totals:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getSemesterScholarDisbursement = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vw_semester_disbursement_scholars"
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching data from view:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data from semester disbursement view.",
      error: error.message,
    });
  }
};

module.exports = {
  getScholarDisbursementSummary,
  getDisbursementHistoryByStudentId,
  getDisbursementTotalPerSy,
  getSemesterScholarDisbursement,
};
