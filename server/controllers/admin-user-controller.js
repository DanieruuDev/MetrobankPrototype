// controllers/authController.js

const pool = require("../database/dbConnect.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role_id, password } = req.body;

    if (!firstName || !lastName || !email || !password || !role_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate role_id exists
    const roleCheck = await pool.query(
      `SELECT role_id FROM public.roles WHERE role_id = $1`,
      [role_id]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      `SELECT admin_email FROM public.administration_adminaccounts WHERE admin_email = $1`,
      [email]
    );
    console.log(existingUser);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Account already exists" });
    }

    // Sync sequence to avoid duplicate PK errors (optional)
    await pool.query(
      `SELECT setval('administration_adminaccounts_admin_id_seq', (SELECT COALESCE(MAX(admin_id), 0) FROM administration_adminaccounts))`
    );

    // Hash password
    const hashedPass = await bcrypt.hash(password, 10);

    // Insert new user
    const newUser = await pool.query(
      `INSERT INTO public.administration_adminaccounts 
       (admin_name, admin_email, admin_password, role_id) 
       VALUES ($1, $2, $3, $4) RETURNING admin_id, admin_email, admin_name, role_id`,
      [`${firstName} ${lastName}`, email, hashedPass, role_id]
    );

    return res.status(201).json({
      user: newUser.rows[0],
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error in registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;

    // Query user with role join
    const result = await client.query(
      `SELECT a.admin_id, a.admin_email, a.admin_password, a.role_id, r.role_name
       FROM administration_adminaccounts a
       JOIN roles r ON a.role_id = r.role_id
       WHERE a.admin_email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Validate password
    const isPassValid = await bcrypt.compare(password, user.admin_password);
    if (!isPassValid) {
      return res.status(401).json({ message: "Incorrect credentials" });
    }

    // Create JWT token with role info
    const token = jwt.sign(
      {
        user_id: user.admin_id,
        email: user.admin_email,
        role_id: user.role_id,
        role_name: user.role_name,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({ email: user.admin_email, token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

const fetchUserInfo = async (req, res) => {
  const user_id = req.user?.user_id; // from auth middleware
  console.log("Fetch User: ", user_id);
  if (!user_id || isNaN(Number(user_id))) {
    return res
      .status(400)
      .json({ message: "Invalid or missing user_id parameter." });
  }

  try {
    const queryText = `
      SELECT 
        a.admin_id,
        a.admin_email,
        a.admin_job,
        a.admin_name,
        a.role_id,
        r.role_name,
        b.branch_id,
        b.branch_name
      FROM administration_adminaccounts a
      JOIN roles r ON a.role_id = r.role_id
      LEFT JOIN administration_brancheads b ON a.admin_id = b.admin_id
      WHERE a.admin_id = $1
    `;
    const { rows } = await pool.query(queryText, [user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    // Structure the response
    const user = {
      admin_id: rows[0].admin_id,
      admin_email: rows[0].admin_email,
      admin_job: rows[0].admin_job,
      admin_name: rows[0].admin_name,
      role_id: rows[0].role_id,
      role_name: rows[0].role_name,
      branch: rows[0].branch_id
        ? { branch_id: rows[0].branch_id, branch_name: rows[0].branch_name }
        : null,
    };

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user info:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { registerUser, loginUser, fetchUserInfo };
