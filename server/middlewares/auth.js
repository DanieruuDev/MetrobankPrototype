// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authorization header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.log("No token found in Authorization header");
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      console.log("JWT verification error:", err.message);
      return res.status(403).json({ message: "Invalid token" });
    }
    console.log("JWT verified. User:", user);
    req.user = user;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!allowedRoles.includes(req.user.role_name)) {
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient rights" });
    }

    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
