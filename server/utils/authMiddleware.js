const jwt = require("jsonwebtoken");
const pool = require("../database/dbConnect.js"); // Assuming you're using pool to query your DB

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(403)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "SECRETKEY123",
    async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
      }

      // Store user info in req.user
      req.user = decoded;

      // Check if the user exists in the respective table (admin or scholar)
      if (decoded.userType === "admin") {
        const adminCheck = await pool.query(
          "SELECT * FROM admin WHERE admin_id = $1",
          [decoded.user_id]
        );
        if (adminCheck.rows.length === 0) {
          return res.status(401).json({ message: "Admin not found." });
        }
      } else if (decoded.userType === "scholar") {
        const scholarCheck = await pool.query(
          "SELECT * FROM scholar WHERE scholar_id = $1",
          [decoded.user_id]
        );
        if (scholarCheck.rows.length === 0) {
          return res.status(401).json({ message: "Scholar not found." });
        }
      }

      next();
    }
  );
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
