const pool = require("../database/dbConnect");

// Get ROI Analytics Data - Dedicated endpoint for analytics calculations
const getROIAnalyticsData = async (req, res) => {
  try {
    // Get all active scholars (regardless of disbursement status)
    const activeScholarsQuery = `
      SELECT 
        COUNT(DISTINCT m.student_id) AS total_active_scholars
      FROM masterlist m
      WHERE m.scholarship_status = 'Active'
    `;

    // Get total disbursed amount (only from completed disbursements)
    const disbursementQuery = `
      SELECT 
        COALESCE(SUM(dd.disbursement_amount), 0) AS total_disbursed
      FROM masterlist m
      LEFT JOIN renewal_scholar rs ON rs.student_id = m.student_id
      LEFT JOIN disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
      LEFT JOIN disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
      WHERE m.scholarship_status = 'Active'
        AND dd.disbursement_status = 'Completed'
    `;

    // Get scholar renewal statistics
    const renewalStatsQuery = `
      SELECT 
        COUNT(DISTINCT m.student_id) AS total_scholars_ever,
        COUNT(DISTINCT CASE 
          WHEN m.scholarship_status = 'Active' 
          THEN m.student_id 
        END) AS currently_active_scholars,
        COUNT(DISTINCT CASE 
          WHEN m.scholarship_status = 'Delisted' 
          THEN m.student_id 
        END) AS delisted_scholars,
        COUNT(DISTINCT CASE 
          WHEN m.scholarship_status = 'Active' 
          AND rs.renewal_id IS NOT NULL 
          THEN m.student_id 
        END) AS renewed_scholars
      FROM masterlist m
      LEFT JOIN renewal_scholar rs ON rs.student_id = m.student_id
    `;

    // Get program-wise statistics (only completed disbursements for investment amounts)
    const programStatsQuery = `
      SELECT 
        m.course,
        COUNT(DISTINCT m.student_id) AS student_count,
        COALESCE(SUM(dd.disbursement_amount), 0) AS total_investment
      FROM masterlist m
      LEFT JOIN renewal_scholar rs ON rs.student_id = m.student_id
      LEFT JOIN disbursement_tracking dt ON dt.renewal_id = rs.renewal_id
      LEFT JOIN disbursement_detail dd ON dd.disbursement_id = dt.disbursement_id
      WHERE m.scholarship_status = 'Active'
        AND dd.disbursement_status = 'Completed'
      GROUP BY m.course
      ORDER BY total_investment DESC
    `;

    const [
      activeScholarsResult,
      disbursementResult,
      renewalResult,
      programResult,
    ] = await Promise.all([
      pool.query(activeScholarsQuery),
      pool.query(disbursementQuery),
      pool.query(renewalStatsQuery),
      pool.query(programStatsQuery),
    ]);

    const activeScholarsData = activeScholarsResult.rows[0];
    const disbursementData = disbursementResult.rows[0];
    const renewalData = renewalResult.rows[0];
    const programData = programResult.rows;

    // Calculate renewal rate
    const totalScholarsEver = parseInt(renewalData.total_scholars_ever);
    const delistedScholars = parseInt(renewalData.delisted_scholars);
    const renewalRate =
      totalScholarsEver > 0
        ? (totalScholarsEver - delistedScholars) / totalScholarsEver
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalDisbursed: parseFloat(disbursementData.total_disbursed),
        totalActiveScholars: parseInt(activeScholarsData.total_active_scholars),
        totalScholarsEver: totalScholarsEver,
        currentlyActiveScholars: parseInt(
          renewalData.currently_active_scholars
        ),
        delistedScholars: delistedScholars,
        renewedScholars: parseInt(renewalData.renewed_scholars),
        renewalRate: renewalRate,
        programStats: programData.map((program) => ({
          program: program.course,
          student_count: parseInt(program.student_count),
          total_investment: parseFloat(program.total_investment),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching ROI analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports = {
  getROIAnalyticsData,
};
