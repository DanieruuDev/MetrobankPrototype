const pool = require("../database/dbConnect.js");

const getScholarDisbursementSummary = async (req, res) => {
  try {
    // Extract page and limit from query params, provide defaults
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    console.log("Fetching disbursement summary with params:", {
      page,
      limit,
      offset,
    });

    // First, let's test if the view exists and is accessible
    const testQuery = await pool.query(
      "SELECT 1 FROM vw_disbursement_overview LIMIT 1"
    );
    console.log("View test successful");

    // Query to fetch paginated data
    const dataQuery = await pool.query(
      `
      SELECT 
      *
      FROM vw_disbursement_overview
      ORDER BY student_name
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    console.log("Data query successful, rows:", dataQuery.rows);

    // Query total count of records (no LIMIT/OFFSET here)
    const countQuery = await pool.query(
      `SELECT COUNT(*) FROM vw_disbursement_overview`
    );
    const totalCount = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    console.log("Count query successful, total count:", totalCount);

    // Return paginated results and pagination info
    res.status(200).json({
      success: true,
      data: dataQuery.rows,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error(
      "Error fetching scholar disbursement summary:",
      error.message,
      error.stack
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

    try {
      const query = `
        SELECT *
        FROM vw_scholar_disbursement
        WHERE student_id = $1
        ORDER BY disbursement_date DESC;
      `;

      const { rows } = await pool.query(query, [id]);
      res.status(200).json(rows);
    } catch (viewError) {
      console.log("View failed, using fallback query:", viewError.message);

      // Fallback query that doesn't depend on maintenance tables
      const fallbackQuery = `
        SELECT 
          m.student_id,
          m.scholar_name,
          m.campus,
          'N/A' as disbursement_type,
          'N/A' as disbursement_status,
          NULL as disbursement_date,
          NULL as amount,
          'N/A' as current_yr_lvl,
          'N/A' as current_semester,
          'N/A' as current_school_year
        FROM masterlist m
        WHERE m.student_id = $1;
      `;

      const { rows } = await pool.query(fallbackQuery, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Student not found." });
      }

      // Return empty array to indicate no disbursement history
      res.status(200).json([]);
    }
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

const getCompletedDisbursementTotals = async (req, res) => {
  const { sy_code } = req.params;

  try {
    if (!sy_code) {
      return res
        .status(400)
        .json({ message: "School year code (sy_code) is required." });
    }

    const query = `
      SELECT 
        dt.disbursement_label AS category,
        COUNT(DISTINCT m.student_id) AS total_students,
        SUM(dd.disbursement_amount) AS total_amount
      FROM disbursement_detail dd
      JOIN disbursement_tracking dtr ON dd.disbursement_id = dtr.disbursement_id
      JOIN renewal_scholar rs ON dtr.renewal_id = rs.renewal_id
      JOIN masterlist m ON rs.student_id = m.student_id
      JOIN disbursement_type dt ON dd.disbursement_type_id = dt.disbursement_type_id
      WHERE dd.disbursement_status = 'Completed'
        AND m.scholarship_status = 'Active'
      GROUP BY dt.disbursement_label
      ORDER BY total_amount DESC
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: `No completed disbursement data found.`,
      });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching completed disbursement totals:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getTotalDisbursedAmount = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(DISTINCT m.student_id) AS total_students,
        COALESCE(SUM(dd.disbursement_amount), 0) AS total_disbursed
      FROM masterlist m
      LEFT JOIN renewal_scholar rs ON rs.student_id = m.student_id
      LEFT JOIN disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
      LEFT JOIN disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
      WHERE m.scholarship_status = 'Active'
        AND dd.disbursement_status = 'Completed'
    `;

    const result = await pool.query(query);
    const { total_students, total_disbursed } = result.rows[0];

    res.status(200).json({
      success: true,
      totalStudents: parseInt(total_students),
      totalDisbursed: parseFloat(total_disbursed),
    });
  } catch (error) {
    console.error("Error fetching total disbursed amount:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

const getStudentBasicInfo = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    // Use direct query instead of view to avoid permission issues
    const query = `
      SELECT 
        m.student_id,
        m.scholar_name,
        m.campus,
        m.scholarship_status,
        m.course,
        m.school_email,
        m.contact_number,
        COALESCE(
          (SELECT rs.yr_lvl 
           FROM renewal_scholar rs 
           WHERE rs.student_id = m.student_id 
           ORDER BY rs.renewal_date DESC 
           LIMIT 1)::text, 
          'N/A'
        ) as current_yr_lvl,
        COALESCE(
          (SELECT rs.semester 
           FROM renewal_scholar rs 
           WHERE rs.student_id = m.student_id 
           ORDER BY rs.renewal_date DESC 
           LIMIT 1)::text, 
          'N/A'
        ) as current_semester,
        COALESCE(
          (SELECT rs.school_year 
           FROM renewal_scholar rs 
           WHERE rs.student_id = m.student_id 
           ORDER BY rs.renewal_date DESC 
           LIMIT 1)::text, 
          'N/A'
        ) as current_school_year
      FROM masterlist m
      WHERE m.student_id = $1;
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Error fetching student basic info:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getScholarDisbursementSummary,
  getDisbursementHistoryByStudentId,
  getDisbursementTotalPerSy,
  getSemesterScholarDisbursement,
  getCompletedDisbursementTotals,
  getTotalDisbursedAmount,
  getStudentBasicInfo,
};
