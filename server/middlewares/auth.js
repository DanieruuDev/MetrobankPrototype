// middleware/authMiddleware.js

const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; // decoded token payload
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
